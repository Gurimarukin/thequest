import { Suspense } from 'react'

import type { ChildrenFC } from '../models/ChildrenFC'
import { Loading } from './Loading'

export const LoadingSuspense: ChildrenFC = ({ children }) => (
  <Suspense
    fallback={
      <div className="flex justify-center">
        <Loading className="mt-4 h-6" />
      </div>
    }
  >
    {children}
  </Suspense>
)
