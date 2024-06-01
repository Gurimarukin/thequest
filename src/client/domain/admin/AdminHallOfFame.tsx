/* eslint-disable functional/no-expression-statements,
                  functional/no-return-void */
import { eq, monoid, ord, readonlyMap, string, task } from 'fp-ts'
import { flow, pipe } from 'fp-ts/function'
import type React from 'react'
import { useCallback, useEffect, useState } from 'react'
import type { OptionProps, SingleValue, SingleValueProps } from 'react-select'
import Select from 'react-select'

import { apiRoutes } from '../../../shared/ApiRouter'
import { MsDuration } from '../../../shared/models/MsDuration'
import { Platform } from '../../../shared/models/api/Platform'
import type { DiscordUserView } from '../../../shared/models/api/hallOfFame/DiscordUserView'
import { HallOfFameInfos } from '../../../shared/models/api/hallOfFame/HallOfFameInfos'
import type { HallOfFameMembersPayload } from '../../../shared/models/api/hallOfFame/HallOfFameMembersPayload'
import type { SummonerShort } from '../../../shared/models/api/summoner/SummonerShort'
import { DiscordUserId } from '../../../shared/models/discord/DiscordUserId'
import { GameName } from '../../../shared/models/riot/GameName'
import { RiotId } from '../../../shared/models/riot/RiotId'
import { TagLine } from '../../../shared/models/riot/TagLine'
import { MapUtils } from '../../../shared/utils/MapUtils'
import { Either, Future, List, Maybe, Tuple, idcOrd } from '../../../shared/utils/fp'

import { apiAdminMadosayentisutoPost, apiSummonerGet } from '../../api'
import { AsyncRenderer } from '../../components/AsyncRenderer'
import { Loading } from '../../components/Loading'
import { Pre } from '../../components/Pre'
import { MainLayout } from '../../components/mainLayout/MainLayout'
import { useStaticData } from '../../contexts/StaticDataContext'
import { useToaster } from '../../contexts/ToasterContext'
import { useSWRHttp } from '../../hooks/useSWRHttp'
import { CloseFilled } from '../../imgs/svgs/icons'
import { cx } from '../../utils/cx'
import { futureRunUnsafe } from '../../utils/futureRunUnsafe'

const getHallOfFameTimeout = MsDuration.minute(1)

export const AdminHallOfFame: React.FC = () => (
  <MainLayout>
    <AsyncRenderer
      {...useSWRHttp(apiRoutes.admin.hallOfFame.get, { timeout: getHallOfFameTimeout }, [
        HallOfFameInfos.codec,
        'HallOfFameInfos',
      ])}
    >
      {infos => <Loaded infos={infos} />}
    </AsyncRenderer>
  </MainLayout>
)

type LoadedProps = {
  infos: HallOfFameInfos
}

const Loaded: React.FC<LoadedProps> = ({ infos }) => {
  const { showToaster } = useToaster()

  const [members, setMembers] = useState<
    ReadonlyMap<PartialDiscordUser, SummonerShort | undefined>
  >(() => toPartial(infos))

  const setSummonerAt = (id: DiscordUserId) => (summoner: SummonerShort | undefined) =>
    setMembers(prev =>
      pipe(
        prev,
        readonlyMap.updateAt(byIdEq)({ id }, summoner),
        Maybe.getOrElse(() => prev),
      ),
    )

  const remove = (id: DiscordUserId) => () => setMembers(readonlyMap.deleteAt(byIdEq)({ id }))

  const addPending = useCallback(
    (user: DiscordUserView) =>
      setMembers(readonlyMap.upsertAt(byIdEq)<SummonerShort | undefined>(user, undefined)),
    [],
  )

  const [isLoading, setIsLoading] = useState(false)

  const validated = validate(members)

  const handleSubmit = useCallback(() => {
    if (Maybe.isSome(validated)) {
      setIsLoading(true)
      pipe(
        apiAdminMadosayentisutoPost(validated.value),
        task.map(
          Either.fold(
            () => showToaster('error', 'error.'),
            () => showToaster('success', 'success.'),
          ),
        ),
        task.map(() => setIsLoading(false)),
      )()
    }
  }, [showToaster, validated])

  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-4 py-4 text-white">
      <table>
        <tbody>
          {pipe(
            members,
            readonlyMap.toReadonlyArray(byGlobalNameOrd),
            List.map(([user, summoner]) => (
              <Member
                key={DiscordUserId.unwrap(user.id)}
                user={user}
                summoner={summoner}
                setSummoner={setSummonerAt(user.id)}
                remove={remove(user.id)}
              />
            )),
          )}
          <Pending
            guildMembers={pipe(
              infos.guildMembers,
              List.differenceW(byIdEq)(pipe(members, readonlyMap.keys(idcOrd(byIdEq)))),
            )}
            addPending={addPending}
          />
        </tbody>
      </table>

      <Button
        type="button"
        onClick={handleSubmit}
        disabled={Maybe.isNone(validated)}
        className="flex items-center gap-2"
      >
        <span>submit</span>
        {isLoading ? <Loading className="h-4" /> : null}
      </Button>
    </div>
  )
}

