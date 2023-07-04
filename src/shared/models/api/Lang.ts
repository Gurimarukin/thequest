import { createEnum } from '../../utils/createEnum'
import type { Dict } from '../../utils/fp'

type Lang = typeof e.T

const e = createEnum(
  // 'en_US',
  // 'cs_CZ',
  // 'de_DE',
  // 'el_GR',
  // 'en_AU',
  'en_GB',
  // 'en_PH',
  // 'en_SG',
  // 'es_AR',
  // 'es_ES',
  // 'es_MX',
  'fr_FR',
  // 'hu_HU',
  // 'id_ID',
  // 'it_IT',
  // 'ja_JP',
  // 'ko_KR',
  // 'pl_PL',
  // 'pt_BR',
  // 'ro_RO',
  // 'ru_RU',
  // 'th_TH',
  // 'tr_TR',
  // 'vn_VN',
  // 'zh_CN',
  // 'zh_MY',
  // 'zh_TW',
)

const default_: Lang = 'fr_FR'

const fromNavigatorLanguage = (lang: string): Lang => {
  switch (lang) {
    case 'fr-FR':
    case 'fr':
      return 'fr_FR'

    default:
      return 'en_GB'
  }
}

/* eslint-disable @typescript-eslint/no-unused-vars */
type TestDefaultLangIsLang = Pick<Dict<Lang, string>, typeof default_>
/* eslint-enable @typescript-eslint/no-unused-vars */

const Lang = { ...e, default: default_, fromNavigatorLanguage }

export { Lang }
