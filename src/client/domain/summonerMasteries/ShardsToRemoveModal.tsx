/* eslint-disable functional/no-expression-statements,
                functional/no-return-void */
import { number, ord, predicate, string } from 'fp-ts'
import type { Ord } from 'fp-ts/Ord'
import { identity, pipe } from 'fp-ts/function'
import { lens } from 'monocle-ts'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { ChampionFaction } from '../../../shared/models/api/champion/ChampionFaction'
import { ChampionKey } from '../../../shared/models/api/champion/ChampionKey'
import type { ChampionLevel } from '../../../shared/models/api/champion/ChampionLevel'
import type { ChampionPosition } from '../../../shared/models/api/champion/ChampionPosition'
import type { ChampionShard } from '../../../shared/models/api/summoner/ChampionShardsPayload'
import type { List } from '../../../shared/utils/fp'
import { Maybe, NonEmptyArray } from '../../../shared/utils/fp'

import { ChampionMasterySquare } from '../../components/ChampionMasterySquare'
import { Loading } from '../../components/Loading'
import { MasteryImg } from '../../components/MasteryImg'
import { Modal } from '../../components/Modal'
import { ButtonPrimary, ButtonSecondary } from '../../components/buttons'
import { Tooltip } from '../../components/tooltip/Tooltip'
import { useTranslation } from '../../contexts/TranslationContext'
import { ChevronForwardFilled, CloseFilled, ToggleFilled } from '../../imgs/svgs/icons'
import { cx } from '../../utils/cx'

export type ShardsToRemoveNotification = {
  championId: ChampionKey
  name: string
  championLevel: ChampionLevel
  championPoints: number
  championPointsSinceLastLevel: number
  championPointsUntilNextLevel: number
  percents: number
  chestGranted: boolean
  tokensEarned: number
  shardsCount: number
  positions: List<ChampionPosition>
  factions: List<ChampionFaction>
  leveledUpFrom: ChampionLevel
  shardsToRemove: number
}

const byPercents: Ord<ShardsToRemoveNotification> = pipe(
  number.Ord,
  ord.contramap((n: ShardsToRemoveNotification) => n.percents),
  ord.reverse,
)

const byName: Ord<ShardsToRemoveNotification> = pipe(
  string.Ord,
  ord.contramap((n: ShardsToRemoveNotification) => n.name),
)

type IsChecked = ShardsToRemoveNotification & {
  isChecked: boolean
}

const isCheckedLens = pipe(lens.id<IsChecked>(), lens.prop('isChecked'))

const invert = predicate.not<boolean>(identity)

type Props = {
  notifications: NonEmptyArray<ShardsToRemoveNotification>
  shardsIsLoading: boolean
  setChampionsShardsBulk: (updates: NonEmptyArray<ChampionShard>) => void
  hide: () => void
}

export const ShardsToRemoveModal: React.FC<Props> = ({
  notifications,
  shardsIsLoading,
  setChampionsShardsBulk,
  hide,
}) => {
  const { t } = useTranslation('masteries')

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

  const noSingleMode = useCallback(() => {
    const n = NonEmptyArray.head(notifications)
    return setChampionsShardsBulk([{ championId: n.championId, shardsCount: n.shardsCount }])
  }, [notifications, setChampionsShardsBulk])

  const yesSingleMode = useCallback(() => {
    const n = NonEmptyArray.head(notifications)
    return setChampionsShardsBulk([
      { championId: n.championId, shardsCount: n.shardsCount - n.shardsToRemove },
    ])
  }, [notifications, setChampionsShardsBulk])

  const confirmMultipleMode = useCallback(
    () =>
      setChampionsShardsBulk(
        pipe(
          notificationsState,
          NonEmptyArray.map(
            (n): ChampionShard => ({
              championId: n.championId,
              shardsCount: n.isChecked ? n.shardsCount - n.shardsToRemove : n.shardsCount,
            }),
          ),
        ),
      ),
    [notificationsState, setChampionsShardsBulk],
  )

  const masteriesRef = useRef<HTMLSpanElement>(null)

  return (
    <Modal>
      <div className="flex max-h-full flex-col items-end overflow-auto border border-goldenrod bg-zinc-900 p-2">
        <button type="button" onClick={hide}>
          <CloseFilled className="w-5 text-goldenrod" />
        </button>
        <div className="flex flex-col items-center p-4">
          <p className="text-sm">{t.modal.nChangesDetected(notificationsState.length)}</p>
          {isSingleMode ? null : (
            <ForAllButton
              notificationsState={notificationsState}
              setNotificationsState={setNotificationsState}
            />
          )}
          <ul
            className={cx(
              'grid grid-cols-[repeat(4,auto)] items-center gap-x-1 gap-y-6',
              isSingleMode ? 'mt-6' : 'mt-2',
            )}
          >
            {notificationsState.map(n => (
              <li key={ChampionKey.unwrap(n.championId)} className="contents">
                <ChampionMasterySquare
                  {...n}
                  shardsCount={Maybe.some(n.shardsCount)}
                  setChampionShards={null}
                  centerShards={true}
                />
                <span ref={masteriesRef} className="flex items-center">
                  <MasteryImg level={n.leveledUpFrom} className="h-6" />
                  <ChevronForwardFilled className="h-4" />
                  <MasteryImg level={n.championLevel} className="h-6" />
                </span>
                <Tooltip hoverRef={masteriesRef} placement="top">
                  {t.modal.masteryChange(n.leveledUpFrom, n.championLevel)}
                </Tooltip>
                <span className="justify-self-end pl-12 pr-4 text-sm">
                  {t.modal.removeNShards(n.shardsToRemove)}
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
                disabled={shardsIsLoading}
                className="flex items-center gap-2"
              >
                <span>{t.modal.no}</span>
                {shardsIsLoading ? <Loading className="h-4" /> : null}
              </ButtonSecondary>
              <ButtonPrimary
                type="button"
                onClick={yesSingleMode}
                disabled={shardsIsLoading}
                className="flex items-center gap-2"
              >
                <span>{t.modal.yes}</span>
                {shardsIsLoading ? <Loading className="h-4" /> : null}
              </ButtonPrimary>
            </div>
          ) : (
            <ButtonPrimary
              type="button"
              onClick={confirmMultipleMode}
              disabled={shardsIsLoading}
              className="mt-6 flex items-center gap-2 bg-goldenrod px-4 py-1 text-black hover:bg-goldenrod/75"
            >
              <span>{t.modal.confirm}</span>
              {shardsIsLoading ? <Loading className="h-4" /> : null}
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

const ForAllButton: React.FC<ForAllButtonProps> = ({
  notificationsState,
  setNotificationsState,
}) => {
  const { t } = useTranslation('masteries')

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
      className="col-span-2 mt-6 self-end border border-goldenrod bg-black px-2 py-1 text-sm hover:bg-goldenrod/75 hover:text-black"
    >
      {yesForAll ? t.modal.yesForAll : t.modal.noForAll}
    </button>
  )
}

type ToggleProps = {
  isChecked: boolean
  toggleChecked: () => void
}

const Toggle: React.FC<ToggleProps> = ({ isChecked, toggleChecked }) => (
  <label className="cursor-pointer">
    <input type="checkbox" checked={isChecked} onChange={toggleChecked} className="hidden" />
    <ToggleFilled
      className={cx('w-8', isChecked ? 'text-goldenrod' : 'rotate-180 text-zinc-400')}
    />
  </label>
)
