import { string, task } from 'fp-ts'
import { flow, pipe } from 'fp-ts/function'
import * as D from 'io-ts/Decoder'
import { JSDOM } from 'jsdom'
import parsoid from 'parsoid'
import remarkParse from 'remark-parse'
import unified from 'unified'
import util from 'util'

import { MsDuration } from '../src/shared/models/MsDuration'
import { ValidatedNea } from '../src/shared/models/ValidatedNea'
import { StringUtils } from '../src/shared/utils/StringUtils'
import { createEnum } from '../src/shared/utils/createEnum'
import type { Tuple, Tuple3 } from '../src/shared/utils/fp'
import { Dict, Either, Future, List, Maybe, NonEmptyArray, Try } from '../src/shared/utils/fp'
import { decodeError } from '../src/shared/utils/ioTsUtils'

import { StrictStruct } from '../src/server/utils/ioTsUtils'

import { expectT } from './expectT'

const aramMapChangesUrl =
  'https://leagueoflegends.fandom.com/wiki/Template:Map_changes/data/aram?action=edit'
const dataMwAttribute = 'data-mw'

type Constructor<E> = {
  new (): E
  prototype: E
}

type ElementType<A> = A extends Constructor<infer E> ? E : never

describe('toto', () => {
  it(
    'should toto',
    () => {
      const future = pipe(
        Future.tryCatch(() => JSDOM.fromURL(aramMapChangesUrl)),
        Future.chainEitherK(pageDom =>
          pipe(
            pageDom.window.document,
            querySelectorEnsureOne('#wpTextbox1', pageDom.window.HTMLTextAreaElement),
            Either.chain(textArea => {
              const textAreaDom = new JSDOM(textArea.value)
              return pipe(textAreaDom.window.document, querySelectorEnsureOne('includeonly'))
            }),
            Either.mapLeft(toError),
          ),
        ),
        Future.chain(includeonly => parsoidParse(includeonly.innerHTML)),
        Future.chainEitherK(html =>
          pipe(
            new JSDOM(html).window.document,
            querySelectorEnsureOne('span'),
            Either.chainNullableK(`Missing attribute ${dataMwAttribute}`)(span =>
              span.getAttribute(dataMwAttribute),
            ),
            Either.mapLeft(toError),
          ),
        ),
        Future.map<string, unknown>(JSON.parse),
        Future.chainEitherK(u =>
          pipe(dataMwDecoder.decode(u), Either.mapLeft(decodeError('DataMw')(u))),
        ),
        Future.chain(data =>
          pipe(
            NonEmptyArray.head(data.parts).template.params,
            Dict.toReadonlyArray,
            List.filterMap(([key, param]) =>
              pipe(
                decodeChampionSpell(key),
                Maybe.map(([champion, spell]) =>
                  pipe(
                    parsoidParse(param.wt),
                    Future.map(html => [champion, spell, html] as const),
                  ),
                ),
              ),
            ),
            List.sequence(Future.ApplicativePar),
          ),
        ),
        Future.map(
          flow(
            listGroupByChampion,
            Dict.map(
              flow(
                NonEmptyArray.groupBy(([, spell]) => spell),
                Dict.map(NonEmptyArray.map(([, , html]) => html)),
              ),
            ),
          ),
        ),
        task.map(res => {
          console.log('res =', util.inspect(res, { depth: Infinity }))
        }),
        task.map(() => expectT(2).toStrictEqual(3)),
      )

      const toError = (e: string): Error => Error(`[${aramMapChangesUrl}] ${e}`)

      const toto = Future.chainEitherK((e: Element) =>
        pipe(
          e.innerHTML,
          string.split('&lt;!--Items--&gt;'),
          NonEmptyArray.head,
          string.split('\n|'),
          NonEmptyArray.tail,
          List.traverse(ValidatedNea.getValidation<Error>())(championRaw =>
            ValidatedNea.fromEither(
              Try.tryCatch(() => unified().use(remarkParse).parse(championRaw)),
            ),
          ),
          Either.mapLeft(
            flow(
              NonEmptyArray.map(e => util.inspect(e)),
              List.mkString('Errors while parsing championRaws:\n', '\n', ''),
              message => Error(message),
            ),
          ),
        ),
      )

      return future()
    },
    MsDuration.unwrap(MsDuration.minute(1)),
  )
})

type ChampSpellHtml = Tuple3<string, Spell, string>

const listGroupByChampion = List.groupBy<ChampSpellHtml, string>(([champion]) => champion) as (
  as: List<ChampSpellHtml>,
) => Dict<string, NonEmptyArray<ChampSpellHtml>>

