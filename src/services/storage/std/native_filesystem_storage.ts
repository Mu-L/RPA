import mime from 'mime'
import path from '@/common/lib/path'
import { StandardStorage, Content, Entry, StandardStorageOptions } from './standard_storage'
import { sanitizeFileName, dataURItoArrayBuffer, arrayBufferToString } from '@/common/utils'
import { IWithLinkStorage, ReadFileType, readableSize } from '../flat/storage'
import { getNativeFileSystemAPI, NativeFileAPI, FileSystemEntryWithInfo, InvocationResult } from '@/services/filesystem'
import { KantuFileAccess } from '@/services/filesystem/kantu-file-access'
import { singletonGetterByKey } from '@/common/ts_utils'
import log from '@/common/log'

export class ErrorWithCode extends Error {
  public code: number;

  constructor(message: string, code: number) {
    super(message);
    this.name = 'ErrorWithCode'
    this.code = code

    // Note: better to keep stack trace
    // reference: https://stackoverflow.com/a/32749533/1755633
    let captured = true

    if (typeof Error.captureStackTrace === 'function') {
      try {
        Error.captureStackTrace(this, this.constructor)
      } catch (e) {
        captured = false
      }
    }

    if (!captured) {
      this.stack = (new Error(message)).stack
    }
  }
}

export function getErrorMessageForCode (code: KantuFileAccess.ErrorCode) {
  switch (code) {
    case KantuFileAccess.ErrorCode.Succeeded:
      return 'Success'

    case KantuFileAccess.ErrorCode.Failed:
      return 'Failed to load'

    case KantuFileAccess.ErrorCode.Truncated:
      return 'File too large to load'

    default:
      return `Unknown error code: ${code}`
  }
}

export type NativeFileSystemStandardStorageOptions = StandardStorageOptions & {
  rootDir:       string;
  baseDir:       string;
  extensions:    string[];
  shouldKeepExt: boolean;
  allowAbsoluteFilePath?: boolean;
}

export class NativeFileSystemStandardStorage extends StandardStorage implements IWithLinkStorage {
  protected rootDir: string
  protected baseDir: string
  protected extensions: string[]
  protected shouldKeepExt: boolean
  protected allowAbsoluteFilePath: boolean
  protected fs: NativeFileAPI

  constructor (opts: NativeFileSystemStandardStorageOptions) {
    super({
      encode: opts.encode,
      decode: opts.decode,
      listFilter: opts.listFilter
    })
    const { baseDir, rootDir, extensions, shouldKeepExt = false, allowAbsoluteFilePath = false } = opts

    if (!baseDir || baseDir === '/') {
      throw new Error(`Invalid baseDir, ${baseDir}`)
    }

    this.rootDir        = rootDir
    this.baseDir        = baseDir
    this.extensions     = extensions
    this.shouldKeepExt  = shouldKeepExt
    this.allowAbsoluteFilePath = allowAbsoluteFilePath

    this.fs = getNativeFileSystemAPI()
  }

  getLink (fileName: string): Promise<string> {
    return this.read(fileName, 'DataURL') as Promise<string>
  }

  public read (filePath: string, type: ReadFileType): Promise<Content> {
    const fullPath     = this.filePath(filePath)
    const relativePath = path.relative(this.dirPath('/'), fullPath)

    const onResolve = (res: InvocationResult<string>) => {
      if (res.errorCode !== KantuFileAccess.ErrorCode.Succeeded) {
        throw new ErrorWithCode(`${filePath}: ` + getErrorMessageForCode(res.errorCode), res.errorCode)
      }

      const rawContent    = (<any>res).content
      const intermediate  = (() => {
        switch (type) {
          case 'Text':
          case 'DataURL':
            return rawContent

          case 'ArrayBuffer':
            return dataURItoArrayBuffer(rawContent)

          case 'BinaryString':
            return arrayBufferToString(dataURItoArrayBuffer(rawContent))
        }
      })()

      return this.decode(intermediate, relativePath, type)
    }
    const onError = (err: Error) => {
      if (/File size cannot be determined/.test(err.message)) {
        throw new Error(`Error #301: File not found (file names are case-sensitive): ${filePath}`)
      }
      return Promise.reject(err)
    }

    switch (type) {
      case 'Text':
        return this.fs.readAllTextCompat({
          path: fullPath
        })
        .then(onResolve, onError)

      default:
        return this.fs.readAllBytesCompat({
          path: fullPath
        })
        .then(onResolve, onError)
    }
  }

