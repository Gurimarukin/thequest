import { pipe } from 'fp-ts/function'
import { Fragment, useRef } from 'react'

import type { Platform } from '../../../shared/models/api/Platform'
import type { ActiveGameMasteriesView } from '../../../shared/models/api/activeGame/ActiveGameMasteriesView'
import { ChampionLevel } from '../../../shared/models/api/champion/ChampionLevel'
import { ChampionPosition } from '../../../shared/models/api/champion/ChampionPosition'
import { GameName } from '../../../shared/models/riot/GameName'
import { RiotId } from '../../../shared/models/riot/RiotId'
import { SummonerName } from '../../../shared/models/riot/SummonerName'
import { TagLine } from '../../../shared/models/riot/TagLine'
import { NumberUtils } from '../../../shared/utils/NumberUtils'
import { List, Maybe } from '../../../shared/utils/fp'

import { ChampionPositionImg } from '../../components/ChampionPositionImg'
import { Tooltip } from '../../components/tooltip/Tooltip'
import { useStaticData } from '../../contexts/StaticDataContext'
import { useTranslation } from '../../contexts/TranslationContext'
import { PeopleSharp } from '../../imgs/svgs/icons'
import { appRoutes } from '../../router/AppRouter'
import { TranslationUtils } from '../../utils/TranslationUtils'
import { cx } from '../../utils/cx'

const { round } = NumberUtils

const allLevels = new Set<ChampionLevel>(ChampionLevel.values)

type Props = {
  platform: Platform
  riotId: RiotId
  summonerName: SummonerName
  profileIconId: number
  masteries: Maybe<ActiveGameMasteriesView>
  premadeId: Maybe<number>
  summonerLevel: Maybe<number>
  role: Maybe<ChampionPosition>
  mainRoles: List<ChampionPosition>
  reverse: boolean
  tooltipShouldHide: boolean
  padding: string
}

export const ActiveGameSummoner: React.FC<Props> = ({
  platform,
  riotId,
  summonerName,
  profileIconId,
  masteries,
  premadeId,
  summonerLevel,
  role,
  mainRoles,
  reverse,
  tooltipShouldHide,
  padding,
}) => {
  const { t } = useTranslation()
  const { assets } = useStaticData()

  const riotIdRef = useRef<HTMLAnchorElement>(null)
  const summonerLevelRef = useRef<HTMLSpanElement>(null)
  const percentsRef = useRef<HTMLSpanElement>(null)
  const totalMasteriesRef = useRef<HTMLSpanElement>(null)
  const mainRolesRef = useRef<HTMLUListElement>(null)

  return (
    <div className="flex flex-col justify-center gap-1 pt-2">
      <div className={cx('flex items-center gap-3', ['flex-row-reverse', reverse])}>
        {pipe(
          premadeId,
          Maybe.fold(
            () => null,
            id => (
              <div
                className={cx('flex items-center gap-1 text-xs font-semibold text-white', padding, [
                  'flex-row-reverse',
                  !reverse,
                ])}
              >
                <PeopleSharp className="h-3" />
                <span className="mt-0.5">{id}</span>
              </div>
            ),
          ),
        )}
        <div className={cx('flex grow', reverse ? 'justify-start' : 'justify-end')}>
          <a
            ref={riotIdRef}
            href={appRoutes.platformRiotId(platform, riotId, {
              view: 'histogram',
              level: allLevels,
            })}
            target="_blank"
            rel="noreferrer"
            className="flex items-baseline gap-0.5 whitespace-pre"
          >
            <span className="text-lg font-semibold leading-6 text-goldenrod">
              {GameName.unwrap(riotId.gameName)}
            </span>
            <span className="leading-5 text-grey-500">#{TagLine.unwrap(riotId.tagLine)}</span>
          </a>
          <Tooltip hoverRef={riotIdRef} placement="top" className="flex items-baseline gap-2">
            <span>{t.common.oldSummonerName}</span>
            <span className="whitespace-pre font-medium text-goldenrod">
              {SummonerName.unwrap(summonerName)}
            </span>
          </Tooltip>
        </div>
      </div>
      <div className={cx('flex items-center gap-2', ['flex-row-reverse', !reverse])}>
        <img
          src={assets.summonerIcon(profileIconId)}
          alt={t.common.summonerIconAlt(RiotId.stringify(riotId))}
          draggable={false}
          className="w-12"
        />
        <div
          className={cx('flex flex-col text-sm leading-3', reverse ? 'items-start' : 'items-end')}
        >
          {pipe(
            summonerLevel,
            Maybe.fold(
              () => null,
              lvl => (
                <>
                  <span ref={summonerLevelRef} className="text-grey-400">
                    {t.common.level(lvl, 'font-semibold')}
                  </span>
                  <Tooltip hoverRef={summonerLevelRef}>{t.common.summonerLevel}</Tooltip>
                </>
              ),
            ),
          )}
          {pipe(
            masteries,
            Maybe.fold(
              () => null,
              m => (
                <div className="mt-[5px]">
                  <span className="flex gap-1.5">
                    <span ref={percentsRef} className="whitespace-nowrap font-semibold">
                      {t.common.percents(round(m.questPercents, 1))}
                    </span>
                    <Tooltip hoverRef={percentsRef} shouldHide={tooltipShouldHide}>
                      {t.activeGame.theQuestProgression}
                    </Tooltip>

                    <span ref={totalMasteriesRef} className="whitespace-nowrap text-grey-400">
                      {t.activeGame.totals(
                        m.totalMasteryLevel,
                        TranslationUtils.numberUnit(t.common)(m.totalMasteryPoints),
                        'font-semibold',
                      )}
                    </span>
                    <Tooltip
                      hoverRef={totalMasteriesRef}
                      className="flex flex-col items-center gap-2"
                    >
                      <span>{t.activeGame.masteryScoreAndPoints}</span>
                      <span>{t.activeGame.otpIndex(m.otpIndex, 'font-semibold')}</span>
                    </Tooltip>
                  </span>
                </div>
              ),
            ),
          )}
          {List.isNonEmpty(mainRoles) ? (
            <>
              <ul ref={mainRolesRef} className="mt-[3px] flex items-start gap-1">
                {mainRoles.map(r => {
                  const isCurrent = pipe(role, Maybe.elem(ChampionPosition.Eq)(r))
                  return (
                    <li key={r} className="relative flex flex-col items-center">
                      <ChampionPositionImg
                        position={r}
                        className={cx('w-4', ['text-cyan-200', isCurrent])}
                      />
                      {isCurrent ? (
                        <span className="absolute -bottom-1 size-0.5 rounded-1/2 bg-cyan-200" />
                      ) : null}
                    </li>
                  )
                })}
              </ul>
              <Tooltip hoverRef={mainRolesRef}>
                <div>
                  {t.activeGame.mainRoles}{' '}
                  {mainRoles.map((r, i) => {
                    const isCurrent = pipe(role, Maybe.elem(ChampionPosition.Eq)(r))
                    return (
                      <Fragment key={r}>
                        <span className={cx('font-semibold', ['text-cyan-200', isCurrent])}>
                          {t.common.labels.position[r]}
                        </span>
                        {i !== mainRoles.length - 1 ? ', ' : null}
                      </Fragment>
                    )
                  })}
                </div>
                {pipe(
                  role,
                  Maybe.fold(
                    () => null,
                    r => (
                      <div>
                        {t.activeGame.currentRole}{' '}
                        <span className="font-semibold text-cyan-200">
                          {t.common.labels.position[r]}
                        </span>
                      </div>
                    ),
                  ),
                )}
              </Tooltip>
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}