const Tr: React.FC<
  React.DetailedHTMLProps<React.HTMLAttributes<HTMLTableRowElement>, HTMLTableRowElement>
> = props => <tr {...props} className={cx('odd:bg-zinc-900 even:bg-zinc-700', props.className)} />

const Td: React.FC<
  React.DetailedHTMLProps<React.TdHTMLAttributes<HTMLTableCellElement>, HTMLTableCellElement>
> = props => <td {...props} className={cx('px-10 py-2 first:pl-2 last:pr-2', props.className)} />

type PartialDiscordUser = DiscordUserView | { id: DiscordUserId }

const byIdEq: eq.Eq<PartialDiscordUser> = eq.struct({ id: DiscordUserId.Eq })
const byGlobalNameOrd: ord.Ord<PartialDiscordUser> = monoid.concatAll(
  ord.getMonoid<PartialDiscordUser>(),
)([
  pipe(
    Maybe.getOrd(string.Ord),
    ord.contramap((u: PartialDiscordUser) =>
      pipe(
        u,
        Maybe.fromPredicate(isDefined),
        Maybe.map(u_ =>
          pipe(
            u_.global_name,
            Maybe.getOrElse(() => u_.username),
          ),
        ),
      ),
    ),
  ),
  pipe(
    DiscordUserId.Ord,
    ord.contramap((u: PartialDiscordUser) => u.id),
  ),
])

function toPartial({
  guildMembers,
  hallOfFameMembers,
}: HallOfFameInfos): ReadonlyMap<PartialDiscordUser, SummonerShort | undefined> {
  return pipe(
    hallOfFameMembers,
    readonlyMap.toReadonlyArray(idcOrd(DiscordUserId.Eq)),
    List.map(
      Tuple.map(id =>
        pipe(
          guildMembers,
          List.findFirst(m => DiscordUserId.Eq.equals(m.id, id)),
          Maybe.getOrElse(() => ({ id })),
        ),
      ),
    ),
    MapUtils.fromReadonlyArray(byIdEq),
  )
}

function isDefined(u: PartialDiscordUser): u is DiscordUserView {
  return ((u as DiscordUserView).username as string | undefined) !== undefined
}

const traversable = readonlyMap.getTraversable(idcOrd(byIdEq))

function validate(
  members: ReadonlyMap<PartialDiscordUser, SummonerShort | undefined>,
): Maybe<HallOfFameMembersPayload> {
  return pipe(
    traversable.traverse(Maybe.Applicative)(members, Maybe.fromNullable),
    Maybe.map(
      flow(
        readonlyMap.toReadonlyArray(idcOrd(byIdEq)),
        List.map(Tuple.mapFst(u => u.id)),
        MapUtils.fromReadonlyArray(DiscordUserId.Eq),
      ),
    ),
  )
}

type MemberProps = {
  user: PartialDiscordUser
  summoner: SummonerShort | undefined
  setSummoner: (summoner: SummonerShort | undefined) => void
  remove: () => void
}

const Member: React.FC<MemberProps> = ({ user, summoner, setSummoner, remove }) => (
  <Tr>
    <Td>
      <div className="flex h-full items-center">
        <button type="button" onClick={remove}>
          <CloseFilled className="size-6 text-red" />
        </button>
      </div>
    </Td>
    <Td>
      {isDefined(user) ? <DiscordUser user={user} /> : <Pre>{DiscordUserId.unwrap(user.id)}</Pre>}
    </Td>
    <Td>
      <SummonerSelect summoner={summoner} setSummoner={setSummoner} />
    </Td>
  </Tr>
)

type PendingProps = {
  guildMembers: List<DiscordUserView>
  addPending: (user: DiscordUserView) => void
}

const Pending: React.FC<PendingProps> = ({ guildMembers, addPending }) => {
  const [value, setValue] = useState<DiscordUserView | null>(null)

  const handleSelectChange = useCallback(
    (newValue: SingleValue<DiscordUserView>) => {
      setValue(newValue)

      if (newValue !== null) {
        addPending(newValue)
      }
    },
    [addPending],
  )

  useEffect(() => {
    if (value !== null) {
      setValue(null)
    }
  }, [value])

  return (
    <Tr>
      <Td />
      <Td>
        <Select<DiscordUserView, false>
          options={guildMembers}
          getOptionValue={getOptionValueUser}
          getOptionLabel={getOptionLabelUser}
          value={value}
          onChange={handleSelectChange}
          components={{
            SingleValue: UserSingleValue,
            Option: UserOption,
          }}
          className="min-w-[320px] text-black"
        />
      </Td>
      <Td />
    </Tr>
  )
}

function getOptionValueUser(u: DiscordUserView): string {
  return DiscordUserId.unwrap(u.id)
}

function getOptionLabelUser(u: DiscordUserView): string {
  return u.username
}

const UserSingleValue: React.FC<SingleValueProps<DiscordUserView, false>> = props => {
  const { data, innerProps } = props

  const { padding, gridArea } = props.getStyles('singleValue', props)

  return (
    <DiscordUser {...innerProps} user={data} style={{ padding, gridArea } as React.CSSProperties} />
  )
}

