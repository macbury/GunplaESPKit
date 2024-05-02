import React, { useEffect } from 'react';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import { createTheme, MantineProvider } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import { Notifications } from '@mantine/notifications';
import { Analytics } from '@vercel/analytics/react';
import { ErrorBoundary } from 'react-error-boundary';
import CrashFallback from './components/CrashFallback';
import ReloadPrompt from './components/ReloadPrompt';
import { useIsMobile } from './hooks/mobile';
import { AppStoreProvider } from './stores';
import Screens from './screens';


function App() {
  const isMobile = useIsMobile()

  const theme = createTheme({
    defaultRadius: 'lg',
    primaryColor: "violet",
    focusRing: "auto"
  });

  return (
    <MantineProvider theme={theme} defaultColorScheme="dark">
      <ModalsProvider>
        <ErrorBoundary fallback={<CrashFallback />}>
          <AppStoreProvider>
            <Notifications
              autoClose={15 * 1000}
              bottom={isMobile ? 90 : 10} />
            <ReloadPrompt />
            <Analytics />
            <Screens />
          </AppStoreProvider>
        </ErrorBoundary>
      </ModalsProvider>
    </MantineProvider>
  )
}

export default App
