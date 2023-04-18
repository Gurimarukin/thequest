import { predicate } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import React from 'react'

import { ChampionKey } from '../../shared/models/api/champion/ChampionKey'
import { Dict, List, Maybe } from '../../shared/utils/fp'

import { useStaticData } from '../contexts/StaticDataContext'

export const Aram = (): JSX.Element => {
  const { champions } = useStaticData()

  return (
    <div className="h-full w-full overflow-auto">
      <ul className="list-disc pl-8">
        {pipe(
          champions,
          List.filterMap(c =>
            pipe(
              c.aram.spells,
              Maybe.filter(predicate.not(Dict.isEmpty)),
              Maybe.map(spells => (
                <li key={ChampionKey.unwrap(c.key)}>
                  <span className="text-lg">{c.name}:</span>
                  <ul className="list-disc pl-8">
                    {pipe(
                      Object.entries(spells),
                      List.map(([spell, __html]) => (
                        <li key={spell}>
                          <span>{spell}:</span>
                          <div dangerouslySetInnerHTML={{ __html }} />
                        </li>
                      )),
                    )}
                  </ul>
                </li>
              )),
            ),
          ),
        )}
      </ul>
    </div>
  )
}
