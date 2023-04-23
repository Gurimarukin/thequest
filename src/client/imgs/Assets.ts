import type { ChampionLevelOrZero } from '../../shared/models/api/champion/ChampionLevel'
import type { ChampionPosition } from '../../shared/models/api/champion/ChampionPosition'
import type { WikiaStatsBalanceKey } from '../../shared/models/wikia/WikiaStatsBalance'
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

const positions: Dict<ChampionPosition, string> = {
  top: new URL('./positions/top.png', import.meta.url).toString(),
  jun: new URL('./positions/jun.png', import.meta.url).toString(),
  mid: new URL('./positions/mid.png', import.meta.url).toString(),
  bot: new URL('./positions/bot.png', import.meta.url).toString(),
  sup: new URL('./positions/sup.png', import.meta.url).toString(),
}

const stats: Dict<WikiaStatsBalanceKey, string> = {
  dmg_dealt: new URL('./stats/dmg_dealt.png', import.meta.url).toString(),
  dmg_taken: new URL('./stats/dmg_taken.png', import.meta.url).toString(),
  healing: new URL('./stats/healing.png', import.meta.url).toString(),
  shielding: new URL('./stats/shielding.png', import.meta.url).toString(),
  ability_haste: new URL('./stats/ability_haste.png', import.meta.url).toString(),
  energy_regen: new URL('./stats/energy_regen.png', import.meta.url).toString(),
  attack_speed: new URL('./stats/attack_speed.png', import.meta.url).toString(),
  movement_speed: new URL('./stats/movement_speed.png', import.meta.url).toString(),
  tenacity: new URL('./stats/tenacity.png', import.meta.url).toString(),
}

export const Assets = {
  chest: new URL('./chest.png', import.meta.url).toString(),
  iconYuumi: new URL('./icon-yuumi.png', import.meta.url).toString(),
  token5: new URL('./tokens/token-5.png', import.meta.url).toString(),
  token6: new URL('./tokens/token-6.png', import.meta.url).toString(),
  masteries,
  positions,
  stats,
}
