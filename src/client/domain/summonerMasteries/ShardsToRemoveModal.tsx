/* eslint-disable functional/no-expression-statements,
                functional/no-return-void */
import { number, ord, predicate, string, task } from 'fp-ts'
import type { Ord } from 'fp-ts/Ord'
import { identity, pipe } from 'fp-ts/function'
import { lens } from 'monocle-ts'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { ChampionKey } from '../../../shared/models/api/champion/ChampionKey'
import type { ChampionLevelOrZero } from '../../../shared/models/api/champion/ChampionLevel'
import type { ChampionPosition } from '../../../shared/models/api/champion/ChampionPosition'
import type { ChampionShardsPayload } from '../../../shared/models/api/summoner/ChampionShardsPayload'
import { StringUtils } from '../../../shared/utils/StringUtils'
import type { Future, List, NotUsed } from '../../../shared/utils/fp'
import { Maybe, NonEmptyArray } from '../../../shared/utils/fp'

import { Loading } from '../../components/Loading'
import { MasteryImg } from '../../components/MasteryImg'
import { Modal } from '../../components/Modal'
import { ButtonPrimary, ButtonSecondary } from '../../components/buttons'
import { Tooltip } from '../../components/tooltip/Tooltip'
import { ChevronForwardFilled, CloseFilled, ToggleFilled } from '../../imgs/svgIcons'
import { cssClasses } from '../../utils/cssClasses'
import { futureRunUnsafe } from '../../utils/futureRunUnsafe'
import { ChampionMasterySquare } from './ChampionMasterySquare'

const { plural } = StringUtils

type Props = {
  notifications: NonEmptyArray<ShardsToRemoveNotification>
  setChampionsShardsBulk: (updates: NonEmptyArray<ChampionShardsPayload>) => Future<NotUsed>
  hide: () => void
}

export type ShardsToRemoveNotification = {
  championId: ChampionKey
  name: string
  championLevel: ChampionLevelOrZero
  championPoints: number
  championPointsUntilNextLevel: number
  percents: number
  chestGranted: boolean
  tokensEarned: number
  shardsCount: number
  positions: List<ChampionPosition>
  leveledUpFrom: ChampionLevelOrZero
  shardsToRemove: number
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
  isChecked: boolean
}

const isCheckedLens = pipe(lens.id<IsChecked>(), lens.prop('isChecked'))

const invert = predicate.not<boolean>(identity)

