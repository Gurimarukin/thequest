import { apply, string } from 'fp-ts'
import { flow, pipe } from 'fp-ts/function'
import type { Decoder } from 'io-ts/lib/Decoder'
import type { Literal } from 'io-ts/lib/Schemable'
import util from 'util'

import { Business } from '../../shared/Business'
import { DayJs } from '../../shared/models/DayJs'
import { ValidatedNea } from '../../shared/models/ValidatedNea'
import { GameId } from '../../shared/models/api/GameId'
import { Lang } from '../../shared/models/api/Lang'
import { Platform } from '../../shared/models/api/Platform'
import { PoroNiceness } from '../../shared/models/api/activeGame/PoroNiceness'
import type { PoroTag } from '../../shared/models/api/activeGame/PoroTag'
import type { ChampionPosition } from '../../shared/models/api/champion/ChampionPosition'
import { LeagueRank } from '../../shared/models/api/league/LeagueRank'
import { LeagueTier } from '../../shared/models/api/league/LeagueTier'
import { RiotId } from '../../shared/models/riot/RiotId'
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

const of = (
  config: PoroApiConfig,
  poroActiveGamePersistence: PoroActiveGamePersistence,
  httpClient: HttpClient,
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
) => {
  return {
    find: (
      lang: Lang,
      gameId: GameId,
      platform: Platform,
      riotId: RiotId,
    ): Future<Maybe<PoroActiveGame>> =>
      findCached(
        lang,
        gameId,
      )(() =>
        Lang.Eq.equals(lang, defaultLang)
          ? fetchAndParseUniqLang(lang, platform, riotId)
          : pipe(
              findCached(
                defaultLang,
                gameId,
              )(() => fetchAndParseUniqLang(defaultLang, platform, riotId)),
              futureMaybe.chain(fetchAndParseTranslatedTags(lang, platform, riotId)),
            ),
      ),
  }

  function findCached(
    lang: Lang,
    gameId: GameId,
  ): (f: () => Future<Maybe<PoroActiveGame>>) => Future<Maybe<PoroActiveGame>> {
    return f =>
      pipe(
        poroActiveGamePersistence.find(lang, gameId),
        futureMaybe.alt<PoroActiveGame>(() =>
          pipe(
            f(),
            futureMaybe.bindTo('game'),
            futureMaybe.bind('insertedAt', () => futureMaybe.fromIO(DayJs.now)),
            futureMaybe.map(
              ({ game, insertedAt }): PoroActiveGameDb => ({
                ...game,
                lang,
                insertedAt,
              }),
            ),
            futureMaybe.chainFirstTaskEitherK(poroActiveGamePersistence.upsert),
          ),
        ),
      )
  }

  function fetchAndParseUniqLang(
    lang: Lang,
    platform: Platform,
    riotId: RiotId,
  ): Future<Maybe<PoroActiveGame>> {
    return pipe(fetch(lang, platform, riotId), Future.chainEitherK(parsePoroActiveGame))
  }

  function fetchAndParseTranslatedTags(
    lang: Lang,
    platform: Platform,
    riotId: RiotId,
  ): (activeGameDefaultLang: PoroActiveGame) => Future<Maybe<PoroActiveGame>> {
    return activeGameDefaultLang =>
      pipe(
        fetch(lang, platform, riotId),
        Future.chainEitherK(parsePoroActiveGameOnlyTags),
        futureMaybe.map(
          (onlyTags): PoroActiveGame => ({
            ...activeGameDefaultLang,
            participants: pipe(
              activeGameDefaultLang.participants,

              List.mapWithIndex(
                (i, participant): PoroActiveGameParticipant => ({
                  ...participant,
                  tags: onlyTags.participants[i]?.tags ?? participant.tags,
                }),
              ),
            ),
          }),
        ),
      )
  }

  function fetch(lang: Lang, platform: Platform, { gameName, tagLine }: RiotId): Future<string> {
    const poroLang = Business.poroLang[lang]
    const platformAndRiotId = `${Platform.encoderLower.encode(platform)}/${gameName}-${tagLine}`

    return pipe(
      getWithUserAgent(`/${poroLang}/live/${platformAndRiotId}/season`),
      Future.chain(() =>
        getWithUserAgent(`/partial/${poroLang}/live-partial/${platformAndRiotId}/season`),
      ),
    )
  }

  function getWithUserAgent(url: string): Future<string> {
    return httpClient.text([`${config.baseUrl}${url}`, 'get'], {
      headers: { 'User-Agent': config.userAgent },
    })
  }
}

