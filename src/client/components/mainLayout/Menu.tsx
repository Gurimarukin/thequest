import { cx } from '../../utils/cx'

type Props = {
  className?: string
  children?: React.ReactNode
}

export const Menu: React.FC<Props> = ({ className, children }) => (
  <div
    className={cx(
      'absolute right-0 top-full z-10 flex flex-col gap-3 border border-goldenrod bg-zinc-900 px-5 py-4',
      className,
    )}
  >
    {children}
  </div>
)
