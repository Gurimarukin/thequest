import type { OverrideProperties } from 'type-fest'

import { cx } from '../utils/cx'

type Props = OverrideProperties<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  {
    type: Exclude<React.ButtonHTMLAttributes<HTMLButtonElement>['type'], undefined>
  }
>

const getButton =
  (baseClassName: string): React.FC<Props> =>
  ({ type, className, children, ...props }) => (
    <button
      {...props}
      // eslint-disable-next-line react/button-has-type
      type={type}
      className={cx('disabled:opacity-25', baseClassName, className)}
    >
      {children}
    </button>
  )

export const ButtonPrimary = getButton('bg-goldenrod py-1 px-4 text-black hover:bg-goldenrod/75')

export const ButtonSecondary = getButton(
  'border border-goldenrod bg-black py-1 px-4 hover:bg-goldenrod/75 hover:text-black',
)
