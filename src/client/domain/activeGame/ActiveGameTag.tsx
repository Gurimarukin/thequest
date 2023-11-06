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
          'whitespace-nowrap rounded-b px-0.5 text-white shadow-even shadow-black saturate-[.7]',
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
  '-1': 'bg-[#cd4545]', // #e9422e // (poro colors)
  0: 'bg-[#cd8837]', // #fac552
  1: 'bg-[#149c3a]', // #3cbc8d
  2: 'bg-[#25acd6]', // #2796bc
}
