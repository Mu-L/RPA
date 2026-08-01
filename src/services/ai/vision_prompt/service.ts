import { getAIProviderConfig } from '@/services/ai/computer_use/service'

// OpenAI-compatible vision calls for aiPrompt and aiScreenXY.
//
// Both commands used to construct AnthropicService directly, which pins them to
// api.anthropic.com and an Anthropic key — so the free Ui.Vision tier, a local
// model and OpenRouter all failed with "No Anthropic API key", even though the
// AI chat and aiComputerUse work on every one of them. That was a gap in the
// code, not a capability limit: answering a question about an image and
// pointing at something on screen work on any vision-capable model.
//
// This module is the other half. The Anthropic path stays exactly as it was
// (see AnthropicService) — it is what the demos were tuned against — and
// everything else comes through here.

type Coord = { x: number; y: number }

export type VisionResult = {
  coords: Coord[]
  isSinglePoint?: boolean
  aiResponse: string
}

// Same ceiling AnthropicService uses, for the same reason: a full-resolution
// screenshot is mostly wasted tokens, and every provider bills for them.
const MAX_PIXELS = 1191888

const chatCompletionsUrl = (baseURL: string): string => {
  const trimmed = String(baseURL || '').replace(/\/+$/, '')
  return /\/chat\/completions$/.test(trimmed) ? trimmed : `${trimmed}/chat/completions`
}

/**
 * Scale a PNG down to the pixel ceiling. Returns the bytes to send plus the
 * factor, because coordinates come back in the SCALED image's space and have to
 * be divided back out — get this wrong and every click lands proportionally
 * off, which looks like a bad model rather than bad arithmetic.
 */
export async function scaleForVision (
  imageBuffer: ArrayBuffer
): Promise<{ buffer: ArrayBuffer; scaleFactor: number; width: number; height: number }> {
  // lazy: jimp is ~700 KB and must stay out of the eager panel bundle
  const { Jimp } = await import('jimp')
  const image = await Jimp.read(imageBuffer as any)

  const width = image.bitmap.width
  const height = image.bitmap.height
  const totalPixels = width * height

  if (totalPixels <= MAX_PIXELS) {
    return { buffer: imageBuffer, scaleFactor: 1, width, height }
  }

  const scaleFactor = Math.sqrt(MAX_PIXELS / totalPixels)
  const scaledWidth = Math.round(width * scaleFactor)
  const scaledHeight = Math.round(height * scaleFactor)

  image.resize({ w: scaledWidth, h: scaledHeight })
  const buffer = await image.getBuffer('image/png')

  return { buffer: buffer as any, scaleFactor, width: scaledWidth, height: scaledHeight }
}

const toDataUrl = (buffer: ArrayBuffer): string =>
  `data:image/png;base64,${Buffer.from(buffer as any).toString('base64')}`

/**
 * One round trip to whatever OpenAI-compatible endpoint is configured
 * (the Ui.Vision free tier, OpenRouter, a local server). Returns the reply text.
 */
