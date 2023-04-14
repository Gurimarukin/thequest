import type { Lane } from '../../shared/models/api/Lane'
import type { ChampionLevelOrZero } from '../../shared/models/api/champion/ChampionLevel'
import type { Dict } from '../../shared/utils/fp'

const masteries: Dict<`${ChampionLevelOrZero}`, string> = {
  0: new URL('./masteries/mastery-0.png', import.meta.url).toString(),
  1: new URL('./masteries/mastery-1.png', import.meta.url).toString(),
  2: new URL('./masteries/mastery-2.png', import.meta.url).toString(),
  3: new URL('./masteries/mastery-3.png', import.meta.url).toString(),
  4: new URL('./masteries/mastery-4.png', import.meta.url).toString(),
  5: new URL('./masteries/mastery-5.png', import.meta.url).toString(),
  6: new URL('./masteries/mastery-6.png', import.meta.url).toString(),
  7: new URL('./masteries/mastery-7.png', import.meta.url).toString(),
}

const lanes: Dict<Lane, string> = {
  top: new URL('./lanes/top.png', import.meta.url).toString(),
  jun: new URL('./lanes/jun.png', import.meta.url).toString(),
  mid: new URL('./lanes/mid.png', import.meta.url).toString(), 
  bot: new URL('./lanes/bot.png', import.meta.url).toString(),
  sup: new URL('./lanes/sup.png', import.meta.url).toString(),
}

export const Assets = {
  chest: new URL('./chest.png', import.meta.url).toString(),
  iconYuumi: new URL('./icon-yuumi.png', import.meta.url).toString(),
  token5: new URL('./tokens/token-5.png', import.meta.url).toString(),
  token6: new URL('./tokens/token-6.png', import.meta.url).toString(),
  masteries,
  lanes,
}