const UserOption: React.FC<OptionProps<DiscordUserView, false>> = props => {
  const { data, innerProps } = props

  const { padding, color, backgroundColor } = props.getStyles('option', props)

  return (
    <DiscordUser
      {...innerProps}
      user={data}
      style={{ padding, color, backgroundColor } as React.CSSProperties}
    />
  )
}

type DiscordUserProps = React.DetailedHTMLProps<
  React.HTMLAttributes<HTMLDivElement>,
  HTMLDivElement
> & {
  user: DiscordUserView
}

const DiscordUser: React.FC<DiscordUserProps> = ({ user, className, ...props }) => (
  <div {...props} className={cx('flex cursor-pointer items-center gap-2', className)}>
    {pipe(
      user.avatar,
      Maybe.fold(
        () => null,
        avatar => (
          <img
            src={`https://cdn.discordapp.com/avatars/${user.id}/${avatar}.png?size=64`}
            className="size-8"
          />
        ),
      ),
    )}
    <span>
      @
      {pipe(
        user.global_name,
        Maybe.getOrElseW(() => <span className="font-lib-mono">{user.username}</span>),
      )}
    </span>
  </div>
)

type SummonerSelectProps = {
  summoner: SummonerShort | undefined
  setSummoner: (summoner: SummonerShort | undefined) => void
}

const SummonerSelect: React.FC<SummonerSelectProps> = ({ summoner, setSummoner }) => {
  const handleClick = useCallback(() => setSummoner(undefined), [setSummoner])

  return summoner === undefined ? (
    <SummonerSelectInput onFoundSummoner={setSummoner} />
  ) : (
    <div className="flex items-center gap-2">
      <SummonerComponent summoner={summoner} className="grow" />
      <Button type="button" onClick={handleClick}>
        edit
      </Button>
    </div>
  )
}

type SummonerSelectInputProps = {
  onFoundSummoner: (summoner: SummonerShort) => void
}

const SummonerSelectInput: React.FC<SummonerSelectInputProps> = ({ onFoundSummoner }) => {
  const [platform, setPlatform] = useState<Platform>(Platform.defaultPlatform)

  const handleSelectChange = useCallback((v: SingleValue<{ value: Platform }>) => {
    if (v !== null) {
      setPlatform(v.value)
    }
  }, [])

  const [rawRiotId, setRawRiotId] = useState('')

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setRawRiotId(e.target.value)
    setError(undefined)
  }, [])

  const [error, setError] = useState<string | undefined>(undefined)

  const [isLoading, setIsLoading] = useState(false)

  const riotId = RiotId.fromStringDecoder.decode(rawRiotId)

  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()

      if (Either.isRight(riotId)) {
        setIsLoading(true)
        pipe(
          apiSummonerGet(platform, riotId.right),
          Future.map(Maybe.fold(() => setError('not found'), onFoundSummoner)),
          Future.orElseW(() => {
            setError('error.')
            return Future.notUsed
          }),
          Future.chainFirstIOK(() => () => setIsLoading(false)),
          futureRunUnsafe,
        )
      }
    },
    [onFoundSummoner, platform, riotId],
  )

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <Select<{ value: Platform }, false>
        options={platformOptions}
        value={{ value: platform }}
        getOptionLabel={getOptionLabelPlatform}
        onChange={handleSelectChange}
        isDisabled={isLoading}
        className="text-black"
      />
      <input
        type="text"
        value={rawRiotId}
        onChange={handleInputChange}
        disabled={isLoading}
        className="text-black"
      />
      {isLoading ? (
        <Loading />
      ) : (
        <Button type="submit" disabled={Either.isLeft(riotId)}>
          ok
        </Button>
      )}
      {error !== undefined ? <div>{error}</div> : null}
    </form>
  )
}

const platformOptions = Platform.values.map(value => ({ value }))

function getOptionLabelPlatform({ value }: { value: Platform }): string {
  return value
}

type SummonerComponentProp = {
  summoner: SummonerShort
  className?: string
}

const SummonerComponent: React.FC<SummonerComponentProp> = ({
  summoner: {
    platform,
    riotId: { gameName, tagLine },
    profileIconId,
  },
  className,
}) => {
  const { assets } = useStaticData()
  return (
    <div className={cx('flex items-center gap-2', className)}>
      <img src={assets.summonerIcon(profileIconId)} className="size-8 shrink-0" />
      <div className="grow">
        <span className="text-goldenrod">{GameName.unwrap(gameName)}</span>
        <span className="text-grey-500">#{TagLine.unwrap(tagLine)}</span>
      </div>
      <span className="shrink-0 text-white">{platform}</span>
    </div>
  )
}

const Button: React.FC<
  React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>
> = ({ className, ...props }) => (
  // eslint-disable-next-line react/button-has-type
  <button
    {...props}
    className={cx(
      'border-2 bg-discord-blurple px-1.5 pb-[3px] pt-0.5 text-white enabled:active:border-dashed disabled:border-grey-400 disabled:text-grey-400',
      className,
    )}
  />
)
