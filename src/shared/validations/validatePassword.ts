import { ClearPassword } from '../models/api/user/ClearPassword'
import { Either, List } from '../utils/fp'

export const validatePassword = (password: ClearPassword): Either<string, ClearPassword> => {
  const passwordStr = ClearPassword.unwrap(password)
  if (passwordStr.length < 8) {
    return Either.left('Le mot de passe doit contenir au moins 8 caractères')
  }
  if (!containsUpperLowerDigit(passwordStr)) {
    return Either.left(
      'Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre',
    )
  }
  return Either.right(password)
}

const containsUpperLowerDigit = (str: string): boolean => {
  const chars = str.split('')
  return containsLower(chars) && containsUpper(chars) && containsDigit(str)
}

const containsLower: (chars: List<string>) => boolean = List.exists(c => c.toLowerCase() === c)
const containsUpper: (chars: List<string>) => boolean = List.exists(c => c.toUpperCase() === c)
const digitsRegex = /[0-9]/
const containsDigit = (str: string): boolean => digitsRegex.test(str)
