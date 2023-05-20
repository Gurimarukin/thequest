import { createEnum } from '../../utils/createEnum'

type Platform = typeof e.T

const e = createEnum('BR', 'EUN', 'EUW', 'JP', 'KR', 'LA1', 'LA2', 'NA', 'OC', 'TR', 'RU')

const defaultPlatform: Platform = 'EUW'

const Platform = { ...e, defaultPlatform }

export { Platform }
