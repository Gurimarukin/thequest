import { pipe } from 'fp-ts/function'
import * as C from 'io-ts/Codec'
import { lens } from 'monocle-ts'

import { List, Maybe } from '../../../utils/fp'
import { SummonerShort } from '../summoner/SummonerShort'
import { UserRole } from './UserRole'

type UserView = C.TypeOf<typeof codec>

const codec = C.struct({
  userName: C.string,
  favoriteSearches: List.codec(SummonerShort.codec),
  linkedRiotAccount: Maybe.codec(SummonerShort.codec),
  role: UserRole.codec,
})

const favoriteSearchesLens = pipe(lens.id<UserView>(), lens.prop('favoriteSearches'))

const UserView = {
  codec,
  Lens: {
    favoriteSearches: favoriteSearchesLens,
  },
}

export { UserView }