export const ShardsToRemoveModal = ({
  notifications,
  setChampionsShardsBulk,
  hide,
}: Props): JSX.Element => {
  const toIsChecked = useCallback(
    () =>
      pipe(
        notifications,
        NonEmptyArray.map(n => ({ ...n, isChecked: true })),
        NonEmptyArray.sortBy([byPercents, byName]),
      ),
    [notifications],
  )

  const [notificationsState, setNotificationsState] =
    useState<NonEmptyArray<IsChecked>>(toIsChecked)

  const isSingleMode = notificationsState.length === 1

  useEffect(() => {
    setNotificationsState(toIsChecked())
  }, [toIsChecked])

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

  const [isLoading, setIsLoading] = useState(false)

  const futureWithLoading = useCallback((f: Future<NotUsed>) => {
    setIsLoading(true)
    return pipe(
      f,
      task.chainFirstIOK(() => () => setIsLoading(false)),
      futureRunUnsafe,
    )
  }, [])

  const noSingleMode = useCallback(() => {
    const n = NonEmptyArray.head(notifications)
    return pipe(
      setChampionsShardsBulk([{ championId: n.championId, shardsCount: n.shardsCount }]),
      futureWithLoading,
    )
  }, [futureWithLoading, notifications, setChampionsShardsBulk])

  const yesSingleMode = useCallback(() => {
    const n = NonEmptyArray.head(notifications)
    return pipe(
      setChampionsShardsBulk([
        { championId: n.championId, shardsCount: n.shardsCount - n.shardsToRemove },
      ]),
      futureWithLoading,
    )
  }, [futureWithLoading, notifications, setChampionsShardsBulk])

  const confirmMultipleMode = useCallback(
    () =>
      pipe(
        setChampionsShardsBulk(
          pipe(
            notificationsState,
            NonEmptyArray.map(
              (n): ChampionShardsPayload => ({
                championId: n.championId,
                shardsCount: n.isChecked ? n.shardsCount - n.shardsToRemove : n.shardsCount,
              }),
            ),
          ),
        ),
        futureWithLoading,
      ),
    [futureWithLoading, notificationsState, setChampionsShardsBulk],
  )

  const masteriesRef = useRef<HTMLSpanElement>(null)

  const s = notificationsState.length < 2 ? '' : 's'

  return (
    <Modal>
      <div className="flex max-h-full flex-col items-end overflow-auto border border-goldenrod bg-zinc-900 p-2">
        <button type="button" onClick={hide}>
          <CloseFilled className="w-5 fill-goldenrod" />
        </button>
        <div className="flex flex-col items-center p-4">
          <p className="text-sm">
            Changement{s} de niveau detecté{s} depuis la dernière modification de fragments.
            <br />
            Peut-être en avez-vous utilisés (des fragments) ?
          </p>
          {isSingleMode ? null : (
            <ForAllButton
              notificationsState={notificationsState}
              setNotificationsState={setNotificationsState}
            />
          )}
          <ul
            className={cssClasses(
              'grid grid-cols-[repeat(4,auto)] items-center gap-y-6 gap-x-1',
              isSingleMode ? 'mt-6' : 'mt-2',
            )}
          >
            {notificationsState.map(n => (
              <li key={ChampionKey.unwrap(n.championId)} className="contents">
                <ChampionMasterySquare
                  {...n}
                  shardsCount={Maybe.some(n.shardsCount)}
                  glow={Maybe.none}
                  aram={Maybe.none}
                  setChampionShards={null}
                />
                <span ref={masteriesRef} className="flex items-center">
                  <MasteryImg level={n.leveledUpFrom} className="h-6" />
                  <ChevronForwardFilled className="h-4" />
                  <MasteryImg level={n.championLevel} className="h-6" />
                </span>
                <Tooltip hoverRef={masteriesRef}>
                  Changement de maîtrise {n.leveledUpFrom} à {n.championLevel}
                </Tooltip>
                <span className="justify-self-end pl-12 pr-4 text-sm">
                  enlever {plural('fragment')(n.shardsToRemove)}
                </span>
                {isSingleMode ? null : (
                  <Toggle isChecked={n.isChecked} toggleChecked={toggleChecked(n.championId)} />
                )}
              </li>
            ))}
          </ul>
          {isSingleMode ? (
            <div className="mt-6 flex gap-8">
              <ButtonSecondary
                type="button"
                onClick={noSingleMode}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                Non {isLoading ? <Loading className="h-4" /> : null}
              </ButtonSecondary>
              <ButtonPrimary
                type="button"
                onClick={yesSingleMode}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                Oui {isLoading ? <Loading className="h-4" /> : null}
              </ButtonPrimary>
            </div>
          ) : (
            <ButtonPrimary
              type="button"
              onClick={confirmMultipleMode}
              disabled={isLoading}
              className="mt-6 flex items-center gap-2 bg-goldenrod py-1 px-4 text-black hover:bg-goldenrod/75"
            >
              Confirmer {isLoading ? <Loading className="h-4" /> : null}
            </ButtonPrimary>
          )}
        </div>
      </div>
    </Modal>
  )
}

type ForAllButtonProps = {
  notificationsState: NonEmptyArray<IsChecked>
  setNotificationsState: React.Dispatch<React.SetStateAction<NonEmptyArray<IsChecked>>>
}

const ForAllButton = ({
  notificationsState,
  setNotificationsState,
}: ForAllButtonProps): JSX.Element => {
  const yesForAll = notificationsState.some(n => !n.isChecked)
  const forAllClick = useMemo(
    () =>
      yesForAll
        ? () => setNotificationsState(NonEmptyArray.map(isCheckedLens.set(true)))
        : () => setNotificationsState(NonEmptyArray.map(isCheckedLens.set(false))),
    [setNotificationsState, yesForAll],
  )

  return (
    <button
      type="button"
      onClick={forAllClick}
      className="col-span-2 mt-6 self-end border border-goldenrod bg-black py-1 px-2 text-sm hover:bg-goldenrod/75 hover:text-black"
    >
      {yesForAll ? 'Oui' : 'Non'} pour tout
    </button>
  )
}

type ToggleProps = {
  isChecked: boolean
  toggleChecked: () => void
}

const Toggle = ({ isChecked, toggleChecked }: ToggleProps): JSX.Element => (
  <label className="cursor-pointer">
    <input type="checkbox" checked={isChecked} onChange={toggleChecked} className="hidden" />
    <ToggleFilled
      className={cssClasses('w-8', isChecked ? 'fill-goldenrod' : 'rotate-180 fill-red-700')}
    />
  </label>
)
