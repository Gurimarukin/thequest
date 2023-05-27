import { pipe } from 'fp-ts/function'

import type { BannedChampion } from '../../../shared/models/api/activeGame/BannedChampion'
import { TeamId } from '../../../shared/models/api/activeGame/TeamId'
import { ChampionKey } from '../../../shared/models/api/champion/ChampionKey'
import type { PartialDict, Tuple } from '../../../shared/utils/fp'
import { List, NonEmptyArray } from '../../../shared/utils/fp'

import { useStaticData } from '../../contexts/StaticDataContext'
import { cx } from '../../utils/cx'

type Props = {
  bans: PartialDict<`${TeamId}`, List<Tuple<string, NonEmptyArray<BannedChampion>>>>
}

export const ActiveGameBans: React.FC<Props> = ({ bans }) => {
  const { assets, champions } = useStaticData()

  return (
    <div className="flex flex-wrap justify-between gap-6">
      {TeamId.values.map((teamId, i) => {
        const teamBans = bans[teamId]
        const reverse = i % 2 === 1
        return (
          <ul key={teamId} className={cx('flex flex-wrap gap-6', ['flex-row-reverse', reverse])}>
            {teamBans !== undefined
              ? pipe(
                  teamBans,
                  List.map(([pickTurn, turnBans]) => (
                    <ul
                      key={pickTurn}
                      className={cx('flex flex-wrap gap-1', ['flex-row-reverse', reverse])}
                    >
                      {pipe(
                        turnBans,
                        NonEmptyArray.map(({ championId }) => {
                          const champion = champions.find(c =>
                            ChampionKey.Eq.equals(c.key, championId),
                          )
                          return (
                            <li
                              key={ChampionKey.unwrap(championId)}
                              className="relative h-10 w-10 overflow-hidden"
                            >
                              <img
                                src={assets.champion.square(championId)}
                                alt={`Icône de ${champion?.name ?? `<Champion ${championId}>`}`}
                                className="m-[-3px] w-[calc(100%_+_6px)] max-w-none"
                              />
                              <span className="absolute top-[calc(100%_-_2px)] w-20 origin-left -rotate-45 border-t-4 border-red-ban shadow-even shadow-black" />
                            </li>
                          )
                        }),
                      )}
                    </ul>
                  )),
                )
              : null}
          </ul>
        )
      })}
    </div>
  )
}
