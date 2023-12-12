import { createEnum } from '../../../utils/createEnum'

type UserRole = typeof UserRole.T

const UserRole = createEnum('base', 'admin')

export { UserRole }
