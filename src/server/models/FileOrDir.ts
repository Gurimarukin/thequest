import nodePath from 'path'

import type { List } from '../../shared/utils/fp'

type FileOrDir = MyFile | Dir

export { FileOrDir }

type MyFile = {
  _tag: 'File'
  path: string
  basename: string
  dirname: string
}

const myFileOf = ({ path, basename, dirname }: Omit<MyFile, '_tag'>): MyFile => ({
  _tag: 'File',
  path,
  basename,
  dirname,
})

const myFileFromPath = (path: string): MyFile =>
  myFileOf({
    path,
    basename: nodePath.basename(path),
    dirname: nodePath.dirname(path),
  })

export { MyFile }

type Dir = {
  _tag: 'Dir'
  path: string
}

const dirOf = (path: string): Dir => ({ _tag: 'Dir', path })

const Dir = {
  of: dirOf,

  joinDir:
    (path: string, ...paths: List<string>) =>
    (dir: Dir): Dir =>
      dirOf(nodePath.join(dir.path, path, ...paths)),

  joinFile:
    (path: string, ...paths: List<string>) =>
    (dir: Dir): MyFile =>
      myFileFromPath(nodePath.join(dir.path, path, ...paths)),
}

export { Dir }
