import type { Config } from 'jest'
import { createDefaultEsmPreset } from 'ts-jest'

const presetConfig = createDefaultEsmPreset()

export default {
  ...presetConfig,
  testEnvironment: 'node',
  modulePathIgnorePatterns: ['.docker-data'],
  roots: ['test'],
} satisfies Config
