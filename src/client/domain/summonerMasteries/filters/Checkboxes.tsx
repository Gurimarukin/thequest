/* eslint-disable functional/no-return-void */
import type { Placement } from '@popperjs/core'
import { readonlySet } from 'fp-ts'
import type { Eq } from 'fp-ts/Eq'
import { pipe } from 'fp-ts/function'
import React, { useRef } from 'react'

import { List } from '../../../../shared/utils/fp'

import { Tooltip } from '../../../components/tooltip/Tooltip'
import { cssClasses } from '../../../utils/cssClasses'

type Props<A> = {
  eq: Eq<A>
  values: List<{
    key: React.Key
    value: A
    icon: (isChecked: boolean) => React.ReactNode
    label: React.ReactNode
  }>
  checked: ReadonlySet<A>
  toggleChecked: (a: A) => (e: React.ChangeEvent<HTMLInputElement>) => void
  onMouseEnter?: React.MouseEventHandler<HTMLDivElement>
  tooltipPlacement?: Placement
  iconClassName?: string
}

export function Checkboxes<A>({
  eq,
  values,
  checked,
  toggleChecked,
  onMouseEnter,
  tooltipPlacement,
  iconClassName,
}: Props<A>): JSX.Element {
  return (
    <div onMouseEnter={onMouseEnter} className="flex flex-wrap">
      {pipe(
        values,
        List.map(({ key, value, icon, label }) => (
          <LabelCheckbox<A>
            key={key}
            eq={eq}
            value={value}
            icon={icon}
            label={label}
            checked={checked}
            toggleChecked={toggleChecked}
            tooltipPlacement={tooltipPlacement}
            iconClassName={iconClassName}
          />
        )),
      )}
    </div>
  )
}

type LabelCheckboxProps<A> = {
  eq: Eq<A>
  value: A
  icon: (isChecked: boolean) => React.ReactNode
  label: React.ReactNode
  checked: ReadonlySet<A>
  toggleChecked: (a: A) => (e: React.ChangeEvent<HTMLInputElement>) => void
  tooltipPlacement: Placement | undefined
  iconClassName: string | undefined
}

function LabelCheckbox<A>({
  eq,
  value,
  icon,
  label,
  checked,
  toggleChecked,
  tooltipPlacement,
  iconClassName,
}: LabelCheckboxProps<A>): JSX.Element {
  const hoverRef = useRef<HTMLSpanElement>(null)
  const isChecked = readonlySet.elem(eq)(value, checked)
  return (
    <label className="group/checkbox">
      <input
        type="checkbox"
        checked={isChecked}
        onChange={toggleChecked(value)}
        className="hidden"
      />
      <span
        ref={hoverRef}
        className={cssClasses(
          'flex h-9 shrink-0 cursor-pointer group-first/checkbox:rounded-l-md group-last/checkbox:rounded-r-md',
          ['bg-zinc-700', !isChecked],
          ['bg-goldenrod-secondary', isChecked],
          iconClassName,
        )}
      >
        {icon(isChecked)}
      </span>
      <Tooltip hoverRef={hoverRef} placement={tooltipPlacement}>
        {label}
      </Tooltip>
    </label>
  )
}
