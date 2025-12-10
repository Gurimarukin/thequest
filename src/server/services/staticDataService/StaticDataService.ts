import { apply, io, predicate } from 'fp-ts'
import type { Predicate } from 'fp-ts/Predicate'
import { flow, pipe } from 'fp-ts/function'
import type { Merge } from 'type-fest'

import { DayJs } from '../../../shared/models/DayJs'
import { Ability } from '../../../shared/models/api/Ability'
import { DDragonVersion } from '../../../shared/models/api/DDragonVersion'
import { ItemId } from '../../../shared/models/api/ItemId'
import { Lang } from '../../../shared/models/api/Lang'
import type {
  MapChangesDataAbility,
  MapChangesDataSkill,
  MapChangesDataSkills,
} from '../../../shared/models/api/MapChangesData'
import { MapChangesData } from '../../../shared/models/api/MapChangesData'
import { Skill } from '../../../shared/models/api/Skill'
import { ChampionKey } from '../../../shared/models/api/champion/ChampionKey'
import type { ChampionPosition } from '../../../shared/models/api/champion/ChampionPosition'
import type { AdditionalStaticData } from '../../../shared/models/api/staticData/AdditionalStaticData'
import type { StaticData } from '../../../shared/models/api/staticData/StaticData'
import type { StaticDataChampion } from '../../../shared/models/api/staticData/StaticDataChampion'
import type { StaticDataItem } from '../../../shared/models/api/staticData/StaticDataItem'
import type { StaticDataSummonerSpell } from '../../../shared/models/api/staticData/StaticDataSummonerSpell'
import { DictUtils } from '../../../shared/utils/DictUtils'
import { ListUtils } from '../../../shared/utils/ListUtils'
import { StringUtils } from '../../../shared/utils/StringUtils'
import {
  Dict,
  Future,
  IO,
  List,
  Maybe,
  NonEmptyArray,
  PartialDict,
  Tuple,
} from '../../../shared/utils/fp'
import { futureMaybe } from '../../../shared/utils/futureMaybe'

import type { Config } from '../../config/Config'
import { constants } from '../../config/constants'
import type { HttpClient } from '../../helpers/HttpClient'
import { StoredAt } from '../../models/StoredAt'
import { ValidatedSoft } from '../../models/ValidatedSoft'
import type { LoggerGetter } from '../../models/logger/LoggerGetter'
import type { DDragonChampion } from '../../models/riot/ddragon/DDragonChampion'
import { ChampionEnglishName } from '../../models/wiki/ChampionEnglishName'
import type { WikiChallenge } from '../../models/wiki/WikiChallenge'
import type { WikiChampionData } from '../../models/wiki/WikiChampionData'
import { WikiChampionFaction } from '../../models/wiki/WikiChampionFaction'
import { WikiChampionPosition } from '../../models/wiki/WikiChampionPosition'
import type { WikiMapChanges } from '../../models/wiki/WikiMapChanges'
import { CacheUtils } from '../../utils/CacheUtils'
import type { DDragonService } from '../DDragonService'
import type { MockService } from '../MockService'
import { fetchWikiChallenges } from './fetchWikiChallenges'
import { fetchWikiChampionsData } from './fetchWikiChampionsData'
import { fetchWikiMapChanges } from './fetchWikiMapChanges'

type StaticDataService = ReturnType<typeof StaticDataService>

