import { createEnum } from '../../../utils/createEnum'

type LeagueMiniSeriesProgress = typeof LeagueMiniSeriesProgress.T

const e = createEnum('W', 'L', 'N')

const LeagueMiniSeriesProgress = e

export { LeagueMiniSeriesProgress }
