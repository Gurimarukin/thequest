import { createEnum } from '../../../utils/createEnum'

type PoroNiceness = typeof PoroNiceness.T

const PoroNiceness = createEnum(
  -1, // red
  0, // yellow
  1, // green
  2, // blue (Pro: Faker)
)

export { PoroNiceness }
