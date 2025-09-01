import { useRef } from 'react'

import type { PoroNiceness } from '../../../shared/models/api/activeGame/PoroNiceness'
import type { PoroTag } from '../../../shared/models/api/activeGame/PoroTag'
import type { Dict } from '../../../shared/utils/fp'

import { Tooltip } from '../../components/tooltip/Tooltip'
import { cx } from '../../utils/cx'

type Props = PoroTag

export const ActiveGameTag: React.FC<Props> = ({ niceness, label, tooltip }) => {
  const ref = useRef<HTMLLIElement>(null)
  return (
    <>
      <li
        ref={ref}
        className={cx(
          'whitespace-nowrap rounded-b px-0.5 text-white shadow-even shadow-black saturate-[0.7]',
          nicenessClassName[niceness],
        )}
      >
        {label}
      </li>
      <Tooltip hoverRef={ref} className="max-w-xs">
        <span dangerouslySetInnerHTML={{ __html: tooltip }} className="whitespace-normal" />
      </Tooltip>
    </>
  )
}

const nicenessClassName: Dict<`${PoroNiceness}`, string> = {
  '-1': 'bg-poro-red', // #e9422e // (poro colors)
  0: 'bg-poro-orange', // #fac552
  1: 'bg-poro-green', // #3cbc8d
  2: 'bg-poro-blue', // #2796bc
}