export async function askOpenAICompatible (
  promptText: string,
  imageBuffers: Array<ArrayBuffer | null | undefined>,
  task: string = 'unknown'
): Promise<string> {
  const providerConfig = getAIProviderConfig()

  const content: any[] = [{ type: 'text', text: promptText }]
  for (const buffer of imageBuffers) {
    if (!buffer) continue
    const scaled = await scaleForVision(buffer)
    content.push({ type: 'image_url', image_url: { url: toDataUrl(scaled.buffer) } })
  }

  const res = await fetch(chatCompletionsUrl(providerConfig.baseURL), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(providerConfig.apiKey ? { Authorization: `Bearer ${providerConfig.apiKey}` } : {}),
      // WHICH CALL this is, named as the JS API names it: ai.ask, ai.find,
      // ai.computerUse, aichat. The four want very different things — pointing
      // at a screen coordinate needs spatial grounding, answering a question
      // about an image does not — so a proxy can route each to a suitable
      // model instead of paying for the strongest on every call.
      // A plain header: OpenAI-compatible servers that do not care ignore it,
      // and it stays out of the request body schema. It is a HINT, not a
      // trust boundary — the client sets it, so route COST on it, not access.
      'X-UIV-Task': task,
      'X-Title': 'Ui.Vision RPA'
    },
    body: JSON.stringify({
      model: providerConfig.model,
      max_tokens: 1024,
      messages: [{ role: 'user', content }]
    })
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`E353: ${providerConfig.label} API returned HTTP ${res.status}. ${detail.slice(0, 300)}`)
  }

  const json: any = await res.json()
  const text = json && json.choices && json.choices[0] && json.choices[0].message
    ? json.choices[0].message.content
    : ''

  if (typeof text !== 'string' || !text.length) {
    throw new Error(`E353: ${providerConfig.label} returned no answer.`)
  }
  return text
}

/**
 * Coordinates out of a reply. The prompt asks for "x,y|||", but models
 * embellish — "(412, 660)", "x=412 y=660", a sentence around it — so this takes
 * the first plausible pair rather than insisting on the exact format. Returning
 * nothing is better than returning a number scraped out of prose, so a match
 * needs two integers close together.
 */
export function parseCoordsFromText (text: string): Coord[] {
  const cleaned = String(text).replace(/\|\|\|/g, ' ')

  const patterns = [
    /x\s*[=:]\s*(\d+)\s*[, ]\s*y\s*[=:]\s*(\d+)/i,
    /\(\s*(\d+)\s*,\s*(\d+)\s*\)/,
    /\b(\d{1,5})\s*,\s*(\d{1,5})\b/
  ]

  for (const re of patterns) {
    const m = re.exec(cleaned)
    if (m) return [{ x: parseInt(m[1], 10), y: parseInt(m[2], 10) }]
  }
  return []
}

/** aiPrompt for every non-Anthropic provider: text (+images) in, text out. */
export async function visionPrompt (
  mainImageBuffer: ArrayBuffer | null,
  searchImageBuffer: ArrayBuffer | null,
  promptText: string
): Promise<VisionResult> {
  const aiResponse = await askOpenAICompatible(promptText, [mainImageBuffer, searchImageBuffer], 'ai.ask')
  return { coords: parseCoordsFromText(aiResponse), isSinglePoint: true, aiResponse }
}

/**
 * aiScreenXY for every non-Anthropic provider: where is this thing on screen?
 *
 * The prompt states the image's dimensions and demands bare coordinates — the
 * same shape the Anthropic path asks for, so the two behave alike. Coordinates
 * are divided back out of the scale factor before they are returned, so the
 * caller always gets ORIGINAL-image pixels regardless of what was sent.
 */
export async function visionLocate (
  imageBuffer: ArrayBuffer,
  promptText: string
): Promise<VisionResult> {
  const scaled = await scaleForVision(imageBuffer)

  const prompt =
    `${promptText}. Analyze the provided image (${scaled.width} x ${scaled.height} pixels). ` +
    'Reply with ONLY the x,y pixel coordinates of that element in the image, in the format x,y — no words, no units, no explanation.'

  // aiScreenXY is the one that needs real spatial grounding — the task most
  // worth routing to a stronger model
  const aiResponse = await askOpenAICompatible(prompt, [scaled.buffer], 'ai.find')
  const scaledCoords = parseCoordsFromText(aiResponse)

  if (!scaledCoords.length) {
    return { coords: [{ x: 0, y: 0 }], isSinglePoint: false, aiResponse }
  }

  const coords = scaledCoords.map(c => ({
    x: Math.round(c.x / scaled.scaleFactor),
    y: Math.round(c.y / scaled.scaleFactor)
  }))

  return { coords, isSinglePoint: true, aiResponse }
}
