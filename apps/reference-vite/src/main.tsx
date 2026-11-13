import React from 'react';
import ReactDOM from 'react-dom/client';
import '@sovereignsquad/gds-theme/styles.css';
import { GdsProvider, gdsDarkPublicTheme } from '@sovereignsquad/gds-theme/client';
import { App } from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GdsProvider theme={gdsDarkPublicTheme} defaultColorScheme="dark">
      <App />
    </GdsProvider>
  </React.StrictMode>,
);
