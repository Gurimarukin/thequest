import { json } from 'fp-ts'
import { flow, pipe } from 'fp-ts/function'
import type { Decoder } from 'io-ts/Decoder'

import { AdditionalStaticData } from '../../shared/models/api/staticData/AdditionalStaticData'
import { StaticData } from '../../shared/models/api/staticData/StaticData'
import type { Puuid } from '../../shared/models/api/summoner/Puuid'
import type { Maybe, Tuple } from '../../shared/utils/fp'
import { Either, Future, List } from '../../shared/utils/fp'
import { futureMaybe } from '../../shared/utils/futureMaybe'
import { decodeError } from '../../shared/utils/ioTsUtils'

import type { MyFile } from '../models/FileOrDir'
import { Dir } from '../models/FileOrDir'
import type { LoggerGetter } from '../models/logger/LoggerGetter'
import { RiotCurrentLolGameInfo } from '../models/riot/currentGame/RiotCurrentLolGameInfo'
import { WikiaChampionData } from '../models/wikia/WikiaChampionData'
import { FsUtils } from '../utils/FsUtils'
import { unknownToError } from '../utils/unknownToError'

const mockDir = pipe(Dir.of(__dirname), Dir.joinDir('..', '..', '..', 'mock'))
const mock = {
  staticData: pipe(mockDir, Dir.joinFile('staticData.json')),
  additionalStaticData: pipe(mockDir, Dir.joinFile('additionalStaticData.json')),
  activeGames: {
    bySummoner: pipe(mockDir, Dir.joinDir('activeGames', 'bySummoner')),
  },
  wikia: {
    champions: pipe(mockDir, Dir.joinFile('wikia', 'champions.json')),
  },
}

type MockService = ReturnType<typeof MockService>

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const MockService = (Logger: LoggerGetter) => {
  const logger = Logger('RiotApiMockService')

  const staticData: Future<Maybe<StaticData>> = maybeFile([StaticData.codec, 'StaticData'])(
    () => mock.staticData,
  )()

  const additionalStaticData: Future<Maybe<AdditionalStaticData>> = maybeFile([
    AdditionalStaticData.codec,
    'AdditionalStaticData',
  ])(() => mock.additionalStaticData)()

  const activeGamesBySummoner: (puuid: Puuid) => Future<Maybe<RiotCurrentLolGameInfo>> = maybeFile([
    RiotCurrentLolGameInfo.decoder,
    'RiotCurrentGameInfo',
  ])((puuid: Puuid) => pipe(mock.activeGames.bySummoner, Dir.joinFile(`${puuid}.json`)))

  const wikiaChampions = maybeFile<List<WikiaChampionData>>([
    List.decoder(WikiaChampionData.decoder),
    'List<WikiaChampionData>',
  ])(() => mock.wikia.champions)()

  return {
    staticData,
    additionalStaticData,
    activeGames: {
      bySummoner: activeGamesBySummoner,
    },
    wikia: {
      champions: wikiaChampions,
    },
  }

  function maybeFile<A>([decoder, decoderName]: Tuple<Decoder<unknown, A>, string>): <
    Args extends List<unknown>,
  >(
    f: (...args: Args) => MyFile,
  ) => (...args: Args) => Future<Maybe<A>> {
    return f =>
      (...args) => {
        const file = f(...args)
        return pipe(
          file,
          FsUtils.exists,
          Future.chainFirstIOEitherK(jsonExists =>
            (jsonExists ? logger.info : logger.warn)(`${file.path} file found:`, jsonExists),
          ),
          futureMaybe.fromTaskEither,
          futureMaybe.filter(jsonExists => jsonExists),
          futureMaybe.chainTaskEitherK(() => FsUtils.readFile(file)),
          futureMaybe.chainEitherK(flow(json.parse, Either.mapLeft(unknownToError))),
          futureMaybe.chainEitherK(u =>
            pipe(decoder.decode(u), Either.mapLeft(decodeError(decoderName)(u))),
          ),
        )
      }
  }
}

export { MockService }
