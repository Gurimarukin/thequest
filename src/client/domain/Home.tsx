/* eslint-disable functional/no-expression-statement */
import React, { useCallback, useState } from 'react'

import { Platform } from '../../shared/models/api/Platform'

import { MainLayout } from '../components/MainLayout'
import { Select } from '../components/Select'
import { useHistory } from '../contexts/HistoryContext'
import { appRoutes } from '../router/AppRouter'

export const Home = (): JSX.Element => {
  const { navigate } = useHistory()

  const [summonerName, setSummonerName] = useState('')
  const [platform, setPlatform] = useState<Platform>('EUW1')

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setSummonerName(e.target.value),
    [],
  )

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      navigate(appRoutes.platformSummonerName(platform, summonerName))
    },
    [navigate, platform, summonerName],
  )

  return (
    <MainLayout>
      <div className="h-full flex justify-center gap-4 items-center">
        <Select<Platform>
          options={Platform.values}
          value={platform}
          setValue={setPlatform}
          className="border border-goldenrod bg-black px-2 py-1"
        />
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={summonerName}
            onChange={handleChange}
            className="border border-goldenrod bg-transparent px-2 py-1"
          />
        </form>
      </div>
    </MainLayout>
  )
}
