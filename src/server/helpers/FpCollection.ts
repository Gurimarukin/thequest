import { pipe } from 'fp-ts/function'
import type { Codec } from 'io-ts/Codec'
import type { Decoder } from 'io-ts/Decoder'
import type {
  BulkWriteOptions,
  ClientSession,
  CollationOptions,
  DeleteOptions,
  DeleteResult,
  Filter,
  FindOptions,
  InsertManyResult,
  InsertOneOptions,
  InsertOneResult,
  MatchKeysAndValues,
  Document as MongoDocument,
  IndexDescription as MongoIndexDescription,
  OptionalUnlessRequiredId,
  ReplaceOptions,
  UpdateOptions,
  UpdateResult,
} from 'mongodb'

import { Store } from '../../shared/models/Store'
import type { LoggerType } from '../../shared/models/logger/LoggerType'
import { TObservable } from '../../shared/models/rx/TObservable'
import type { NotUsed, Tuple } from '../../shared/utils/fp'
import { Either, Future, IO, List, Maybe, NonEmptyArray, toNotUsed } from '../../shared/utils/fp'
import { futureMaybe } from '../../shared/utils/futureMaybe'
import { decodeError } from '../../shared/utils/ioTsUtils'

import type { MongoCollection } from '../models/mongo/MongoCollection'
import type { IndexDescription, WithoutProjection } from '../models/mongo/MongoTypings'

export type FpCollection = ReturnType<ReturnType<ReturnType<typeof FpCollection>>>

export const FpCollection =
  (logger: LoggerType) =>
  <A, O extends MongoDocument>(
    codecWithName: Tuple<Codec<unknown, OptionalUnlessRequiredId<O>, A>, string>,
  ) =>
  (collection: MongoCollection<O>) => {
    const [codec] = codecWithName

    return {
      collection,

      path: FpCollectionHelpers.getPath<O>(),

      ensureIndexes: (
        indexSpecs: NonEmptyArray<IndexDescription<A>>,
        options: { session?: ClientSession } = {},
      ): Future<NotUsed> =>
        pipe(
          logger.info('Ensuring indexes'),
          Future.fromIOEither,
          Future.chain(() =>
            collection.future(c =>
              c.createIndexes(
                NonEmptyArray.asMutable(indexSpecs as NonEmptyArray<MongoIndexDescription>),
                options,
              ),
            ),
          ),
          Future.map(toNotUsed),
        ),

      insertOne: (doc: A, options: InsertOneOptions = {}): Future<InsertOneResult<O>> => {
        const encoded = codec.encode(doc)
        return pipe(
          collection.future(c => c.insertOne(encoded, options)),
          Future.chainFirstIOEitherK(() => logger.trace('Inserted', JSON.stringify(encoded))),
        )
      },

      insertMany: (
        docs: NonEmptyArray<A>,
        options: BulkWriteOptions = {},
      ): Future<InsertManyResult<O>> => {
        const encoded = docs.map(codec.encode)
        return pipe(
          collection.future(c => c.insertMany(encoded, options)),
          Future.chainFirstIOEitherK(res =>
            logger.trace(`Inserted ${res.insertedCount} documents`),
          ),
        )
      },

      updateOne: (filter: Filter<O>, doc: A, options: UpdateOptions = {}): Future<UpdateResult> => {
        const encoded = codec.encode(doc)
        return pipe(
          collection.future(c =>
            c.updateOne(filter, { $set: encoded as MatchKeysAndValues<O> }, options),
          ),
          Future.chainFirstIOEitherK(() => logger.trace('Updated', JSON.stringify(encoded))),
        )
      },

      replaceOne: (
        filter: Filter<O>,
        doc: A,
        options: ReplaceOptions = {},
      ): Future<UpdateResult | MongoDocument> => {
        const encoded = codec.encode(doc)
        return pipe(
          collection.future(c => c.replaceOne(filter, encoded as O, options)),
          Future.chainFirstIOEitherK(() => logger.trace('Replaced', JSON.stringify(encoded))),
        )
      },

      count: (filter: Filter<O>): Future<number> =>
        collection.future(c => c.countDocuments(filter)),

      findOne,
      findAllArr,
      findAllObs,

      deleteOne: (filter: Filter<O>, options: DeleteOptions = {}): Future<DeleteResult> =>
        pipe(
          collection.future(c => c.deleteOne(filter, options)),
          Future.chainFirstIOEitherK(res => logger.trace(`Deleted ${res.deletedCount} documents`)),
        ),

      deleteMany: (filter: Filter<O>, options: DeleteOptions = {}): Future<DeleteResult> =>
        pipe(
          collection.future(c => c.deleteMany(filter, options)),
          Future.chainFirstIOEitherK(res => logger.trace(`Deleted ${res.deletedCount} documents`)),
        ),

      drop: (): Future<boolean> =>
        pipe(
          collection.future(c => c.drop()),
          Future.chainFirstIOEitherK(() => logger.trace('Dropped collection')),
        ),
    }

    function findOne(
      filter: Filter<O>,
      options?: WithoutProjection<FindOptions<O>>,
    ): Future<Maybe<A>>
    function findOne<B extends A>(
      filter: Filter<O>,
      options: WithoutProjection<FindOptions<O>>,
      decoderWithName: Tuple<Decoder<unknown, B>, string>,
    ): Future<Maybe<B>>

    function findOne<B extends A>(
      filter: Filter<O>,
      options: WithoutProjection<FindOptions<O>> = {},
      [decoder, name]: Tuple<Decoder<unknown, B>, string> = codecWithName as Tuple<
        Decoder<unknown, B>,
        string
      >,
    ): Future<Maybe<B>> {
      return pipe(
        collection.future(c => c.findOne(filter, options)),
        Future.chainFirstIOEitherK(res => logger.trace('Found one', JSON.stringify(res))),
        Future.map(Maybe.fromNullable),
        futureMaybe.chainEitherK(u =>
          pipe(decoder.decode(u), Either.mapLeft(decodeError(name)(u))),
        ),
      )
    }

    function findAllArr(): (query: Filter<O>, options?: FindOptions<O>) => Future<List<A>>
    function findAllArr<B>([decoder, decoderName]: Tuple<Decoder<unknown, B>, string>): (
      query: Filter<O>,
      options?: FindOptions<O>,
    ) => Future<List<B>>

    function findAllArr<B>(
      [decoder, decoderName] = codecWithName as Tuple<Decoder<unknown, B>, string>,
    ): (query: Filter<O>, options?: FindOptions<O>) => Future<List<B>> {
      return (filter, options) =>
        pipe(
          collection.future(c => c.find(filter, options).toArray()),
          Future.chainFirstIOEitherK(as => logger.trace(`Found all ${as.length} documents`)),
          Future.chainEitherK(as =>
            pipe(
              List.decoder(decoder).decode(as),
              Either.mapLeft(decodeError(`List<${decoderName}>`)(as)),
            ),
          ),
        )
    }

    function findAllObs(): (filter: Filter<O>, options?: FindOptions<O>) => TObservable<A>
    function findAllObs<B>([decoder, decoderName]: Tuple<Decoder<unknown, B>, string>): (
      filter: Filter<O>,
      options?: FindOptions<O>,
    ) => TObservable<B>

    function findAllObs<B>(
      [decoder, decoderName] = codecWithName as Tuple<Decoder<unknown, B>, string>,
    ): (filter: Filter<O>, options?: FindOptions<O>) => TObservable<B> {
      return fpCollectionHelpersFindAllObs(logger, collection, [decoder, decoderName])
    }
  }