  public stat (entryPath: string, isDirectory?: boolean): Promise<Entry> {
    const dir          = path.dirname(entryPath)
    const name         = path.basename(entryPath)
    const fullPath     = isDirectory ? this.dirPath(entryPath) : this.filePath(entryPath)
    const relativePath = path.relative(this.dirPath('/'), fullPath)
    const noEntry      = {
      dir,
      name,
      fullPath,
      relativePath,
      isFile:       false,
      isDirectory:  false,
      lastModified: new Date(0),
      size:         0
    }

    const pExists = isDirectory ? this.fs.directoryExists({ path: fullPath })
                                : this.fs.fileExists({ path: fullPath })

    return pExists.then(exists => {
      if (!exists) {
        return noEntry
      }

      return this.fs.getFileSystemEntryInfo({ path: fullPath })
      .then(
        (info) => {
          return {
            dir,
            name,
            fullPath,
            relativePath,
            isFile:       !info.isDirectory,
            isDirectory:  info.isDirectory,
            lastModified: new Date(info.lastWriteTime),
            size:         info.length
          }
        },
        (e: Error) => {
          return noEntry
        }
      )
    })
  }

  protected __list (directoryPath: string = '/', brief: boolean = false): Promise<Entry[]> {
    return this.ensureBaseDir()
    .then(() => {
      return this.fs.getEntries({
        brief,
        path:       this.dirPath(directoryPath),
        extensions: this.extensions,
      })
      .then(data => {
        const entries: FileSystemEntryWithInfo[] = data.entries
        const errorCode = data.errorCode

        if (errorCode !== KantuFileAccess.ErrorCode.Succeeded) {
          throw new ErrorWithCode(getErrorMessageForCode(errorCode) + `: ${directoryPath}`, errorCode)
        }

        const convertName = (entryName: string, isDirectory: boolean) => {
          if (this.shouldKeepExt || isDirectory) return entryName
          // only the PRIMARY extension is an implementation detail to hide
          // ("Foo.json" -> "Foo", legacy "Foo.js.json" -> "Foo.js");
          // secondary extensions are part of the name ("Foo.js" stays)
          const ext = path.extname(entryName).substr(1).toLowerCase()
          return ext === this.extensions[0].toLowerCase() ? this.removeExt(entryName) : entryName
        }
        const convert = (entry: FileSystemEntryWithInfo): Entry => {
          const dir          = this.dirPath(directoryPath)
          const name         = convertName(entry.name, entry.isDirectory)
          const fullPath     = path.join(dir, entry.name)
          const relativePath = path.relative(this.dirPath('/'), fullPath)

          return {
            dir,
            name,
            fullPath,
            relativePath,
            isFile:       !entry.isDirectory,
            isDirectory:  entry.isDirectory,
            lastModified: new Date(entry.lastWriteTime),
            size:         entry.length
          }
        }

        return entries.map(convert)
      })
    })
  }

  protected __write (filePath: string, content: any): Promise<void> {
    return this.ensureBaseDir()
    .then(() => this.encode(content, filePath))
    .then(encodedContent => {
      return this.fs.writeAllBytes({
        content:  encodedContent,
        path:     this.filePath(filePath, true),
      })
      .then(result => {
        if (!result) {
          throw new Error(`Failed to write to '${filePath}'`)
        }
      })
    })
  }

  protected __overwrite (filePath: string, content: any): Promise<void> {
    return this.write(filePath, content)
  }

  protected __removeFile (filePath: string): Promise<void> {
    return this.ensureBaseDir()
    .then(() => {
      return this.fs.deleteFile({
        path: this.filePath(filePath)
      })
      .then(() => {})
    })
  }

  protected __removeEmptyDirectory (directoryPath: string): Promise<void> {
    return this.ensureBaseDir()
    .then(() => {
      return this.fs.removeDirectory({ path: this.dirPath(directoryPath) })
      .then(() => {})
    })
  }

  protected __moveFile (filePath: string, newPath: string): Promise<void> {
    return this.ensureBaseDir()
    .then(() => {
      return this.fs.moveFile({
        sourcePath: this.filePath(filePath),
        targetPath: this.filePath(this.inheritSecondaryExt(filePath, newPath), true)
      })
      .then(() => {})
    })
  }

