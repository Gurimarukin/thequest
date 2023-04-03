import { HTTPError } from 'ky'
import React from 'react'
import type { SWRResponse } from 'swr'

export function basicAsyncRenderer<A>({
  data,
  error,
}: Pick<SWRResponse<A, unknown>, 'data' | 'error'>): <B>(
  renderData: (a: A) => B,
) => JSX.Element | B {
  return renderData => {
    if (error !== undefined) {
      return (
        <div className="flex justify-center">
          {error instanceof HTTPError && error.response.status === 404 ? (
            <pre className="mt-4">not found.</pre>
          ) : (
            <pre className="mt-4">error</pre>
          )}
        </div>
      )
    }
    if (data === undefined) {
      return (
        <div className="flex justify-center">
          <pre className="mt-4">loading...</pre>
        </div>
      )
    }
    return renderData(data)
  }
}
