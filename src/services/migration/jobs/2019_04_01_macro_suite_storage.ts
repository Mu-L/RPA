import { IMigrationJob, MigrationJobMeta, MigrationJobType, VersionRange } from '@/services/migration/types'
import { getIndexeddbFlatStorage } from '@/services/storage/flat/indexeddb_storage'
import { getStorageManager, StorageTarget, StorageStrategyType, StorageManager } from '@/services/storage'
import { Macro } from '@/common/convert_utils'
import { getMacroExtraKeyValueData } from '@/services/kv_data/macro_extra_data';
import fs from '@/common/filesystem'
import { backup } from '@/services/backup/backup'
import { singletonGetter } from '@/common/ts_utils'

export class MigrateMacroTestSuiteToBrowserFileSystem implements IMigrationJob {
  private oldMacros: Macro[] = []

  getMeta (): MigrationJobMeta {
    return {
      createdAt: new Date('2019-04-01').getTime(),
      goal: [
        `Migrate macros from indexedDB storage to Browser File System storage`,
        `In order to prepare for an easy support for deep folder structure`,
        `Note: the old indexedDB storage WILL NOT be cleared, just in case any user loses his data during migration`,
        `The real clean up could be done in future releases, in the form of another migration job`
      ].join('. ')
    }
  }

  getType (): MigrationJobType {
    return MigrationJobType.MigrateMacroTestSuiteToBrowserFileSystem
  }

  previousVersionRange (): VersionRange {
    return '<=4.0.1'
  }

  shouldMigrate (): Promise<boolean> {
    return this.getOldMacroStorage().list()
    .then((list) => list.length > 0)
  }

  migrate (): Promise<boolean> {
    const migrateMacros = () => {
      return this.getOldMacroStorage().readAll()
      .then((fileObjs) => {
        console.log('this.getOldMacroStorage().readAll()', fileObjs)

        this.oldMacros = fileObjs.map((obj) => obj.content as any as Macro)

        return fs.ensureDirectory('/macros')
        .then(() => this.getNewMacroStorage().bulkWrite(fileObjs))
      })
      .then(() => true)
    }

    const migrateMacroExtra = () => {
      return getMacroExtraKeyValueData().getAll()
      .then((allMacroExtra) => {
        this.oldMacros.forEach(macro => {
          const newId = this.getNewMacroStorage().filePath(macro.name)
          const oldId = macro.id as string

          if (allMacroExtra[oldId]) {
            allMacroExtra[newId] = allMacroExtra[oldId]
          }
        })

        return getMacroExtraKeyValueData().set('', allMacroExtra as any)
      })
    }

    return migrateMacros()
    .then(() => migrateMacroExtra())
    .then(() => true)
  }

  remedy () {
    // Download the old macros in zip
    const readOldMacros = () => {
      return this.getOldMacroStorage().readAll()
      .then((fileObjs) => {
        this.oldMacros = fileObjs.map((obj) => obj.content as any as Macro)
        return this.oldMacros
      })
    }

    return readOldMacros()
    .then(macros => {
      return backup({
        backup: {
          testCase: true
        },
        macroNodes: macros
      })
    })
  }

  private getOldMacroStorage () {
    return getIndexeddbFlatStorage({
      table: 'testCases'
    })
  }

  private getNewMacroStorage () {
    return this.getStorageManager().getStorageForTarget(
      StorageTarget.Macro,
      StorageStrategyType.Browser
    ) as any
  }

  private getStorageManager () {
    return new StorageManager(
      StorageStrategyType.Browser,
      {
        getMaxMacroCount: () => Promise.resolve(Infinity)
      }
    )
  }
}

export const getMigrateMacroTestSuiteToBrowserFileSystem = singletonGetter(() => {
  return new MigrateMacroTestSuiteToBrowserFileSystem()
})
