import { useCallback, useState } from 'react'

import { appRoutes } from '../../router/AppRouter'
import { ClickOutside } from '../ClickOutside'
import { Link } from '../Link'
import { Menu } from './Menu'

export const AccountDisconnected: React.FC = () => {
  const [loginIsVisible, setLoginIsVisible] = useState(false)
  const toggleLogin = useCallback(() => setLoginIsVisible(v => !v), [])
  const hideLogin = useCallback(() => setLoginIsVisible(false), [])

  return (
    <ClickOutside onClickOutside={hideLogin}>
      <div>
        <button
          type="button"
          onClick={toggleLogin}
          className="border border-goldenrod bg-black px-4 py-1 hover:bg-goldenrod/75 hover:text-black"
        >
          Compte
        </button>
        {loginIsVisible ? (
          <Menu>
            <Link
              to={appRoutes.login}
              className="bg-goldenrod px-4 py-1 text-black enabled:hover:bg-goldenrod/75"
            >
              Connexion
            </Link>
            <div className="flex justify-center">
              <Link to={appRoutes.register} className="underline">
                Inscription
              </Link>
            </div>
          </Menu>
        ) : null}
      </div>
    </ClickOutside>
  )
}
