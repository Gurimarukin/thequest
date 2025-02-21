import type { Except } from 'type-fest'

export type SVGIcon = React.FC<SVGIconProps>

export type SVGIconProps = Except<React.SVGProps<SVGSVGElement>, 'children'>
