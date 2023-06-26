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
    <div className="grid h-full grid-rows-[1fr_1fr_auto] justify-center gap-3 p-3">
      <h1 className="self-end justify-self-center font-mono text-2xl">La Quête.</h1>

      <div className="flex flex-wrap justify-between gap-12 self-center justify-self-center py-6">
        <HighlightLink to={appRoutes.aram({})} tooltip="Équilibrages spécifiques">
          <HowlingAbyssSimple className="w-8" />
          <span>ARAM</span>
        </HighlightLink>

        <HighlightLink to={appRoutes.factions({})} tooltip="Défis “Globe-trotteur”">
          <MaskedImage src={Assets.runeterra} className="h-8 w-8" />
          <span>Factions</span>
        </HighlightLink>
      </div>

      <p className="text-xs">
        La Quête isn’t endorsed by Riot Games and doesn’t reflect the views or opinions of Riot
        Games or anyone officially involved in producing or managing Riot Games properties. Riot
        Games, and all associated properties are trademarks or registered trademarks of Riot Games,
        Inc.
      </p>
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
