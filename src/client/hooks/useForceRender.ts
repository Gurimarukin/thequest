/* eslint-disable functional/no-return-void */
import { useCallback, useState } from 'react'

/**
 * Expose a util to force a render for the consumer component.
 */
export const useForceRender = (): (() => void) => {
  // eslint-disable-next-line react/hook-use-state
  const [, setValue] = useState(0)
  return useCallback(() => setValue(v => v + 1), [])
}
