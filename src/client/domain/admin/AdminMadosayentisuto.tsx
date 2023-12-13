import * as D from 'io-ts/Decoder'

import { apiRoutes } from '../../../shared/ApiRouter'

import { AsyncRenderer } from '../../components/AsyncRenderer'
import { MainLayout } from '../../components/mainLayout/MainLayout'
import { useSWRHttp } from '../../hooks/useSWRHttp'

export const AdminMadosayentisuto: React.FC = () => (
  <MainLayout>
    <AsyncRenderer
      {...useSWRHttp(apiRoutes.admin.madosayentisuto.get, {}, [D.id<unknown>(), 'unknown'])}
    >
      {res => <pre>{JSON.stringify(res, null, 2)}</pre>}
    </AsyncRenderer>
  </MainLayout>
)
