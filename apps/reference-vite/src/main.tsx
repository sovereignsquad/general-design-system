import React from 'react';
import ReactDOM from 'react-dom/client';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import { GdsProvider, gdsDarkPublicTheme } from '@gds/theme/client';
import { App } from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GdsProvider theme={gdsDarkPublicTheme} defaultColorScheme="dark">
      <App />
    </GdsProvider>
  </React.StrictMode>,
);
