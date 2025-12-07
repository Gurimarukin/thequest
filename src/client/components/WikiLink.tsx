import { OpenInNew } from '../imgs/svgs/icons'

type Props = {
  href: string
}

export const WikiLink: React.FC<Props> = ({ href }) => (
  <span className="mt-24 flex items-center gap-2 self-center text-sm">
    <OpenInNew className="invisible size-3.5" /> {/* for hitbox */}
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="peer border-b border-b-wheat/50 transition-all duration-100 hover:border-b-goldenrod"
    >
      {href}
    </a>
    <OpenInNew className="invisible size-3.5 opacity-0 transition-all duration-100 peer-hover:visible peer-hover:opacity-100" />
  </span>
)
