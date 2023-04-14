import { createEnum } from '../../utils/createEnum'

type Lane = typeof Lane.T

const Lane = createEnum('top', 'jun', 'mid', 'bot', 'sup')

export { Lane }
