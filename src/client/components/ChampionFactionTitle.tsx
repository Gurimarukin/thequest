import { pipe } from 'fp-ts/function'
import { useRef } from 'react'
import type { SWRResponse } from 'swr'

import { ChallengesView } from '../../shared/models/api/challenges/ChallengesView'
import type { ChampionFaction } from '../../shared/models/api/champion/ChampionFaction'
import { ChampionFactionOrNone } from '../../shared/models/api/champion/ChampionFaction'
import type { Dict } from '../../shared/utils/fp'
import { Maybe } from '../../shared/utils/fp'

import { cx } from '../utils/cx'
import { Challenge } from './Challenge'
import { ChampionFactionImg } from './ChampionFactionImg'
import { Loading } from './Loading'

type ChampionFactionTitleProps = {
  challenges: Maybe<SWRResponse<ChallengesView, unknown>>
  faction: ChampionFactionOrNone
  className?: string
}

export const ChampionFactionTitle: React.FC<ChampionFactionTitleProps> = ({
  challenges,
  faction,
  className,
}) => {
  const hoverRef = useRef<HTMLDivElement>(null)
  return (
    <div className={cx('col-span-full flex', className)}>
      <div ref={hoverRef} className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          {faction !== 'none' ? <ChampionFactionImg faction={faction} className="h-7 w-7" /> : null}
          <span>{ChampionFactionOrNone.label[faction]}</span>
        </div>
        {faction !== 'none'
          ? pipe(
              challenges,
              Maybe.fold(
                () => null,
                ({ data, error }) =>
                  error !== undefined ? (
                    <pre>error</pre>
                  ) : data === undefined ? (
                    <Loading className="h-4" />
                  ) : (
                    <Challenge
                      id={ChallengesView.id[faction]}
                      name={challengeName[faction]}
                      tier={pipe(
                        data[faction],
                        Maybe.chain(c => c.level),
                      )}
                      value={pipe(
                        data[faction],
                        Maybe.map(c => c.value),
                      )}
                      thresholds={thresholds}
                      hoverRef={hoverRef}
                      iconClassName="h-7"
                    />
                  ),
              ),
            )
          : null}
      </div>
    </div>
  )
}

const challengeName: Dict<ChampionFaction, string> = {
  bandle: '5 sur 5',
  bilgewater: 'Naufrageurs',
  demacia: 'POUR DEMACIA',
  freljord: 'Premiers de la glace',
  ionia: 'Tendez l’autre Wuju',
  ixtal: 'Terrible jungle',
  noxus: 'La force avant tout',
  piltover: 'Innovateurs',
  shadowIsles: 'Terreurs des îles',
  shurima: 'Artistes shurimartiaux',
  targon: 'Maîtres de la montagne',
  void: '(Cris inhumains)',
  zaun: 'Troupe techno-chimique',
}

const thresholds = {
  GOLD: 1,
  PLATINUM: 3,
  DIAMOND: 6,
  MASTER: 10,
}
