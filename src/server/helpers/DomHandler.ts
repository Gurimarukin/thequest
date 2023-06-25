import { apply, predicate } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { JSDOM } from 'jsdom'

import { ValidatedNea } from '../../shared/models/ValidatedNea'
import { StringUtils } from '../../shared/utils/StringUtils'
import { Either, List, NonEmptyArray, Try } from '../../shared/utils/fp'

type Constructor<E> = {
  new (): E
  prototype: E
}

type DomHandlerOptions = {
  url?: string
}

type DomHandler = {
  window: JSDOM['window']
  querySelectorEnsureOneTextContent: (
    selector: string,
  ) => (parent: ParentNode) => Either<string, string>
}

const domHandlerOf = (options?: DomHandlerOptions) => (html: string) =>
  pipe(
    Try.tryCatch(() => new JSDOM(html, options)),
    Try.map(({ window }): DomHandler => {
      const querySelectorEnsureOneTextContent =
        (selector: string) =>
        (parent: ParentNode): Either<string, string> =>
          pipe(
            parent,
            querySelectorEnsureOne(selector, window.HTMLElement),
            Either.chain(textContent(selector)),
          )

      return { window, querySelectorEnsureOneTextContent }
    }),
  )

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

const querySelectorAll =
  <E extends Element>(selector: string, type: Constructor<E>) =>
  (parent: ParentNode): ValidatedNea<string, List<E>> => {
    const elts = parent.querySelectorAll(selector)

    const isE = (e: Element): e is E => e instanceof type
    return pipe(
      [...elts],
      List.traverseWithIndex(ValidatedNea.getValidation<string>())((i, e) =>
        isE(e) ? ValidatedNea.valid(e) : elementNotMatching(selector, type)(i, e),
      ),
    )
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
            isE(e) ? ValidatedNea.valid(e) : elementNotMatching(selector, type)(i, e),
        ),
      ),
      Either.chain(([head, ...tail]) =>
        apply.sequenceT(ValidatedNea.getValidation<string>())(head, ...tail),
      ),
    )
  }
}

const textContent = getText('textContent', e => e.textContent)

const DomHandler = {
  of: domHandlerOf,
  querySelectorEnsureOne,
  querySelectorAll,
  querySelectorAllNonEmpty,
  textContent,
}

export { DomHandler }

function getText(
  name: string,
  getter: (elt: Element) => string | null,
): (selector: string) => (elt: Element) => Either<string, string> {
  return selector => elt =>
    pipe(
      getter(elt),
      Either.fromNullable(`No ${name} for element: ${selector}`),
      Either.map(StringUtils.cleanHtml),
      Either.filterOrElse(
        predicate.not(looksLikeHTMLTag),
        str => `${name} looks like an HTML tag and this might be a problem: ${str}`,
      ),
    )
}

const looksLikeHTMLTag = (str: string): boolean => str.startsWith('<') && str.endsWith('/>')

const elementNotMatching =
  (selector: string, type: Constructor<Element>) =>
  (index: number, element: Element): ValidatedNea<string, never> =>
    ValidatedNea.invalid(
      NonEmptyArray.of(
        `Element ${index} matching "${selector}" - expected ${
          type.name
        } got <${element.nodeName.toLowerCase()}>`,
      ),
    )
