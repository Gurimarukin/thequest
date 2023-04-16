import { pipe } from 'fp-ts/function'
import type { Decoder } from 'io-ts/Decoder'
import * as D from 'io-ts/Decoder'

import { ChampionId } from '../../../shared/models/api/champion/ChampionId'
import { ChampionKey } from '../../../shared/models/api/champion/ChampionKey'
import { ChampionType } from '../../../shared/models/api/champion/ChampionType'
import { WikiaStatsBalance } from '../../../shared/models/wikia/WikiaStatsBalance'
import { createEnum } from '../../../shared/utils/createEnum'
import { Maybe, NonEmptyArray } from '../../../shared/utils/fp'
import { DayJsFromISOString } from '../../../shared/utils/ioTsUtils'

import { StrictStruct } from '../../utils/ioTsUtils'
import { WikiaChampionPosition } from './WikiaChampionPosition'

type WikiaChampion = D.TypeOf<typeof decoder>

const Resource = createEnum(
  'Blood Well',
  'Bloodthirst',
  'Courage',
  'Energy',
  'Ferocity',
  'Flow',
  'Fury',
  'Grit',
  'Health',
  'Heat',
  'Mana',
  'None',
  'Rage',
  'Shield',
  'Soul Unbound',
)

const SecondaryAttribute = createEnum('Health')

const RangedType = createEnum('Melee', 'Ranged')

const Role = createEnum(
  'Artillery',
  'Assassin',
  'Battlemage',
  'Burst',
  'Catcher',
  'Diver',
  'Enchanter',
  'Juggernaut',
  'Marksman',
  'Skirmisher',
  'Specialist',
  'Vanguard',
  'Warden',
)

const positionsDecoder: Decoder<unknown, Maybe<NonEmptyArray<WikiaChampionPosition>>> = D.union(
  pipe(
    StrictStruct.decoder({}),
    D.map(() => Maybe.none),
  ),
  pipe(NonEmptyArray.decoder(WikiaChampionPosition.decoder), D.map(Maybe.some)),
)

const altTypeDecoder: Decoder<unknown, Maybe<ChampionType>> = D.union(
  pipe(
    D.literal(''),
    D.map(() => Maybe.none),
  ),
  Maybe.decoder(ChampionType.decoder),
)

const AdaptiveType = createEnum('Magic', 'Physical')

const decoder = StrictStruct.decoder({
  id: ChampionKey.codec,
  apiname: ChampionId.codec,
  title: D.string,
  attack: D.number,
  defense: D.number,
  magic: D.number,
  difficulty: D.number,
  herotype: ChampionType.decoder,
  alttype: altTypeDecoder,
  resource: Resource.decoder,
  'secondary attributes': Maybe.decoder(SecondaryAttribute.decoder),
  stats: StrictStruct.decoder({
    hp_base: D.number,
    hp_lvl: D.number,
    mp_base: D.number,
    mp_lvl: D.number,
    arm_base: D.number,
    arm_lvl: D.number,
    mr_base: D.number,
    mr_lvl: D.number,
    hp5_base: D.number,
    hp5_lvl: D.number,
    mp5_base: D.number,
    mp5_lvl: D.number,
    dam_base: D.number,
    dam_lvl: D.number,
    as_base: D.number,
    as_lvl: D.number,
    crit_base: Maybe.decoder(D.number),
    range: D.number,
    range_lvl: Maybe.decoder(D.number),
    ms: D.number,
    acquisition_radius: Maybe.decoder(D.number),
    selection_radius: D.number,
    pathing_radius: D.number,
    gameplay_radius: Maybe.decoder(D.number),
    as_ratio: D.number,
    attack_delay_offset: Maybe.decoder(D.number),
    attack_cast_time: Maybe.decoder(D.number),
    attack_total_time: Maybe.decoder(D.number),
    missile_speed: Maybe.decoder(D.number),
    windup_modifier: Maybe.decoder(D.number),
    crit_mod: Maybe.decoder(D.number),
    aram: Maybe.decoder(WikiaStatsBalance.codec),
    nb: Maybe.decoder(WikiaStatsBalance.codec),
    ofa: Maybe.decoder(WikiaStatsBalance.codec),
    urf: Maybe.decoder(WikiaStatsBalance.codec),
    usb: Maybe.decoder(WikiaStatsBalance.codec),
  }),
  fullname: Maybe.decoder(D.string),
  nickname: Maybe.decoder(D.string),
  rangetype: RangedType.decoder,
  date: DayJsFromISOString.decoder,
  patch: D.string,
  changes: D.string,
  role: NonEmptyArray.decoder(Role.decoder),
  positions: positionsDecoder,
  op_positions: positionsDecoder,
  damage: D.number,
  toughness: D.number,
  control: D.number,
  mobility: D.number,
  utility: D.number,
  style: D.number,
  adaptivetype: AdaptiveType.decoder,
  be: D.number,
  rp: D.number,
  skill_i: NonEmptyArray.decoder(D.string),
  skill_q: NonEmptyArray.decoder(D.string),
  skill_w: NonEmptyArray.decoder(D.string),
  skill_e: NonEmptyArray.decoder(D.string),
  skill_r: NonEmptyArray.decoder(D.string),
  skills: Maybe.decoder(NonEmptyArray.decoder(D.string)),
})

const WikiaChampion = { decoder }

export { WikiaChampion }
