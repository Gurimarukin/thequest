import React from 'react'
import { createPortal } from 'react-dom'

export const modalLayerId = 'modal-layer'

export const Modal: React.FC = ({ children }) => {
  const modalLayer = document.getElementById(modalLayerId)

  if (modalLayer === null) {
    // eslint-disable-next-line functional/no-throw-statements
    throw Error(`Modal layer not found: #${modalLayerId}`)
  }

  return createPortal(<div className="flex h-screen w-screen items-center justify-center bg-black/50">{children}</div>, modalLayer)
}
