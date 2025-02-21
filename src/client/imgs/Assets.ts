import type { WikiStatsBalanceKey } from '../../shared/models/WikiStatsBalance'
import type { ChampionFaction } from '../../shared/models/api/champion/ChampionFaction'
import type { ChampionLevel } from '../../shared/models/api/champion/ChampionLevel'
import type { Dict } from '../../shared/utils/fp'

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

const masteries: Dict<`${ChampionLevel}`, string> = {
  0: new URL('./masteries/mastery-0.png', import.meta.url).toString(),
  1: new URL('./masteries/mastery-1.png', import.meta.url).toString(),
  2: new URL('./masteries/mastery-2.png', import.meta.url).toString(),
  3: new URL('./masteries/mastery-3.png', import.meta.url).toString(),
  4: new URL('./masteries/mastery-4.png', import.meta.url).toString(),
  5: new URL('./masteries/mastery-5.png', import.meta.url).toString(),
  6: new URL('./masteries/mastery-6.png', import.meta.url).toString(),
  7: new URL('./masteries/mastery-7.png', import.meta.url).toString(),
  8: new URL('./masteries/mastery-8.png', import.meta.url).toString(),
  9: new URL('./masteries/mastery-9.png', import.meta.url).toString(),
  10: new URL('./masteries/mastery-10.png', import.meta.url).toString(),
}

// https://wiki.leagueoflegends.com/en-us/Category:Champion_stat_assets
const stats: Dict<WikiStatsBalanceKey, string> = {
  dmg_dealt: new URL('./stats/damage_amp.png', import.meta.url).toString(),
  dmg_taken: new URL('./stats/armor_penetration.webp', import.meta.url).toString(),
  healing: new URL('./stats/heal_power.webp', import.meta.url).toString(),
  shielding: new URL('./stats/shield_power.webp', import.meta.url).toString(),
  ability_haste: new URL('./stats/ability_haste.webp', import.meta.url).toString(),
  energyregen_mod: new URL('./stats/energy_regen.webp', import.meta.url).toString(),
  total_as: new URL('./stats/attack_speed.webp', import.meta.url).toString(),
  movement_speed: new URL('./stats/movement_speed.webp', import.meta.url).toString(),
  tenacity: new URL('./stats/tenacity.webp', import.meta.url).toString(),
}

export const Assets = {
  champion: new URL('./champion.webp', import.meta.url).toString(),
  factions,
  globetrotter: new URL('./globetrotter.png', import.meta.url).toString(),
  masteries,
  poro: new URL('./poro.png', import.meta.url).toString(),
  runeterra: new URL('./runeterra.png', import.meta.url).toString(),
  spatula: new URL('./spatula.png', import.meta.url).toString(),
  stats,
  yuumi: new URL('./yuumi.png', import.meta.url).toString(),
}
