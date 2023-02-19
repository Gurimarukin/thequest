import { apiRoutes } from '../shared/ApiRouter'
import { PlatformWithName } from '../shared/models/api/summoner/PlatformWithName'
import { LoginPasswordPayload } from '../shared/models/api/user/LoginPasswordPayload'
import type { Future } from '../shared/utils/fp'

import { http } from './utils/http'

export const apiUserSelfFavoritesPut = (platformWithName: PlatformWithName): Future<unknown> =>
  http(apiRoutes.user.self.favorites.put, { json: [PlatformWithName.codec, platformWithName] })

export const apiUserSelfFavoritesDelete = (platformWithName: PlatformWithName): Future<unknown> =>
  http(apiRoutes.user.self.favorites.delete, { json: [PlatformWithName.codec, platformWithName] })

export const apiUserLoginPasswordPost = (payload: LoginPasswordPayload): Future<unknown> =>
  http(apiRoutes.user.login.password.post, { json: [LoginPasswordPayload.codec, payload] })

export const apiUserLogoutPost: Future<unknown> = http(apiRoutes.user.logout.post)

export const apiUserRegisterPost = (payload: LoginPasswordPayload): Future<unknown> =>
  http(apiRoutes.user.register.password.post, { json: [LoginPasswordPayload.codec, payload] })
