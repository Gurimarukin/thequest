import { pipe } from 'fp-ts/function'
import * as C from 'io-ts/Codec'
import type { IsEqual } from 'type-fest'

import type { PartialDict } from '../../utils/fp'
import { Dict, List, Maybe, idcOrd } from '../../utils/fp'
import { MapFromArray } from '../../utils/ioTsUtils'
import { WikiStatsBalance } from '../WikiStatsBalance'
import type { Expect } from '../typeUtils'
import { Ability } from './Ability'
import { Skill } from './Skill'

type MapChangesDataAbility = C.TypeOf<typeof mapChangesDataAbilityCodec>

const mapChangesDataAbilityCodec = C.struct({
  icon: C.string,
  description: C.string,
})

type MapChangesDataAbilities = ReadonlyMap<Ability, MapChangesDataAbility>

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type TestAbilities = Expect<IsEqual<MapChangesDataAbilities, C.TypeOf<typeof abilitiesCodec>>>

const abilitiesCodec = MapFromArray.codec(idcOrd(Ability.Eq))(
  Ability.codec,
  mapChangesDataAbilityCodec,
)

type MapChangesDataSkill = C.TypeOf<typeof skillCodec>

const skillCodec = C.struct({
  name: Ability.codec,
  icon: C.string,
  abilities: abilitiesCodec,
})

type SkillCodec = typeof skillCodec

const skillsProperties: Dict<Skill, SkillCodec> = pipe(
  Skill.values,
  List.reduce(Dict.empty<Skill, SkillCodec>(), (acc, skill) => ({
    ...acc,
    [skill]: skillCodec satisfies SkillCodec,
  })),
)

type MapChangesDataSkills = PartialDict<Skill, MapChangesDataSkill>

const skillsCodec = C.partial(skillsProperties)

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type TestSkills = Expect<IsEqual<MapChangesDataSkills, C.TypeOf<typeof skillsCodec>>>

type MapChangesData = C.TypeOf<typeof codec>

const codec = C.struct({
  stats: Maybe.codec(WikiStatsBalance.codec),
  skills: Maybe.codec(skillsCodec),
})

const empty: MapChangesData = {
  stats: Maybe.none,
  skills: Maybe.none,
}

const MapChangesData = { codec, empty }

export {
  MapChangesData,
  MapChangesDataAbilities,
  MapChangesDataAbility,
  MapChangesDataSkill,
  MapChangesDataSkills,
}
