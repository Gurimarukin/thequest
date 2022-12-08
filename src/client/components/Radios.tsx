/* eslint-disable functional/no-return-void */
import React from 'react'

import type { NonEmptyArray } from '../../shared/utils/fp'

import { cssClasses } from '../utils/cssClasses'

type Value = string | number | null

type RadiosProps<A extends Value> = {
  readonly name: string
  readonly value: A
  readonly setValue: (a: A) => void
  readonly children: NonEmptyArray<LabelValue<A>>
}

type LabelValue<A> = {
  readonly value: A
  readonly label: React.ReactNode
}

export function Radios<A extends Value>({
  name,
  value,
  setValue,
  children,
}: RadiosProps<A>): JSX.Element {
  return (
    <div className="flex">
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
              className={cssClasses(
                'flex group-first:rounded-l-md group-last:rounded-r-md',
                ['cursor-pointer bg-zinc-700', !isChecked],
                ['bg-goldenrod text-black', isChecked],
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