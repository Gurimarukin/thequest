import { pipe } from 'fp-ts/function'
import * as luainjs from 'lua-in-js'

import { Either, Future, Try } from '../../../shared/utils/fp'
import { decodeError } from '../../../shared/utils/ioTsUtils'

import { DomHandler } from '../../helpers/DomHandler'
import type { HttpClient } from '../../helpers/HttpClient'
import { WikiaChampionsData } from '../../models/wikia/WikiaChampionsData'

const championDataUrl = 'https://leagueoflegends.fandom.com/wiki/Module:ChampionData/data'

const mwCodeClassName = '.mw-code'

export const getFetchWikiaChampionData = (httpClient: HttpClient): Future<WikiaChampionsData> =>
  pipe(
    httpClient.text([championDataUrl, 'get']),
    Future.chainEitherK(DomHandler.of),
    Future.chainEitherK(domHandler =>
      pipe(
        domHandler.window.document,
        DomHandler.querySelectorEnsureOne(mwCodeClassName),
        Either.mapLeft(toErrorWithUrl(championDataUrl)),
      ),
    ),
    Future.map(mwCode => mwCode.textContent),
    Future.chainEitherK(
      Try.fromNullable(
        Error(`[${championDataUrl}] empty text content for selector: ${mwCodeClassName}`),
      ),
    ),
    Future.map(str => luainjs.createEnv().parse(str).exec()),
    Future.chainEitherK(u =>
      pipe(
        WikiaChampionsData.decoder.decode(u),
        Either.mapLeft(decodeError('WikiaChampionsData')(u)),
      ),
    ),
  )

const toErrorWithUrl =
  (url: string) =>
  (e: string): Error =>
    Error(`[${url}] ${e}`)
