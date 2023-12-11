/* eslint-disable functional/no-expression-statements,
                  functional/no-return-void */
import { task } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { useCallback, useState } from 'react'

import type { Platform } from '../../../../shared/models/api/Platform'
import type { Puuid } from '../../../../shared/models/api/summoner/Puuid'
import { GameName } from '../../../../shared/models/riot/GameName'
import { RiotId } from '../../../../shared/models/riot/RiotId'
import { SummonerName } from '../../../../shared/models/riot/SummonerName'
import { TagLine } from '../../../../shared/models/riot/TagLine'
import { Future, Maybe } from '../../../../shared/utils/fp'

import { useHistory } from '../../../contexts/HistoryContext'
import { useStaticData } from '../../../contexts/StaticDataContext'
import { useTranslation } from '../../../contexts/TranslationContext'
import { useUser } from '../../../contexts/UserContext'
import { usePathMatch } from '../../../hooks/usePathMatch'
import {
  CloseFilled,
  PersonFilled,
  StarFilled,
  StarOutline,
  TimeOutline,
} from '../../../imgs/svgs/icons'
import { MasteriesQuery } from '../../../models/masteriesQuery/MasteriesQuery'
import type { PartialSummonerShort } from '../../../models/summoner/PartialSummonerShort'
import { appParsers, appRoutes } from '../../../router/AppRouter'
import { cx } from '../../../utils/cx'
import { futureRunUnsafe } from '../../../utils/futureRunUnsafe'
import { Link } from '../../Link'
import { Loading } from '../../Loading'

type Props = {
  type: 'self' | 'favorite' | 'recent'
  // eslint-disable-next-line deprecation/deprecation
  summoner: PartialSummonerShort
}

export const SummonerSearch: React.FC<Props> = ({ type, summoner }) => {
  const { navigate, masteriesQuery } = useHistory()
  const { maybeUser, addFavoriteSearch, removeFavoriteSearch, removeRecentSearch } = useUser()
  const { t } = useTranslation('common')
  const staticData = useStaticData()

  const summonerMatch = usePathMatch(appParsers.platformRiotId)
  const summonerGameMatch = usePathMatch(appParsers.platformRiotIdGame)

  // with current masteriesQuery
  const puuidRoute = useCallback(
    (platform: Platform, puuid: Puuid): string =>
      (summonerGameMatch !== undefined ? appRoutes.sPlatformPuuidGame : appRoutes.sPlatformPuuid)(
        platform,
        puuid,
        summonerMatch !== undefined
          ? MasteriesQuery.toPartial({ ...masteriesQuery, search: Maybe.none })
          : {},
      ),
    [masteriesQuery, summonerGameMatch, summonerMatch],
  )

  const removeRecent = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      removeRecentSearch(summoner.puuid)
    },
    [removeRecentSearch, summoner],
  )

  const [favoriteIsLoading, setFavoriteIsLoading] = useState(false)

  const addFavorite = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()

      if (Maybe.isNone(summoner.riotId)) {
        return navigateToSummoner()
      }

      setFavoriteIsLoading(true)
      return pipe(
        addFavoriteSearch({ ...summoner, riotId: summoner.riotId.value }),
        // on not found
        Future.map(Maybe.getOrElseW(() => navigateToSummoner())),
        task.chainFirstIOK(() => () => setFavoriteIsLoading(false)),
        futureRunUnsafe,
      )

      function navigateToSummoner(): void {
        return navigate(puuidRoute(summoner.platform, summoner.puuid))
      }
    },
    [addFavoriteSearch, navigate, puuidRoute, summoner],
  )

  const removeFavorite = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      setFavoriteIsLoading(true)
      return pipe(
        removeFavoriteSearch(summoner.puuid),
        task.chainFirstIOK(() => () => setFavoriteIsLoading(false)),
        futureRunUnsafe,
      )
    },
    [removeFavoriteSearch, summoner],
  )

  return (
    <li className="contents">
      {renderRecent(type, removeRecent)}
      <Link
        to={puuidRoute(summoner.platform, summoner.puuid)}
        className="group flex items-center leading-4"
      >
        <img
          src={staticData.assets.summonerIcon(summoner.profileIconId)}
          alt={t.summonerIconAlt(
            pipe(
              summoner.riotId,
              Maybe.fold(() => SummonerName.unwrap(summoner.name), RiotId.stringify),
            ),
          )}
          className="w-12"
        />
        <div className="ml-2 flex grow items-baseline gap-0.5">
          {pipe(
            summoner.riotId,
            Maybe.fold(
              () => <span className={linkClassName}>{SummonerName.unwrap(summoner.name)}</span>,
              riotId => (
                <>
                  <span className={cx(linkClassName, 'text-goldenrod')}>
                    {GameName.unwrap(riotId.gameName)}
                  </span>
                  <span className="font-normal text-grey-500">
                    #{TagLine.unwrap(riotId.tagLine)}
                  </span>
                </>
              ),
            ),
          )}
        </div>
        <span className={cx(linkClassName, 'ml-4 font-normal')}>{summoner.platform}</span>
      </Link>
      {Maybe.isSome(maybeUser)
        ? renderFavorite(type, favoriteIsLoading, addFavorite, removeFavorite)
        : null}
    </li>
  )
}

const linkClassName = 'border-y border-y-transparent group-hover:border-b-current'

function renderRecent(
  type: Props['type'],
  removeRecent: (e: React.MouseEvent) => void,
): React.ReactElement {
  switch (type) {
    case 'self':
      return <span className="w-3" />

    case 'favorite':
      return <span className="w-3" />

    case 'recent':
      return (
        <button type="button" onClick={removeRecent} className="group p-2">
          <TimeOutline className="h-4 text-goldenrod group-hover:hidden" />
          <CloseFilled className="hidden h-4 text-red group-hover:flex" />
        </button>
      )
  }
}

function renderFavorite(
  type: Props['type'],
  isLoading: boolean,
  addFavorite: (e: React.MouseEvent) => void,
  removeFavorite: (e: React.MouseEvent) => void,
): React.ReactElement {
  switch (type) {
    case 'self':
      return (
        <span className="px-3">
          <PersonFilled className="h-4" />
        </span>
      )

    case 'favorite':
      return (
        <button
          type="button"
          onClick={removeFavorite}
          disabled={isLoading}
          className="px-3 pb-3 pt-2 text-goldenrod enabled:hover:text-red"
        >
          {isLoading ? <Loading className="h-5" /> : <StarFilled className="h-5" />}
        </button>
      )

    case 'recent':
      return (
        <button
          type="button"
          onClick={addFavorite}
          disabled={isLoading}
          className="px-3 pb-3 pt-2 text-goldenrod enabled:hover:text-wheat"
        >
          {isLoading ? <Loading className="h-5" /> : <StarOutline className="h-5" />}
        </button>
      )
  }
}
