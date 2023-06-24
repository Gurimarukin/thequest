import { pipe } from 'fp-ts/function'
import { useRef } from 'react'
import type { SWRResponse } from 'swr'

import { ChallengeView } from '../../shared/models/api/challenges/ChallengeView'
import type { ChallengesView } from '../../shared/models/api/challenges/ChallengesView'
import type { ChampionFaction } from '../../shared/models/api/champion/ChampionFaction'
import { ChampionFactionOrNone } from '../../shared/models/api/champion/ChampionFaction'
import type { Dict } from '../../shared/utils/fp'
import { Maybe } from '../../shared/utils/fp'

import { InformationCircleOutline } from '../imgs/svgIcons'
import { cx } from '../utils/cx'
import { ChampionFactionImg } from './ChampionFactionImg'
import { Loading } from './Loading'
import { Tooltip } from './tooltip/Tooltip'

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
  const hoverRef = useRef<HTMLHeadingElement>(null)
  const placementRef = useRef<HTMLSpanElement>(null)
  return (
    <div className={cx('col-span-full flex', className)}>
      <h2 ref={hoverRef} className="flex items-center gap-2 text-sm">
        {faction !== 'none' ? <ChampionFactionImg faction={faction} className="h-7 w-7" /> : null}
        <span>{ChampionFactionOrNone.label[faction]}</span>
        {faction !== 'none' ? (
          <>
            <span ref={placementRef}>
              <InformationCircleOutline className="h-4" />
            </span>
            <Tooltip
              hoverRef={hoverRef}
              placementRef={placementRef}
              className="max-w-xl !whitespace-normal break-normal py-2"
            >
              Défi : <i>{tooltip[faction]}</i>
            </Tooltip>

            {pipe(
              challenges,
              Maybe.fold(
                () => null,
                ({ data, error }) =>
                  error !== undefined ? (
                    <pre>error</pre>
                  ) : data === undefined ? (
                    <Loading className="h-4" />
                  ) : (
                    <pre>
                      {JSON.stringify(Maybe.codec(ChallengeView.codec).encode(data[faction]))}
                    </pre>
                  ),
              ),
            )}
          </>
        ) : null}
      </h2>
    </div>
  )
}

const tooltip: Dict<ChampionFaction, string> = {
  bandle: '5 sur 5',
  bilgewater: 'Naufrageurs',
  demacia: 'POUR DEMACIA',
  freljord: 'Premiers de la glace',
  ionia: 'Tendez l’autre Wuju',
  ixtal: 'Terrible jungle',
  noxus: 'La force avant tout',
  piltover: 'Innovateurs',
  shadowIsles: 'Terreurs des îles',
  shurima: 'Artistes shurimatiaux',
  targon: 'Maîtres de la montagne',
  void: '(Cris inhumains)',
  zaun: 'Troupe techno-chimique',
}
