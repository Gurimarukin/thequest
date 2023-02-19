import type { eq } from 'fp-ts'
import { string } from 'fp-ts'

import { createEnum } from '../../utils/createEnum'

type Platform = typeof e.T

const e = createEnum('BR1', 'EUN1', 'EUW1', 'JP1', 'KR', 'LA1', 'LA2', 'NA1', 'OC1', 'TR1', 'RU')

const Eq: eq.Eq<Platform> = string.Eq

const Platform = {
  codec: e.codec,
  values: e.values,
  Eq,
}

export { Platform }
