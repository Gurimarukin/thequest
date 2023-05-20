import { apiRoutes } from '../../../shared/ApiRouter'
import type { Platform } from '../../../shared/models/api/Platform'
import { CurrentGameInfoView } from '../../../shared/models/api/currentGame/CurrentGameInfoView'
import { Maybe } from '../../../shared/utils/fp'

import { MainLayout } from '../../components/mainLayout/MainLayout'
import { useSWRHttp } from '../../hooks/useSWRHttp'
import { basicAsyncRenderer } from '../../utils/basicAsyncRenderer'

type Props = {
  platform: Platform
  summonerName: string
}

export const ActiveGame: React.FC<Props> = ({ platform, summonerName }) => (
  <MainLayout>
    {basicAsyncRenderer(
      useSWRHttp(apiRoutes.summoner.byName(platform, summonerName).activeGame.get, {}, [
        Maybe.decoder(CurrentGameInfoView.codec),
        'Maybe<CurrentGameInfoView>',
      ]),
    )(
      Maybe.fold(
        () => (
          <div className="flex justify-center">
            <pre className="mt-4">pas en partie.</pre>
          </div>
        ),
        game => <ActiveGameComponent game={game} />,
      ),
    )}
  </MainLayout>
)

type ActiveGameComponentProps = {
  game: CurrentGameInfoView
}

const ActiveGameComponent: React.FC<ActiveGameComponentProps> = ({ game }) => (
  <pre>{JSON.stringify(game, null, 2)}</pre>
)
