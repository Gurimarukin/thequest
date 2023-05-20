import { createEnum } from '../../../shared/utils/createEnum'

type TeamId = typeof TeamId.T

const TeamId = createEnum(100, 200)

export { TeamId }
