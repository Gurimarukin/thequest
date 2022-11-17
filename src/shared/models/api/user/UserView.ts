import { pipe } from 'fp-ts/function'
import * as C from 'io-ts/Codec'
import { lens } from 'monocle-ts'

import { List } from '../../../utils/fp'
import { SummonerShort } from '../SummonerShort'
import { UserName } from './UserName'

type UserView = C.TypeOf<typeof codec>

const codec = C.struct({
  userName: UserName.codec,
  favoriteSearches: List.codec(SummonerShort.codec),
})

const favoriteSearchesLens = pipe(lens.id<UserView>(), lens.prop('favoriteSearches'))

const UserView = {
  codec,
  Lens: {
    favoriteSearches: favoriteSearchesLens,
  },
}

export { UserView }
