import { pipe } from 'fp-ts/function'
import { Fragment, useMemo } from 'react'

import { apiRoutes } from '../../../shared/ApiRouter'
import type { Platform } from '../../../shared/models/api/Platform'
import type { ActiveGameParticipantView } from '../../../shared/models/api/activeGame/ActiveGameParticipantView'
import { ActiveGameView } from '../../../shared/models/api/activeGame/ActiveGameView'
import { ChampionKey } from '../../../shared/models/api/champion/ChampionKey'
import { ListUtils } from '../../../shared/utils/ListUtils'
import { List, Maybe } from '../../../shared/utils/fp'

import { MainLayout } from '../../components/mainLayout/MainLayout'
import { useStaticData } from '../../contexts/StaticDataContext'
import { useSWRHttp } from '../../hooks/useSWRHttp'
import { appRoutes } from '../../router/AppRouter'
import { basicAsyncRenderer } from '../../utils/basicAsyncRenderer'

type Props = {
  platform: Platform
  summonerName: string
}

export const ActiveGame: React.FC<Props> = ({ platform, summonerName }) => (
  <MainLayout>
    {basicAsyncRenderer(
      useSWRHttp(apiRoutes.summoner.byName(platform, summonerName).activeGame.get, {}, [
        Maybe.decoder(ActiveGameView.codec),
        'Maybe<ActiveGameView>',
      ]),
    )(
      Maybe.fold(
        () => (
          <div className="flex justify-center">
            <pre className="mt-4">pas en partie.</pre>
          </div>
        ),
        game => <ActiveGameComponent platform={platform} game={game} />,
      ),
    )}
  </MainLayout>
)

type ActiveGameComponentProps = {
  platform: Platform
  game: ActiveGameView
}

const ActiveGameComponent: React.FC<ActiveGameComponentProps> = ({ platform, game }) => {
  const {
    participants: {},
    ...rest
  } = game
  const grouped = useMemo(() => groupParticipants(game.participants), [game.participants])
  return (
    <div>
      <ul className="grid grid-cols-[repeat(4,auto)_1fr_repeat(4,auto)] gap-y-3">
        {grouped.map((maybeParticipant, i) =>
          pipe(
            maybeParticipant,
            Maybe.fold(
              () => <span className="col-span-5" />,
              participant => (
                <Fragment key={participant.summonerName}>
                  <Participant platform={platform} participant={participant} />
                  {i % 2 === 0 ? <span /> : null}
                </Fragment>
              ),
            ),
          ),
        )}
      </ul>

      <pre>{JSON.stringify(rest, null, 2)}</pre>
    </div>
  )
}

const groupParticipants = (
  participants: List<ActiveGameParticipantView>,
): List<Maybe<ActiveGameParticipantView>> => {
  const grouped = pipe(
    participants,
    List.groupBy(p => `${p.teamId}`),
  )

  const p100 = pipe(grouped[100] ?? [], List.chunksOf(3))[0] ?? []
  const p200 = grouped[200] ?? []
  const size = Math.max(p100.length, p200.length)

  return pipe(
    p100,
    List.map(Maybe.some),
    ListUtils.padEnd(size, Maybe.none),
    List.zip(pipe(p200, List.map(Maybe.some), ListUtils.padEnd(size, Maybe.none))),
    List.flatten,
  )
}

type ParticipantProps = {
  platform: Platform
  participant: ActiveGameParticipantView
}

const Participant: React.FC<ParticipantProps> = ({
  platform,
  participant: {
    teamId,
    summonerName,
    profileIconId,
    championId,
    shardsCount,
    spell1Id,
    spell2Id,
    perks,
  },
}) => {
  const { champions, assets } = useStaticData()

  const champion = champions.find(c => ChampionKey.Eq.equals(c.key, championId))

  /* eslint-disable react/jsx-key */
  const children = [
    <span>
      <img
        src={assets.summonerIcon(profileIconId)}
        alt={`Icône de ${summonerName}`}
        className="w-12"
      />
    </span>,
    <a
      href={appRoutes.platformSummonerName(platform, summonerName, {})}
      target="_blank"
      rel="noreferrer"
      className="bg-mastery-7-bis/50"
    >
      {summonerName}
    </a>,
    <span>
      <img
        src={assets.champion.square(championId)}
        alt={`Icône de ${champion?.name ?? `<Champion ${championId}>`}`}
        className="w-12"
      />
    </span>,
    <pre>{JSON.stringify({ shardsCount, spell1Id, spell2Id, perks }, null, 2)}</pre>,
  ]
  /* eslint-enable react/jsx-key */

  return <li className="contents">{teamId === 100 ? children : List.reverse(children)}</li>
}
