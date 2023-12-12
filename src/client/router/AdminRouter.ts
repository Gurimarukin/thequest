import type { Match, Parser } from 'fp-ts-routing'
import { end, format, lit } from 'fp-ts-routing'

/**
 * matches
 */

const admin = lit('admin')
const adminMadosayentisuto = admin.then(lit('madosayentisuto'))

/**
 * parsers
 *
 * Don't forget .then(end).parser (or use p)
 */

export const adminParsers = {
  index: p(admin),
  madosayentisuto: p(adminMadosayentisuto),

  any: admin.parser,
}

/**
 * routes
 */

export const adminRoutes = {
  index: format(admin.formatter, {}),
  madosayentisuto: format(adminMadosayentisuto.formatter, {}),
}

function p<A>(match: Match<A>): Parser<A> {
  return match.then(end).parser
}
