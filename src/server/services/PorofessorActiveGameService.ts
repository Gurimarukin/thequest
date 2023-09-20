import { apply } from 'fp-ts'
import { flow, pipe } from 'fp-ts/function'
import type { Literal } from 'io-ts/lib/Schemable'
import util from 'util'

import { DayJs } from '../../shared/models/DayJs'
import type { MsDuration } from '../../shared/models/MsDuration'
import { ValidatedNea } from '../../shared/models/ValidatedNea'
import { Platform } from '../../shared/models/api/Platform'
import type { TeamId } from '../../shared/models/api/activeGame/TeamId'
import type { ChampionPosition } from '../../shared/models/api/champion/ChampionPosition'
import { LeagueRank } from '../../shared/models/api/league/LeagueRank'
import { LeagueTier } from '../../shared/models/api/league/LeagueTier'
import { TObservable } from '../../shared/models/rx/TObservable'
import { StringUtils } from '../../shared/utils/StringUtils'
import { createEnum } from '../../shared/utils/createEnum'
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
  Tuple,
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

type Participant = {
  premadeId: Maybe<number>
  summonerName: string
  summonerLevel: number
  champion: Maybe<Champion>
  leagues: Leagues
  role: ChampionPosition
  mainRoles: List<ChampionPosition>
  tags: List<unknown>
}

type Champion = {
  percents: number
  played: number
  kills: number
  deaths: number
  assists: number
}

type Leagues = {
  soloDuo: Maybe<League>
  flex: Maybe<League>
}

type League = TierRank & {
  leaguePoints: number
  previousSeason: Maybe<TierRank>
}

type TierRank = {
  tier: LeagueTier
  rank: LeagueRank
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
    cardsList: Element | undefined,
  ): ValidatedNea<string, List<Participant>> {
    if (cardsList === undefined) return ValidatedNea.invalid([`Team ${teamId} not found`])

    return pipe(
      cardsList,
      DomHandler.querySelectorAll(`:scope > li > div`, window.HTMLElement),
      ValidatedNea.chain(List.traverseWithIndex(validation)(parseParticipant(teamId))),
    )
  }

  function parseParticipant(
    teamId: TeamId,
  ): (i: number, participant: HTMLElement) => ValidatedNea<string, Participant> {
    return (i, participant) => {
      const ePrefix = `Team ${teamId}[${i}]: `
      const summonerName = participant.dataset[summonernameKey]
      return seqS<Participant>({
        premadeId: pipe(
          participant.querySelector('.premadeHistoryTagContainer > div'),
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
          participant,
          domHandler.querySelectorEnsureOneTextContent('.championBox .level'),
          ValidatedNea.fromEither,
          ValidatedNea.chain(numberFromString(`${ePrefix}summoner level`)),
        ),
        champion: parseChampion(participant),
        leagues: parseLeagues(participant),

        // TODO
        role: ValidatedNea.valid('top'),
        mainRoles: ValidatedNea.valid(['top']),
        tags: ValidatedNea.valid([]),
      })
    }
  }

  function parseChampion(participant: Element): ValidatedNea<string, Maybe<Champion>> {
    return pipe(
      participant,
      domHandler.querySelectorEnsureOneTextContent('.championBox > .imgFlex > .txt > .title'),
      ValidatedNea.fromEither,
      ValidatedNea.chain(str =>
        str === '0 Played'
          ? ValidatedNea.valid(Maybe.none)
          : pipe(
              seqS({
                champion: parseChampionWinrate(str),
                kills: parseKda(participant, 'kills'),
                deaths: parseKda(participant, 'deaths'),
                assists: parseKda(participant, 'assists'),
              }),
              ValidatedNea.map(({ champion, ...rest }) => Maybe.some({ ...champion, ...rest })),
            ),
      ),
    )
  }

  function parseKda(participant: Element, className: string): ValidatedNea<string, number> {
    return pipe(
      participant,
      domHandler.querySelectorEnsureOneTextContent(
        `.championBox > .imgFlex > .txt > .content .${className}`,
      ),
      ValidatedNea.fromEither,
      ValidatedNea.chain(numberFromString('')),
    )
  }

  function parseLeagues(participant: Element): ValidatedNea<string, Leagues> {
    return pipe(
      apply.sequenceT(validation)(
        parseLeague(participant, '.rankingsBox > .imgFlex', false),
        parseLeague(participant, '.rankingsBox .rankingOtherRankings > .imgFlex', true),
      ),
      ValidatedNea.map(
        flow(
          List.compact,
          (leagues): Leagues => ({
            soloDuo: findLeague(leagues, 'Soloqueue'),
            flex: findLeague(leagues, 'Flex'),
          }),
        ),
      ),
    )
  }

  function parseLeague(
    participant: Element,
    selector: string,
    canBeNull: boolean,
  ): ValidatedNea<string, Maybe<Tuple<Queue, League>>> {
    if (canBeNull) {
      const league = participant.querySelector(selector)
      if (league === null) return ValidatedNea.valid(Maybe.none)
      return parseLeagueBis(league)
    }

    return pipe(
      participant,
      DomHandler.querySelectorEnsureOne(selector),
      ValidatedNea.fromEither,
      ValidatedNea.chain(parseLeagueBis),
    )
  }

  function parseLeagueBis(league: Element): ValidatedNea<string, Maybe<Tuple<Queue, League>>> {
    return pipe(
      league,
      domHandler.querySelectorEnsureOneTextContent(':scope > .txt > .title'),
      ValidatedNea.fromEither,
      ValidatedNea.chain(title => {
        if (title === 'Unranked') return ValidatedNea.valid(Maybe.none)

        const previousSeasonRankingImg = league.querySelector<HTMLImageElement>(
          '.inlinePreviousSeasonRanking > img',
        )
        return pipe(
          apply.sequenceT(validation)(
            pipe(
              league,
              domHandler.querySelectorEnsureOneTextContent(':scope > .txt > .title'),
              ValidatedNea.fromEither,
              ValidatedNea.chain(parseQueueTierRankLeaguePoints),
            ),
            previousSeasonRankingImg === null
              ? ValidatedNea.valid(Maybe.none)
              : pipe(parseTierRank(previousSeasonRankingImg.alt), ValidatedNea.map(Maybe.some)),
          ),
          ValidatedNea.map(([{ queue, tier, rank, leaguePoints }, previousSeason]) => {
            const res: League = {
              tier,
              rank,
              leaguePoints,
              previousSeason,
            }
            return Maybe.some(Tuple.of(queue, res))
          }),
        )
      }),
    )
  }

  function findLeague(leagues: List<Tuple<Queue, League>>, queue: Queue): Maybe<League> {
    return pipe(
      leagues,
      List.findFirstMap(([q, l]) => (Queue.Eq.equals(q, queue) ? Maybe.some(l) : Maybe.none)),
    )
  }
}

