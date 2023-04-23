export const assertUnreachable = (x: never): never => {
  // eslint-disable-next-line functional/no-throw-statements
  throw Error(`Unexpected value: ${x}`)
}