function querySelectorEnsureOne(selector: string): (parent: ParentNode) => Either<string, Element>
function querySelectorEnsureOne<E extends Element>(
  selector: string,
  type: Constructor<E>,
): (parent: ParentNode) => Either<string, E>
function querySelectorEnsureOne<E extends Element>(
  selector: string,
  type?: Constructor<E>,
): (parent: ParentNode) => Either<string, E> {
  return parent => {
    const res = parent.querySelectorAll(selector)

    if (1 < res.length) return Either.left(`More than one element matches selector: ${selector}`)

    const elt = res[0]
    if (elt === undefined) return Either.left(`No element matches selector: ${selector}`)

    if (type === undefined) return Either.right(elt as E)

    const isE = (e: Element): e is E => e instanceof type
    if (isE(elt)) return Either.right(elt)

    return Either.left(`Element don't have expected type: ${type.name}`)
  }
}

const parsoidParse = (input: string): Future<string> =>
  Future.tryCatch(
    () =>
      new Promise<string>(resolve =>
        parsoid
          .parse({
            input,
            mode: 'wt2html',
            parsoidOptions: {
              linting: false,
              loadWMF: true, // true,
              useWorker: false,
              fetchConfig: true, // true,
              fetchTemplates: true, // true,
              fetchImageInfo: true, // true,
              expandExtensions: true, // true,
              rtTestMode: false,
              addHTMLTemplateParameters: false,
              usePHPPreProcessor: true, // true,
            },
            envOptions: {
              domain: 'en.wikipedia.org',
              prefix: null,
              pageName: '',
              scrubWikitext: false,
              pageBundle: false,
              wrapSections: false,
              logLevels: ['fatal', 'error', 'warn'],
            },
            oldid: null,
            contentmodel: null,
            outputContentVersion: '2.1.0',
            body_only: true,
          })
          .then((res: { html: string }) => resolve(res.html))
          .done(),
      ),
  )

type Spell = typeof Spell.T
const Spell = createEnum('I', 'Q', 'W', 'E', 'R')

const spellRegex = RegExp(`^(.*) ([${Spell.values.join('')}])$`)

const decodeChampionSpell = (raw: string): Maybe<Tuple<string, Spell>> =>
  pipe(raw, StringUtils.matcher2(spellRegex)) as Maybe<Tuple<string, Spell>>

const dataMwDecoder = StrictStruct.decoder({
  parts: NonEmptyArray.decoder(
    StrictStruct.decoder({
      template: StrictStruct.decoder({
        target: StrictStruct.decoder({
          wt: D.string,
          function: D.literal('switch'),
        }),
        params: D.record(
          StrictStruct.decoder({
            wt: D.string,
          }),
        ),
        i: D.number,
      }),
    }),
  ),
})

