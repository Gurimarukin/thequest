/* eslint-disable functional/no-return-void */
import { number, ord, predicate, string } from 'fp-ts'
import type { Ord } from 'fp-ts/Ord'
import { identity, pipe } from 'fp-ts/function'
import { lens } from 'monocle-ts'
import React, { useCallback, useMemo, useState } from 'react'

import { ChampionKey } from '../../../shared/models/api/ChampionKey'
import type { ChampionLevelOrZero } from '../../../shared/models/api/ChampionLevel'
import { StringUtils } from '../../../shared/utils/StringUtils'
import { Maybe, NonEmptyArray } from '../../../shared/utils/fp'

import { MasteryImg } from '../../components/MasteryImg'
import { Modal } from '../../components/Modal'
import { ChevronForwardFilled, CloseFilled, ToggleFilled } from '../../imgs/svgIcons'
import { cssClasses } from '../../utils/cssClasses'
import { ChampionMasterySquare } from './ChampionMasterySquare'

type Props = {
  readonly notifications: NonEmptyArray<ShardsToRemoveNotification>
}

export type ShardsToRemoveNotification = {
  readonly championId: ChampionKey
  readonly name: string
  readonly championLevel: ChampionLevelOrZero
  readonly percents: number
  readonly chestGranted: boolean
  readonly tokensEarned: number
  readonly shardsCount: number
  readonly leveledUpFrom: ChampionLevelOrZero
  readonly shardsToRemove: number
}

const byPercents: Ord<ShardsToRemoveNotification> = pipe(
  number.Ord,
  ord.contramap((n: ShardsToRemoveNotification) => n.percents),
  ord.reverse,
)

const byName: Ord<ShardsToRemoveNotification> = pipe(
  string.Ord,
  ord.contramap(n => n.name),
)

type IsChecked = ShardsToRemoveNotification & {
  readonly isChecked: boolean
}

const isCheckedLens = pipe(lens.id<IsChecked>(), lens.prop('isChecked'))

const invert = predicate.not<boolean>(identity)

export const ShardsToRemoveModal = ({ notifications }: Props): JSX.Element => {
  const [notificationsState, setNotificationsState] = useState<NonEmptyArray<IsChecked>>(() =>
    pipe(
      notifications,
      NonEmptyArray.map(n => ({ ...n, isChecked: true })),
      NonEmptyArray.sortBy([byPercents, byName]),
    ),
  )

  const toggleChecked = useCallback(
    (champion: ChampionKey) => () =>
      setNotificationsState(
        NonEmptyArray.map(n =>
          ChampionKey.Eq.equals(champion, n.championId)
            ? pipe(isCheckedLens, lens.modify(invert))(n)
            : n,
        ),
      ),
    [],
  )

  const yesForAll = notificationsState.some(n => !n.isChecked)
  const forAllClick = useMemo(
    () =>
      yesForAll
        ? () => setNotificationsState(NonEmptyArray.map(isCheckedLens.set(true)))
        : () => setNotificationsState(NonEmptyArray.map(isCheckedLens.set(false))),
    [yesForAll],
  )

  return (
    <Modal>
      <div className="flex max-h-full flex-col items-end overflow-auto border border-goldenrod bg-zinc-900 p-2">
        <button type="button">
          <CloseFilled className="w-5 fill-goldenrod" />
        </button>
        <div className="flex flex-col p-4">
          <p className="pt-2 text-sm">
            Changement{notificationsState.length < 2 ? '' : 's'} de niveau depuis la dernière
            modification de fragments.
            <br />
            Peut-être en avez-vous utilisés (des fragments) ?
          </p>
          <button
            type="button"
            onClick={forAllClick}
            className="col-span-2 mt-6 self-end border border-goldenrod bg-black py-1 px-2 text-sm hover:bg-goldenrod/75 hover:text-black"
          >
            {yesForAll ? 'Oui' : 'Non'} pour tout
          </button>
          <ul className="mt-2 grid grid-cols-[auto_auto_1fr_auto] items-center gap-y-6 gap-x-1">
            {notificationsState.map(n => (
              <li key={ChampionKey.unwrap(n.championId)} className="contents">
                <ChampionMasterySquare
                  {...n}
                  shardsCount={Maybe.some(n.shardsCount)}
                  glow={Maybe.none}
                  setChampionShards={null}
                />
                <span
                  className="flex items-center"
                  title={`Maîtrise ${n.championLevel} — précédemment maîtrise ${n.leveledUpFrom}`}
                >
                  <MasteryImg level={n.leveledUpFrom} className="h-6" />
                  <ChevronForwardFilled className="h-4" />
                  <MasteryImg level={n.championLevel} className="h-6" />
                </span>
                <span className="justify-self-end pl-12 pr-4 text-sm">
                  enlever {StringUtils.plural(n.shardsToRemove, 'fragment')}
                </span>
                <Toggle isChecked={n.isChecked} toggleChecked={toggleChecked(n.championId)} />
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="mt-6 self-center bg-goldenrod py-1 px-4 text-black hover:bg-goldenrod/75"
          >
            Confirmer
          </button>
        </div>
      </div>
    </Modal>
  )
}

type ToggleProps = {
  readonly isChecked: boolean
  readonly toggleChecked: () => void
}

const Toggle = ({ isChecked, toggleChecked }: ToggleProps): JSX.Element => (
  <label className="cursor-pointer">
    <input type="checkbox" checked={isChecked} onChange={toggleChecked} className="hidden" />
    <ToggleFilled
      className={cssClasses('w-8 fill-goldenrod', ['rotate-180 opacity-50', !isChecked])}
    />
  </label>
)
