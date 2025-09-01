/* eslint-disable functional/no-expression-statements,
                  functional/no-return-void */
import type { SpringValue } from '@react-spring/web'
import { animated, useTransition } from '@react-spring/web'
import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'

import { MsDuration } from '../../shared/models/MsDuration'
import type { Dict } from '../../shared/utils/fp'
import { List } from '../../shared/utils/fp'

import { CloseFilled } from '../imgs/svgs/icons'
import type { ChildrenFC } from '../models/ChildrenFC'
import { ToasterId } from '../models/ToasterId'
import { cx } from '../utils/cx'

const defaultDuration = MsDuration.seconds(3)

const config = { tension: 125, friction: 20, precision: 0.1 }

const toasterLayerId = 'toaster-layer'

const toasterLayer = document.getElementById(toasterLayerId)

if (toasterLayer === null) {
  // eslint-disable-next-line functional/no-throw-statements
  throw Error(`Toaster layer not found: #${toasterLayerId}`)
}

type ToasterContext = {
  showToaster: (type: ToasterType, content: React.ReactNode, options?: ToasterOptions) => ToasterId
}

type ToasterType = 'success' | 'error'
type ToasterOptions = {
  onClick?: (self: ToasterId) => void
  onClose?: (self: ToasterId) => void
  /**
   * @default Infinity if 'error', else defaultDuration
   */
  duration?: MsDuration
}

type Toaster = {
  id: ToasterId
  type: ToasterType
  content: React.ReactNode
} & ToasterOptions

const ToasterContext = createContext<ToasterContext | undefined>(undefined)

export const ToasterContextProvider: ChildrenFC = ({ children }) => {
  const refMap = useMemo(() => new WeakMap<Toaster, HTMLElement>(), [])
  const cancelMap = useMemo(() => new WeakMap<Toaster, () => void>(), [])

  const [toasters, setToasters] = useState(List.empty<Toaster>())

  const transitions = useTransition(toasters, {
    from: { opacity: 0, height: 0, ttl: 100 },
    keys: toaster => ToasterId.unwrap(toaster.id),
    enter: toaster => (next, cancel) => {
      cancelMap.set(toaster, cancel)
      return next({ opacity: 1, height: refMap.get(toaster)?.offsetHeight }).then(() =>
        next({ ttl: 0 }),
      )
    },
    leave: [{ opacity: 0 }, { height: 0 }],
    onRest: (result, ctrl, toaster) => {
      setToasters(List.filter(t => !ToasterId.Eq.equals(t.id, toaster.id)))
    },
    config: (toaster, index, phase) => key =>
      // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
      phase === 'enter' && key === 'ttl'
        ? {
            duration: MsDuration.unwrap(
              toaster.duration ??
                (toaster.type === 'error' ? MsDuration.infinity : defaultDuration),
            ),
          }
        : config,
  })

  const showToaster = useCallback(
    (type: ToasterType, content: React.ReactNode, options?: ToasterOptions): ToasterId => {
      const id = ToasterId.generate()
      setToasters(List.append({ id, type, content, ...options }))
      return id
    },
    [],
  )

  const onMount = useCallback(
    (toaster: Toaster) => (elt: HTMLElement | null) => {
      if (elt !== null) refMap.set(toaster, elt)
    },
    [refMap],
  )

  const onClick = useCallback(
    (ttl: SpringValue<number>, toaster: Toaster) => () => {
      if (cancelMap.has(toaster) && ttl.get() !== 0) cancelMap.get(toaster)?.()
    },
    [cancelMap],
  )

  const value: ToasterContext = {
    showToaster,
  }

  return (
    <ToasterContext.Provider value={value}>
      {children}
      <>
        {createPortal(
          <div className="absolute right-0 top-0 flex w-96 max-w-screen flex-col">
            {transitions(({ opacity, height, ttl }, toaster) => (
              <animated.div style={{ opacity, height }}>
                <div ref={onMount(toaster)} className="pt-1">
                  <div className={cx('p-0.75 text-[beige] shadow-even', container[toaster.type])}>
                    <div
                      className={cx(
                        'grid grid-cols-[1fr_auto] border-3 py-2 pl-2 pr-1',
                        border[toaster.type],
                      )}
                    >
                      <div className="text-sm">{toaster.content}</div>
                      <button type="button" onClick={onClick(ttl, toaster)}>
                        <CloseFilled className="w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </animated.div>
            ))}
          </div>,
          toasterLayer,
        )}
      </>
    </ToasterContext.Provider>
  )
}

const container: Dict<ToasterType, string> = {
  success: 'bg-green-toaster',
  error: 'bg-red-toaster',
}

const border: Dict<ToasterType, string> = {
  success: 'border-green-toaster-bis',
  error: 'border-red-toaster-bis',
}

export const useToaster = (): ToasterContext => {
  const context = useContext(ToasterContext)
  if (context === undefined) {
    // eslint-disable-next-line functional/no-throw-statements
    throw Error('useToaster must be used within a ToasterContextProvider')
  }
  return context
}
