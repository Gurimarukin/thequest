import { separated } from 'fp-ts'
import { flow, pipe } from 'fp-ts/function'
import * as luainjs from 'lua-in-js'

import type { LoggerType } from '../../../shared/models/logger/LoggerType'
import { DictUtils } from '../../../shared/utils/DictUtils'
import { IO, List } from '../../../shared/utils/fp'
import { Either, Future, Try } from '../../../shared/utils/fp'
import { decodeError, decodeErrorString } from '../../../shared/utils/ioTsUtils'

import { constants } from '../../config/constants'
import { DomHandler } from '../../helpers/DomHandler'
import type { HttpClient } from '../../helpers/HttpClient'
import { RawWikiaChampionsData } from '../../models/wikia/RawWikiaChampionsData'
import { WikiaChampionData } from '../../models/wikia/WikiaChampionData'
import { RawWikiaChampionData } from '../../models/wikia/WikiaChampionData'

const championDataUrl = `${constants.lolWikiaDomain}/wiki/Module:ChampionData/data`

const mwCodeClassName = '.mw-code'

export const getFetchWikiaChampionsData = (
  logger: LoggerType,
  httpClient: HttpClient,
): Future<List<WikiaChampionData>> =>
  pipe(
    httpClient.text([championDataUrl, 'get']),
    Future.chainIOEitherK(wikiaChampionsDataFromHtml(logger)),
  )

// export for testing purpose
export const wikiaChampionsDataFromHtml =
  (logger: LoggerType) =>
  (html: string): IO<List<WikiaChampionData>> =>
    pipe(
      DomHandler.of()(html),
      Try.chain(domHandler =>
        pipe(
          domHandler.window.document.body,
          DomHandler.querySelectorEnsureOne(mwCodeClassName),
          Either.mapLeft(withUrlError),
        ),
      ),
      Try.chainNullableK(
        Error(`[${championDataUrl}] empty text content for selector: ${mwCodeClassName}`),
      )(mwCode => mwCode.textContent),
      Try.chain(str => Try.tryCatch(() => luainjs.createEnv().parse(str).exec())),
      // Future.chainEitherK(str => Try.tryCatch(() => luainjs.createEnv().parse(str).exec())),
      Try.chain(u =>
        pipe(
          RawWikiaChampionsData.decoder.decode(u),
          Either.mapLeft(decodeError('RawWikiaChampionsData')(u)),
        ),
      ),
      Try.map(
        flow(
          DictUtils.entries,
          List.partitionMap(([englishName, rawChampion]) =>
            pipe(
              RawWikiaChampionData.decoder.decode(rawChampion),
              Either.bimap(
                decodeErrorString(`RawWikiaChampionData (${JSON.stringify(englishName)})`)(
                  rawChampion,
                ),
                WikiaChampionData.fromRaw(englishName),
              ),
            ),
          ),
        ),
      ),
      IO.fromEither,
      IO.chainFirst(({ left: errors }) =>
        List.isNonEmpty(errors)
          ? logger.warn(pipe(errors, List.mkString('\n', '\n', '')))
          : IO.notUsed,
      ),
      IO.map(separated.right),
    )

const withUrlError = (e: string): Error => Error(`[${championDataUrl}] ${e}`)
