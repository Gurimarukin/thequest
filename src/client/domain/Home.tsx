import { useRef } from 'react'

import { Link } from '../components/Link'
import { MaskedImage } from '../components/MaskedImage'
import { MainLayout } from '../components/mainLayout/MainLayout'
import { Tooltip } from '../components/tooltip/Tooltip'
import { Assets } from '../imgs/Assets'
import { HowlingAbyssSimple } from '../imgs/svgs/HowlingAbyss'
import { appRoutes } from '../router/AppRouter'

export const Home: React.FC = () => (
  <MainLayout>
    <div className="grid h-full grid-rows-[1fr_auto] justify-center gap-3 p-3">
      <h1 className="self-center font-mono text-2xl">La Quête.</h1>

      <div className="flex flex-wrap justify-between gap-12 py-6">
        <HighlightLink to={appRoutes.aram({})} tooltip="Équilibrages spécifiques">
          <HowlingAbyssSimple className="w-8" />
          <span>ARAM</span>
        </HighlightLink>

        <HighlightLink to={appRoutes.factions({})} tooltip="Défis “Globe-trotteur”">
          <MaskedImage src={Assets.runeterra} className="h-8 w-8" />
          <span>Factions</span>
        </HighlightLink>
      </div>
    </div>
  </MainLayout>
)

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
      {tooltip !== undefined ? (
        <Tooltip hoverRef={ref} placement="top">
          {tooltip}
        </Tooltip>
      ) : null}
    </>
  )
}
