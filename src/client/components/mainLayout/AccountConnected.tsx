/* eslint-disable functional/no-expression-statements */
import { task } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { useCallback, useState } from 'react'

import type { UserView } from '../../../shared/models/api/user/UserView'
import { Future } from '../../../shared/utils/fp'

import { apiUserLogoutPost } from '../../api'
import { useUser } from '../../contexts/UserContext'
import { PersonFilled } from '../../imgs/svgIcons'
import { futureRunUnsafe } from '../../utils/futureRunUnsafe'
import { ClickOutside } from '../ClickOutside'
import { Loading } from '../Loading'
import { Menu } from './Menu'

type AccountConnectedProps = {
  user: UserView
}

export const AccountConnected: React.FC<AccountConnectedProps> = ({ user }) => {
  const { refreshUser } = useUser()

  const [menuIsVisible, setMenuIsVisible] = useState(false)
  const toggleMenu = useCallback(() => setMenuIsVisible(v => !v), [])
  const hideMenu = useCallback(() => setMenuIsVisible(false), [])

  const [isLoading, setIsLoading] = useState(false)

  const disconnect = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      setIsLoading(true)
      return pipe(
        apiUserLogoutPost,
        Future.chain(() => refreshUser),
        task.chainFirstIOK(() => () => setIsLoading(false)),
        futureRunUnsafe,
      )
    }, // TODO: handle error
    [refreshUser],
  )

  return (
    <ClickOutside onClickOutside={hideMenu}>
      <div>
        <button type="button" onClick={toggleMenu} className="flex items-end gap-3 py-2">
          <span>{user.userName}</span>
          <PersonFilled className="h-7 text-wheat" />
        </button>
        {menuIsVisible ? (
          <Menu>
            <ul className="flex flex-col gap-0.5">
              <li>
                <button
                  type="button"
                  onClick={disconnect}
                  disabled={isLoading}
                  className="flex items-center gap-2 bg-goldenrod px-4 py-1 text-black hover:bg-goldenrod/75 disabled:bg-grey-disabled"
                >
                  Déconnexion {isLoading ? <Loading className="h-4" /> : null}
                </button>
              </li>
            </ul>
          </Menu>
        ) : null}
      </div>
    </ClickOutside>
  )
}
