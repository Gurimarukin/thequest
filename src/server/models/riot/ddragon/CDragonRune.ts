import { pipe } from 'fp-ts/function'
import * as D from 'io-ts/Decoder'

import { RuneId } from '../../../../shared/models/api/perk/RuneId'
import { StringUtils } from '../../../../shared/utils/StringUtils'
import { Maybe } from '../../../../shared/utils/fp'

const iconPathRegex = /^\/lol-game-data\/assets\/v1\/(perk-images\/.*\.png)$/

const iconPathDecoder = pipe(
  D.string,
  D.parse(str =>
    pipe(
      str,
      StringUtils.matcher1(iconPathRegex),
      Maybe.fold(() => D.failure(str, 'IconPathFromString'), D.success),
    ),
  ),
)

type CDragonRune = D.TypeOf<typeof decoder>

const decoder = D.struct({
  id: RuneId.codec, // 8143
  name: D.string, // 'Ruée offensive'
  // majorChangePatchVersion: '',
  // tooltip: "Après avoir cessé d'être furtif ou après avoir utilisé une ruée, un bond, un saut instantané ou une téléportation, infliger des dégâts à un champion vous octroie +9 létalité et +7 pénétration magique pendant 5 sec.<br><br>Délai de récupération : 4 sec.<br><hr><br>Dégâts supplémentaires aux champions : @f1@",
  // shortDesc: "Vous gagnez de la létalité et de la pénétration magique après avoir utilisé une ruée, un bond, un saut instantané ou une téléportation ou en cessant d'être furtif.",
  longDesc: D.string, // "Après avoir cessé d'être furtif ou après avoir utilisé une ruée, un bond, un saut instantané ou une téléportation, infliger des dégâts à un champion vous octroie +9 létalité et +7 pénétration magique pendant 5 sec.<br><br>Délai de récupération : 4 sec."
  // recommendationDescriptor: '',
  iconPath: iconPathDecoder, // '/lol-game-data/assets/v1/perk-images/Styles/Domination/SuddenImpact/SuddenImpact.png'
  // endOfGameStatDescs: ['Dégâts supplémentaires : @eogvar1@'],
  // recommendationDescriptorAttributes: {
  //   kBurstDamage: 8,
  //   kDamagePerSecond: 2,
  // },
})

const CDragonRune = { decoder }

export { CDragonRune }
