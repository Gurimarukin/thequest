import type { Platform } from '../../../shared/models/api/Platform'
import { createEnum } from '../../../shared/utils/createEnum'
import type { Dict } from '../../../shared/utils/fp'

type Shard = typeof e.T

const e = createEnum('europe')

const platform: Dict<Shard, Platform> = {
  europe: 'EUW',
}

const Shard = { ...e, platform }

export { Shard }