const StaticDataService = (
  config: Config,
  Logger: LoggerGetter,
  httpClient: HttpClient,
  ddragonService: DDragonService,
  mockService: MockService,
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
) => {
  const logger = Logger('StaticDataService')

  const fetchCachedStaticData: (lang: Lang) => (version: DDragonVersion) => Future<StaticData> =
    fetchCachedStoredAt(
      Lang.values,
      lang =>
        (version: DDragonVersion): Future<StaticData> =>
          pipe(
            ddragonService.champions(version, lang),
            Future.map(d => DictUtils.values(d.data)),
            Future.chain(staticDataFetch(version)),
          ),
      version => data => DDragonVersion.Eq.equals(data.value.version, version),
    )

  const fetchCachedWikiChampionsData: Future<List<WikiChampionData>> = pipe(
    fetchCachedStoredAt([''], () => () => fetchWikiChampionsData(logger, httpClient))('')(),
    Future.orElse(e =>
      pipe(
        logger.warn('fetchWikiChampionsData error:', e),
        Future.fromIO,
        Future.map(() => List.empty<WikiChampionData>()),
      ),
    ),
  )

  const fetchWikiChallengesSafe: Future<List<WikiChallenge>> = pipe(
    fetchWikiChallenges(httpClient),
    Future.orElse(e =>
      pipe(
        logger.warn('fetchWikiChallenges error:', e),
        Future.fromIO,
        Future.map(() => List.empty<WikiChallenge>()),
      ),
    ),
  )

  const fetchWikiAramChanges: Future<WikiMapChanges> = pipe(
    fetchWikiMapChanges(httpClient, 'aram'),
    Future.orElse(e =>
      pipe(
        logger.warn('fetchWikiAramChanges error:', e),
        Future.fromIO,
        Future.map((): WikiMapChanges => new Map()),
      ),
    ),
  )

  const fetchWikiUrfChanges: Future<WikiMapChanges> = pipe(
    fetchWikiMapChanges(httpClient, 'urf'),
    Future.orElse(e =>
      pipe(
        logger.warn('fetchWikiUrfChanges error:', e),
        Future.fromIO,
        Future.map((): WikiMapChanges => new Map()),
      ),
    ),
  )

  return {
    wikiChampions: pipe(
      config.mock ? mockService.wiki.champions : futureMaybe.none,
      futureMaybe.getOrElse(() => fetchCachedWikiChampionsData),
    ),

    getLatest: (lang: Lang): Future<StaticData> =>
      pipe(
        config.mock ? mockService.staticData : futureMaybe.none,
        futureMaybe.getOrElse(() =>
          pipe(ddragonService.latestVersionCached, Future.chain(fetchCachedStaticData(lang))),
        ),
      ),

    getLatestAdditional: (lang: Lang): Future<AdditionalStaticData> =>
      pipe(
        config.mock ? mockService.additionalStaticData : futureMaybe.none,
        futureMaybe.getOrElse(() => getLatestAdditional(lang)),
      ),
  }

  // No need to cache it, as all `ddragonService` functions used are already cached
  function getLatestAdditional(lang: Lang): Future<AdditionalStaticData> {
    return pipe(
      ddragonService.latestVersionCached,
      Future.chain(version =>
        pipe(
          apply.sequenceS(Future.ApplyPar)({
            version: Future.successful(version),
            summoners: ddragonService.summonersCached(lang)(version),
            runeStyles: ddragonService.runeStylesCached(lang)(version),
            runes: ddragonService.cdragon.latestRunesCached(lang),
            items: ddragonService.itemsCached(lang)(version),
          }),
        ),
      ),
      Future.map(
        ({ version, summoners, runeStyles, runes, items }): AdditionalStaticData => ({
          version,
          summonerSpells: pipe(
            summoners.data,
            DictUtils.entries,
            List.map(
              flow(
                Tuple.snd,
                (s): StaticDataSummonerSpell => ({
                  ...s,
                  cooldown: NonEmptyArray.head(s.cooldown),
                }),
              ),
            ),
          ),
          runeStyles: pipe(
            runeStyles,
            List.map(style => ({
              ...style,
              slots: pipe(
                style.slots,
                List.map(slot => ({
                  runes: pipe(
                    slot.runes,
                    List.map(rune => rune.id),
                  ),
                })),
              ),
            })),
          ),
          runes,
          items: pipe(
            items.data,
            DictUtils.entries,
            List.map(
              ([id, { image, ...item }]): StaticDataItem => ({
                ...item,
                // TODO: check isNaN?
                id: ItemId(Number(id)),
                image: image.full,
              }),
            ),
          ),
        }),
      ),
    )
  }

  function staticDataFetch(
    version: DDragonVersion,
  ): (ddragonChampions: List<DDragonChampion>) => Future<StaticData> {
    return ddragonChampions =>
      pipe(
        apply.sequenceS(Future.ApplyPar)({
          wikiChampions: fetchCachedWikiChampionsData,
          challenges: fetchWikiChallengesSafe,
          mapChanges: apply.sequenceS(Future.ApplyPar)({
            aram: fetchWikiAramChanges,
            urf: fetchWikiUrfChanges,
          }),
        }),
        Future.map(({ wikiChampions, challenges, mapChanges }) =>
          enrichChampions(ddragonChampions, wikiChampions, challenges, mapChanges),
        ),
        Future.chainFirstIOEitherK(
          flow(
            ValidatedSoft.errors,
            NonEmptyArray.fromReadonlyArray,
            Maybe.fold(
              () => IO.notUsed,
              flow(
                List.mkString('Errors while enriching champions data:\n- ', '\n- ', ''),
                logger.warn,
              ),
            ),
          ),
        ),
        Future.map(
          (champions): StaticData => ({
            version,
            champions: champions.value,
          }),
        ),
      )
  }
}

