import React, { useEffect } from 'react';
import { notifications } from '@mantine/notifications';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Button, Text, rem } from '@mantine/core';
import { IconAppWindow } from '@tabler/icons-react';

const intervalMS = 60 * 60 * 1000

export default function ReloadPrompt() {
  const {
    offlineReady: [offlineReady],
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      // eslint-disable-next-line prefer-template
      console.log('SW Registered: ', r)
      r && setInterval(() => {
        r.update()
      }, intervalMS)
    },
    onRegisterError(error) {
      console.log('SW registration error', error)
    },
  })

  useEffect(() => {
    if (needRefresh) {
      notifications.show({
        title: 'New version of this page',
        color: 'blue',
        autoClose: false,
        message: (
          <>
            <Text size="sm" mb="xs">
              A new version of this page is available with updated features.
            </Text>
            <Button
              variant="light"
              color="blue"
              onClick={() => {
                notifications.clean()
                updateServiceWorker(true)
              }}
              size="xs">
              Reload Page Now
            </Button>
          </>
        ),
        icon: <IconAppWindow style={{ width: rem(18), height: rem(18) }} />
      })
    }
  }, [needRefresh])

  // useEffect(() => {
  //   if (offlineReady) {
  //     const id = notifications.show({
  //       loading: true,
  //       autoClose: false,
  //       message: "Updating... Please wait new version of page will be ready in a second..."
  //     })

  //     return () => { notifications.hide(id) }
  //   }
  // }, [offlineReady])

  return null
}
