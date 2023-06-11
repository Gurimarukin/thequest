/* eslint-disable functional/no-expression-statements,
                  functional/no-return-void */
import { useCallback } from 'react'

import type { List } from '../../shared/utils/fp'

type Props<A extends string> = {
  options: List<A>
  value: A
  setValue: (a: A) => void
  className?: string
}

export function Select<A extends string>({
  options,
  value,
  setValue,
  className,
}: Props<A>): React.ReactElement {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setValue(e.target.value as A)
    },
    [setValue],
  )

  return (
    <select value={value} onChange={handleChange} className={className}>
      {options.map((option, i) => (
        // eslint-disable-next-line react/no-array-index-key
        <option key={i} value={option}>
          {option}
        </option>
      ))}
    </select>
  )
}
