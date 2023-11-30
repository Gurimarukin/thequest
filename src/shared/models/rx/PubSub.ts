import { pipe } from 'fp-ts/function'
import { Subject } from 'rxjs'

import { IO, toNotUsed } from '../../utils/fp'
import type { Override } from '../typeFest'
import type { TObservable } from './TObservable'
import type { TSubject } from './TSubject'

// eslint-disable-next-line functional/no-return-void
type StrongSubject<A> = Override<Subject<A>, 'next', (value: A) => void>

export type PubSub<A> = {
  subject: TSubject<A>
  observable: TObservable<A>
}

export const PubSub = <A>(): PubSub<A> => {
  const subject: StrongSubject<A> = new Subject()

  return {
    subject: {
      next: a =>
        pipe(
          IO.tryCatch(() => subject.next(a)),
          IO.map(toNotUsed),
        ),
      complete: pipe(
        IO.tryCatch(() => subject.complete()),
        IO.map(toNotUsed),
      ),
    },
    observable: subject.asObservable(),
  }
}