  protected __copyFile (filePath: string, newPath: string): Promise<void> {
    return this.ensureBaseDir()
    .then(() => {
      return this.fs.copyFile({
        sourcePath: this.filePath(filePath),
        targetPath: this.filePath(this.inheritSecondaryExt(filePath, newPath), true)
      })
      .then(() => {})
    })
  }

  // rename/copy must not silently change a file's TYPE: a script macro
  // (secondary extension, e.g. .js) renamed to a bare name stays .js instead
  // of getting the primary extension appended — which would leave raw script
  // text in a file the decoder parses as JSON. An explicit known extension
  // in the new name always wins.
  private inheritSecondaryExt (sourcePath: string, newPath: string): string {
    const extOf = (p: string) => path.extname(path.basename(p)).substr(1).toLowerCase()
    const isKnown = (e: string) => this.extensions.some(x => x.toLowerCase() === e)

    if (isKnown(extOf(newPath))) return newPath

    const srcExt = extOf(this.filePath(sourcePath))
    const isSecondary = srcExt !== this.extensions[0].toLowerCase() && isKnown(srcExt)

    return isSecondary ? `${newPath}.${srcExt}` : newPath
  }

  protected __createDirectory (directoryPath: string): Promise<void> {
    return this.ensureBaseDir()
    .then(() => {
      return this.fs.createDirectory({
        path: this.dirPath(directoryPath, true)
      })
      .then(() => {})
    })
  }

  public dirPath (dir: string, shouldSanitize: boolean = false): string {
    const path = this.getPathLib()
    const absPath = (() => {
      if (this.isStartWithBaseDir(dir)) {
        return path.normalize(dir)
      } else {
        return path.normalize(path.join(this.rootDir, this.baseDir, dir))
      }
    })()

    const dirName       = path.dirname(absPath)
    const baseName      = path.basename(absPath)
    const sanitized     = shouldSanitize ? sanitizeFileName(baseName) : baseName

    return path.join(dirName, sanitized)
  }

  public filePath (filePath: string, shouldSanitize: boolean = false): string {
    const dirName       = path.dirname(filePath)
    const baseName      = path.basename(filePath)
    const sanitized     = shouldSanitize ? sanitizeFileName(baseName) : baseName
    const existingExt   = path.extname(baseName)
    // ANY known extension is honored as-is; only extension-less names get the
    // primary one appended. This is what lets a macro named "Foo.js" live as
    // the plain file Foo.js while "Bar" still becomes Bar.json.
    const isKnownExt    = !!existingExt && this.extensions.some(e => e.toLowerCase() === existingExt.substr(1).toLowerCase())
    const finalFileName = isKnownExt ? sanitized : (sanitized + '.' + this.extensions[0])

    if (this.isStartWithBaseDir(dirName)) {
      return path.normalize(path.join(dirName, finalFileName))
    } else if (this.allowAbsoluteFilePath && this.isAbsoluteUrl(filePath)) {
      return path.normalize(path.join(dirName, finalFileName))
    } else {
      return path.normalize(path.join(this.rootDir, this.baseDir, dirName, finalFileName))
    }
  }

  public isWin32Path (): boolean {
    return /^([A-Z]:\\|\/\/|\\\\)/i.test(this.rootDir)
  }

  private isAbsoluteUrl (str: string): boolean {
    const path = this.getPathLib()
    return path.isAbsolute(str)
  }

  private isStartWithBaseDir (str: string): boolean {
    return str.indexOf(this.rootDir) === 0
  }

  private removeExt (fileNameWithExt: string) {
    const name: string = path.basename(fileNameWithExt)
    const ext: string  = path.extname(fileNameWithExt)
    const i: number    = name.lastIndexOf(ext)

    return name.substring(0, i)
  }

  private ensureBaseDir (): Promise<void> {
    const fs  = this.fs
    const dir = path.normalize(path.join(this.rootDir, this.baseDir))

    return fs.directoryExists({
      path: dir
    })
    .then(existed => {
      if (existed)  return existed
      return fs.createDirectory({
        path: dir
      })
    })
    .then(() => {})
  }
}

export const getNativeFileSystemStandardStorage = singletonGetterByKey(
  (opts: NativeFileSystemStandardStorageOptions) => {
    return path.join(opts.rootDir, opts.baseDir)
  },
  (opts: NativeFileSystemStandardStorageOptions) => {
    return new NativeFileSystemStandardStorage(opts)
  }
)
