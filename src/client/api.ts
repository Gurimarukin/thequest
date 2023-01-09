import { apiRoutes } from '../shared/ApiRouter'
import { PlatformWithName } from '../shared/models/api/summoner/PlatformWithName'
import { LoginPayload } from '../shared/models/api/user/LoginPayload'
import type { Future } from '../shared/utils/fp'

import { http } from './utils/http'

export const apiUserSelfFavoritesPut = (platformWithName: PlatformWithName): Future<unknown> =>
  http(apiRoutes.user.self.favorites.put, { json: [PlatformWithName.codec, platformWithName] })

export const apiUserSelfFavoritesDelete = (platformWithName: PlatformWithName): Future<unknown> =>
  http(apiRoutes.user.self.favorites.delete, { json: [PlatformWithName.codec, platformWithName] })

export const apiUserLoginPost = (payload: LoginPayload): Future<unknown> =>
  http(apiRoutes.user.login.post, { json: [LoginPayload.codec, payload] })

export const apiUserLogoutPost: Future<unknown> = http(apiRoutes.user.logout.post)

export const apiUserRegisterPost = (payload: LoginPayload): Future<unknown> =>
  http(apiRoutes.user.register.post, { json: [LoginPayload.codec, payload] })
