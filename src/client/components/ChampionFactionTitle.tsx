import { pipe } from 'fp-ts/function'
import { useRef } from 'react'
import type { SWRResponse } from 'swr'

import { ChallengesView } from '../../shared/models/api/challenges/ChallengesView'
import type { ChampionFactionOrNone } from '../../shared/models/api/champion/ChampionFaction'
import { Maybe } from '../../shared/utils/fp'

import { useTranslation } from '../contexts/TranslationContext'
import type { CountWithTotal } from '../models/CountWithTotal'
import { cx } from '../utils/cx'
import { ChallengeWithProgression } from './Challenge'
import { ChampionFactionImg } from './ChampionFactionImg'
import { Loading } from './Loading'
import { Pre } from './Pre'
import { Tooltip } from './tooltip/Tooltip'

export type ChampionFactionTitleProps = {
  challenges: Maybe<SWRResponse<ChallengesView, unknown>>
  faction: ChampionFactionOrNone
  count: CountWithTotal
  className?: string
}

export const ChampionFactionTitle: React.FC<ChampionFactionTitleProps> = ({
  challenges,
  faction,
  count: { count, total },
  className,
}) => {
  const { t } = useTranslation('common')

  const ref = useRef<HTMLSpanElement>(null)

  return (
    <div className={cx('col-span-full flex', className)}>
      <div className="flex items-baseline gap-4">
        <div className="flex items-center gap-2">
          {faction !== 'none' ? <ChampionFactionImg faction={faction} className="size-7" /> : null}
          <span className="font-semibold">{t.labels.factionOrNone[faction]}</span>
          <span ref={ref} className="text-sm">
            {t.fraction(count, total, { withParenthesis: true })}
          </span>
        </div>
        <Tooltip hoverRef={ref}>{t.nChampionsFraction(count, total)}</Tooltip>
        {faction !== 'none'
          ? pipe(
              challenges,
              Maybe.fold(
                () => null,
                ({ data, error }) =>
                  error !== undefined ? (
                    <Pre>error</Pre>
                  ) : data === undefined ? (
                    <Loading className="h-4" />
                  ) : (
                    <ChallengeWithProgression
                      id={ChallengesView.id[faction]}
                      tier={pipe(
                        data[faction],
                        Maybe.chain(c => c.level),
                      )}
                      value={pipe(
                        data[faction],
                        Maybe.map(c => c.value),
                      )}
                      thresholds={thresholds}
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

const thresholds = {
  GOLD: 1,
  PLATINUM: 3,
  DIAMOND: 6,
  MASTER: 10,
}
