import { HTTPError } from 'ky'
import type { SWRResponse } from 'swr'

import { Loading } from '../components/Loading'
import type { Translation } from '../contexts/TranslationContext'

export const basicAsyncRenderer =
  (t: Translation['common']) =>
  <A,>({ data, error }: Pick<SWRResponse<A, unknown>, 'data' | 'error'>) =>
  <B,>(renderData: (a: A) => B): React.ReactElement | B => {
    if (error !== undefined) {
      return (
        <div className="flex justify-center">
          {error instanceof HTTPError && error.response.status === 404 ? (
            <pre className="mt-4">{t.notFound}</pre>
          ) : (
            <pre className="mt-4">{t.error}</pre>
          )}
        </div>
      )
    }
    if (data === undefined) {
      return (
        <div className="flex justify-center">
          <Loading className="mt-4 h-6" />
        </div>
      )
    }
    return renderData(data)
  }
