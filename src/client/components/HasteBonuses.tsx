/* eslint-disable functional/no-expression-statements,
                  functional/no-return-void */
import { pipe } from 'fp-ts/function'
import { useCallback, useEffect, useId, useRef, useState } from 'react'

import { ItemId } from '../../shared/models/api/ItemId'
import { RuneId } from '../../shared/models/api/perk/RuneId'
import type { StaticDataItem } from '../../shared/models/api/staticData/StaticDataItem'
import type { StaticDataRune } from '../../shared/models/api/staticData/StaticDataRune'
import { Maybe, assertUnreachable } from '../../shared/utils/fp'

import { useStaticData } from '../contexts/StaticDataContext'
import { useTranslation } from '../contexts/TranslationContext'
import { cx } from '../utils/cx'
import { Rune } from './Rune'
import { Tooltip } from './tooltip/Tooltip'

export const cosmicInsight = { id: RuneId(8347), haste: 18 }
const ionianBootsOfLucidity = { id: ItemId(3158), haste: 10 }
const crimsonLucidity = { id: ItemId(3171), haste: 20 }

type HasteBonusesProps = {
  runeById: (id: RuneId) => Maybe<StaticDataRune>
  itemById: (id: ItemId) => Maybe<StaticDataItem>
  /** Pass prop if you want total haste tooltip */
  totalHaste?: number
  onToggle: (addHaste: number) => void
  /** @default false */
  cosmicInsightDefaultChecked?: boolean
  /** @default false */
  cosmicInsightDisabled?: boolean
  canBuyCrimsonLucidity: boolean
  /** @default "large" */
  size?: 'small' | 'large'
  className?: string
}

export const HasteBonuses: React.FC<HasteBonusesProps> = ({
  runeById,
  itemById,
  totalHaste,
  onToggle,
  cosmicInsightDefaultChecked = false,
  cosmicInsightDisabled = false,
  canBuyCrimsonLucidity,
  size = 'large',
  className,
}) => {
  const { t } = useTranslation('common')

  const isSmall = size === 'small'

  const ref = useRef<HTMLUListElement>(null)

  return (
    <>
      <ul ref={ref} className={cx('flex gap-2', className)}>
        {pipe(
          runeById(cosmicInsight.id),
          Maybe.fold(
            () => null,
            rune => (
              <RuneBonusCheckbox
                defaultChecked={cosmicInsightDefaultChecked}
                haste={cosmicInsight.haste}
                rune={rune}
                onToggle={onToggle}
                disabled={cosmicInsightDisabled}
                isSmall={isSmall}
              />
            ),
          ),
        )}

        {pipe(
          itemById(ionianBootsOfLucidity.id),
          Maybe.fold(
            () => null,
            baseItem => (
              <BootsBonusRadio
                baseHaste={ionianBootsOfLucidity.haste}
                baseItem={baseItem}
                upgradedHaste={crimsonLucidity.haste}
                upgradedItem={pipe(
                  itemById(crimsonLucidity.id),
                  Maybe.filter(() => canBuyCrimsonLucidity),
                )}
                onToggle={onToggle}
                isSmall={isSmall}
              />
            ),
          ),
        )}
      </ul>

      {totalHaste !== undefined && (
        <Tooltip hoverRef={ref} placement="top">
          {t.totalHaste(totalHaste)}
        </Tooltip>
      )}
    </>
  )
}

type RuneBonusCheckboxProps = {
  defaultChecked: boolean
  haste: number
  rune: StaticDataRune
  onToggle: (addHaste: number) => void
  disabled: boolean
  isSmall: boolean
}

