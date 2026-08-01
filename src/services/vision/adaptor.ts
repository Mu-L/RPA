import { guardSearchResult, ConvertResultItem } from '../desktop'

// In-extension image search (template matching) running in a web worker with
// the kantusearch WASM module — the same matcher the native DesktopAutomation
// XModule uses, compiled to WebAssembly. Assets live in extension/lib/imagesearch/
// (worker.js bootstraps kantusearch.js + kantusearch.wasm + worker-main.js).
//
// Used as the browser-scope fallback when the XModule is not installed, so
// CDP-based input (uiv.browser.* and its internal BClick/BMove engine) works
// with .png targets without any native install.

const WORKER_URL = '/lib/imagesearch/worker.js'

// Worker protocol (see webextension-imagesearch-1.0.1-extension/src/ts):
// message: { type: 0 = Init | 1 = Job, data }
// job:     { id, type (2 = ImageSearch), startTime, finishTime, args, result }
const MSG_INIT = 0
const MSG_JOB = 1
const JOB_IMAGE_SEARCH = 2

type Rect = { left: number; top: number; width: number; height: number }

type WorkerRegion = {
  // v1.1.0 (current source) names the matched region `matchedRect`; the 2018
  // binary called it `rect`. Read both so a binary swap can't break this.
  matchedRect?: Rect;
  rect?: Rect;
  // Present for green/pink (relative) patterns
  relativeRect?: Rect;
  order: number;
  score: number;
}

type WorkerSearchResult = {
  containsGreenPinkBoxes: boolean;
  errorCode: number;
  regions: WorkerRegion[];
}

type PendingJob = {
  resolve: (result: any) => void;
  reject: (e: Error) => void;
}

const workerState: {
  worker: Worker | null;
  pReady: Promise<void> | null;
  jobs: Record<number, PendingJob>;
  nextJobId: number;
} = {
  worker: null,
  pReady: null,
  jobs: {},
  nextJobId: 1
}

const getWorker = (): Promise<Worker> => {
  if (workerState.worker && workerState.pReady) {
    return workerState.pReady.then(() => workerState.worker as Worker)
  }

  const worker = new Worker(WORKER_URL)
  workerState.worker = worker

  workerState.pReady = new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('E340: Image search worker failed to initialize (timeout)')), 30000)

    worker.onmessage = (e: MessageEvent) => {
      const msg = e.data
      if (!msg) return

      if (msg.type === MSG_INIT) {
        clearTimeout(timer)
        resolve()
        return
      }

      if (msg.type === MSG_JOB && msg.data) {
        const pending = workerState.jobs[msg.data.id]
        if (pending) {
          delete workerState.jobs[msg.data.id]
          pending.resolve(msg.data.result)
        }
      }
    }

    worker.onerror = (e) => {
      clearTimeout(timer)
      const error = new Error(`E341: Image search worker error: ${e.message || 'unknown'}`)
      reject(error)
      Object.keys(workerState.jobs).forEach(id => {
        workerState.jobs[id as any].reject(error)
        delete workerState.jobs[id as any]
      })
      // Force re-create on next use
      workerState.worker = null
      workerState.pReady = null
    }
  })

  return workerState.pReady.then(() => worker)
}

const postImageSearchJob = (args: {
  image: ImageData;
  pattern: ImageData;
  options: any;
  patternScaleX: number;
  patternScaleY: number;
}): Promise<WorkerSearchResult> => {
  return getWorker().then(worker => {
    return new Promise<WorkerSearchResult>((resolve, reject) => {
      const id = workerState.nextJobId++
      workerState.jobs[id] = { resolve, reject }
      worker.postMessage({
        type: MSG_JOB,
        data: {
          id,
          type: JOB_IMAGE_SEARCH,
          startTime: 0,
          finishTime: 0,
          args,
          result: null
        }
      })
    })
  })
}

const loadImageData = (dataUrl: string): Promise<ImageData> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) return reject(new Error('E342: Failed to get canvas context for image search'))
      ctx.drawImage(img, 0, 0)
      resolve(ctx.getImageData(0, 0, canvas.width, canvas.height))
    }
    img.onerror = () => reject(new Error('E343: Failed to load image for image search'))
    img.src = dataUrl
  })
}

