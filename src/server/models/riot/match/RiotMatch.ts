import { semigroup } from 'fp-ts'
import { flow, pipe } from 'fp-ts/function'
import * as D from 'io-ts/Decoder'
import type { Except, Merge, OverrideProperties } from 'type-fest'

import { DayJs } from '../../../../shared/models/DayJs'
import { MsDuration } from '../../../../shared/models/MsDuration'
import { GameId } from '../../../../shared/models/api/GameId'
import { MapId } from '../../../../shared/models/api/MapId'
import type { Platform } from '../../../../shared/models/api/Platform'
import { GameQueue } from '../../../../shared/models/api/activeGame/GameQueue'
import { TeamId } from '../../../../shared/models/api/activeGame/TeamId'
import { ChampionKey } from '../../../../shared/models/api/champion/ChampionKey'
import { List, Maybe, NonEmptyArray, PartialDict } from '../../../../shared/utils/fp'

import { DayJsFromNumber } from '../../../utils/ioTsUtils'
import type { MatchDb } from '../../match/MatchDb'
import { GameMode } from '../GameMode'
import { GameType } from '../GameType'
import { RiotMatchParticipant } from './RiotMatchParticipant'

const objectiveDecoder = D.struct({
  first: D.boolean,
  kills: D.number,
})

// ---

type RawRiotMatch = D.TypeOf<typeof rawDecoder>

const rawDecoder = D.struct({
  metadata: D.struct({
    dataVersion: D.string, // '2'
    // matchId: 'EUW1_0123456789',
    // participants: List.decoder(Puuid.codec),
  }),
  info: pipe(
    D.struct({
      gameCreation: DayJsFromNumber.decoder,
      /**
       * Prior to patch 11.20, this field returns the game length in milliseconds calculated
       * from gameEndTimestamp - gameStartTimestamp. Post patch 11.20, this field returns the
       * max timePlayed of any participant in the game in seconds, which makes the behavior of
       * this field consistent with that of match-v4.
       * The best way to handling the change in this field is to treat the value as milliseconds
       * if the gameEndTimestamp field isn't in the response and to treat the value as seconds
       * if gameEndTimestamp is in the response.
       */
      gameDuration: D.number,
      /**
       * Unix timestamp for when match ends on the game server. This timestamp can occasionally
       * be significantly longer than when the match "ends". The most reliable way of
       * determining the timestamp for the end of the match would be to add the max time played
       * of any participant to the gameStartTimestamp. This field was added to match-v5 in
       * patch 11.20 on Oct 5th, 2021.
       */
      gameEndTimestamp: Maybe.decoder(DayJsFromNumber.decoder),
      gameId: GameId.codec,
      gameMode: GameMode.codec,
      gameName: D.string,
      gameStartTimestamp: DayJsFromNumber.decoder,
      gameType: GameType.codec,
      gameVersion: D.string,
      mapId: MapId.codec,
      participants: List.decoder(RiotMatchParticipant.rawDecoder),
      queueId: GameQueue.codec,
      teams: List.decoder(
        D.struct({
          bans: List.decoder(
            D.struct({
              championId: pipe(
                ChampionKey.codec,
                D.map(Maybe.fromPredicate(k => ChampionKey.unwrap(k) !== -1)),
              ),
              pickTurn: D.number,
            }),
          ),
          objectives: D.struct({
            baron: objectiveDecoder,
            champion: objectiveDecoder,
            dragon: objectiveDecoder,
            inhibitor: objectiveDecoder,
            riftHerald: objectiveDecoder,
            tower: objectiveDecoder,
          }),
          teamId: pipe(
            D.literal(...TeamId.values, 0), // happens in Arena ¯\_(ツ)_/¯
            D.map((id): TeamId => (id === 0 ? 200 : id)),
          ),
          win: D.boolean,
        }),
      ),
    }),
  ),
})

type RiotMatch = OverrideProperties<
  Merge<
    Except<Merge<RawRiotMatch['metadata'], RawRiotMatch['info']>, 'participants'>,
    {
      win: TeamId
    }
  >,
  {
    gameDuration: MsDuration
    gameEndTimestamp: DayJs
    teams: PartialDict<`${TeamId}`, MatchTeam>
  }
>

type MatchTeam = Merge<
  Except<RawRiotMatch['info']['teams'][number], 'teamId' | 'win'>,
  {
    participants: List<RiotMatchParticipant>
  }
>

const decoder = pipe(
  rawDecoder,
  D.map(
    ({
      metadata,
      info: { gameDuration, gameEndTimestamp, participants, teams, ...info },
    }): RiotMatch => {
      const maxTimePlayed = pipe(
        participants,
        NonEmptyArray.fromReadonlyArray,
        Maybe.map(
          flow(
            NonEmptyArray.map(p => p.timePlayed),
            NonEmptyArray.concatAll(semigroup.max(MsDuration.Ord)),
          ),
        ),
        Maybe.getOrElse(() => MsDuration.ms(0)),
      )

      return {
        ...metadata,
        ...info,
        gameDuration: pipe(
          gameEndTimestamp,
          Maybe.fold(
            () => MsDuration.ms(gameDuration),
            () => MsDuration.seconds(gameDuration),
          ),
        ),
        gameEndTimestamp: pipe(info.gameStartTimestamp, DayJs.add(maxTimePlayed)),
        teams: pipe(
          teams,
          List.groupBy(t => `${t.teamId}`),
          PartialDict.map(
            ([team]): MatchTeam => ({
              ...team,
              participants: pipe(
                participants,
                List.filter(p => TeamId.Eq.equals(p.teamId, team.teamId)),
              ),
            }),
          ),
        ),
        win: pipe(
          teams,
          List.findFirst(t => t.win),
          Maybe.fold(
            (): TeamId => 100,
            t => t.teamId,
          ),
        ),
      }
    },
  ),
)

const toMatchDb =
  (platform: Platform) =>
  ({ gameId, ...m }: RiotMatch): MatchDb => ({ ...m, platform, id: gameId })

const RiotMatch = { decoder, toMatchDb }

export { RiotMatch }
