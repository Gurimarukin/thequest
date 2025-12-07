/* eslint-disable functional/no-expression-statements,
                  functional/no-return-void */
import { pipe } from 'fp-ts/function'
import { useCallback, useEffect, useId, useRef, useState } from 'react'

import { ItemId } from '../../shared/models/api/ItemId'
import { RuneId } from '../../shared/models/api/perk/RuneId'
import type { StaticDataItem } from '../../shared/models/api/staticData/StaticDataItem'
import type { StaticDataRune } from '../../shared/models/api/staticData/StaticDataRune'
import { List, Maybe } from '../../shared/utils/fp'

import { useStaticData } from '../contexts/StaticDataContext'
import { cx } from '../utils/cx'
import { Rune } from './Rune'
import { Tooltip } from './tooltip/Tooltip'

export const cosmicInsight = { id: RuneId(8347), haste: 18 }
const ionianBootsOfLucidity = { id: ItemId(3158), haste: 10 }

type HasteBonusesProps = {
  runeById: (id: RuneId) => Maybe<StaticDataRune>
  itemById: (id: ItemId) => Maybe<StaticDataItem>
  onToggle: (addHaste: number) => void
  /** @default false */
  cosmicInsightDefaultChecked?: boolean
  /** @default false */
  cosmicInsightDisabled?: boolean
  /** @default "large" */
  size?: 'small' | 'large'
  className?: string
}

export const HasteBonuses: React.FC<HasteBonusesProps> = ({
  runeById,
  itemById,
  onToggle,
  cosmicInsightDefaultChecked = false,
  cosmicInsightDisabled = false,
  size = 'large',
  className,
}) => {
  const isSmall = size === 'small'

  const hasteBonuses: List<Maybe<PartialBonusProps>> = [
    pipe(
      runeById(cosmicInsight.id),
      Maybe.map(
        (rune): PartialBonusProps => ({
          defaultChecked: cosmicInsightDefaultChecked,
          haste: cosmicInsight.haste,
          disabled: cosmicInsightDisabled,
          children: (
            <Rune
              icon={rune.iconPath}
              name={rune.name}
              description={rune.longDesc}
              className="w-full"
            />
          ),
        }),
      ),
    ),
    pipe(
      itemById(ionianBootsOfLucidity.id),
      Maybe.map(
        (item): PartialBonusProps => ({
          haste: ionianBootsOfLucidity.haste,
          children: <Item item={item} />,
        }),
      ),
    ),
  ]

  return (
    <ul className={cx('flex gap-2', className)}>
      {pipe(
        hasteBonuses,
        List.filterMapWithIndex((i, bonus) =>
          pipe(
            bonus,
            Maybe.map(({ defaultChecked, disabled, ...props }) => (
              <HasteBonus
                {...props}
                key={i}
                defaultChecked={defaultChecked ?? false}
                onToggle={onToggle}
                disabled={disabled ?? false}
                isSmall={isSmall}
              />
            )),
          ),
        ),
      )}
    </ul>
  )
}

type PartialBonusProps = Required<Pick<HasteBonusProps, 'haste' | 'children'>> &
  Partial<Pick<HasteBonusProps, 'defaultChecked' | 'disabled'>>

type HasteBonusProps = {
  defaultChecked: boolean
  haste: number
  onToggle: (addHaste: number) => void
  disabled: boolean
  isSmall: boolean
  children?: React.ReactNode
}

const HasteBonus: React.FC<HasteBonusProps> = ({
  defaultChecked,
  haste,
  onToggle,
  disabled,
  isSmall,
  children,
}) => {
  const [checked, setChecked] = useState(false)

  const handleToggle = useCallback(() => {
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
      handleToggle()
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
        onChange={handleToggle}
        disabled={disabled}
        className="peer sr-only"
      />

      <label
        htmlFor={id}
        // prevent drag and drop in parents
        onPointerDown={stopPropagation}
        className={cx(
          'relative flex overflow-hidden bg-black peer-enabled:cursor-pointer',
          isSmall ? 'w-7' : 'w-10',
        )}
      >
        <span className={checked ? undefined : 'opacity-60'}>{children}</span>

        {!checked && (
          <span className="absolute top-[calc(100%_-_0.125rem)] w-20 origin-left -rotate-45 border-t-4 border-red-ban shadow-even shadow-black" />
        )}
      </label>
    </li>
  )
}

function stopPropagation(e: React.SyntheticEvent): void {
  e.stopPropagation()
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
