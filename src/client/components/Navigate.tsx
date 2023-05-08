/* eslint-disable functional/no-expression-statements */
import { useEffect } from 'react'

import type { NavigateOptions } from '../contexts/HistoryContext'
import { useHistory } from '../contexts/HistoryContext'

type NavigateProps = {
  to: string
} & NavigateOptions

export const Navigate: React.FC<NavigateProps> = ({ to, ...options }) => {
  const { navigate } = useHistory()

  useEffect(() => {
    navigate(to, options)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}
