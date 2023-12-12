/* eslint-disable functional/no-expression-statements,
                  functional/no-return-void */
import { useCallback, useRef } from 'react'
import type { SelectInstance, SingleValue } from 'react-select'
import ReactSelect from 'react-select'

import { type List } from '../../shared/utils/fp'

import { ChevronForwardFilled } from '../imgs/svgs/icons'
import { cx } from '../utils/cx'

type Props<A extends string> = {
  options: List<SelectOption<A>>
  value: A
  onChange: (a: A) => void
  className?: string
}

type SelectOption<A extends string> = {
  value: A
  label: string
}

function SelectOption<A extends string>(value: A, label: string = value): SelectOption<A> {
  return { value, label }
}

export { SelectOption }

export function Select<A extends string>({
  options,
  value,
  onChange,
  className,
}: Props<A>): React.ReactElement {
  const ref = useRef<SelectInstance<SelectOption<A>> | null>(null)

  const menuIsOpenRef = useRef<boolean>(false)

  const handleChange = useCallback(
    (newValue: SingleValue<SelectOption<A>>) => {
      if (newValue !== null) {
        onChange(newValue.value)
      }
    },
    [onChange],
  )

  const onMenuOpen = useCallback(() => {
    // eslint-disable-next-line functional/immutable-data
    menuIsOpenRef.current = true
  }, [])

  const onMenuClose = useCallback(() => {
    // eslint-disable-next-line functional/immutable-data
    menuIsOpenRef.current = false
  }, [])

  return (
    <ReactSelect<SelectOption<A>>
      ref={ref}
      options={options}
      value={SelectOption(value)}
      onChange={handleChange}
      onMenuOpen={onMenuOpen}
      onMenuClose={onMenuClose}
      isSearchable={false}
      components={{
        IndicatorSeparator: null,
        DropdownIndicator: ChevronForwardFilled,
      }}
      className={className}
      styles={{
        control: base => ({
          ...base,
          minHeight: undefined,
          backgroundColor: undefined,
          borderRadius: undefined,
          borderWidth: undefined,
          borderColor: undefined,
          '&:hover': undefined,
        }),
        valueContainer: base => ({
          ...base,
          padding: undefined,
        }),
        singleValue: base => ({
          ...base,
          marginRight: undefined,
          marginLeft: undefined,
          color: undefined,
        }),
        indicatorsContainer: base => ({
          ...base,

          '& > svg': {
            width: 16,
            height: 16,
            transform: menuIsOpenRef.current ? 'rotate(270deg)' : 'rotate(90deg)',
            transition: 'transform 0.3s',
          },
        }),
        menu: base => ({
          ...base,
          marginTop: undefined,
          marginBottom: undefined,
          backgroundColor: undefined,
          borderRadius: undefined,
        }),
        menuList: base => ({
          ...base,
          paddingTop: undefined,
          paddingBottom: undefined,
        }),
        option: base => ({
          ...base,
          padding: undefined,
          backgroundColor: undefined,
          color: undefined,
          cursor: undefined,
        }),
      }}
      classNames={{
        container: () => containerClassName,
        control: () => controlClassName,
        singleValue: () => singleValueClassName,
        menu: () => menuClassName,
        option: p =>
          cx(
            optionClassName,
            [optionIsFocusedClassName, p.isFocused],
            p.isSelected ? optionIsSelectedClassName : optionNotSelectedClassName,
          ) ?? '',
      }}
    />
  )
}

const containerClassName = 'z-10'

const controlClassName = 'h-full pl-1.5 pr-1 gap-1 border-y border-l border-goldenrod'

const singleValueClassName = 'min-w-[32px]'

const menuClassName = 'bg-zinc-700 rounded-b-md'

const optionClassName = 'py-[3px] px-1.5'
const optionIsFocusedClassName = 'bg-black'
const optionIsSelectedClassName = 'bg-goldenrod-bis'
const optionNotSelectedClassName = 'cursor-pointer hover:bg-black'
