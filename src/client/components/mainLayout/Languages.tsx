import { useCallback, useState } from 'react'

import { Lang } from '../../../shared/models/api/Lang'
import type { Dict } from '../../../shared/utils/fp'

import { useTranslation } from '../../contexts/TranslationContext'
import { GlobeOutline } from '../../imgs/svgIcons'
import { TranslationUtils } from '../../utils/TranslationUtils'
import { cx } from '../../utils/cx'
import { ClickOutside } from '../ClickOutside'
import { Menu } from './Menu'

export const Languages: React.FC = () => {
  const { lang } = useTranslation()

  const [languagesIsVisible, setLanguagesIsVisible] = useState(false)
  const toggleLanguages = useCallback(() => setLanguagesIsVisible(v => !v), [])
  const hideLanguages = useCallback(() => setLanguagesIsVisible(false), [])

  return (
    <ClickOutside onClickOutside={hideLanguages}>
      <div className="relative flex items-center self-stretch py-2">
        <button type="button" onClick={toggleLanguages}>
          <GlobeOutline className="h-5" />
        </button>

        {languagesIsVisible ? (
          <Menu className="right-[calc(1px_-_12px)]">
            {Lang.values.map(l => {
              const isSelected = Lang.Eq.equals(l, lang)
              return (
                <button
                  key={l}
                  type="button"
                  disabled={isSelected}
                  className={cx('grid grid-cols-[1fr_auto] gap-3.5 py-0.5 text-start', [
                    'border-b border-goldenrod-bis',
                    isSelected,
                  ])}
                >
                  <span>{TranslationUtils.labels.lang[l]}</span>
                  <span>{langEmoji[l]}</span>
                </button>
              )
            })}
          </Menu>
        ) : null}
      </div>
    </ClickOutside>
  )
}

const langEmoji: Dict<Lang, string> = {
  en_GB: '🇬🇧',
  fr_FR: '🇫🇷',
}
