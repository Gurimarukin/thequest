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

const default_ = 'fr_FR' as const

/* eslint-disable @typescript-eslint/no-unused-vars */
type TestDefaultLangIsLang = Pick<Dict<Lang, string>, typeof default_>
/* eslint-enable @typescript-eslint/no-unused-vars */

const Lang = { codec: e.codec, values: e.values, Eq: e.Eq, default: default_ }

export { Lang }
