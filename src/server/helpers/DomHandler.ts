import { apply } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { JSDOM } from 'jsdom'

import { ValidatedNea } from '../../shared/models/ValidatedNea'
import { Either, NonEmptyArray, Try } from '../../shared/utils/fp'

type Constructor<E> = {
  new (): E
  prototype: E
}

const domHandlerOf = (html: string): Try<JSDOM> => Try.tryCatch(() => new JSDOM(html))

function querySelectorEnsureOne(selector: string): (parent: ParentNode) => Either<string, Element>
function querySelectorEnsureOne<E extends Element>(
  selector: string,
  type: Constructor<E>,
): (parent: ParentNode) => Either<string, E>
function querySelectorEnsureOne<E extends Element>(selector: string, type?: Constructor<E>) {
  return (parent: ParentNode): Either<string, Element | E> => {
    const res = parent.querySelectorAll(selector)
    const elt = res[0]

    if (elt === undefined) return Either.left(`No element matches selector: ${selector}`)
    if (1 < res.length) return Either.left(`More than one element matches selector: ${selector}`)

    if (type === undefined) return Either.right(elt)

    const isE = (e: Element): e is E => e instanceof type
    if (isE(elt)) return Either.right(elt)

    return Either.left(`Element don't have expected type: ${type.name}`)
  }
}

function querySelectorAllNonEmpty(
  selector: string,
): (parent: ParentNode) => ValidatedNea<string, NonEmptyArray<Element>>
function querySelectorAllNonEmpty<E extends Element>(
  selector: string,
  type: Constructor<E>,
): (parent: ParentNode) => ValidatedNea<string, NonEmptyArray<E>>
function querySelectorAllNonEmpty<E extends Element>(
  selector: string,
  type?: Constructor<E>,
): (parent: ParentNode) => ValidatedNea<string, NonEmptyArray<E>> {
  return (parent: ParentNode): ValidatedNea<string, NonEmptyArray<E>> => {
    const elts = parent.querySelectorAll(selector)

    const res = pipe(
      NonEmptyArray.fromReadonlyArray([...elts]),
      Either.fromOption(() => NonEmptyArray.of(`No element matches selector: ${selector}`)),
    )

    if (type === undefined) return res as ValidatedNea<string, NonEmptyArray<E>>

    const isE = (e: Element): e is E => e instanceof type
    return pipe(
      res,
      Either.map(
        NonEmptyArray.mapWithIndex(
          (i, e): ValidatedNea<string, E> =>
            isE(e)
              ? Either.right(e)
              : Either.left(
                  NonEmptyArray.of(
                    `Element ${i} matching "${selector}" - expected ${
                      type.name
                    } got <${e.nodeName.toLowerCase()} />`,
                  ),
                ),
        ),
      ),
      Either.chain(([head, ...tail]) =>
        apply.sequenceT(ValidatedNea.getValidation<string>())(head, ...tail),
      ),
    )
  }
}

export const DomHandler = {
  of: domHandlerOf,
  querySelectorEnsureOne,
  querySelectorAllNonEmpty,
}
