import { createEnum } from '../../utils/createEnum'

type Lane = typeof Lane.T

const Lane = createEnum('top', 'jungle', 'middle', 'bottom', 'support')

export { Lane }
