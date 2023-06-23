import type { ChampionFaction } from '../../shared/models/api/champion/ChampionFaction'
import type { ChampionLevelOrZero } from '../../shared/models/api/champion/ChampionLevel'
import type { ChampionPosition } from '../../shared/models/api/champion/ChampionPosition'
import type { LeagueRank } from '../../shared/models/api/league/LeagueRank'
import type { FourRanksTier, OneRankTier } from '../../shared/models/api/league/LeagueTier'
import type { WikiaStatsBalanceKey } from '../../shared/models/wikia/WikiaStatsBalance'
import type { Dict } from '../../shared/utils/fp'

const ironIcon = new URL('./divisions/iron_I.png', import.meta.url).toString()

const divisions: Dict<'unranked' | `${FourRanksTier}${LeagueRank}` | OneRankTier, string> = {
  unranked: new URL('./divisions/unranked.png', import.meta.url).toString(),
  IRONI: ironIcon,
  IRONII: ironIcon,
  IRONIII: ironIcon,
  IRONIV: ironIcon,
  BRONZEI: new URL('./divisions/bronze_I.webp', import.meta.url).toString(),
  BRONZEII: new URL('./divisions/bronze_II.webp', import.meta.url).toString(),
  BRONZEIII: new URL('./divisions/bronze_III.webp', import.meta.url).toString(),
  BRONZEIV: new URL('./divisions/bronze_IV.webp', import.meta.url).toString(),
  SILVERI: new URL('./divisions/silver_I.webp', import.meta.url).toString(),
  SILVERII: new URL('./divisions/silver_II.webp', import.meta.url).toString(),
  SILVERIII: new URL('./divisions/silver_III.webp', import.meta.url).toString(),
  SILVERIV: new URL('./divisions/silver_IV.webp', import.meta.url).toString(),
  GOLDI: new URL('./divisions/gold_I.webp', import.meta.url).toString(),
  GOLDII: new URL('./divisions/gold_II.webp', import.meta.url).toString(),
  GOLDIII: new URL('./divisions/gold_III.webp', import.meta.url).toString(),
  GOLDIV: new URL('./divisions/gold_IV.webp', import.meta.url).toString(),
  PLATINUMI: new URL('./divisions/platinum_I.webp', import.meta.url).toString(),
  PLATINUMII: new URL('./divisions/platinum_II.webp', import.meta.url).toString(),
  PLATINUMIII: new URL('./divisions/platinum_III.webp', import.meta.url).toString(),
  PLATINUMIV: new URL('./divisions/platinum_IV.webp', import.meta.url).toString(),
  DIAMONDI: new URL('./divisions/diamond_I.webp', import.meta.url).toString(),
  DIAMONDII: new URL('./divisions/diamond_II.webp', import.meta.url).toString(),
  DIAMONDIII: new URL('./divisions/diamond_III.webp', import.meta.url).toString(),
  DIAMONDIV: new URL('./divisions/diamond_IV.webp', import.meta.url).toString(),
  MASTER: new URL('./divisions/master.webp', import.meta.url).toString(),
  GRANDMASTER: new URL('./divisions/grandmaster.png', import.meta.url).toString(),
  CHALLENGER: new URL('./divisions/challenger.webp', import.meta.url).toString(),
}

const factions: Dict<ChampionFaction, string> = {
  bandle: new URL('./factions/bandle.webp', import.meta.url).toString(),
  bilgewater: new URL('./factions/bilgewater.webp', import.meta.url).toString(),
  demacia: new URL('./factions/demacia.webp', import.meta.url).toString(),
  freljord: new URL('./factions/freljord.webp', import.meta.url).toString(),
  ionia: new URL('./factions/ionia.webp', import.meta.url).toString(),
  ixtal: new URL('./factions/ixtal.webp', import.meta.url).toString(),
  noxus: new URL('./factions/noxus.webp', import.meta.url).toString(),
  piltover: new URL('./factions/piltover.webp', import.meta.url).toString(),
  shadowIsles: new URL('./factions/shadowIsles.webp', import.meta.url).toString(),
  shurima: new URL('./factions/shurima.webp', import.meta.url).toString(),
  targon: new URL('./factions/targon.webp', import.meta.url).toString(),
  void: new URL('./factions/void.webp', import.meta.url).toString(),
  zaun: new URL('./factions/zaun.webp', import.meta.url).toString(),
}

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
  dmg_dealt: new URL('./stats/attack_damage.webp', import.meta.url).toString(),
  dmg_taken: new URL('./stats/armor_penetration.webp', import.meta.url).toString(),
  healing: new URL('./stats/heal_power.webp', import.meta.url).toString(),
  shielding: new URL('./stats/shield_power.webp', import.meta.url).toString(),
  ability_haste: new URL('./stats/ability_haste.webp', import.meta.url).toString(),
  energy_regen: new URL('./stats/energy_regen.webp', import.meta.url).toString(),
  attack_speed: new URL('./stats/attack_speed.webp', import.meta.url).toString(),
  movement_speed: new URL('./stats/movement_speed.webp', import.meta.url).toString(),
  tenacity: new URL('./stats/tenacity.webp', import.meta.url).toString(),
}

const tokens = {
  5: new URL('./tokens/token-5.png', import.meta.url).toString(),
  6: new URL('./tokens/token-6.png', import.meta.url).toString(),
}

export const Assets = {
  champion: new URL('./champion.webp', import.meta.url).toString(),
  chest: new URL('./chest.png', import.meta.url).toString(),
  divisions,
  factions,
  masteries,
  positions,
  stats,
  tokens,
  yuumi: new URL('./yuumi.png', import.meta.url).toString(),
}
