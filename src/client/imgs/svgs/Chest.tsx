import type { SVGIcon } from './SVGIcon'

// https://raw.communitydragon.org/pbe/plugins/rcp-fe-lol-static-assets/global/default/svg

export const Chest: SVGIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" className={className}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M15 16H1L0 15V1L1 0H15L16 1V15L15 16ZM10 5L8 3L6 5V7L8 9L10 7V5ZM14 2L12 4V8L8 12L4 8V4L2 2V14H14V2Z"
      fill="currentColor"
    />
  </svg>
)
