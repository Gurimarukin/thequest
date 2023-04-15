/* eslint-disable functional/no-return-void */
import type { Placement } from '@popperjs/core'
import { readonlySet } from 'fp-ts'
import type { Endomorphism } from 'fp-ts/Endomorphism'
import type { Eq } from 'fp-ts/Eq'
import { pipe } from 'fp-ts/function'
import React, { useCallback, useRef } from 'react'

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
  toggleChecked: (f: Endomorphism<ReadonlySet<A>>) => void
  isMenuVisible?: boolean
  onMouseEnter?: React.MouseEventHandler<HTMLDivElement>
  tooltipPlacement?: Placement
  iconClassName?: string
  className?: string
}

export function Checkboxes<A>({
  eq,
  values,
  checked,
  toggleChecked,
  isMenuVisible,
  onMouseEnter,
  tooltipPlacement,
  iconClassName,
  className,
}: Props<A>): JSX.Element {
  const toggleChecked_ = useCallback(
    (value: A) => (e: React.ChangeEvent<HTMLInputElement>) =>
      toggleChecked(prev => {
        const isAllChecked = readonlySet.size(prev) === List.size(values)
        if (isAllChecked) return new Set([value])

        const isChecked = readonlySet.elem(eq)(value, prev)
        if (isChecked && readonlySet.size(prev) === 1) {
          return pipe(
            values,
            List.map(v => v.value),
            readonlySet.fromReadonlyArray(eq),
          )
        }

        return pipe(
          prev,
          (e.target.checked ? readonlySet.insert(eq) : readonlySet.remove(eq))(value),
        )
      }),
    [eq, toggleChecked, values],
  )

  return (
    <div onMouseEnter={onMouseEnter} className={cssClasses('flex flex-wrap', className)}>
      {pipe(
        values,
        List.map(({ key, value, icon, label }) => (
          <LabelCheckbox<A>
            key={key}
            eq={eq}
            isAllChecked={readonlySet.size(checked) === List.size(values)}
            value={value}
            icon={icon}
            label={label}
            checked={checked}
            toggleChecked={toggleChecked_}
            isMenuVisible={isMenuVisible}
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
  isAllChecked: boolean
  value: A
  icon: (isChecked: boolean) => React.ReactNode
  label: React.ReactNode
  checked: ReadonlySet<A>
  toggleChecked: (value: A) => (e: React.ChangeEvent<HTMLInputElement>) => void
  isMenuVisible: boolean | undefined
  tooltipPlacement: Placement | undefined
  iconClassName: string | undefined
}

function LabelCheckbox<A>({
  eq,
  isAllChecked,
  value,
  icon,
  label,
  checked,
  toggleChecked,
  isMenuVisible,
  tooltipPlacement,
  iconClassName,
}: LabelCheckboxProps<A>): JSX.Element {
  const hoverRef = useRef<HTMLSpanElement>(null)
  const isChecked = isAllChecked ? false : readonlySet.elem(eq)(value, checked)
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
          'flex h-9 shrink-0 cursor-pointer',
          isMenuVisible === true
            ? 'group-first/checkbox:rounded-tl-md group-last/checkbox:rounded-tr-md'
            : 'group-first/checkbox:rounded-l-md group-last/checkbox:rounded-r-md',
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
