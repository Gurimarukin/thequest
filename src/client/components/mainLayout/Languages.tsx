import { useCallback, useState } from 'react'

import { Lang } from '../../../shared/models/api/Lang'
import type { Dict } from '../../../shared/utils/fp'

import { useTranslation } from '../../contexts/TranslationContext'
import { EmojiFlagFr, EmojiFlagGb } from '../../imgs/svgs/emojis'
import { LanguageOutline } from '../../imgs/svgs/icons'
import { TranslationUtils } from '../../utils/TranslationUtils'
import { cx } from '../../utils/cx'
import { ClickOutside } from '../ClickOutside'

export const Languages: React.FC = () => {
  const [languagesIsVisible, setLanguagesIsVisible] = useState(false)
  const toggleLanguages = useCallback(() => setLanguagesIsVisible(v => !v), [])
  const hideLanguages = useCallback(() => setLanguagesIsVisible(false), [])

  return (
    <ClickOutside onClickOutside={hideLanguages}>
      <div className="relative flex items-center self-stretch py-2">
        <button type="button" onClick={toggleLanguages}>
          <LanguageOutline className="h-5" />
        </button>

        {languagesIsVisible ? (
          <div className="absolute right-[calc(1px_-_0.75rem)] top-full z-10 flex flex-col border border-goldenrod bg-zinc-900">
            {Lang.values.map(l => (
              <LangButton key={l} l={l} />
            ))}
          </div>
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
      className={cx('group flex items-center justify-between gap-3.5 py-1.5 pl-4 pr-2', {
        'bg-zinc-700': isSelected,
      })}
    >
      <span
        className={cx('border-y border-y-transparent leading-4', {
          'group-hover:border-b-goldenrod': !isSelected,
        })}
      >
        {TranslationUtils.labels.lang[l]}
      </span>
      <span className="flex">{langEmoji[l]}</span>
    </button>
  )
}

const langEmoji: Dict<Lang, React.ReactNode> = {
  en_GB: <EmojiFlagGb className="!h-6" />,
  fr_FR: <EmojiFlagFr className="!h-6" />,
}
