import { pipe } from 'fp-ts/function'
import { useRef } from 'react'

import type { ActiveGameParticipantView } from '../../../shared/models/api/activeGame/ActiveGameParticipantView'
import { TeamId } from '../../../shared/models/api/activeGame/TeamId'
import { ChampionKey } from '../../../shared/models/api/champion/ChampionKey'
import type { PartialDict } from '../../../shared/utils/fp'
import { Maybe, NonEmptyArray, Tuple } from '../../../shared/utils/fp'

import { CroppedChampionSquare } from '../../components/CroppedChampionSquare'
import { Tooltip } from '../../components/tooltip/Tooltip'
import { useStaticData } from '../../contexts/StaticDataContext'
import { Assets } from '../../imgs/Assets'
import { cx } from '../../utils/cx'

type Props = {
  participants: PartialDict<`${TeamId}`, NonEmptyArray<ActiveGameParticipantView>>
}

export const ActiveGameBans: React.FC<Props> = ({ participants }) => (
  <div className="flex flex-wrap justify-between gap-6 px-3">
    {TeamId.values.map((teamId, i) => {
      const teamBans = participants[teamId]
      const reverse = i % 2 === 1
      return (
        <ul key={teamId} className={cx('flex flex-wrap gap-1', ['flex-row-reverse', reverse])}>
          {teamBans !== undefined
            ? pipe(
                teamBans,
                NonEmptyArray.map(participant => (
                  <Ban key={participant.summonerName} participant={participant} />
                )),
              )
            : null}
        </ul>
      )
    })}
  </div>
)

type BanProps = {
  participant: ActiveGameParticipantView
}

const Ban: React.FC<BanProps> = ({ participant }) => {
  const { champions } = useStaticData()

  const ref = useRef<HTMLLIElement>(null)

  const pickedChampion = champions.find(c =>
    ChampionKey.Eq.equals(c.key, participant.championId),
  )?.name
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
              alt={'Icône de champion vide'}
              className="h-6 w-6 opacity-50"
            />
          </li>,
          'Aucun.',
        ),
      championId => {
        const bannedChampion = champions.find(c => ChampionKey.Eq.equals(c.key, championId))
        const bannedChampionName = bannedChampion?.name ?? `<Champion ${championId}>`
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
      <Tooltip hoverRef={ref} className="flex flex-col items-center gap-1">
        <span className="font-bold">{tooltip}</span>
        <span className="text-2xs">banni par</span>
        <span>
          {participant.summonerName}
          {pickedChampion !== undefined ? ` (${pickedChampion})` : null}
        </span>
        <span className="text-2xs">au tour {participant.bannedChampion.pickTurn}</span>
      </Tooltip>
    </>
  )
}
