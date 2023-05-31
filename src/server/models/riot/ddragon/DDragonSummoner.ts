import * as D from 'io-ts/Decoder'

import { SummonerSpellId } from '../../../../shared/models/api/summonerSpell/SummonerSpellId'
import { SummonerSpellKey } from '../../../../shared/models/api/summonerSpell/SummonerSpellKey'
import { NonEmptyArray } from '../../../../shared/utils/fp'

type DDragonSummoner = D.TypeOf<typeof decoder>

const decoder = D.struct({
  id: SummonerSpellId.codec, // 'SummonerBarrier'
  key: SummonerSpellKey.fromStringCodec, // '21'
  name: D.string, // 'Barrière'
  description: D.string, // 'Protège votre champion contre 105-411 pts de dégâts (selon le niveau du champion) pendant 2 sec.'
  // tooltip: 'Protège temporairement votre champion contre {{ tooltipabsorbeddamage }} pts de dégâts pendant 2 sec.',
  // maxrank: 1,
  cooldown: NonEmptyArray.decoder(D.number), // [180]
  // cooldownBurn: '180',
  // cost: [0],
  // costBurn: '0',
  // datavalues: {},
  // effect: [null, [87], [18], [0], [0], [0], [0], [0], [0], [0], [0]],
  // effectBurn: [null, '87', '18', '0', '0', '0', '0', '0', '0', '0', '0'],
  // vars: [],
  // summonerLevel: 4,
  // modes: [
  //   'NEXUSBLITZ',
  //   'URF',
  //   'PRACTICETOOL',
  //   'TUTORIAL',
  //   'CLASSIC',
  //   'ARAM',
  //   'DOOMBOTSTEEMO',
  //   'ULTBOOK',
  //   'ONEFORALL',
  //   'ARSR',
  //   'ASSASSINATE',
  //   'FIRSTBLOOD',
  //   'PROJECT',
  //   'STARGUARDIAN',
  // ],
  // costType: 'Pas de coût',
  // maxammo: '-1',
  // range: [1200],
  // rangeBurn: '1200',
  // image: {
  //   full: 'SummonerBarrier.png',
  //   sprite: 'spell0.png',
  //   group: 'spell',
  //   x: 0,
  //   y: 0,
  //   w: 48,
  //   h: 48,
  // },
  // resource: 'Pas de coût',
})

const DDragonSummoner = { decoder }

export { DDragonSummoner }
