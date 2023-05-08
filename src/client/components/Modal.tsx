import { createPortal } from 'react-dom'

import { ChildrenFC } from '../models/ChildrenFC'

const modalLayerId = 'modal-layer'

const modalLayer = document.getElementById(modalLayerId)

if (modalLayer === null) {
  // eslint-disable-next-line functional/no-throw-statements
  throw Error(`Modal layer not found: #${modalLayerId}`)
}

export const Modal: ChildrenFC = ({ children }) =>
  createPortal(
    <div className="absolute top-0 flex h-screen w-screen items-center justify-center bg-black/50">
      {children}
    </div>,
    modalLayer,
  )
