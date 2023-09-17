import { flow, pipe } from 'fp-ts/function'
import { useMemo, useRef } from 'react'

import type { ActiveGameParticipantView } from '../../../shared/models/api/activeGame/ActiveGameParticipantView'
import type { ActiveGameView } from '../../../shared/models/api/activeGame/ActiveGameView'
import { TeamId } from '../../../shared/models/api/activeGame/TeamId'
import { ChallengesView } from '../../../shared/models/api/challenges/ChallengesView'
import { ChampionFaction } from '../../../shared/models/api/champion/ChampionFaction'
import { ListUtils } from '../../../shared/utils/ListUtils'
import type { List } from '../../../shared/utils/fp'
import { Maybe, NonEmptyArray, PartialDict, Tuple } from '../../../shared/utils/fp'

import { Challenge } from '../../components/Challenge'
import { CroppedChampionSquare } from '../../components/CroppedChampionSquare'
import { Tooltip } from '../../components/tooltip/Tooltip'
import { useStaticData } from '../../contexts/StaticDataContext'
import { useTranslation } from '../../contexts/TranslationContext'
import { Assets } from '../../imgs/Assets'
import { cx } from '../../utils/cx'

type Props = {
  isDraft: boolean
  participants: ActiveGameView['participants']
}

export const ActiveGameHeader: React.FC<Props> = ({ isDraft, participants }) => {
  const { t } = useTranslation('common')
  const { championByKey } = useStaticData()

  const factions = useMemo(
    (): PartialDict<`${TeamId}`, List<ChampionFaction>> =>
      pipe(
        participants,
        PartialDict.map(
          flow(
            NonEmptyArray.map(p =>
              pipe(
                championByKey(p.championId),
                Maybe.fold(
                  () => [],
                  c => c.factions,
                ),
              ),
            ),
            ListUtils.commonElems(ChampionFaction.Eq),
          ),
        ),
      ),
    [championByKey, participants],
  )

  return (
    <div className="flex flex-wrap gap-6 px-3 text-sm text-goldenrod">
      {TeamId.values.map((teamId, i) => {
        const teamBans = participants[teamId]
        const reverse = i % 2 === 1
        return (
          <div
            key={teamId}
            className={cx('flex grow items-center gap-8', ['flex-row-reverse', reverse])}
          >
            {isDraft ? (
              <ul className={cx('flex flex-wrap gap-1', ['flex-row-reverse', reverse])}>
                {teamBans !== undefined
                  ? pipe(
                      teamBans,
                      NonEmptyArray.map(participant => (
                        <Ban key={participant.summonerName} participant={participant} />
                      )),
                    )
                  : null}
              </ul>
            ) : null}
            <ul key={teamId} className={cx('flex gap-4', ['justify-end', reverse])}>
              {(factions[teamId] ?? []).map(faction => (
                <li
                  key={faction}
                  className={cx('flex items-center gap-1.5', ['flex-row-reverse', reverse])}
                >
                  <Challenge
                    id={ChallengesView.id[faction]}
                    tier={Maybe.some('GOLD')}
                    className="h-9"
                  />
                  {t.labels.faction[faction]}
                </li>
              ))}
            </ul>
          </div>
        )
      })}
    </div>
  )
}

type BanProps = {
  participant: ActiveGameParticipantView
}

const Ban: React.FC<BanProps> = ({ participant }) => {
  const { t } = useTranslation()
  const { championByKey } = useStaticData()

  const ref = useRef<HTMLLIElement>(null)

  const pickedChampion = championByKey(participant.championId)
  const [children, tooltip] = pipe(
    participant.bannedChampion.championId,
    Maybe.fold(
      () =>
        Tuple.of(
          <li
            ref={ref}
            className="relative flex h-10 w-10 items-center justify-center overflow-hidden bg-black"
          >
            <img
              src={Assets.champion}
              alt={t.common.emptyChampionIconAlt}
              className="h-6 w-6 opacity-50"
            />
          </li>,
          t.activeGame.empty,
        ),
      championId => {
        const bannedChampionName = pipe(
          championByKey(championId),
          Maybe.fold(
            () => t.common.championKey(championId),
            c => c.name,
          ),
        )
        return Tuple.of(
          <CroppedChampionSquare
            ref={ref}
            championKey={championId}
            championName={bannedChampionName}
            as="li"
            className="relative h-10 w-10"
          >
            <span className="absolute top-[calc(100%_-_2px)] w-20 origin-left -rotate-45 border-t-4 border-red-ban shadow-even shadow-black" />
          </CroppedChampionSquare>,
          bannedChampionName,
        )
      },
    ),
  )
  return (
    <>
      {children}
      <Tooltip hoverRef={ref} className="flex flex-col items-center gap-1 !text-2xs">
        <span className="text-xs font-bold">{tooltip}</span>
        {t.activeGame.bannedBy(
          participant.summonerName,
          pipe(
            pickedChampion,
            Maybe.map(c => c.name),
          ),
          participant.bannedChampion.pickTurn,
          'text-xs',
        )}
      </Tooltip>
    </>
  )
}
