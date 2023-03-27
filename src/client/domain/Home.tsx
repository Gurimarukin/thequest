import React from 'react'

import { MainLayout } from '../components/mainLayout/MainLayout'

export const Home = (): JSX.Element => (
  <MainLayout>
    <div className="flex h-full items-center justify-center">
      <h1 className="font-mono text-2xl">La Quête.</h1>
    </div>
  </MainLayout>
)
