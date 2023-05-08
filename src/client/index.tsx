import { createRoot } from 'react-dom/client'

import { App } from './App'

const rootEltId = 'root'
const rootElt = document.getElementById(rootEltId)

if (rootElt === null) {
  // eslint-disable-next-line functional/no-throw-statements
  throw Error(`root element not found: #${rootEltId}`)
}

const root = createRoot(rootElt)

// eslint-disable-next-line functional/no-expression-statements
root.render(<App />)