export { PoroActiveGameService }

const defaultLang: Lang = 'en_GB'

type PoroActiveGameOnlyTags = {
  participants: List<PoroActiveGameParticipantOnlyTags>
}

type PoroActiveGameParticipantOnlyTags = Pick<PoroActiveGameParticipant, 'tags'>

const parsePoroActiveGameOnlyTags: (html: string) => Try<Maybe<PoroActiveGameOnlyTags>> =
  parsePoroActiveGameCommon(parsePoroActiveGameOnlyTagsBis)

export const parsePoroActiveGame: (html: string) => Try<Maybe<PoroActiveGame>> =
  parsePoroActiveGameCommon(parsePoroActiveGameBis)

function parsePoroActiveGameCommon<A>(
  f: (domHandler: DomHandler) => ValidatedNea<string, A>,
): (html: string) => Try<Maybe<A>> {
  return html => {
    if (html.includes('The summoner is not in-game') || html.includes('Summoner not found')) {
      return Try.success(Maybe.none)
    }
    return pipe(
      html,
      DomHandler.of(),
      Try.map(f),
      Try.chain(Either.mapLeft(flow(List.mkString('\n', '\n', ''), Error))),
      Try.map(Maybe.some),
    )
  }
}

const validation = ValidatedNea.getValidation<string>()
const seqS = ValidatedNea.getSeqS<string>()

function parsePoroActiveGameOnlyTagsBis(
  domHandler: DomHandler,
): ValidatedNea<string, PoroActiveGameOnlyTags> {
  return seqS<PoroActiveGameOnlyTags>({
    participants: parseParticipants(domHandler, parseParticipant),
  })

  function parseParticipant(
    i: number,
    participant: HTMLElement,
  ): ValidatedNea<string, PoroActiveGameParticipantOnlyTags> {
    return pipe(
      seqS<PoroActiveGameParticipantOnlyTags>({
        tags: parseTags(domHandler, participant),
      }),
      prefixErrors(`[${i}] `),
    )
  }
}