export { StaticDataService }

type MapName = 'aram' | 'urf'
type MapChanges = Dict<MapName, WikiMapChanges>

function enrichChampions(
  ddragonChampions: List<DDragonChampion>,
  wikiChampions: List<WikiChampionData>,
  challenges: List<WikiChallenge>,
  mapChanges: MapChanges,
): ValidatedSoft<List<StaticDataChampion>, string> {
  const wikiChampionByKey = pipe(
    wikiChampions,
    ListUtils.findFirstBy(ChampionKey.Eq)(c => c.id),
  )

  return pipe(
    ddragonChampions,
    List.traverse(ValidatedSoft.Applicative)(ddragonChampion =>
      pipe(
        wikiChampionByKey(ddragonChampion.key),
        Maybe.fold(
          () => ValidatedSoft(emptyStaticDataChampion(ddragonChampion), 'wikiChampion not found'),
          enrichChampion(ddragonChampion),
        ),
        ValidatedSoft.mapLeft(e => `[${ddragonChampion.key}] ${e}`),
      ),
    ),
    ValidatedSoft.chainFirst(detectUnmatchedChanges(mapChanges)),
  )

  function enrichChampion(
    ddragonChampion: DDragonChampion,
  ): (wikiChampion: WikiChampionData) => ValidatedSoft<StaticChampionWithEnglishName, string> {
    return wikiChampion =>
      pipe(
        apply.sequenceS(ValidatedSoft.Applicative)({
          positions: pipe(
            wikiChampion.external_positions,
            Maybe.map(List.map(p => WikiChampionPosition.position[p])),
            ValidatedSoft.fromOption(() => [List.empty<ChampionPosition>(), 'empty positons']),
          ),
          skills: pipe(
            mapChanges,
            Dict.traverseWithIndex(ValidatedSoft.Applicative)(skillsMapChanges(wikiChampion)),
          ),
        }),
        ValidatedSoft.map(
          ({ positions, skills }): StaticChampionWithEnglishName => ({
            id: ddragonChampion.id,
            key: ddragonChampion.key,
            name: ddragonChampion.name,
            positions,
            factions: pipe(
              challenges,
              List.filterMap(challenge =>
                List.elem(ChampionEnglishName.Eq)(wikiChampion.englishName, challenge.champions)
                  ? Maybe.some(WikiChampionFaction.faction[challenge.faction])
                  : Maybe.none,
              ),
            ),
            aram: { stats: wikiChampion.stats.aram, skills: skills.aram },
            urf: { stats: wikiChampion.stats.urf, skills: skills.urf },
            englishName: Maybe.some(wikiChampion.englishName),
          }),
        ),
      )
  }
}

function skillsMapChanges(
  wikiChampion: WikiChampionData,
): (map: MapName, changes: WikiMapChanges) => ValidatedSoft<Maybe<MapChangesDataSkills>, string> {
  return (map, changes) => {
    const abilities = changes.get(wikiChampion.englishName)

    if (abilities === undefined) {
      return ValidatedSoft(Maybe.none)
    }

    return pipe(
      Array.from(abilities.entries()),
      List.traverse(ValidatedSoft.Applicative)(([ability, description]) =>
        pipe(
          Skill.values,
          List.findFirstMap(skill => {
            const abilities_ = wikiChampion[`skill_${StringUtils.toLowerCase(skill)}`]

            return List.elem(Ability.Eq)(ability, abilities_)
              ? Maybe.some(Tuple.of(skill, abilities_[0]))
              : Maybe.none
          }),
          Maybe.fold(
            () => ValidatedSoft(Maybe.none, `ability not found: ${ability}`),
            ([skill, skillName]) =>
              ValidatedSoft(Maybe.some(Tuple.of(skill, { skillName, ability, description }))),
          ),
        ),
      ),
      // eslint-disable-next-line fp-ts/prefer-bimap
      ValidatedSoft.map(flow(List.compact, groupSpells(wikiChampion.englishName), Maybe.some)),
      ValidatedSoft.mapLeft(e => `[${map}] ${e}`),
    )
  }
}

