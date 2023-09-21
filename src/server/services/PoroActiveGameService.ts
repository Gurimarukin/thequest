import { apply, string } from 'fp-ts'
import { flow, pipe } from 'fp-ts/function'
import type { Decoder } from 'io-ts/lib/Decoder'
import type { Literal } from 'io-ts/lib/Schemable'
import util from 'util'

import { DayJs } from '../../shared/models/DayJs'
import { ValidatedNea } from '../../shared/models/ValidatedNea'
import { Platform } from '../../shared/models/api/Platform'
import { PoroNiceness } from '../../shared/models/api/activeGame/PoroNiceness'
import type { PoroTag } from '../../shared/models/api/activeGame/PoroTag'
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
import { NonEmptyArrayFromString, NumberFromString } from '../../shared/utils/ioTsUtils'

import type { PoroApiConfig } from '../config/Config'
import { DomHandler } from '../helpers/DomHandler'
import type { HttpClient } from '../helpers/HttpClient'
import type { PoroActiveGame } from '../models/activeGame/PoroActiveGame'
import type { PoroActiveGameDb } from '../models/activeGame/PoroActiveGameDb'
import type {
  PoroActiveGameParticipant,
  PoroActiveGameParticipantChampion,
} from '../models/activeGame/PoroActiveGameParticipant'
import type { CronJobEvent } from '../models/event/CronJobEvent'
import type { PoroLeague } from '../models/league/PoroLeague'
import type { PoroLeagues } from '../models/league/PoroLeagues'
import type { TierRank } from '../models/league/TierRank'
import type { WinRate } from '../models/league/WinRate'
import type { LoggerGetter } from '../models/logger/LoggerGetter'
import { GameId } from '../models/riot/GameId'
import type { PoroActiveGamePersistence } from '../persistence/PoroActiveGamePersistence'
import { getOnError } from '../utils/getOnError'

type PoroActiveGameService = ReturnType<typeof of>