function parsePoroActiveGameBis(domHandler: DomHandler): ValidatedNea<string, PoroActiveGame> {
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
    participants: pipe(
      parseParticipants(domHandler, parseParticipant),
      ValidatedNea.map(List.compact),
    ),
  })

  function parseParticipant(
    i: number,
    participant: HTMLElement,
  ): ValidatedNea<string, Maybe<PoroActiveGameParticipant>> {
    const premadeHistoryTagContainerDiv = '.premadeHistoryTagContainer > div'
    const championBoxLevel = '.championBox .level'

    return pipe(
      participant,
      datasetGet('summonername'),
      ValidatedNea.chain(summonerName =>
        pipe(
          summonerName,
          decode([RiotId.fromStringCodec, 'RiotId']),
          ValidatedNea.fold(
            () =>
              // streamer mode
              ValidatedNea.valid(Maybe.none),
            riotId =>
              pipe(
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
                  riotId: ValidatedNea.valid(riotId),
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
                  tags: parseTags(domHandler, participant),
                }),
                ValidatedNea.map(Maybe.some),
              ),
          ),
        ),
      ),

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
          if (title.startsWith('Unranked')) {
            return pipe(
              parsePreviousSplit(league, 'previousSeasonRanking'),
              ValidatedNea.map(
                Maybe.fold(
                  () => Maybe.none,
                  p =>
                    Maybe.some(
                      Tuple.of<[Queue, PoroLeague]>('Soloqueue', {
                        currentSplit: Maybe.none,
                        previousSplit: Maybe.some(p),
                      }),
                    ),
                ),
              ),
            )
          }
          return pipe(
            apply.sequenceT(validation)(
              pipe(
                league,
                domHandler.querySelectorEnsureOneTextContent(':scope > .txt > .title'),
                ValidatedNea.fromEither,
                ValidatedNea.chain(parseQueueTierRankLeaguePoints),
              ),
              parseLeagueWinRate(league),
              parsePreviousSplit(league, 'inlinePreviousSeasonRanking'),
            ),
            ValidatedNea.map(([{ queue, tier, rank, leaguePoints }, winRate, previousSplit]) =>
              Maybe.some(
                Tuple.of<[Queue, PoroLeague]>(queue, {
                  currentSplit: Maybe.some({ tier, rank, leaguePoints, winRate }),
                  previousSplit,
                }),
              ),
            ),
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

  function parsePreviousSplit(
    league: Element,
    containerClass: string,
  ): ValidatedNea<string, Maybe<TierRank>> {
    const img = league.querySelector<HTMLImageElement>(`.${containerClass} > img`)
    if (img === null) return ValidatedNea.valid(Maybe.none)
    return pipe(parseTierRank(img.alt), ValidatedNea.map(Maybe.some))
  }

  function findLeague(leagues: List<Tuple<Queue, PoroLeague>>, queue: Queue): PoroLeague {
    return pipe(
      leagues,
      List.findFirst(([q]) => Queue.Eq.equals(q, queue)),
      Maybe.fold(() => ({ currentSplit: Maybe.none, previousSplit: Maybe.none }), Tuple.snd),
    )
  }

  function parseRole(participant: Element): ValidatedNea<string, Maybe<ChampionPosition>> {
    const titleClass = '.rolesBox > .imgFlex > .txt > .title'

    return pipe(
      participant,
      DomHandler.querySelectorEnsureOne(titleClass),
      Either.chain(title =>
        pipe(
          title.firstChild?.textContent?.trim(),
          Either.fromNullable(`Element "${titleClass}" has no textContent`),
        ),
      ),
      ValidatedNea.fromEither,
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
}

function parseParticipants<A>(
  domHandler: DomHandler,
  parseParticipant: (i: number, participant: HTMLElement) => ValidatedNea<string, A>,
): ValidatedNea<string, List<A>> {
  const { window } = domHandler

  const cardsClass = 'div.site-content > ul.cards-list > li > div'

  return pipe(
    window.document,
    DomHandler.querySelectorAll(cardsClass, window.HTMLElement),
    ValidatedNea.chain(List.traverseWithIndex(validation)(parseParticipant)),
  )
}

function parseTags(
  domHandler: DomHandler,
  participant: Element,
): ValidatedNea<string, List<PoroTag>> {
  const { window } = domHandler

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
              ValidatedNea.fromNullable([`No attribute "${dataTagNicenessAttr}" for ${tagBoxTag}`]),
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

const championWinRateRegex = /^(\d+)% Win \((\d+) Played\)$/

// "46% Win (39 Played)"
function parseChampionWinRate(str: string): ValidatedNea<string, WinRate> {
  return pipe(
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
}

type Queue = typeof Queue.T
const Queue = createEnum('Soloqueue', 'Flex')

type QueueTierRankLeaguePoints = TierRank & {
  queue: Queue
  leaguePoints: number
}

const tierRegex = new RegExp(`^${g(LeagueTier)}(.*)$`, 'i')

function parseTier(str: string): ValidatedNea<string, Tuple<LeagueTier, string>> {
  return pipe(
    str,
    StringUtils.matcher2(tierRegex),
    fromOptionRegex(str, tierRegex),
    ValidatedNea.map(([tier, rest]) => Tuple.of(tier.toUpperCase() as LeagueTier, rest)),
  )
}

const rankRegex = new RegExp(`^ ${g(LeagueRank)}$`)

// "Emerald II"
// "GrandMaster"
function parseTierRank(str: string): ValidatedNea<string, TierRank> {
  return pipe(
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
}

const rankLeaguePointsQueueRegex = (isApex: boolean): RegExp =>
  new RegExp(`^ ${isApex ? '' : `${g(LeagueRank)} `}(-?\\d+) LP \\(${g(Queue)}\\).*$`)

// "Emerald II 10 LP (Soloqueue) S13.1:"
// "GrandMaster 10 LP (Soloqueue) S13.1:"
function parseQueueTierRankLeaguePoints(
  str: string,
): ValidatedNea<string, QueueTierRankLeaguePoints> {
  return pipe(
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
}

const playedRegex = /^\((\d+) Played\)$/

// "(109 Played)"
function parsePlayed(str: string): ValidatedNea<string, number> {
  return pipe(
    str,
    StringUtils.matcher1(playedRegex),
    fromOptionRegex(str, playedRegex),
    ValidatedNea.map(Number),
  )
}

const percentsRegex = /^(\d+)% Win$/

// "58% Win"
function parsePercents(str: string): ValidatedNea<string, number> {
  return pipe(
    str,
    StringUtils.matcher1(percentsRegex),
    fromOptionRegex(str, percentsRegex),
    ValidatedNea.map(Number),
  )
}

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