type SkillEntry = Tuple<
  Skill,
  {
    skillName: Ability
    ability: Ability
    description: string
  }
>

function groupSpells(
  champion: ChampionEnglishName,
): (entries: List<SkillEntry>) => MapChangesDataSkills {
  return flow(
    List.groupBy(Tuple.fst),
    PartialDict.map((abilities_): MapChangesDataSkill => {
      // each element of `abilities` should have the same `.[1].skillName`
      const name = abilities_[0][1].skillName

      return {
        name,
        icon: abilityIconHtml(champion, name),
        abilities: new Map(
          pipe(
            abilities_,
            List.map(
              ([, { ability, description }]): Tuple<Ability, MapChangesDataAbility> =>
                Tuple.of(ability, {
                  icon: abilityIconHtml(champion, ability),
                  description,
                }),
            ),
          ),
        ),
      }
    }),
  )
}

type StaticChampionWithEnglishName = Merge<
  StaticDataChampion,
  { englishName: Maybe<ChampionEnglishName> }
>

function detectUnmatchedChanges(
  mapChanges: MapChanges,
): (champions: List<StaticChampionWithEnglishName>) => ValidatedSoft<Dict<MapName, void>, string> {
  return champions => {
    const championEnglishNames = pipe(
      champions,
      List.filterMap(c => c.englishName),
    )

    return pipe(
      mapChanges,
      Dict.traverseWithIndex(ValidatedSoft.Applicative)((map, changes) => {
        const diff = pipe(
          Array.from(changes.keys()),
          List.difference(ChampionEnglishName.Eq)(championEnglishNames),
        )

        if (!List.isNonEmpty(diff)) {
          return ValidatedSoft(undefined)
        }

        return ValidatedSoft(
          undefined,
          `${map} changes, champions not found: ${pipe(diff, NonEmptyArray.map(ChampionEnglishName.unwrap), List.mkString(', '))}`,
        )
      }),
    )
  }
}

function emptyStaticDataChampion(ddragonChampion: DDragonChampion): StaticChampionWithEnglishName {
  return {
    id: ddragonChampion.id,
    key: ddragonChampion.key,
    name: ddragonChampion.name,
    positions: [],
    factions: [],
    aram: MapChangesData.empty,
    urf: MapChangesData.empty,
    englishName: Maybe.none,
  }
}

/** See [`preProcessHtml`](./fetchWikiMapChanges.ts) */
function abilityIconHtml(champion: ChampionEnglishName, ability: Ability): string {
  const renamed = championRename.get(champion) ?? ChampionEnglishName.unwrap(champion)

  const png = `${skipChampion(renamed)}_${skipAbility(ability)}.png`

  return `<img alt="An icon for ${champion}'s ability ${ability}" src="${constants.lolWikiDomain}/en-us/images/thumb/${png}/40px-${png}" decoding="async" loading="lazy" />`
}

const championRename: ReadonlyMap<ChampionEnglishName, string> = new Map([
  [ChampionEnglishName('Nunu & Willump'), 'Nunu'],
])

function skipSpaces(str: string): string {
  return str.replaceAll(' ', '_')
}

const skipChampion: (name: string) => string = skipSpaces

function skipAbility(name: Ability): string {
  return skipSpaces(Ability.unwrap(name)).replaceAll(':', '-')
}

/**
 * Cache for constants.staticDataCacheTtl
 */
function fetchCachedStoredAt<K extends string, A, Args extends List<unknown>>(
  cacheFor: NonEmptyArray<K>,
  fetch: (key: K) => (...args: Args) => Future<A>,
  filterCache: (...args: Args) => Predicate<StoredAt<A>> = () => () => true,
): (key: K) => (...args: Args) => Future<A> {
  const res = CacheUtils.fetchCached<K, StoredAt<A>, Args>(
    cacheFor,
    k =>
      (...args_) =>
        pipe(
          fetch(k)(...args_),
          Future.chainIOK(value =>
            pipe(
              DayJs.now,
              io.map(storedAt => ({ value, storedAt })),
            ),
          ),
        ),
    () =>
      (...args_) =>
        pipe(
          DayJs.now,
          io.map(now =>
            pipe(
              StoredAt.isStillValid(constants.staticDataCacheTtl, now),
              predicate.and(filterCache(...args_)),
            ),
          ),
        ),
  )

  return key =>
    (...args) =>
      pipe(
        res(key)(...args),
        Future.map(a => a.value),
      )
}
