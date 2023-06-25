/* eslint-disable functional/no-return-void */
import type { NonEmptyArray } from '../../shared/utils/fp'

import { cx } from '../utils/cx'

type Value = string | number | null

type RadiosProps<A extends Value> = {
  name: string
  value: A
  setValue: (a: A) => void
  children: NonEmptyArray<LabelValue<A>>
}

type LabelValue<A> = {
  value: A
  label: React.ReactNode
}

export function Radios<A extends Value>({
  name,
  value,
  setValue,
  children,
}: RadiosProps<A>): React.ReactElement {
  return (
    <div className="flex flex-wrap">
      {children.map(({ value: val, label }) => {
        const isChecked = val === value
        return (
          <label key={val} className="group">
            <input
              type="radio"
              name={name}
              checked={isChecked}
              // eslint-disable-next-line react/jsx-no-bind
              onChange={() => setValue(val)}
              className="hidden"
            />
            <span
              className={cx(
                'flex border-l border-goldenrod-bis group-first:rounded-l-md group-first:border-l-0 group-last:rounded-r-md',
                isChecked ? 'bg-goldenrod-bis text-black' : 'cursor-pointer bg-zinc-700',
              )}
            >
              {label}
            </span>
          </label>
        )
      })}
    </div>
  )
}

export function labelValue<A>(value: A, label: React.ReactNode): LabelValue<A> {
  return { value, label }
}