type KeyOf<A> = A extends List<infer B> ? keyof B : A extends Maybe<infer C> ? keyof C : keyof A

type Path<S> = {
  <
    K1 extends KeyOf<S>,
    K2 extends KeyOf<S[K1]>,
    K3 extends KeyOf<S[K1][K2]>,
    K4 extends KeyOf<S[K1][K2][K3]>,
    K5 extends KeyOf<S[K1][K2][K3][K4]>,
  >(
    ...path: [K1, K2, K3, K4, K5]
  ): string
  <
    K1 extends KeyOf<S>,
    K2 extends KeyOf<S[K1]>,
    K3 extends KeyOf<S[K1][K2]>,
    K4 extends KeyOf<S[K1][K2][K3]>,
  >(
    ...path: [K1, K2, K3, K4]
  ): string
  <K1 extends KeyOf<S>, K2 extends KeyOf<S[K1]>, K3 extends KeyOf<S[K1][K2]>>(
    ...path: [K1, K2, K3]
  ): string
  <K1 extends KeyOf<S>, K2 extends KeyOf<S[K1]>>(...path: [K1, K2]): string
  <K1 extends KeyOf<S>>(...path: [K1]): string
}

const getPath =
  <A>(): Path<A> =>
  (...path: List<string>) =>
    List.mkString('.')(path)

const fpCollectionHelpersFindAllObs =
  <O extends MongoDocument, B>(
    logger: LoggerType,
    collection: MongoCollection<O>,
    [decoder, decoderName]: Tuple<Decoder<unknown, B>, string>,
  ) =>
  (filter: Filter<O>, options?: FindOptions<O>): TObservable<B> => {
    const count = Store<number>(0)
    return pipe(
      collection.observable(coll => coll.find(filter, options).stream()),
      TObservable.chainEitherK(u =>
        pipe(decoder.decode(u), Either.mapLeft(decodeError(decoderName)(u))),
      ),
      TObservable.chainFirstIOK(() => count.modify(n => n + 1)),
      TObservable.map(Maybe.some),
      TObservable.concat(
        pipe(
          futureMaybe.none,
          Future.chainFirstIOEitherK(() =>
            pipe(
              count.get,
              IO.fromIO,
              IO.chain(n => logger.trace(`Found all ${n} documents`)),
            ),
          ),
          TObservable.fromTaskEither,
        ),
      ),
      TObservable.compact,
    )
  }

// https://www.mongodb.com/docs/manual/reference/collation
const caseInsensitiveCollation: CollationOptions = {
  locale: 'en',

  // level 1: compare base characters only, ignoring other differences such as diacritics and case
  // level 2: also compare diacritics (but not case)
  strength: 2,

  // whitespace and punctuation are not considered as base characters
  alternate: 'shifted',
}

export const FpCollectionHelpers = {
  getPath,
  findAllObs: fpCollectionHelpersFindAllObs,
  caseInsensitiveCollation,
}