const cropImageData = (imageData: ImageData, rect: { x: number; y: number; width: number; height: number }): ImageData => {
  const srcCanvas = document.createElement('canvas')
  srcCanvas.width = imageData.width
  srcCanvas.height = imageData.height
  const srcCtx = srcCanvas.getContext('2d') as CanvasRenderingContext2D
  srcCtx.putImageData(imageData, 0, 0)

  const x = Math.max(0, Math.round(rect.x))
  const y = Math.max(0, Math.round(rect.y))
  const width = Math.min(imageData.width - x, Math.round(rect.width))
  const height = Math.min(imageData.height - y, Math.round(rect.height))

  return srcCtx.getImageData(x, y, width, height)
}

export type SearchImageInExtensionRequest = {
  patternImageUrl: string;
  targetImageUrl: string;
  minSimilarity: number;
  allowSizeVariation: boolean;
  enableGreenPinkBoxes: boolean;
  requireGreenPinkBoxes: boolean;
  // Pattern→screen DPI scale (e.g. pageDpi / patternDpi). Applied INSIDE the
  // engine after green/pink box detection (kantusearch.searchImageScaled), so
  // the pattern must be passed UN-resized — prescaling it kills the exact box
  // colors on Retina/HiDPI and causes E601 (see uivision-wasm
  // docs/fix-e601-green-pink-dpi.md).
  patternScale: number;
  // Search area within the target image, in target-image pixels (device px)
  searchAreaRect?: { x: number; y: number; width: number; height: number };
  // Divide image-pixel coordinates by this to get CSS px (usually devicePixelRatio)
  scaleDownRatio: number;
  pageOffset: { x: number; y: number };
  viewportOffset: { x: number; y: number };
}

// Returns the same shape as convertImageSearchResultForPage() on the native
// CV path, so callers cannot tell which engine produced the result.
export function searchImageInExtension (req: SearchImageInExtensionRequest): Promise<ConvertResultItem[]> {
  const scale = 1 / req.scaleDownRatio

  return Promise.all([
    loadImageData(req.targetImageUrl),
    loadImageData(req.patternImageUrl)
  ])
  .then(([targetImage, patternImage]) => {
    const cropped = req.searchAreaRect ? cropImageData(targetImage, req.searchAreaRect) : targetImage
    const cropOffsetX = req.searchAreaRect ? Math.max(0, Math.round(req.searchAreaRect.x)) : 0
    const cropOffsetY = req.searchAreaRect ? Math.max(0, Math.round(req.searchAreaRect.y)) : 0

    const patternScale = Number.isFinite(req.patternScale) && req.patternScale > 0 ? req.patternScale : 1

    return postImageSearchJob({
      image: cropped,
      pattern: patternImage,
      options: {
        minSimilarity: Math.max(0.1, Math.min(1.0, req.minSimilarity)),
        allowSizeVariation: req.allowSizeVariation,
        enableGreenPinkBoxes: req.enableGreenPinkBoxes,
        requireGreenPinkBoxes: req.requireGreenPinkBoxes
      },
      patternScaleX: patternScale,
      patternScaleY: patternScale
    })
    .then((result: WorkerSearchResult) => {
      // Same error codes as the native host (E601-E606 for green/pink issues)
      guardSearchResult(result as any)

      const toFindResult = (rect: { left: number; top: number; width: number; height: number }, score: number) => {
        // Worker coordinates are relative to the (possibly cropped) image;
        // recover full-image px first, then convert like the native path does
        const ix = rect.left + cropOffsetX
        const iy = rect.top + cropOffsetY

        return {
          offsetLeft:   scale * ix,
          offsetTop:    scale * iy,
          viewportLeft: scale * ix + req.viewportOffset.x,
          viewportTop:  scale * iy + req.viewportOffset.y,
          pageLeft:     scale * ix + req.pageOffset.x,
          pageTop:      scale * iy + req.pageOffset.y,
          width:        scale * rect.width,
          height:       scale * rect.height,
          score
        }
      }

      return (result.regions || []).map((r: WorkerRegion) => {
        const matched = r.matchedRect || r.rect
        if (!matched) throw new Error('E344: image search region has no matchedRect/rect')
        // Green/pink pattern: matched = relative (pink) box, reference = anchor (green) box
        if (r.relativeRect) {
          return {
            matched:   toFindResult(r.relativeRect, r.score),
            reference: toFindResult(matched, r.score)
          }
        }
        return {
          matched:   toFindResult(matched, r.score),
          reference: null
        }
      })
    })
  })
}
