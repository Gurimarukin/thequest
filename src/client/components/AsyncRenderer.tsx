import { HTTPError } from 'ky'
import type { SWRResponse } from 'swr'

import { useTranslation } from '../contexts/TranslationContext'
import { Loading } from './Loading'
import { Pre } from './Pre'

type Props<A> = Pick<SWRResponse<A, unknown>, 'data' | 'error'> & {
  children: (data: A) => React.ReactElement | null
}

export function AsyncRenderer<A>({ data, error, children }: Props<A>): React.ReactElement | null {
  const { t } = useTranslation('common')

  if (error !== undefined) {
    return (
      <div className="flex justify-center">
        {error instanceof HTTPError && error.response.status === 404 ? (
          <Pre className="mt-4">{t.notFound}</Pre>
        ) : (
          <Pre className="mt-4">{t.error}</Pre>
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

  return children(data)
}
