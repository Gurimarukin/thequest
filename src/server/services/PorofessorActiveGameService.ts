import { flow, pipe } from 'fp-ts/function'

import { DayJs } from '../../shared/models/DayJs'
import type { MsDuration } from '../../shared/models/MsDuration'
import { ValidatedNea } from '../../shared/models/ValidatedNea'
import { Platform } from '../../shared/models/api/Platform'
import type { TeamId } from '../../shared/models/api/activeGame/TeamId'
import { TObservable } from '../../shared/models/rx/TObservable'
import { StringUtils } from '../../shared/utils/StringUtils'
import type { Dict } from '../../shared/utils/fp'
import {
  Either,
  Future,
  IO,
  List,
  Maybe,
  NonEmptyArray,
  NotUsed,
  Try,
  toNotUsed,
} from '../../shared/utils/fp'
import { futureMaybe } from '../../shared/utils/futureMaybe'
import { NumberFromString } from '../../shared/utils/ioTsUtils'

import { DomHandler } from '../helpers/DomHandler'
import type { HttpClient } from '../helpers/HttpClient'
import type { PorofessorActiveGame } from '../models/activeGame/PorofessorActiveGame'
import type { PorofessorActiveGameDb } from '../models/activeGame/PorofessorActiveGameDb'
import type { CronJobEvent } from '../models/event/CronJobEvent'
import type { LoggerGetter } from '../models/logger/LoggerGetter'
import type { GameId } from '../models/riot/GameId'
import type { PorofessorActiveGamePersistence } from '../persistence/PorofessorActiveGamePersistence'
import { getOnError } from '../utils/getOnError'

type PorofessorActiveGameService = ReturnType<typeof of>

