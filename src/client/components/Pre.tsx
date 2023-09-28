import { cx } from '../utils/cx'

export const Pre: React.FC<React.HTMLAttributes<HTMLSpanElement>> = ({
  className,
  children,
  ...props
}) => (
  <span className={cx('font-lib-mono', className)} {...props}>
    {children}
  </span>
)
