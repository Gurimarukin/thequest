import { pipe } from 'fp-ts/function'
import * as D from 'io-ts/Decoder'

import { ChampionId } from '../../../../shared/models/api/ChampionId'
import { ChampionKey } from '../../../../shared/models/api/ChampionKey'
import { List } from '../../../../shared/utils/fp'

import { NumberFromString } from '../../../../client/utils/ioTsUtils'

type DDragonChampion = D.TypeOf<typeof decoder>

const decoder = D.struct({
  version: D.string,
  id: ChampionId.codec,
  key: pipe(NumberFromString.decoder, D.compose(ChampionKey.codec)),
  name: D.string,
  title: D.string,
  blurb: D.string,
  info: D.struct({
    attack: D.number,
    defense: D.number,
    magic: D.number,
    difficulty: D.number,
  }),
  image: D.struct({
    full: D.string, // 'Aatrox.png'
    sprite: D.string, // 'champion0.png'
    group: D.string, // 'champion'
    x: D.number, // 0
    y: D.number, // 0
    w: D.number, // 48
    h: D.number, // 48
  }),
  tags: List.decoder(D.string), // ['Fighter', 'Tank']
  partype: D.string, // 'Puits de sang' / 'Mana' / 'Énergie'
  stats: D.struct({
    hp: D.number,
    hpperlevel: D.number,
    mp: D.number,
    mpperlevel: D.number,
    movespeed: D.number,
    armor: D.number,
    armorperlevel: D.number,
    spellblock: D.number,
    spellblockperlevel: D.number,
    attackrange: D.number,
    hpregen: D.number,
    hpregenperlevel: D.number,
    mpregen: D.number,
    mpregenperlevel: D.number,
    crit: D.number,
    critperlevel: D.number,
    attackdamage: D.number,
    attackdamageperlevel: D.number,
    attackspeedperlevel: D.number,
    attackspeed: D.number,
  }),
})

const DDragonChampion = { decoder }

export { DDragonChampion }
