import { createEnum } from '../../../utils/createEnum'

type TeamId = typeof TeamId.T

const TeamId = createEnum(100, 200)

export { TeamId }
