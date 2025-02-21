import { separated } from 'fp-ts'
import { flow, pipe } from 'fp-ts/function'
import * as luainjs from 'lua-in-js'

import type { LoggerType } from '../../../shared/models/logger/LoggerType'
import { DictUtils } from '../../../shared/utils/DictUtils'
import { Either, Future, IO, List, Try } from '../../../shared/utils/fp'
import { decodeError, decodeErrorString } from '../../../shared/utils/ioTsUtils'

import { constants } from '../../config/constants'
import { DomHandler } from '../../helpers/DomHandler'
import type { HttpClient } from '../../helpers/HttpClient'
import { RawWikiChampionsData } from '../../models/wiki/RawWikiChampionsData'
import { RawWikiChampionData, WikiChampionData } from '../../models/wiki/WikiChampionData'

const championDataUrl = `${constants.lolWikiDomain}/en-us/Module:ChampionData/data`

const mwCodeClassName = '.mw-code'

export const fetchWikiChampionsData = (
  logger: LoggerType,
  httpClient: HttpClient,
): Future<List<WikiChampionData>> =>
  pipe(
    httpClient.text([championDataUrl, 'get']),
    Future.chainIOEitherK(wikiChampionsDataFromHtml(logger)),
  )

// export for testing purpose
export const wikiChampionsDataFromHtml =
  (logger: LoggerType) =>
  (html: string): IO<List<WikiChampionData>> =>
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
      Try.chain(u =>
        pipe(
          RawWikiChampionsData.decoder.decode(u),
          Either.mapLeft(decodeError('RawWikiChampionsData')(u)),
        ),
      ),
      Try.map(
        flow(
          DictUtils.entries,
          List.partitionMap(([englishName, rawChampion]) =>
            pipe(
              RawWikiChampionData.decoder.decode(rawChampion),
              Either.bimap(
                decodeErrorString(`RawWikiChampionData (${JSON.stringify(englishName)})`)(
                  rawChampion,
                ),
                WikiChampionData.fromRaw(englishName),
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
