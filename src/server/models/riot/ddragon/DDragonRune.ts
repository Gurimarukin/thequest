import * as D from 'io-ts/Decoder'

import { RuneId } from '../../../../shared/models/api/perk/RuneId'
import { RuneKey } from '../../../../shared/models/api/perk/RuneKey'

type DDragonRune = D.TypeOf<typeof decoder>

const decoder = D.struct({
  id: RuneId.codec, // 8112
  key: RuneKey.codec, // 'Electrocute'
  icon: D.string, // 'perk-images/Styles/Domination/Electrocute/Electrocute.png'
  name: D.string, //'Électrocution',
  // shortDesc: D.string, // "Toucher un champion avec 3 attaques ou compétences <b>différentes</b> en moins de 3 sec inflige des <lol-uikit-tooltipped-keyword key='LinkTooltip_Description_AdaptiveDmg'>dégâts adaptatifs</lol-uikit-tooltipped-keyword> supplémentaires."
  longDesc: D.string, // "Toucher un champion ennemi avec 3 attaques ou compétences <b>différentes</b> en moins de 3 sec inflige des <lol-uikit-tooltipped-keyword key='LinkTooltip_Description_AdaptiveDmg'><font color='#48C4B7'>dégâts adaptatifs</font></lol-uikit-tooltipped-keyword> supplémentaires.<br><br>Dégâts : 30 - 180 (+0.4 dégâts d'attaque supplémentaires, +0.25 puissance) pts de dégâts.<br><br>Délai de récupération : 25 - 20 sec.<br><br><hr><i>''On les appelait les lords fulminants, car parler de leurs éclairs était une invitation à l'anéantissement.''</i>"
})

const DDragonRune = { decoder }

export { DDragonRune }
