import { cx } from '../../utils/cx'
import type { SVGIcon } from './SVGIcon'

const baseClassName = 'h-[1em] inline'

export const EmojiFlagFr: SVGIcon = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 72 72"
    className={cx(baseClassName, className)}
  >
    <rect x="5" y="17" width="62" height="38" fill="#fff" />
    <rect x="5" y="17" width="21" height="38" fill="#1e50a0" />
    <rect x="46" y="17" width="21" height="38" fill="#d22f27" />
    <rect
      x="5"
      y="17"
      width="62"
      height="38"
      fill="none"
      stroke="#000"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    />
  </svg>
)

export const EmojiFlagGb: SVGIcon = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 72 72"
    className={cx(baseClassName, className)}
  >
    <rect x="5" y="17" width="62" height="38" fill="#1e50a0" />
    <polygon fill="#fff" points="40 28.856 40 32 50.181 32 67 21.691 67 17 59.346 17 40 28.856" />
    <polygon
      fill="#d22f27"
      points="67 17 67 17 63.173 17 40 31.203 40 32 43.482 32 67 17.586 67 17"
    />
    <polygon
      fill="#fff"
      points="59.347 55 67 55 67 55 67 50.308 50.182 40 40 40 40 43.143 59.347 55"
    />
    <polygon fill="#d22f27" points="67 55 67 52.653 46.355 40 41.568 40 66.042 55 67 55 67 55" />
    <polygon fill="#fff" points="32 43.144 32 40 21.819 40 5 50.309 5 55 12.654 55 32 43.144" />
    <polygon fill="#d22f27" points="5 55 5 55 8.827 55 32 40.797 32 40 28.518 40 5 54.414 5 55" />
    <polygon
      fill="#fff"
      points="12.653 17 5 17 5 17 5 21.692 21.818 32 32 32 32 28.857 12.653 17"
    />
    <polygon fill="#d22f27" points="5 17 5 19.347 25.646 32 30.432 32 5.958 17 5 17 5 17" />
    <rect x="5" y="31" width="62" height="10" fill="#fff" />
    <rect x="31" y="17" width="10" height="38" fill="#fff" />
    <rect x="5" y="33" width="62" height="6" fill="#d22f27" />
    <rect x="33" y="17" width="6" height="38" fill="#d22f27" />
    <rect
      x="5"
      y="17"
      width="62"
      height="38"
      fill="none"
      stroke="#000"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    />
  </svg>
)

export const EmojiUpsideDown: SVGIcon = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="12 12 48 48"
    className={cx(baseClassName, className)}
  >
    <circle cx="36" cy="36" r="23" fill="#FCEA2B" />
    <circle
      cx="36"
      cy="36"
      r="23"
      fill="none"
      stroke="#000000"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    />
    <path
      fill="none"
      stroke="#000000"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M26.1851,27.0707 c2.8995-1.6362,6.2482-2.5699,9.8149-2.5699s6.9153,0.9336,9.8149,2.5699"
    />
    <path d="M42,41c0-1.6568,1.3448-3,3-3c1.6553,0,3,1.3433,3,3c0,1.6552-1.3447,3-3,3C43.3448,44,42,42.6552,42,41" />
    <path d="M24,41c0-1.6568,1.3447-3,3-3s3,1.3433,3,3c0,1.6552-1.3447,3-3,3S24,42.6552,24,41" />
  </svg>
)
