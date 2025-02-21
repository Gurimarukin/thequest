import { createEnum } from '../../utils/createEnum'

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

const fromNavigatorLanguage = (lang: string): Lang => {
  switch (lang) {
    // case 'es-ES':
    // case 'es':
    //   return 'es_ES'

    case 'fr-FR':
    case 'fr':
      return 'fr_FR'

    default:
      return 'en_GB'
  }
}

const Lang = { ...e, fromNavigatorLanguage }

export { Lang }
