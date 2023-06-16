import { json } from 'fp-ts'
import { flow, pipe } from 'fp-ts/function'

import type { Maybe } from '../../shared/utils/fp'
import { Either, Future } from '../../shared/utils/fp'
import { futureMaybe } from '../../shared/utils/futureMaybe'
import { decodeError } from '../../shared/utils/ioTsUtils'

import { Dir } from '../models/FileOrDir'
import type { LoggerGetter } from '../models/logger/LoggerGetter'
import { RiotCurrentGameInfo } from '../models/riot/currentGame/RiotCurrentGameInfo'
import type { SummonerId } from '../models/summoner/SummonerId'
import { FsUtils } from '../utils/FsUtils'
import { unknownToError } from '../utils/unknownToError'

const mockDir = pipe(Dir.of(__dirname), Dir.joinDir('..', '..', '..', 'mock'))
const mock = {
  activeGames: {
    bySummoner: pipe(mockDir, Dir.joinDir('activeGames', 'bySummoner')),
  },
}

type RiotApiMockService = ReturnType<typeof RiotApiMockService>

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const RiotApiMockService = (Logger: LoggerGetter) => {
  const logger = Logger('RiotApiMockService')

  return {
    activeGames: {
      bySummoner: (summonerId: SummonerId): Future<Maybe<RiotCurrentGameInfo>> => {
        const summonerIdJson = pipe(mock.activeGames.bySummoner, Dir.joinFile(`${summonerId}.json`))
        return pipe(
          summonerIdJson,
          FsUtils.exists,
          Future.chainFirstIOEitherK(jsonExists =>
            logger.info(`activeGames.bySummoner(${summonerId}) file found:`, jsonExists),
          ),
          futureMaybe.fromTaskEither,
          futureMaybe.filter(jsonExists => jsonExists),
          futureMaybe.chainTaskEitherK(() => FsUtils.readFile(summonerIdJson)),
          futureMaybe.chainEitherK(flow(json.parse, Either.mapLeft(unknownToError))),
          futureMaybe.chainEitherK(u =>
            pipe(
              RiotCurrentGameInfo.decoder.decode(u),
              Either.mapLeft(decodeError('RiotCurrentGameInfo')(u)),
            ),
          ),
        )
      },
    },
  }
}

export { RiotApiMockService }
