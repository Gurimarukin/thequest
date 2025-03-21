import { pipe } from 'fp-ts/function'
import type { Decoder } from 'io-ts/Decoder'
import type { Encoder } from 'io-ts/Encoder'
import jwt from 'jsonwebtoken'

import type { MsDuration } from '../../shared/models/MsDuration'
import { Token } from '../../shared/models/api/user/Token'
import { DictUtils } from '../../shared/utils/DictUtils'
import type { Dict, PartialDict, Tuple } from '../../shared/utils/fp'
import { Either, Future, List, Maybe } from '../../shared/utils/fp'
import { decodeError } from '../../shared/utils/ioTsUtils'

type MySignOptions = Omit<jwt.SignOptions, 'expiresIn' | 'notBefore'> & {
  expiresIn?: MsDuration
  notBefore?: MsDuration
}

type MyVerifyOptions = Omit<jwt.VerifyOptions, 'complete'>

type JwtHelper = ReturnType<typeof JwtHelper>

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const JwtHelper = (secret: string) => ({
  sign:
    <O extends Dict<string, unknown>, A>(encoder: Encoder<O, A>) =>
    (a: A, { expiresIn, notBefore, ...options }: MySignOptions = {}): Future<Token> =>
      pipe(
        Future.tryCatch(
          () =>
            new Promise<Maybe<string>>((resolve, reject) =>
              jwt.sign(
                encoder.encode(a),
                secret,
                {
                  ...options,
                  ...msDurationOptions({ expiresIn, notBefore }),
                },
                (err, encoded) =>
                  err !== null ? reject(err) : resolve(Maybe.fromNullable(encoded)),
              ),
            ),
        ),
        Future.chain(Future.fromOption(() => Error('undefined jwt (this should never happen)'))),
        Future.map(Token),
      ),

  verify:
    <A>([decoder, decoderName]: Tuple<Decoder<string | jwt.JwtPayload, A>, string>) =>
    (token: string, options: MyVerifyOptions = {}) =>
      pipe(
        Future.tryCatch(
          () =>
            new Promise<Maybe<string | jwt.JwtPayload>>((resolve, reject) =>
              jwt.verify(token, secret, { ...options, complete: false }, (err, decoded) =>
                err !== null ? reject(err) : resolve(Maybe.fromNullable(decoded)),
              ),
            ),
        ),
        Future.chain(
          Future.fromOption(() => Error('Undefined payload (this should never happen)')),
        ),
        Future.chainEitherK(u =>
          pipe(decoder.decode(u), Either.mapLeft(decodeError(decoderName)(u))),
        ),
      ),
})

export { JwtHelper }

const msDurationOptions = <K extends string>(
  obj: Dict<K, MsDuration | undefined>,
): PartialDict<K, `${number}`> =>
  pipe(
    obj,
    DictUtils.entries,
    List.reduce({}, (acc, [key, val]) => (val === undefined ? acc : { ...acc, [key]: `${val}` })),
  )
