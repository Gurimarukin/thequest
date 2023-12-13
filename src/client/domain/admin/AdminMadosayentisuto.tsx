import { apiRoutes } from '../../../shared/ApiRouter'
import { MadosayentisutoInfos } from '../../../shared/models/api/MadosayentisutoInfos'

import { AsyncRenderer } from '../../components/AsyncRenderer'
import { MainLayout } from '../../components/mainLayout/MainLayout'
import { useSWRHttp } from '../../hooks/useSWRHttp'

export const AdminMadosayentisuto: React.FC = () => (
  <MainLayout>
    <AsyncRenderer
      {...useSWRHttp(apiRoutes.admin.madosayentisuto.get, {}, [
        MadosayentisutoInfos.codec,
        'MadosayentisutoInfos',
      ])}
    >
      {res => <pre className="text-xs">{JSON.stringify(res, null, 2)}</pre>}
    </AsyncRenderer>
  </MainLayout>
)
