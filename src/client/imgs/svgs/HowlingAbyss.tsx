import { type SVGIcon, secondaryColor } from './SVGIcon'

export const HowlingAbyss: SVGIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 91 91" className={className}>
    <g transform="translate(-5,-5)">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray="none"
        d="m 55.5,7.5 -6,6 h -8 l -6,6 h -16 v 16 l -6,6 v 8 L 7.5,55.5 V 93.5 H 45.5 l 6,-6 h 8 l 6,-6 h 16 v -16 l 6,-6 v -8 l 6,-6 V 7.5 Z"
      />
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeDasharray="none"
        d="M 55.5,7.5 43.5,19.5 H 19.5 V 43.5 L 7.5,55.5 V 93.5 H 45.5 L 57.5,81.5 H 81.5 V 57.5 L 93.5,45.5 V 7.5 Z"
      />
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="5"
        strokeDasharray="none"
        d="M 55.5,7.5 37.5,25.5 H 25.5 V 37.5 L 7.5,55.5 V 93.5 H 45.5 L 63.5,75.5 H 75.5 V 63.5 L 93.5,45.5 V 7.5 Z"
      />
      <path fill={secondaryColor} stroke="none" d="m 15.5,59.5 44,-44 h 26 v 26 l -44,44 h -26 z" />
    </g>
  </svg>
)

export const HowlingAbyssSimple: SVGIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" className={className}>
    <g transform="translate(-2.5,-2.5)">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="10"
        strokeDasharray="none"
        d="M 55.5,7.5 43.5,19.5 H 19.5 V 43.5 L 7.5,55.5 V 93.5 H 45.5 L 57.5,81.5 H 81.5 V 57.5 L 93.5,45.5 V 7.5 Z"
      />
      <path fill={secondaryColor} stroke="none" d="m 23.5,62.5 39,-39 h 15 v 15 l -39,39 h -15 z" />
    </g>
  </svg>
)
