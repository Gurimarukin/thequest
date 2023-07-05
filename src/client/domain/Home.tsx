import { useRef } from 'react'

import { Link } from '../components/Link'
import { MaskedImage } from '../components/MaskedImage'
import { MainLayout } from '../components/mainLayout/MainLayout'
import { Tooltip } from '../components/tooltip/Tooltip'
import { useTranslation } from '../contexts/TranslationContext'
import { Assets } from '../imgs/Assets'
import { HowlingAbyssSimple } from '../imgs/svgs/HowlingAbyss'
import { appRoutes } from '../router/AppRouter'

export const Home: React.FC = () => {
  const { t } = useTranslation('home')
  return (
    <MainLayout>
      <div className="grid h-full grid-rows-[1fr_1fr_auto] justify-center gap-3 p-3">
        <h1 className="self-end justify-self-center font-mono text-2xl">{t.theQuest}</h1>

        <div className="flex flex-wrap justify-between gap-12 self-center justify-self-center py-6">
          <HighlightLink to={appRoutes.aram({})} tooltip={t.specificBalanceChanges}>
            <HowlingAbyssSimple className="w-8" />
            <span>{t.aram}</span>
          </HighlightLink>

          <HighlightLink to={appRoutes.factions({})} tooltip={t.globetrotterChallenges}>
            <MaskedImage src={Assets.runeterra} className="h-8 w-8" />
            <span>{t.factions}</span>
          </HighlightLink>
        </div>

        <p className="text-2xs">{t.isntEndorsed}</p>
      </div>
    </MainLayout>
  )
}

type HighlightLinkProps = {
  to: string
  tooltip: React.ReactNode
  children?: React.ReactNode
}

const HighlightLink: React.FC<HighlightLinkProps> = ({ to, tooltip, children }) => {
  const ref = useRef<HTMLAnchorElement>(null)

  return (
    <>
      <Link ref={ref} to={to} className="flex flex-col items-center gap-3 text-sm">
        {children}
      </Link>
      {tooltip !== undefined ? <Tooltip hoverRef={ref}>{tooltip}</Tooltip> : null}
    </>
  )
}