type ChampionWinrate = {
  percents: number
  played: number
}

// "46% Win (39 Played)"
const championWinrateRegex = /^(\d+)% Win \((\d+) Played\)$/
const parseChampionWinrate = (str: string): ValidatedNea<string, ChampionWinrate> =>
  pipe(
    str,
    StringUtils.matcher2(championWinrateRegex),
    ValidatedNea.fromOption(() => `${JSON.stringify(str)} didn't match championWinrateRegex`),
    ValidatedNea.map(
      ([percents, played]): ChampionWinrate => ({
        // championWinrateRegex ensures these casts are safe
        percents: Number(percents),
        played: Number(played),
      }),
    ),
  )

type Queue = typeof Queue.T
const Queue = createEnum('Soloqueue', 'Flex')

type QueueTierRankLeaguePoints = TierRank & {
  queue: Queue
  leaguePoints: number
}

const tierRegex = new RegExp(`^${g(LeagueTier)}(.*)$`, 'i')

const parseTier = (str: string): ValidatedNea<string, Tuple<LeagueTier, string>> =>
  pipe(
    str,
    StringUtils.matcher2(tierRegex),
    fromOptionRegex(str, tierRegex),
    ValidatedNea.map(([tier, rest]) => Tuple.of(tier.toUpperCase() as LeagueTier, rest)),
  )

const rankRegex = new RegExp(`^ ${g(LeagueRank)}$`)

// "Emerald II"
// "GrandMaster"
const parseTierRank = (str: string): ValidatedNea<string, TierRank> =>
  pipe(
    parseTier(str),
    ValidatedNea.chain(([tier, rest]) =>
      LeagueTier.isApexTier(tier)
        ? ValidatedNea.valid<string, TierRank>({ tier, rank: 'I' })
        : pipe(
            rest,
            StringUtils.matcher1(rankRegex),
            fromOptionRegex(rest, rankRegex),
            ValidatedNea.map((rank): TierRank => ({ tier, rank: rank as LeagueRank })),
          ),
    ),
  )

const rankLeaguePointsQueueRegex = (isApex: boolean): RegExp =>
  new RegExp(`^ ${isApex ? '' : `${g(LeagueRank)} `}(\\d+) LP \\(${g(Queue)}\\).*$`)

// "Emerald II 10 LP (Soloqueue) S13.1:"
// "GrandMaster 10 LP (Soloqueue) S13.1:"
const parseQueueTierRankLeaguePoints = (
  str: string,
): ValidatedNea<string, QueueTierRankLeaguePoints> =>
  pipe(
    parseTier(str),
    ValidatedNea.chain(([tier, rest]) => {
      const isApex = LeagueTier.isApexTier(tier)
      const regex = rankLeaguePointsQueueRegex(isApex)
      if (isApex) {
        return pipe(
          rest,
          StringUtils.matcher2(regex),
          fromOptionRegex(rest, regex),
          ValidatedNea.map(
            ([leaguePoints, queue]): QueueTierRankLeaguePoints => ({
              queue: queue as Queue,
              tier,
              rank: 'I',
              leaguePoints: Number(leaguePoints),
            }),
          ),
        )
      }
      return pipe(
        rest,
        StringUtils.matcher3(regex),
        fromOptionRegex(rest, regex),
        ValidatedNea.map(
          ([rank, leaguePoints, queue]): QueueTierRankLeaguePoints => ({
            queue: queue as Queue,
            tier,
            rank: rank as LeagueRank,
            leaguePoints: Number(leaguePoints),
          }),
        ),
      )
    }),
  )

const numberFromString =
  (prefix: string) =>
  (str: string): ValidatedNea<string, number> =>
    pipe(
      NumberFromString.decoder.decode(str),
      Either.mapLeft(() => NonEmptyArray.of(`${prefix} - expected number from string got: ${str}`)),
    )

const fromOptionRegex = (
  str: string,
  regex: RegExp,
): (<A>(ma: Maybe<A>) => ValidatedNea<string, A>) =>
  ValidatedNea.fromOption(() => `${JSON.stringify(str)} didn't match ${util.inspect(regex)}`)

function g<A extends Literal>({ values }: { values: List<A> }): string {
  return `(${values.join('|')})`
}
