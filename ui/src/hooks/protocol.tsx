import { useEffect, useCallback } from "react";
import { Text } from "@mantine/core";
import { modals } from '@mantine/modals';
import { useAppStore, Screen } from "../stores";

export function useOnBluetoothDisconnect(enabled : boolean = true) {
  const app = useAppStore();

  const handleDisconnect = useCallback(() => {
    // TODO: use store for reconnect?
    // show options
    modals.openConfirmModal({
      title: "GunplaESPKit bluetooth connection failed",
      centered: true,
      closeOnConfirm: true,
      closeOnCancel: true,
      labels: { confirm: 'Try to reconnect', cancel: 'Disconnect' },
      onCancel: () => app.changeScreen(Screen.Start),
      onConfirm: () => app.protocol.reconnect(),
      children: (
        <Text size="sm">
          Connection to the Bluetooth device has been lost.
        </Text>
      )
    })
  }, [app])

  useEffect(() => {
    let handler = null;
    const callback = () => {
      handler = setTimeout(handleDisconnect, 1000);
    };
    if (enabled) {
      app.protocol?.device?.addEventListener('gattserverdisconnected', callback)
    }

    return () => {
      clearTimeout(handler);
      app.protocol?.device?.removeEventListener('gattserverdisconnected', callback)
    }
  }, [app, enabled])

  useEffect(() => {
    if (!app.features.hasPing) {
      return;
    }

    const ping = () => {
      app.protocol.rpc.ping()
    };

    const handler = setInterval(ping, 15000);
    return () => clearTimeout(handler)
  }, [app])
}