const RuneBonusCheckbox: React.FC<RuneBonusCheckboxProps> = ({
  defaultChecked,
  haste,
  rune,
  onToggle,
  disabled,
  isSmall,
}) => {
  const [checked, setChecked] = useState(false)

  const onChange = useCallback(() => {
    if (checked) {
      onToggle(-haste)
      setChecked(false)
    } else {
      onToggle(haste)
      setChecked(true)
    }
  }, [checked, haste, onToggle])

  useEffect(() => {
    if (defaultChecked) {
      onChange()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // only on mount

  const id = useId()

  return (
    <li className="flex">
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="peer sr-only"
      />

      <Label htmlFor={id} isSmall={isSmall} crossedOut={!checked}>
        <Rune
          icon={rune.iconPath}
          name={rune.name}
          description={rune.longDesc}
          className="w-full"
        />
      </Label>
    </li>
  )
}

type BootsBonusRadioProps = {
  baseHaste: number
  baseItem: StaticDataItem
  upgradedHaste: number
  upgradedItem: Maybe<StaticDataItem>
  onToggle: (addHaste: number) => void
  isSmall: boolean
}

type RadioState = (typeof radioStateValues)[number]

const radioStateValues = ['none', 'base', 'upgraded'] as const

const BootsBonusRadio: React.FC<BootsBonusRadioProps> = ({
  baseHaste,
  baseItem,
  upgradedHaste,
  upgradedItem,
  onToggle,
  isSmall,
}) => {
  const [value, setValue] = useState<RadioState>('none')

  const onClick = useCallback(() => {
    switch (value) {
      case 'none':
        onToggle(baseHaste)
        return setValue('base')

      case 'base':
        if (Maybe.isSome(upgradedItem)) {
          onToggle(-baseHaste + upgradedHaste)
          return setValue('upgraded')
        }

        onToggle(-baseHaste)
        return setValue('none')

      case 'upgraded':
        onToggle(-upgradedHaste)
        return setValue('none')

      default:
        assertUnreachable(value)
    }
  }, [baseHaste, onToggle, upgradedHaste, upgradedItem, value])

  const id = useId()

  return (
    <li className="flex">
      {radioStateValues.map(val => (
        <Radio
          key={val}
          name="hastBoots"
          id={`${id}-${val}`}
          value={val}
          setValue={setValue}
          isChecked={val === value}
        />
      ))}

      <Label
        htmlFor={`${id}-${value}`}
        isSmall={isSmall}
        crossedOut={value === 'none'}
        onClick={onClick}
      >
        {pipe(
          upgradedItem,
          Maybe.filter(() => value === 'upgraded'),
          Maybe.fold(
            () => <Item item={baseItem} />,
            upgraded => <Item item={upgraded} />,
          ),
        )}
      </Label>
    </li>
  )
}

type RadioProps<A> = {
  name: string
  id: string
  value: A
  setValue: (a: A) => void
  isChecked: boolean
}

function Radio<A extends string>({
  name,
  id,
  value,
  setValue,
  isChecked,
}: RadioProps<A>): React.ReactElement {
  const onChange = useCallback(() => setValue(value), [setValue, value])

  return (
    <input
      type="radio"
      name={name}
      id={id}
      value={value}
      checked={isChecked}
      onChange={onChange}
      className="peer sr-only" // peer enabled cursor pointer below
    />
  )
}

type ItemProps = {
  item: StaticDataItem
}

const Item: React.FC<ItemProps> = ({ item }) => {
  const { assets } = useStaticData()

  const ref = useRef<HTMLImageElement>(null)

  return (
    <>
      <img ref={ref} src={assets.item(item.id)} alt={item.name} className="w-full" />

      <Tooltip hoverRef={ref} className="flex max-w-xs flex-col gap-1">
        <span className="font-bold">{item.name}</span>
        <span className="whitespace-break-spaces">{item.plaintext}</span>
        <span
          dangerouslySetInnerHTML={{ __html: item.description }}
          className="whitespace-normal"
        />
      </Tooltip>
    </>
  )
}

type LabelProps = {
  htmlFor: string
  isSmall: boolean
  crossedOut: boolean
  onClick?: () => void
  children: React.ReactNode
}

const Label: React.FC<LabelProps> = ({ htmlFor, isSmall, crossedOut, onClick, children }) => (
  <label
    htmlFor={htmlFor}
    // prevent drag and drop in parents
    onPointerDown={stopPropagation}
    onClick={onClick}
    className={cx(
      'relative flex overflow-hidden bg-black peer-enabled:cursor-pointer',
      isSmall ? 'w-7' : 'w-10',
    )}
  >
    <span className={crossedOut ? 'opacity-60' : undefined}>{children}</span>

    {crossedOut && (
      <span className="absolute top-[calc(100%_-_0.125rem)] w-20 origin-left -rotate-45 border-t-4 border-red-ban shadow-even shadow-black" />
    )}
  </label>
)

function stopPropagation(e: React.SyntheticEvent): void {
  e.stopPropagation()
}