const data = {
  parts: [
    {
      template: {
        target: {
          wt:
            '#switch:{{{1|}}}<!--\n' +
            '                                             Champions-->\n',
          function: 'switch',
        },
        params: {
          'Akshan W': { wt: '* Scoundrel duration reduced to 25 seconds.' },
          'Azir W': {
            wt: "* '''Azir''' will start the game with one point already ranked in ''Arise!'', allowing him to allocate the other two to his other abilities.",
          },
          'Bard I': {
            wt: '* Chime spawn rate changed to every 30 seconds instead of 50 seconds (initial spawn unchanged).',
          },
          "Bel'Veth I": {
            wt: "* '''Bel'Veth''' gains 2 stacks from nearby siege minion deaths.",
          },
          "Bel'Veth R": {
            wt: '* Enhanced Void Corals spawn from nearby turrets being destroyed.',
          },
          'Corki I': {
            wt:
              '* First package spawn time reduced to 5:00.\n' +
              '* Package cooldown reduced to 150 seconds.',
          },
          'Gangplank Q': {
            wt: '* {{sbc|New Effect:}} Passively gains 1 {{ai|Silver Serpents|Gangplank|Silver Serpent}} per second.',
          },
          'Garen W': {
            wt: "* Bonus resistances on-kill changed to {{fd|0.5}}. ''Number of enemy kills needed to reach the maximum amount changed to 60.''",
          },
          'Karthus I': { wt: '* Duration changed to 5 seconds.' },
          'Nasus Q': {
            wt:
              '* Per-kill stacks increased to {{as|6|Siphoning Strike}}.\n' +
              '* Per-large-kill stacks increased to {{as|24|Siphoning Strike}}.',
          },
          'Ornn I': {
            wt: "* {{sbc|New Effect:}} Forging an item puts ''Living Forge'' on a 120-second cooldown.",
          },
          'Qiyana W': {
            wt: "* Targeting a Health Relic on {{tip|Howling Abyss}} grants the {{sbc|{{as|River}}}} ''Element''.",
          },
          'Shaco W': { wt: "* Limited to 6 ''Boxes'' active." },
          'Shyvana I': {
            wt:
              "* {{sbc|Alternate Innate:}} '''Shyvana''' gains {{as|1 '''bonus''' armor}}, {{as|1 '''bonus''' magic resistance}}, and {{as|{{fd|0.05}} '''bonus''' Fury regeneration}} whenever a siege or a canon minion dies within 1400 units range of her, or when she is healed by a health relic's area of effect on the enemy's side of the map.\n" +
              '** She will not gain bonuses if she is dead, even if in range.',
          },
          'Sion I': { wt: '* Life steal reduced to 50%.' },
          'Skarner I': {
            wt:
              "* Number of ''Crystal Spires'' spawned on the battlefield changed to five:\n" +
              '** One in each brush (with the central one being neutral)\n' +
              "** One in each team's base (below each inhibitor)",
          },
          'Veigar E': { wt: '* Cooldown changed to {{ap|23 to 17}} seconds.' },
          'Thresh I': { wt: '* Each collected soul counts as 2 from 1.' },
          'Yorick I': {
            wt: '* Deaths required for a grave changed to 5 at all levels.',
          },
          'Zeri Q': {
            wt:
              "* '''Zeri''' will start the game with one point already ranked in ''Burst Fire!'', allowing her to allocate the other two to her other abilities.\n" +
              '<!--Items-->',
          },
          'Tear of the Goddess': { wt: '* Each charge consumed generates 50% more mana.' },
          "Archangel's Staff": { wt: '* Each charge consumed generates 50% more mana.' },
          Heartsteel: {
            wt: '* Permanent bonus health reduced to 5% of damage amount from 10%.',
          },
          Manamune: { wt: '* Each charge consumed generates 50% more mana.' },
          "Winter's Approach": { wt: '* Each charge consumed generates 50% more mana.' },
          'Dark Seal': { wt: '* This item is disabled.' },
          "Mejai's Soulstealer": { wt: '* This item is disabled.' },
          'Rod of Ages': { wt: '* Gain a stack every 40 seconds.' },
          "Warmog's Armor": {
            wt:
              '* Champion damage cooldown changed to 8 seconds.\n' +
              '* Non-champion damage cooldown changed to 4 seconds.<!--\n' +
              '                                               Runes-->',
          },
          Triumph: {
            wt:
              "* Base heal ratio changed to {{as|{{fd|1.5}}% of '''maximum''' health}}.\n" +
              "* Heal health ratio changed to {{as|3% of '''missing''' health}}.\n" +
              '* Bonus gold changed to {{g|10}}.',
          },
          'Presence of Mind': {
            wt:
              "* Mana restored changed to {{as|10% of '''maximum''' mana}}.\n" +
              "* Energy restored changed to {{as|10% of '''maximum''' energy}}.",
          },
          Electrocute: { wt: '* Cooldown changed to {{pp|15 to 10}} seconds.' },
          'Dark Harvest': { wt: '* Damage per soul changed to 2.' },
          'Taste of Blood': { wt: '* Cooldown changed to 15 seconds.' },
          'Zombie Ward': {
            wt: '* Automatically exchanged with {{ri|Eyeball Collection}}.',
          },
          'Ghost Poro': {
            wt: '* Automatically exchanged with {{ri|Eyeball Collection}}.',
          },
          'Nullifying Orb': { wt: '* Cooldown changed to 30 seconds.' },
          Waterwalking: { wt: '* Automatically exchanged with {{ri|Scorch}}.' },
          'Gathering Storm': { wt: '* Stats gained every 6 minutes.' },
          'Grasp of the Undying': {
            wt:
              '* Triggered attack bonus health changed to 10.\n' +
              '* Ranged champions triggered attack bonus health changed to 6.',
          },
          Demolish: {
            wt:
              '* Base damage changed to 50.\n' +
              "* Health ratio changed to {{as|20% of '''maximum''' health}}.",
          },
          Conditioning: { wt: '* Initial cooldown changed to 8 minutes.' },
          Overgrowth: {
            wt:
              '* Bonus health per stack changed to 5.\n' +
              '* Additional bonus health threshold changed to 80 minions or monsters.',
          },
          'Magical Footwear': {
            wt:
              '* Boots granted at 8 minutes.\n' +
              '* Time reduction per takedown changed to 30 seconds.',
          },
          'Perfect Timing': { wt: '* Initial cooldown changed to 4 minutes.' },
          'Minion Dematerializer': { wt: '* Initial cooldown changed to 120 seconds.' },
        },
        i: 0,
      },
    },
  ],
}
