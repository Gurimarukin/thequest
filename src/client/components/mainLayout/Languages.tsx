import { useCallback, useState } from 'react'

import { Lang } from '../../../shared/models/api/Lang'
import type { Dict } from '../../../shared/utils/fp'

import { useTranslation } from '../../contexts/TranslationContext'
import { EmojiFlagFr, EmojiFlagGb } from '../../imgs/svgs/emojis'
import { LanguageFilled } from '../../imgs/svgs/icons'
import { TranslationUtils } from '../../utils/TranslationUtils'
import { cx } from '../../utils/cx'
import { ClickOutside } from '../ClickOutside'
import { Menu } from './Menu'

export const Languages: React.FC = () => {
  const [languagesIsVisible, setLanguagesIsVisible] = useState(true)
  const toggleLanguages = useCallback(() => setLanguagesIsVisible(v => !v), [])
  const hideLanguages = useCallback(() => setLanguagesIsVisible(false), [])

  return (
    <ClickOutside onClickOutside={hideLanguages}>
      <div className="relative flex items-center self-stretch py-2">
        <button type="button" onClick={toggleLanguages}>
          <LanguageFilled className="h-5" />
        </button>

        {languagesIsVisible ? (
          <Menu className="right-[calc(1px_-_12px)]">
            {Lang.values.map(l => (
              <LangButton key={l} l={l} />
            ))}
          </Menu>
        ) : null}
      </div>
    </ClickOutside>
  )
}

type LangButtonProps = {
  l: Lang
}

const LangButton: React.FC<LangButtonProps> = ({ l }) => {
  const { lang, setLang } = useTranslation()

  const handleClick = useCallback(() => setLang(l), [l, setLang])

  const isSelected = Lang.Eq.equals(l, lang)

  return (
    <button
      type="button"
      disabled={isSelected}
      onClick={handleClick}
      className={cx(
        'grid grid-cols-[1fr_auto] gap-3.5 border-b py-0.5 text-start',
        isSelected ? 'border-goldenrod-bis' : 'border-transparent',
      )}
    >
      <span>{TranslationUtils.labels.lang[l]}</span>
      <span>{langEmoji[l]}</span>
    </button>
  )
}

const langEmoji: Dict<Lang, React.ReactNode> = {
  en_GB: <EmojiFlagGb />,
  fr_FR: <EmojiFlagFr />,
}
