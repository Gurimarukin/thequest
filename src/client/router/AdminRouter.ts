import type { Match, Parser } from 'fp-ts-routing'
import { end, format, lit } from 'fp-ts-routing'

/**
 * matches
 */

const admin = lit('admin')
const adminHallOfFame = admin.then(lit('hall-of-fame'))

/**
 * parsers
 *
 * Don't forget .then(end).parser (or use p)
 */

export const adminParsers = {
  index: p(admin),
  hallOfFame: p(adminHallOfFame),

  any: admin.parser,
}

/**
 * routes
 */

export const adminRoutes = {
  index: format(admin.formatter, {}),
  hallOfFame: format(adminHallOfFame.formatter, {}),
}

function p<A>(match: Match<A>): Parser<A> {
  return match.then(end).parser
}
