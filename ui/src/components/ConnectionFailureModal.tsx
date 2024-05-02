import React, { useCallback, useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { IconBluetooth, IconX } from "@tabler/icons-react";
import { useDisclosure } from "@mantine/hooks";
import { Alert, Button, Modal, Text, Title } from "@mantine/core";
import { useAppStore, Screen } from "../stores";

export interface IConnectionFailureModalProps {
  enabled?: boolean
}

export const ConnectionFailureModal = observer(({ enabled = true } : IConnectionFailureModalProps) => {
  const app = useAppStore()
  const { protocol, features } = useAppStore()
  const [opened, actions] = useDisclosure()
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false)

  const cancel = useCallback(() => {
    actions.close()
    app.changeScreen(Screen.Start)
    setError('')
  }, [app, actions])

  const reconnect = useCallback(async () => {
    try {
      setLoading(true)
      protocol.restart()
      const res = await protocol.reconnect(5)
      console.log("Finished reconnect", res);
      await protocol.check()
      actions.close()
      setError('')
    } catch (e) {
      console.error("Could not reconnect...", e);
      setError(e.toString())
    } finally {
      setLoading(false)
    }
  }, [setLoading, setError, protocol, actions])

  useEffect(() => {
    console.log('Configuring handle for', protocol.device);

    if (enabled) {
      protocol.device?.addEventListener('gattserverdisconnected', actions.open)
    }

    return () => {
      protocol.device?.removeEventListener('gattserverdisconnected', actions.open)
    }
  }, [protocol, actions, enabled, protocol?.device])

  useEffect(() => {
    if (!features.hasPing) {
      return;
    }

    const ping = () => {
      protocol.rpc.ping()
    };

    const handler = setInterval(ping, 15000);
    return () => clearTimeout(handler)
  }, [features, protocol])

  return (
    <Modal
      withCloseButton={false}
      onClose={close}
      opened={opened}
      centered>
        <Title size="lg">GunplaESPKit bluetooth connection failed</Title>
        <Text pt="md">
          Connection to the Bluetooth device has been lost.
          Please ensure that you are in close proximity to the device and check if it is powered on.
          Additionally, you can try the following steps to fix this issue:
        </Text>
        { error && <Alert title="Failed to reconnect" mt="md" variant="light" color="red">{error}</Alert> }
        <ol>
          <li>Restart the Bluetooth device and your device.</li>
          <li>Make sure that the Bluetooth device is not connected to any other device.</li>
          <li>Check if the Bluetooth device's battery is charged.</li>
        </ol>
        <Button loading={loading} onClick={reconnect} mb="sm" fullWidth variant="light" leftSection={<IconBluetooth size={24} />}>
          Reconnect
        </Button>
        <Button loading={loading} onClick={cancel} fullWidth variant="outline" color="red" leftSection={<IconX size={24} />}>
          Go back to start screen
        </Button>
    </Modal>
  )
});
