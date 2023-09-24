import { Link } from '../components/Link'
import { useTranslation } from '../contexts/TranslationContext'
import { appRoutes } from '../router/AppRouter'

export const NotFound: React.FC = () => {
  const { t } = useTranslation('notFound')
  return (
    <div className="flex flex-col items-center gap-4 p-6">
      <p className="text-xl">{t.thisPageDoesntExist}</p>
      <Link to={appRoutes.index} className="text-lg underline">
        {t.home}
      </Link>
    </div>
  )
}
