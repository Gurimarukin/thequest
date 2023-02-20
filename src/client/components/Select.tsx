/* eslint-disable functional/no-expression-statements,
                  functional/no-return-void */
import React, { useCallback } from 'react'

import type { List } from '../../shared/utils/fp'

type Props<A extends string> = {
  readonly options: List<A>
  readonly value: A
  readonly setValue: (a: A) => void
  readonly className?: string
}

export function Select<A extends string>({
  options,
  value,
  setValue,
  className,
}: Props<A>): JSX.Element {
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
