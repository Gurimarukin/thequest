import { date, eq, io, number } from 'fp-ts'
import type { IO } from 'fp-ts/IO'
import { pipe } from 'fp-ts/function'
import type { Newtype } from 'newtype-ts'
import { iso } from 'newtype-ts'

type ToasterId = Newtype<{ readonly ToasterId: unique symbol }, number>

const { wrap, unwrap } = iso<ToasterId>()

const generate: IO<ToasterId> = pipe(date.now, io.map(wrap))

const Eq: eq.Eq<ToasterId> = pipe(number.Eq, eq.contramap(unwrap))

const ToasterId = { generate, unwrap, Eq }

export { ToasterId }
