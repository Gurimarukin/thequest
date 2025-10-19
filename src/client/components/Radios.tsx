/* eslint-disable functional/no-return-void */
import { useCallback, useId } from 'react'

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
      {children.map(({ value: val, label }) => (
        <Radio
          key={val}
          name={name}
          value={val}
          setValue={setValue}
          label={label}
          isChecked={val === value}
        />
      ))}
    </div>
  )
}

type RadioProps<A extends Value> = {
  name: string
  value: A
  setValue: (a: A) => void
  label: React.ReactNode
  isChecked: boolean
}

function Radio<A extends Value>({
  name,
  value,
  setValue,
  label,
  isChecked,
}: RadioProps<A>): React.ReactNode {
  const onChange = useCallback(() => setValue(value), [setValue, value])

  const id = useId()

  return (
    <span className="group">
      <input
        type="radio"
        name={name}
        id={id}
        checked={isChecked}
        onChange={onChange}
        className="sr-only"
      />

      <label
        htmlFor={id}
        className={cx(
          'flex border-l border-goldenrod-bis group-first:rounded-l-md group-first:border-l-0 group-last:rounded-r-md',
          isChecked ? 'bg-goldenrod-bis text-black' : 'cursor-pointer bg-zinc-700',
        )}
      >
        {label}
      </label>
    </span>
  )
}

export function labelValue<A>(value: A, label: React.ReactNode): LabelValue<A> {
  return { value, label }
}