const PoroActiveGameService = (
  config: PoroApiConfig,
  Logger: LoggerGetter,
  poroActiveGamePersistence: PoroActiveGamePersistence,
  httpClient: HttpClient,
  cronJobObservable: TObservable<CronJobEvent>,
): IO<PoroActiveGameService> => {
  const logger = Logger('SummonerService')

  return pipe(
    cronJobObservable,
    TObservable.subscribe(getOnError(logger))({
      next: ({ date }) =>
        pipe(
          poroActiveGamePersistence.deleteBeforeDate(
            pipe(date, DayJs.subtract(config.cacheTtlActiveGame)),
          ),
          Future.map(toNotUsed),
        ),
    }),
    IO.map(() => of(config, poroActiveGamePersistence, httpClient)),
  )
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const of = (
  config: PoroApiConfig,
  poroActiveGamePersistence: PoroActiveGamePersistence,
  httpClient: HttpClient,
) => {
  return {
    find: (
      gameId: GameId,
      platform: Platform,
      summonerName: string,
    ): Future<Maybe<PoroActiveGame>> =>
      pipe(
        poroActiveGamePersistence.findById(gameId),
        futureMaybe.alt<PoroActiveGame>(() =>
          pipe(
            fetch(platform, summonerName),
            futureMaybe.bindTo('game'),
            futureMaybe.bind('insertedAt', () => futureMaybe.fromIO(DayJs.now)),
            futureMaybe.map(
              ({ game, insertedAt }): PoroActiveGameDb => ({
                ...game,
                insertedAt,
              }),
            ),
            futureMaybe.chainFirstTaskEitherK(poroActiveGamePersistence.upsert),
          ),
        ),
      ),
  }

  function fetch(platform: Platform, summonerName: string): Future<Maybe<PoroActiveGame>> {
    const platformSummoner = `${Platform.encoderLower.encode(platform)}/${summonerName}`

    return pipe(
      httpClient.text([`${config.baseUrl}/partial/live-partial/${platformSummoner}`, 'get'], {
        headers: { 'User-Agent': config.userAgent },
      }),
      Future.chainEitherK(parsePoroActiveGame),
    )
  }
}

export { PoroActiveGameService }

const validation = ValidatedNea.getValidation<string>()
const seqS = ValidatedNea.getSeqS<string>()

// PoroActiveGame
export const parsePoroActiveGame = (html: string): Try<Maybe<PoroActiveGame>> => {
  if (html.includes('The summoner is not in-game') || html.includes('Summoner not found')) {
    return Try.success(Maybe.none)
  }
  return pipe(
    html,
    DomHandler.of(),
    Try.map(parsePoroActiveGameBis),
    Try.chain(Either.mapLeft(flow(List.mkString('\n', '\n', ''), Error))),
    Try.map(Maybe.some),
  )
}

const parsePoroActiveGameBis = (domHandler: DomHandler): ValidatedNea<string, PoroActiveGame> => {
  const { window } = domHandler

  const spectateButton = 'spectate_button'

  return seqS<PoroActiveGame>({
    gameId: pipe(
      window.document.getElementById(spectateButton),
      ValidatedNea.fromNullable([`Element not found: #${spectateButton}`]),
      ValidatedNea.chain(datasetGet('spectateGameid')),
      ValidatedNea.chain(decode([NumberFromString.codec, 'NumberFromString'])),
      ValidatedNea.chain(decode([GameId.codec, 'GameId'])),
    ),
    participants: parseParticipants(),
  })

  function parseParticipants(): ValidatedNea<string, PoroActiveGame['participants']> {
    const cardsListClass = 'div.site-content > ul.cards-list'

    return pipe(
      window.document,
      DomHandler.querySelectorAll(cardsListClass, window.Element),
      ValidatedNea.chain(([team100, team200, ...remain]) =>
        apply.sequenceT(validation)(
          parseTeam(100, team100),
          parseTeam(200, team200),
          List.isEmpty(remain)
            ? ValidatedNea.valid(NotUsed)
            : ValidatedNea.invalid([`Got more than 2 teams ${cardsListClass}`]),
        ),
      ),
      ValidatedNea.map(([team100, team200]): PoroActiveGame['participants'] => ({
        100: List.isNonEmpty(team100) ? team100 : undefined,
        200: List.isNonEmpty(team200) ? team200 : undefined,
      })),
    )
  }

  function parseTeam(
    teamId: TeamId,
    cardsList: Element | undefined,
  ): ValidatedNea<string, List<PoroActiveGameParticipant>> {
    return pipe(
      cardsList === undefined
        ? ValidatedNea.invalid(['Not found'])
        : pipe(
            cardsList,
            DomHandler.querySelectorAll(`:scope > li > div`, window.HTMLElement),
            ValidatedNea.chain(List.traverseWithIndex(validation)(parseParticipant)),
          ),
      prefixErrors(`Team ${teamId} `),
    )
  }

  function parseParticipant(
    i: number,
    participant: HTMLElement,
  ): ValidatedNea<string, PoroActiveGameParticipant> {
    const premadeHistoryTagContainerDiv = '.premadeHistoryTagContainer > div'
    const championBoxLevel = '.championBox .level'

    return pipe(
      seqS<PoroActiveGameParticipant>({
        premadeId: pipe(
          participant.querySelector(premadeHistoryTagContainerDiv),
          Maybe.fromNullable,
          Maybe.chainNullableK(e => e.textContent),
          Maybe.fold(
            () => ValidatedNea.valid(Maybe.none),
            flow(
              string.trim,
              decode([NumberFromString.decoder, 'NumberFromString']),
              ValidatedNea.map(Maybe.some),
            ),
          ),
          prefixErrors(`${premadeHistoryTagContainerDiv}: `),
        ),
        summonerName: pipe(participant, datasetGet('summonername')),
        summonerLevel: pipe(
          participant,
          domHandler.querySelectorEnsureOneTextContent(championBoxLevel),
          ValidatedNea.fromEither,
          ValidatedNea.chain(
            flow(
              decode([NumberFromString.decoder, 'NumberFromString']),
              prefixErrors(`${championBoxLevel}:`),
            ),
          ),
        ),
        champion: parseChampion(participant),
        leagues: parseLeagues(participant),
        role: parseRole(participant),
        mainRoles: parseRoles(participant),
        tags: parseTags(participant),
      }),
      prefixErrors(`[${i}] `),
    )
  }

  function parseChampion(
    participant: Element,
  ): ValidatedNea<string, Maybe<PoroActiveGameParticipantChampion>> {
    return pipe(
      participant,
      domHandler.querySelectorEnsureOneTextContent('.championBox > .imgFlex > .txt > .title'),
      ValidatedNea.fromEither,
      ValidatedNea.chain(str =>
        str === '0 Played'
          ? ValidatedNea.valid(Maybe.none)
          : pipe(
              seqS({
                champion: parseChampionWinRate(str),
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
    const selector = `.championBox > .imgFlex > .txt > .content .${className}`

    return pipe(
      participant,
      domHandler.querySelectorEnsureOneTextContent(selector),
      ValidatedNea.fromEither,
      ValidatedNea.chain(
        flow(decode([NumberFromString.decoder, 'NumberFromString']), prefixErrors(`${selector}: `)),
      ),
    )
  }

  function parseLeagues(participant: Element): ValidatedNea<string, PoroLeagues> {
    return pipe(
      apply.sequenceT(validation)(
        parseLeague(participant, '.rankingsBox > .imgFlex', false),
        parseLeague(participant, '.rankingsBox .rankingOtherRankings > .imgFlex', true),
      ),
      ValidatedNea.map(
        flow(
          List.compact,
          (leagues): PoroLeagues => ({
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
  ): ValidatedNea<string, Maybe<Tuple<Queue, PoroLeague>>> {
    if (canBeNull) {
      const league = participant.querySelector(selector)
      if (league === null) return ValidatedNea.valid(Maybe.none)
      return parseLeagueBis(selector)(league)
    }

    return pipe(
      participant,
      DomHandler.querySelectorEnsureOne(selector),
      ValidatedNea.fromEither,
      ValidatedNea.chain(parseLeagueBis(selector)),
    )
  }

  function parseLeagueBis(
    selector: string,
  ): (league: Element) => ValidatedNea<string, Maybe<Tuple<Queue, PoroLeague>>> {
    return league =>
      pipe(
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
              parseLeagueWinRate(league),
              previousSeasonRankingImg === null
                ? ValidatedNea.valid(Maybe.none)
                : pipe(parseTierRank(previousSeasonRankingImg.alt), ValidatedNea.map(Maybe.some)),
            ),
            ValidatedNea.map(([{ queue, tier, rank, leaguePoints }, winRate, previousSeason]) => {
              const res: PoroLeague = {
                tier,
                rank,
                leaguePoints,
                winRate,
                previousSeason,
              }
              return Maybe.some(Tuple.of(queue, res))
            }),
          )
        }),
        prefixErrors(`${selector}: `),
      )
  }

  function parseLeagueWinRate(league: Element): ValidatedNea<string, WinRate> {
    const oneLinerClass = ':scope > .txt > .content > .oneLiner'

    return seqS<WinRate>({
      played: pipe(
        league,
        DomHandler.querySelectorEnsureOne(oneLinerClass),
        ValidatedNea.fromEither,
        ValidatedNea.chainNullableK([`Element "${oneLinerClass}" has no textContent`])(e =>
          e.lastChild?.textContent?.trim(),
        ),
        ValidatedNea.chain(parsePlayed),
      ),
      percents: pipe(
        league,
        domHandler.querySelectorEnsureOneTextContent(
          ':scope > .txt > .content > .oneLiner > .highlight',
        ),
        ValidatedNea.fromEither,
        ValidatedNea.chain(parsePercents),
      ),
    })
  }

  function findLeague(leagues: List<Tuple<Queue, PoroLeague>>, queue: Queue): Maybe<PoroLeague> {
    return pipe(
      leagues,
      List.findFirstMap(([q, l]) => (Queue.Eq.equals(q, queue) ? Maybe.some(l) : Maybe.none)),
    )
  }

  function parseRole(participant: Element): ValidatedNea<string, Maybe<ChampionPosition>> {
    const titleClass = '.rolesBox > .imgFlex > .txt > .title'

    return pipe(
      participant.querySelector(titleClass)?.firstChild?.textContent?.trim(),
      ValidatedNea.fromNullable([`Element "${titleClass}" has no textContent`]),
      ValidatedNea.chain(lane =>
        lane === unknownLane
          ? ValidatedNea.valid(Maybe.none)
          : pipe(
              lane,
              decode([Lane.decoder, 'Lane']),
              ValidatedNea.map(l => Maybe.some(lanePosition[l])),
              prefixErrors(`${titleClass}: `),
            ),
      ),
    )
  }

  function parseRoles(participant: Element): ValidatedNea<string, List<ChampionPosition>> {
    const rolesBoxHighlight = '.rolesBox > .imgFlex > .txt > .content > .highlight'

    return pipe(
      participant,
      domHandler.querySelectorEnsureOneTextContent(rolesBoxHighlight),
      ValidatedNea.fromEither,
      ValidatedNea.chain(lanes =>
        lanes === unknownLane
          ? ValidatedNea.valid(List.empty<Lane>())
          : pipe(
              lanes,
              decode([
                NonEmptyArrayFromString.decoder(', ')(Lane.decoder),
                'NonEmptyArrayFromString<Lane>',
              ]),
            ),
      ),
      ValidatedNea.map(List.map(l => lanePosition[l])),
      prefixErrors(`${rolesBoxHighlight}: `),
    )
  }

  function parseTags(participant: Element): ValidatedNea<string, List<PoroTag>> {
    const tagBoxTag = '.tags-box > tag'
    const divTag = 'div.tag'

    const dataTagNicenessAttr = 'data-tag-niceness'
    const tooltipAttr = 'tooltip'

    return pipe(
      participant,
      DomHandler.querySelectorAll(tagBoxTag, window.HTMLElement),
      ValidatedNea.chain(
        List.traverseWithIndex(validation)((i, tag) =>
          pipe(
            apply.sequenceT(validation)(
              pipe(
                tag.getAttribute(dataTagNicenessAttr),
                ValidatedNea.fromNullable([
                  `No attribute "${dataTagNicenessAttr}" for ${tagBoxTag}`,
                ]),
                ValidatedNea.chain(flow(Number, decode([PoroNiceness.decoder, 'Niceness']))),
              ),
              pipe(
                tag,
                DomHandler.querySelectorEnsureOne('div.tag'),
                ValidatedNea.fromEither,
                ValidatedNea.chain(div =>
                  seqS({
                    label: pipe(
                      div.textContent,
                      ValidatedNea.fromNullable([`Empty textContent for ${tagBoxTag} ${divTag}`]),
                      ValidatedNea.map(string.trim),
                    ),
                    tooltip: pipe(
                      div.getAttribute(tooltipAttr),
                      ValidatedNea.fromNullable([
                        `No attribute "${tooltipAttr}" for ${tagBoxTag} ${divTag}`,
                      ]),
                    ),
                  }),
                ),
              ),
            ),
            ValidatedNea.map(
              ([niceness, { label, tooltip }]): PoroTag => ({ niceness, label, tooltip }),
            ),
            prefixErrors(`${tagBoxTag} [${i}]: `),
          ),
        ),
      ),
    )
  }
}

const championWinRateRegex = /^(\d+)% Win \((\d+) Played\)$/

// "46% Win (39 Played)"
const parseChampionWinRate = (str: string): ValidatedNea<string, WinRate> =>
  pipe(
    str,
    StringUtils.matcher2(championWinRateRegex),
    fromOptionRegex(str, championWinRateRegex),
    ValidatedNea.map(
      ([percents, played]): WinRate => ({
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

const playedRegex = /^\((\d+) Played\)$/

// "(109 Played)"
const parsePlayed = (str: string): ValidatedNea<string, number> =>
  pipe(
    str,
    StringUtils.matcher1(playedRegex),
    fromOptionRegex(str, playedRegex),
    ValidatedNea.map(Number),
  )

const percentsRegex = /^(\d+)% Win$/

// "58% Win"
const parsePercents = (str: string): ValidatedNea<string, number> =>
  pipe(
    str,
    StringUtils.matcher1(percentsRegex),
    fromOptionRegex(str, percentsRegex),
    ValidatedNea.map(Number),
  )

const unknownLane = 'Unknown'

type Lane = typeof Lane.T
const Lane = createEnum('Top', 'Jungler', 'Mid', 'AD Carry', 'Support')

const lanePosition: Dict<Lane, ChampionPosition> = {
  Top: 'top',
  Jungler: 'jun',
  Mid: 'mid',
  'AD Carry': 'bot',
  Support: 'sup',
}

const datasetGet =
  (key: string) =>
  (elt: HTMLElement): ValidatedNea<string, string> => {
    const res = elt.dataset[key]
    return res === undefined
      ? ValidatedNea.invalid([`data-${key} not found`])
      : ValidatedNea.valid(res)
  }

const decode =
  <I, A>([decoder, decoderName]: Tuple<Decoder<I, A>, string>) =>
  (i: I): ValidatedNea<string, A> =>
    pipe(
      decoder.decode(i),
      Either.mapLeft(() => NonEmptyArray.of(`Expected ${decoderName}, got: ${util.inspect(i)}`)),
    )

function g<A extends Literal>({ values }: { values: List<A> }): string {
  return `(${values.join('|')})`
}

const fromOptionRegex = (
  str: string,
  regex: RegExp,
): (<A>(ma: Maybe<A>) => ValidatedNea<string, A>) =>
  ValidatedNea.fromOption(() => `${JSON.stringify(str)} didn't match ${util.inspect(regex)}`)

const prefixErrors = (
  prefix: string,
): (<A>(fa: ValidatedNea<string, A>) => ValidatedNea<string, A>) =>
  ValidatedNea.mapLeft(NonEmptyArray.map(e => `${prefix}${e}`))
