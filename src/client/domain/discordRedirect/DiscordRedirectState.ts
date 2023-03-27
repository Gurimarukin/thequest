import { createEnum } from '../../../shared/utils/createEnum'

type DiscordRedirectState = typeof u.T

const u = createEnum('login', 'register')

const DiscordRedirectState = { decoder: u.decoder }

export { DiscordRedirectState }
