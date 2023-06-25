import { pipe } from 'fp-ts/function'
import fs from 'fs'

import type { NotUsed } from '../../shared/utils/fp'
import { Future, Maybe, toNotUsed } from '../../shared/utils/fp'

import type { FileOrDir, MyFile } from '../models/FileOrDir'

const stat = (f: FileOrDir): Future<Maybe<fs.Stats>> =>
  pipe(
    Future.tryCatch(() => fs.promises.stat(f.path)),
    Future.map(Maybe.some),
    Future.orElse(() => Future.successful<Maybe<fs.Stats>>(Maybe.none)),
  )

const exists = (f: FileOrDir): Future<boolean> => pipe(stat(f), Future.map(Maybe.isSome))

const readFile = (file: MyFile): Future<string> =>
  Future.tryCatch(() => fs.promises.readFile(file.path, { encoding: 'utf-8' }))

const writeFile =
  (file: MyFile) =>
  (data: string): Future<NotUsed> =>
    pipe(
      Future.tryCatch(() => fs.promises.writeFile(file.path, data, { encoding: 'utf-8' })),
      Future.map(toNotUsed),
    )

export const FsUtils = { exists, readFile, writeFile }
