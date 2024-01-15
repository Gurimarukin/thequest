import { useRef } from 'react'

import { ChampionPosition } from '../../../shared/models/api/champion/ChampionPosition'

import { ChampionPositionImg } from '../../components/ChampionPositionImg'
import { Tooltip } from '../../components/tooltip/Tooltip'
import { useTranslation } from '../../contexts/TranslationContext'

// participant line 1 + participant line 2
const participantHeightWithoutSpacer = 98 + 16

// participant line 1 + participant line 2 + spacer
export const participantHeightMobile = participantHeightWithoutSpacer + 4
export const participantHeightDesktop = participantHeightWithoutSpacer + 16

type Props = {
  shouldWrap: boolean
  /**
   * @default 1
   */
  rowMultiple?: number
  iconClassName?: string
}

export const ActiveGamePositions: React.FC<Props> = ({
  shouldWrap,
  rowMultiple = 1,
  iconClassName,
}) => (
  <>
    {ChampionPosition.values.map((position, i) => {
      const isLast = i === ChampionPosition.values.length - 1
      return (
        <Span
          key={position}
          position={position}
          className={iconClassName}
          style={{
            height: shouldWrap
              ? undefined
              : isLast
                ? participantHeightWithoutSpacer
                : participantHeightDesktop,
            gridRowStart: rowMultiple * i + 1,
          }}
        />
      )
    })}
  </>
)

type SpanProps = {
  position: ChampionPosition
  className?: string
  style?: React.CSSProperties
}

const Span: React.FC<SpanProps> = ({ position, className, style }) => {
  const { t } = useTranslation('common')

  const ref = useRef<HTMLSpanElement>(null)

  return (
    <div className={className} style={style}>
      <span ref={ref}>
        <ChampionPositionImg position={position} className="h-5 w-5 text-grey-500" />
      </span>
      <Tooltip hoverRef={ref}>{t.labels.position[position]}</Tooltip>
    </div>
  )
}