const PorofessorActiveGameService = (
  cacheTtl: MsDuration,
  Logger: LoggerGetter,
  porofessorActiveGamePersistence: PorofessorActiveGamePersistence,
  httpClient: HttpClient,
  cronJobObservable: TObservable<CronJobEvent>,
): IO<PorofessorActiveGameService> => {
  const logger = Logger('SummonerService')

  return pipe(
    cronJobObservable,
    TObservable.subscribe(getOnError(logger))({
      next: ({ date }) =>
        pipe(
          porofessorActiveGamePersistence.deleteBeforeDate(pipe(date, DayJs.subtract(cacheTtl))),
          Future.map(toNotUsed),
        ),
    }),
    IO.map(() => of(porofessorActiveGamePersistence, httpClient)),
  )
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const of = (
  porofessorActiveGamePersistence: PorofessorActiveGamePersistence,
  httpClient: HttpClient,
) => {
  return {
    find: (
      gameId: GameId,
      platform: Platform,
      summonerName: string,
    ): Future<Maybe<PorofessorActiveGame>> =>
      pipe(
        porofessorActiveGamePersistence.findById(gameId),
        futureMaybe.alt<PorofessorActiveGame>(() =>
          pipe(
            fetch(platform, summonerName),
            futureMaybe.bindTo('game'),
            futureMaybe.bind('insertedAt', () => futureMaybe.fromIO(DayJs.now)),
            futureMaybe.map(
              ({ game, insertedAt }): PorofessorActiveGameDb => ({
                ...game,
                insertedAt,
              }),
            ),
            futureMaybe.chainFirstTaskEitherK(porofessorActiveGamePersistence.upsert),
          ),
        ),
      ),
  }

  function fetch(platform: Platform, summonerName: string): Future<Maybe<PorofessorActiveGame>> {
    const res = pipe(
      httpClient.text([
        `https://porofessor.gg/partial/live-partial/${Platform.encoderLower.encode(
          platform,
        )}/${summonerName}`,
        'get',
      ]),
    )
    return Future.todo()
  }
}

export { PorofessorActiveGameService }

const validation = ValidatedNea.getValidation<string>()
const seqS = ValidatedNea.getSeqS<string>()

// PorofessorActiveGame
export const parsePorofessorActiveGame = (html: string): Try<Maybe<unknown>> => {
  if (html.includes('The summoner is not in-game') || html.includes('Summoner not found')) {
    return Try.success(Maybe.none)
  }
  return pipe(html, DomHandler.of(), Try.map(parsePorofessorActiveGameBis), Try.map(Maybe.some))
}

const cardsListClass = 'div.site-content > ul.cards-list'
const summonernameKey = 'summonername'

const parsePorofessorActiveGameBis = (domHandler: DomHandler): ValidatedNea<string, unknown> => {
  const { window } = domHandler

  return seqS({
    teams: parseTeams(),
  })

  function parseTeams(): ValidatedNea<string, Dict<`${TeamId}`, List<Participant>>> {
    return pipe(
      window.document,
      DomHandler.querySelectorAll(cardsListClass, window.Element),
      ValidatedNea.chain(([team100, team200, ...remain]) =>
        seqS<
          Dict<`${TeamId}`, List<Participant>> & {
            _: NotUsed
          }
        >({
          100: parseTeam(100, team100),
          200: parseTeam(200, team200),
          _: List.isEmpty(remain)
            ? ValidatedNea.valid(NotUsed)
            : ValidatedNea.invalid([`Got more than 2 teams ${cardsListClass}`]),
        }),
      ),
    )
  }

  function parseTeam(
    teamId: TeamId,
    elt: Element | undefined,
  ): ValidatedNea<string, List<Participant>> {
    if (elt === undefined) return ValidatedNea.invalid([`Team ${teamId} not found`])

    return pipe(
      elt,
      DomHandler.querySelectorAll(`:scope > li > div`, window.HTMLElement),
      ValidatedNea.chain(List.traverseWithIndex(validation)(parseParticipant(teamId))),
    )
  }

  type Participant = {
    premadeId: Maybe<number>
    summonerName: string
    summonerLevel: number
    champion: Maybe<Champion>
    leagues: {
      soloDuo: Maybe<League>
      flex: Maybe<League>
    }
  }

  type Champion = {
    percents: number
    played: number
    kills: number
    deaths: number
    assists: number
  }

  type League = unknown

  function parseParticipant(
    teamId: TeamId,
  ): (i: number, elt: HTMLElement) => ValidatedNea<string, Participant> {
    return (i, elt) => {
      const ePrefix = `Team ${teamId}[${i}]: `
      const summonerName = elt.dataset[summonernameKey]
      return seqS<Participant>({
        premadeId: pipe(
          elt.querySelector('.premadeHistoryTagContainer > div'),
          Maybe.fromNullable,
          Maybe.chainNullableK(e => e.textContent),
          Maybe.fold(
            () => ValidatedNea.valid(Maybe.none),
            flow(numberFromString(`${ePrefix}premade history`), ValidatedNea.map(Maybe.some)),
          ),
        ),
        summonerName:
          summonerName === undefined
            ? ValidatedNea.invalid([`${ePrefix}data-${summonernameKey} not found`])
            : ValidatedNea.valid(summonerName),
        summonerLevel: pipe(
          elt,
          domHandler.querySelectorEnsureOneTextContent('.championBox .level'),
          ValidatedNea.fromEither,
          ValidatedNea.chain(numberFromString(`${ePrefix}summoner level`)),
        ),
        champion: pipe(
          elt,
          domHandler.querySelectorEnsureOneTextContent('.championBox > .imgFlex > .txt > .title'),
          ValidatedNea.fromEither,
          ValidatedNea.chain(str =>
            str === '0 Played'
              ? ValidatedNea.valid(Maybe.none)
              : pipe(
                  seqS({
                    champion: parseChampionWinrate(str),
                    kills: parseKda(elt, 'kills'),
                    deaths: parseKda(elt, 'deaths'),
                    assists: parseKda(elt, 'assists'),
                  }),
                  ValidatedNea.map(({ champion, ...rest }) => Maybe.some({ ...champion, ...rest })),
                ),
          ),
        ),
        leagues: seqS({
          soloDuo: ValidatedNea.valid(Maybe.none),
          flex: ValidatedNea.valid(Maybe.none),
        }),
      })
    }
  }

  function parseKda(elt: Element, className: string): ValidatedNea<string, number> {
    return pipe(
      elt,
      domHandler.querySelectorEnsureOneTextContent(
        `.championBox > .imgFlex > .txt > .content .${className}`,
      ),
      ValidatedNea.fromEither,
      ValidatedNea.chain(numberFromString('')),
    )
  }
}

type ChampionWinrate = {
  percents: number
  played: number
}

// 46% Win (39 Played)
const championWinrateRegex = /^(\d+)% Win \((\d+) Played\)$/
const parseChampionWinrate = (str: string): ValidatedNea<string, ChampionWinrate> =>
  pipe(
    str,
    StringUtils.matcher2(championWinrateRegex),
    ValidatedNea.fromOption(() => `${str} didn't match championWinrateRegex`),
    ValidatedNea.chain(([percents, played]) =>
      seqS<ChampionWinrate>({
        percents: numberFromString('')(percents),
        played: numberFromString('')(played),
      }),
    ),
  )

const numberFromString =
  (prefix: string) =>
  (str: string): ValidatedNea<string, number> =>
    pipe(
      NumberFromString.decoder.decode(str),
      Either.mapLeft(() => NonEmptyArray.of(`${prefix} - expected number from string got: ${str}`)),
    )
