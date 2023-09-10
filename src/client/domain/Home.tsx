import { MainLayout } from '../components/mainLayout/MainLayout'
import { useTranslation } from '../contexts/TranslationContext'

export const Home: React.FC = () => {
  const { t } = useTranslation('home')
  return (
    <MainLayout>
      <div className="grid h-full grid-rows-[1fr_auto] justify-center gap-3 p-3">
        <h1 className="self-center justify-self-center font-mono text-2xl">{t.theQuest}</h1>
        <p className="text-2xs">{t.isntEndorsed}</p>
      </div>
    </MainLayout>
  )
}
