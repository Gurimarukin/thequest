/* eslint-disable functional/no-expression-statements,
                  functional/no-return-void */
import { useCallback, useEffect, useRef, useState } from 'react'

type ShouldWrap = {
  shouldWrap: boolean
  onMountContainer: (e: HTMLElement | null) => void
  onMountLeft: (e: HTMLElement | null) => void
  onMountRight: (e: HTMLElement | null) => void
}

export const useShouldWrap = (): ShouldWrap => {
  const [shouldWrap, setShouldWrap] = useState(false)

  const containerRef = useRef<HTMLElement | null>(null)
  const leftRef = useRef<HTMLElement | null>(null)
  const rightRef = useRef<HTMLElement | null>(null)

  const updateShouldWrap = useCallback(() => {
    if (containerRef.current !== null && leftRef.current !== null && rightRef.current !== null) {
      const container = containerRef.current.getBoundingClientRect()
      const left = leftRef.current.getBoundingClientRect()
      const right = rightRef.current.getBoundingClientRect()

      setShouldWrap(shouldWrap_ => {
        if (shouldWrap_ && left.right < right.left) return false
        if (!shouldWrap_ && container.width < left.width + right.width) return true
        return shouldWrap_
      })
    }
  }, [])

  useEffect(() => {
    window.addEventListener('resize', updateShouldWrap)
    return () => window.removeEventListener('resize', updateShouldWrap)
  }, [updateShouldWrap])

  return {
    shouldWrap,
    onMountContainer: useCallback(
      (e: HTMLElement | null) => {
        // eslint-disable-next-line functional/immutable-data
        containerRef.current = e
        updateShouldWrap()
      },
      [updateShouldWrap],
    ),
    onMountLeft: useCallback(
      (e: HTMLElement | null) => {
        // eslint-disable-next-line functional/immutable-data
        leftRef.current = e
        updateShouldWrap()
      },
      [updateShouldWrap],
    ),
    onMountRight: useCallback(
      (e: HTMLElement | null) => {
        // eslint-disable-next-line functional/immutable-data
        rightRef.current = e
        updateShouldWrap()
      },
      [updateShouldWrap],
    ),
  }
}
