import { pipe } from 'fp-ts/function'
import * as D from 'io-ts/Decoder'

type DDragonItem = D.TypeOf<typeof decoder>

const decoder = D.struct({
  name: D.string, // 'Ionian Boots of Lucidity'
  description: pipe(D.string, D.map(removeTrailingBrs)), // '<mainText><stats><attention>10</attention> Ability Haste<br><attention>45</attention> Move Speed</stats><br><br><passive>Ionian Insight</passive><br>Gain 10 Summoner Spell Haste.<br><br></mainText>'
  // colloq: '', // aliases for searching
  plaintext: D.string, // 'Increases Move Speed and Cooldown Reduction'
  // from: List.decoder(ItemId.codec), // ['1001', '2022']
  // into: List.decoder(ItemId.codec), // ['3171']
  image: D.struct({
    full: D.string, // '3158.png'
    // sprite: D.string, // 'item3.png'
    // group: D.literal('item'),
    // x: D.number, // 432
    // y: D.number, // 192
    // w: D.number, // 48
    // h: D.number, // 48
  }),
  // gold: D.struct({
  //   base: D.number, // 350
  //   purchasable: D.boolean, // true
  //   total: D.number, // 900
  //   sell: D.number, // 630
  // }),
  // tags: List.decoder(D.string), // ['Boots', 'CooldownReduction']
  // maps: D.record(D.boolean), // { '11': true, '12': true, '21': true, '22': false, '30': false, '33': false, '35': true }
  // stats: D.record(D.number), // { FlatMovementSpeedMod: 45 }
  // depth: D.number, // 2
})

function removeTrailingBrs(html: string): string {
  const res = html.replace(/<br><\/mainText>$/, '</mainText>')

  if (res === html) {
    return res
  }

  return removeTrailingBrs(res)
}

const DDragonItem = { decoder }

export { DDragonItem }
