import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@sovereignsquad/gds-theme/styles.css'
// Opt-in date-component styles (issue 433): the playground renders GdsDate* components,
// so it imports dates.css in addition to styles.css. Consumers not using date
// components need neither this import nor @mantine/dates/dayjs installed.
import '@sovereignsquad/gds-theme/dates.css'
// Opt-in map styles: the playground renders GdsMap, whose engine lays tiles out through CSS.
// Without this the tiles load but fall into normal document flow, which reads as a map that
// never loaded. Consumers not using the map subpath need neither this import nor leaflet.
import '@sovereignsquad/gds-core/map.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
