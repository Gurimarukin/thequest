import type { SpellName } from '../../shared/models/api/SpellName'
import type {
  ChampionFaction,
  ChampionFactionOrNone,
} from '../../shared/models/api/champion/ChampionFaction'
import type { ChampionPosition } from '../../shared/models/api/champion/ChampionPosition'
import type { LeagueRank } from '../../shared/models/api/league/LeagueRank'
import type { LeagueTier } from '../../shared/models/api/league/LeagueTier'
import type { WikiaStatsBalanceKey } from '../../shared/models/wikia/WikiaStatsBalance'
import type { Dict } from '../../shared/utils/fp'

import type { Translation } from '../contexts/TranslationContext'
import { TranslationUtils } from '../utils/TranslationUtils'

const locale = 'fr-FR'

const challengeShort = TranslationUtils.challenge(
  id => `<Challenge ${id}>`,
  f => factionOrNone[f],
)

const factionChallengeName: Dict<ChampionFaction, string> = {
  bandle: '5 sur 5',
  bilgewater: 'Naufrageurs',
  demacia: 'POUR DEMACIA',
  freljord: 'Premiers de la glace',
  ionia: 'Tendez l’autre Wuju',
  ixtal: 'Terrible jungle',
  noxus: 'La force avant tout',
  piltover: 'Innovateurs',
  shadowIsles: 'Terreurs des îles',
  shurima: 'Artistes shurimartiaux',
  targon: 'Maîtres de la montagne',
  void: '(Cris inhumains)',
  zaun: 'Troupe techno-chimique',
}

const factionOrNone: Dict<ChampionFactionOrNone, string> = {
  bandle: 'Bandle',
  bilgewater: 'Bilgewater',
  demacia: 'Demacia',
  freljord: 'Freljord',
  ionia: 'Ionia',
  ixtal: 'Ixtal',
  noxus: 'Noxus',
  piltover: 'Piltover',
  shadowIsles: 'Îles Obscures',
  shurima: 'Shurima',
  targon: 'Targon',
  void: 'Néant',
  zaun: 'Zaun',
  none: 'Sans faction',
}

const leagueTier: Dict<LeagueTier, string> = {
  IRON: 'Fer',
  BRONZE: 'Bronze',
  SILVER: 'Argent',
  GOLD: 'Or',
  PLATINUM: 'Platine',
  DIAMOND: 'Diamant',
  MASTER: 'Maître',
  GRANDMASTER: 'Grand Maître',
  CHALLENGER: 'Challenger',
}

const position: Dict<ChampionPosition, string> = {
  top: 'Haut',
  jun: 'Jungle',
  mid: 'Milieu',
  bot: 'Bas',
  sup: 'Support',
}

const rank: Dict<LeagueRank, string> = {
  I: 'I',
  II: 'II',
  III: 'III',
  IV: 'IV',
}

const spell: Dict<SpellName, string> = {
  I: 'P',
  Q: 'Q',
  W: 'W',
  E: 'E',
  R: 'R',
}

const wikiaStatsBalance: Dict<WikiaStatsBalanceKey, string> = {
  dmg_dealt: 'Dégâts infligés',
  dmg_taken: 'Dégâts subis',
  healing: 'Efficacité des soins',
  shielding: 'Efficacité des boucliers',
  ability_haste: 'Accélération de compétences',
  energy_regen: 'Regénération d’énergie',
  attack_speed: 'Vitesse d’attaque',
  movement_speed: 'Vitesse de déplacement',
  tenacity: 'Tenacité',
}

export const frTranslation: Translation = {
  aram: {
    category: {
      label: {
        buffed: 'Champions buffés',
        nerfed: 'Champions nerfés',
        other: 'Autres',
        balanced: 'Champions parfaitement équilibrés',
      },
      description: {
        buffed: 'Champions avec plus de buffs que de nerfs',
        nerfed: 'Champions avec plus de nerfs que de buffs',
        other:
          'Champions avec autant de buffs que de nerfs (ou avec des modifications de compétences pour lesquelles il est difficile de déterminer automatiquement si c’est un buff ou un nerf 🙃)',
        balanced: 'Champions avec aucun équilibrage',
      },
    },
    spell: s => `(${spell[s]}) :`,
    statIconAlt: name => `Icône stat ${wikiaStatsBalance[name]}`,
  },
  common: {
    challenge: {
      challenge: 'Défi',
      iconAlt: id => `Icône défi ${challengeShort(id)}`,
      thresholds: 'Seuils :',
      valueTier: (value, tier, o) =>
        `${value} : ${leagueTier[tier]}${o !== undefined && o.withComma ? ',' : ''}`,
    },
    championIconAlt: name => `Icône de ${name}`,
    fraction: (numerator, denominator, o) => {
      const res = `${numerator.toLocaleString(locale)} / ${denominator.toLocaleString(locale)}`
      return o !== undefined && o.withParenthesis ? `(${res})` : res
    },
    labels: {
      challengeShort,
      challenge: TranslationUtils.challenge(
        id => `<Challenge ${id}>`,
        f => factionChallengeName[f],
      ),
      faction: factionOrNone,
      factionOrNone,
      leagueTier,
      position,
      spell,
      wikiaStatsBalance,
    },
    league: {
      label: {
        soloDuo: 'Classée Solo/Duo',
        flex: 'Classée FLEXXX',
      },
      leaguePoints: n => `${n} LP`,
      losses: pluralUnit('défaite'),
      wins: pluralUnit('victoire'),
      serie: 'Série :',
      tierRank: (tier, rank_) =>
        `${leagueTier[tier]}${rank_ !== undefined ? ` ${rank[rank_]}` : ''}`,
      tierRankAlt: (tier, rank_) =>
        `${leagueTier[tier]}${rank_ !== undefined ? ` ${rank[rank_]}` : ''}`,
      unranked: 'Non classé',
      unrankedIconAlt: 'Icône non classé',
    },
    nChampionsFraction: (n, total) => `${plural('champion')(n)} / ${total.toLocaleString(locale)}`,
    nResults: plural('résultat'),
    number: (n, o) =>
      o !== undefined && o.withParenthesis
        ? `(${n.toLocaleString(locale)})`
        : n.toLocaleString(locale),
    percents: n => `${n.toLocaleString(locale)} %`,
    positionIconAlt: p => `Icône position ${position[p]}`,
  },
  masteries: {
    addShard: 'Ajouter un fragment',
    chestAvailable: 'coffre disponible',
    chestIconAlt: 'Icône de coffre',
    chestGranted: 'coffre obtenu',
    nShards: plural('fragment'),
    nTokens: plural('jeton'),
    points: (points, total) =>
      `${points.toLocaleString(locale)}${
        total !== undefined ? ` / ${total.toLocaleString(locale)}` : ''
      } points`,
    pointsSinceLastLevel: (points, level) =>
      `${plural('point')(points)} depuis le niveau ${level.toLocaleString(locale)}`,
    pointsUntilNextLevel: (points, level) =>
      `${plural('point')(points)} jusqu'au niveau ${level.toLocaleString(locale)}`,
    removeShard: 'Enlever un fragment',
    removeNShards: n => `enlever ${plural('fragment')(n)}`,
    tokenIconAlt: (level, o) =>
      `Jeton de maîtrise ${level}${o !== undefined && o.notObtained ? ' (non obtenu)' : ''}`,
  },
}

function plural(unit: string) {
  return (n: number): string => `${n.toLocaleString(locale)} ${pluralUnit(unit)(n)}`
}

function pluralUnit(unit: string) {
  return (n: number): string => `${unit}${n < 2 ? '' : 's'}`
}
