import type { Platform } from '../../../shared/models/api/Platform'

import { MainLayout } from '../../components/mainLayout/MainLayout'

type Props = {
  platform: Platform
  summonerName: string
}

export const ActiveGame: React.FC<Props> = ({ platform, summonerName }) => (
  <MainLayout>
    <pre>
      ActiveGame, platform: {platform}, summonerName: {summonerName}
    </pre>
  </MainLayout>
)
