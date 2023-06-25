import { cx } from '../utils/cx'

type Props = {
  src: string
  className?: string
}

export const MaskedImage: React.FC<Props> = ({ src, className }) => (
  <span
    className={cx('bg-current', className)}
    style={{
      maskImage: `url(${src})`,
      WebkitMaskImage: `url(${src})`,
      maskSize: '100% 100%, contain',
      WebkitMaskSize: '100% 100%, contain',
    }}
  />
)
