import { random } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { createRoot } from 'react-dom/client'
import useSWR from 'swr'

import { ChallengesView } from '../src/shared/models/api/challenges/ChallengesView'
import { ChampionKey } from '../src/shared/models/api/champion/ChampionKey'
import { ChampionLevel } from '../src/shared/models/api/champion/ChampionLevel'
import { Dict, List, Maybe } from '../src/shared/utils/fp'

import { MasteryImg } from '../src/client/components/MasteryImg'
import { HistoryContextProvider } from '../src/client/contexts/HistoryContext'
import { StaticDataContextProvider } from '../src/client/contexts/StaticDataContext'
import { ToasterContextProvider } from '../src/client/contexts/ToasterContext'
import { TranslationContextProvider } from '../src/client/contexts/TranslationContext'
import { UserContextProvider } from '../src/client/contexts/UserContext'
import type { EnrichedChampionMastery } from '../src/client/domain/summonerMasteries/EnrichedChampionMastery'
import { Masteries } from '../src/client/domain/summonerMasteries/Masteries'
import { SparkSolid } from '../src/client/imgs/svgs/icons'

const UIBook: React.FC = () => {
  const challenges = useSWR('challenges', () =>
    Promise.resolve<ChallengesView>(
      pipe(
        ChallengesView.id,
        Dict.map(() => Maybe.none),
      ),
    ),
  )

  return (
    <div className="flex h-screen w-screen flex-col gap-16 overflow-auto p-4">
      <div className="self-center">
        <Masteries
          challenges={challenges}
          masteries={pipe(
            ChampionLevel.values,
            List.reverse,
            List.mapWithIndex(championMastery),
            List.prepend({
              ...championMastery(11, 99),
              championPointsSinceLastLevel: -100,
              championPointsUntilNextLevel: 200,
            }),
            List.prepend({
              ...championMastery(12, 999),
              championPointsSinceLastLevel: 0,
            }),
            List.prepend({
              ...championMastery(13, 9999),
              championPointsUntilNextLevel: 0,
            }),
          )}
          setChampionShards={{
            isLoading: false,
            run: () => () => undefined,
          }}
        />
      </div>

      <ul className="flex flex-wrap gap-4">
        {ChampionLevel.values.map(level => (
          <li key={level} className="flex outline outline-1 outline-white">
            <MasteryImg level={level} className="max-h-64 max-w-64" />
          </li>
        ))}
      </ul>

      <div className="flex gap-4">
        <div className="outline outline-1 outline-white">
          <SparkSolid className="h-64" />
        </div>
      </div>
    </div>
  )
}

function championMastery(i: number, championLevel: number): EnrichedChampionMastery {
  const tokensEarned = random.randomInt(0, 2)()

  return {
    championId: ChampionKey(i + 1),
    championLevel,
    championPoints: championLevel === 0 ? 0 : 1000,
    championPointsSinceLastLevel: championLevel === 0 ? 0 : 100,
    championPointsUntilNextLevel: 100,
    tokensEarned,
    markRequiredForNextLevel: tokensEarned === 2 ? 2 : random.randomInt(tokensEarned, 2)(),
    name: `Champion ${i + 1}`,
    percents: championLevel,
    shardsCount: Maybe.none,
    glow: false,
    positions: [],
    factions: [],
    aram: {
      category: 'balanced',
      data: { stats: Maybe.none, skills: Maybe.none },
    },
    urf: {
      category: 'buffed',
      data: { stats: Maybe.some({ dmg_dealt: 1.1 }), skills: Maybe.none },
    },
    faction: 'bandle',
    isHidden: false,
  }
}

// render

const rootEltId = 'root'
const rootElt = document.getElementById(rootEltId)

if (rootElt === null) {
  // eslint-disable-next-line functional/no-throw-statements
  throw Error(`root element not found: #${rootEltId}`)
}

const root = createRoot(rootElt)

// eslint-disable-next-line functional/no-expression-statements
root.render(
  <TranslationContextProvider>
    <ToasterContextProvider>
      <HistoryContextProvider>
        <UserContextProvider>
          <StaticDataContextProvider>
            <UIBook />
          </StaticDataContextProvider>
        </UserContextProvider>
      </HistoryContextProvider>
    </ToasterContextProvider>
  </TranslationContextProvider>,
)
