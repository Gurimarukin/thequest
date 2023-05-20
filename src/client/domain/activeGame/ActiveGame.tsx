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
    <pre>
      ActiveGame, platform: {platform}, summonerName: {summonerName}
    </pre>
    {basicAsyncRenderer(
      useSWRHttp(apiRoutes.summoner.byName(platform, summonerName).activeGame.get, {}, [
        Maybe.decoder(CurrentGameInfoView.codec),
        'Maybe<CurrentGameInfoView>',
      ]),
    )(game => (
      <pre>{JSON.stringify(game, null, 2)}</pre>
    ))}
  </MainLayout>
)
