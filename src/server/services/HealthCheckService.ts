import type { HealthCheckPersistence } from '../persistence/HealthCheckPersistence'

type HealthCheckService = Readonly<ReturnType<typeof HealthCheckService>>

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const HealthCheckService = (healthCheckPersistence: HealthCheckPersistence) => {
  const { check } = healthCheckPersistence

  return { check }
}

export { HealthCheckService }
