import { identity, pipe } from 'fp-ts/function'
import { forwardRef, useCallback } from 'react'

import { GameName } from '../../../../shared/models/riot/GameName'
import { RiotId } from '../../../../shared/models/riot/RiotId'
import { TagLine } from '../../../../shared/models/riot/TagLine'
import { Either } from '../../../../shared/utils/fp'

import { useTranslation } from '../../../contexts/TranslationContext'
import { cx } from '../../../utils/cx'

type Props = {
  summoner: Either<string, RiotId>
  setSummoner: React.Dispatch<React.SetStateAction<Either<string, RiotId>>>
  handleFocus: React.FocusEventHandler<HTMLInputElement>
}

export const SearchSummonerInput = forwardRef<HTMLDivElement, Props>(
  ({ summoner, setSummoner, handleFocus }, ref) => {
    const { t } = useTranslation('common')

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) =>
        setSummoner(
          pipe(
            RiotId.fromStringDecoder.decode(e.target.value),
            Either.mapLeft(() => e.target.value),
          ),
        ),
      [setSummoner],
    )

    const summonerRaw = pipe(summoner, Either.fold(identity, RiotId.stringify))

    return (
      <div ref={ref} className="grid min-w-50 items-center area-1">
        <div className="w-full px-2 area-1">
          {pipe(
            summoner,
            Either.fold(
              name => <span>{name}</span>,
              ({ gameName, tagLine }) => (
                <>
                  <span className="text-goldenrod">{GameName.unwrap(gameName)}</span>
                  <span className="text-grey-500">#{TagLine.unwrap(tagLine)}</span>
                </>
              ),
            ),
          )}
        </div>
        <input
          type="text"
          value={summonerRaw}
          onChange={handleChange}
          onFocus={handleFocus}
          placeholder={t.layout.searchSummoner}
          className={cx('w-0 min-w-full bg-transparent px-2 text-wheat/0 caret-wheat area-1', {
            'font-normal': summonerRaw === '',
          })}
        />
      </div>
    )
  },
)
