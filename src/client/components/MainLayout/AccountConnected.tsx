import { pipe } from 'fp-ts/function'
import React, { useCallback, useState } from 'react'

import type { UserView } from '../../../shared/models/api/user/UserView'
import { Future } from '../../../shared/utils/fp'

import { apiUserLogoutPost } from '../../api'
import { useUser } from '../../contexts/UserContext'
import { PersonFilled } from '../../imgs/svgIcons'
import { futureRunUnsafe } from '../../utils/futureRunUnsafe'
import { ClickOutside } from '../ClickOutside'
import { Menu } from './Menu'

type AccountConnectedProps = {
  readonly user: UserView
}
export const AccountConnected = ({ user }: AccountConnectedProps): JSX.Element => {
  const { refreshUser } = useUser()

  const [menuIsVisible, setMenuIsVisible] = useState(false)
  const toggleMenu = useCallback(() => setMenuIsVisible(v => !v), [])
  const hideMenu = useCallback(() => setMenuIsVisible(false), [])

  const disconnect = useCallback(
    () => pipe(apiUserLogoutPost, Future.map(refreshUser), futureRunUnsafe),
    [refreshUser],
  )

  return (
    <ClickOutside onClickOutside={hideMenu}>
      <div>
        <button type="button" onClick={toggleMenu} className="flex items-end gap-3 py-2">
          <span>{user.userName}</span>
          <PersonFilled className="h-7 fill-wheat" />
        </button>
        {menuIsVisible ? (
          <Menu>
            <ul className="flex flex-col gap-[2px]">
              <li>
                <button
                  type="button"
                  onClick={disconnect}
                  className="bg-goldenrod py-1 px-4 text-black hover:bg-goldenrod/75"
                >
                  Déconnexion
                </button>
              </li>
            </ul>
          </Menu>
        ) : null}
      </div>
    </ClickOutside>
  )
}
