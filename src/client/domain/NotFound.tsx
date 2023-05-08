import { Link } from '../components/Link'
import { appRoutes } from '../router/AppRouter'

export const NotFound: React.FC = () => (
  <div className="flex flex-col items-center gap-4 p-6">
    <p className="text-xl">Cette page n’existe pas.</p>
    <Link to={appRoutes.index} className="underline">
      Accueil
    </Link>
  </div>
)
