import { task } from 'fp-ts'
import { flow, pipe } from 'fp-ts/function'
import type { Decoder } from 'io-ts/Decoder'
import * as D from 'io-ts/Decoder'
import util from 'util'
import * as xml2js from 'xml2js'

import { MsDuration } from '../../../../src/shared/models/MsDuration'
import { Either, Future } from '../../../../src/shared/utils/fp'
import { decodeError } from '../../../../src/shared/utils/ioTsUtils'

import { HttpClient } from '../../../../src/server/helpers/HttpClient'
import { LoggerGetter } from '../../../../src/server/models/logger/LoggerGetter'

import { expectT } from '../../../expectT'

describe('toto', () => {
  const httpClient = HttpClient(LoggerGetter('trace'))

  // it.only('should decode', () => {
  //   const data = {
  //     root: {
  //       _: '\n[[Category:Templates]]',
  //       ignore: ['<includeonly>...</includeonly>', '<noinclude>', '</noinclude>'],
  //       template: [{ title: ['doc'] }],
  //     },
  //   }

  //   expectT(
  //     pipe(parseTreeXMLDecoder.decode(data), Either.mapLeft(decodeError('ParseTreeXML')(data))),
  //   ).toStrictEqual(Either.left(Error()))
  // })

  it(
    'should toto',
    () => {
      const future = pipe(
        httpClient.http(
          ['https://leagueoflegends.fandom.com/api.php', 'get'],
          {
            searchParams: {
              action: 'parse',
              format: 'json',
              prop: 'parsetree',
              // page: 'Template:Map changes/data/aram',
              pageid: 1399551,
            },
          },
          [aramChangesPageParseTreeResultDecoder, 'AramChangesPageParseTreeResult'],
        ),
        Future.chain(a =>
          pipe(
            a.parse.parsetree['*'],
            parseXML(aramChangesPageParseTreeXMLDecoder, 'AramChangesPageParseTreeXML'),
          ),
        ),
        Future.chain(a =>
          pipe(a.root.ignore[0], parseXML(includeOnlyXMLDecoder, 'IncludeOnlyXML')),
        ),
        Future.chain(a =>
          httpClient.http(['https://leagueoflegends.fandom.com/api.php', 'post'], {
            searchParams: {
              action: 'parse',
              format: 'json',
              prop: 'parsetree',
            },
            body: a.includeonly,
            headers: {
              'Content-Type': 'text/plain',
            },
          }),
        ),
        Future.map(JSON.stringify),
        task.map(res => {
          // console.log('res =', JSON.stringify(res))
          console.log('res =', util.inspect(res, { depth: Infinity }))
          expectT(2).toStrictEqual(3)
        }),
      )

      return future()
    },
    MsDuration.unwrap(MsDuration.minute(1)),
  )
})

const parseXML =
  <A>(decoder: Decoder<unknown, A>, decoderName: string) =>
  (xml: string): Future<A> =>
    pipe(
      Future.tryCatch<unknown>(() => xml2js.parseStringPromise(xml)),
      Future.map(flow(JSON.stringify, JSON.parse)),
      Future.chainEitherK(u =>
        pipe(decoder.decode(u), Either.mapLeft(decodeError(decoderName)(u))),
      ),
    )

const aramChangesPageParseTreeResultDecoder = D.struct({
  parse: D.struct({
    parsetree: D.struct({
      '*': D.string,
    }),
  }),
})

const aramChangesPageParseTreeXMLDecoder = D.struct({
  root: D.struct({
    ignore: D.tuple(D.string),
  }),
})

const includeOnlyXMLDecoder = D.struct({
  includeonly: D.string,
})

const includeOnlyParseTreeDecoder = D.struct({})
