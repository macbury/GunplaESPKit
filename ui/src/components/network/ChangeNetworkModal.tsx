import { Modal, Autocomplete, ActionIcon, PasswordInput, Group, Button, Text, rem, Drawer } from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconWifi, IconReload } from "@tabler/icons-react";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect } from "react";
import { useIsMobile } from "../../hooks/mobile";
import { useAppStore } from "../../stores";

export const ChangeNetworkModal = observer(() => {
  const { network, protocol } = useAppStore()
  const isMobile = useIsMobile();

  const form = useForm({
    initialValues: {
      SSID: '',
      password: ''
    }
  });

  const connectToWiFi = useCallback(async (e) => {
    e.preventDefault()
    try {
      await network.connect(
        form.values.SSID,
        form.values.password
      )
    } finally {
      network.close()
    }
  }, [form, network])

  useEffect(() => {
    if (network.opened) {
      network.load()
    } else {
      form.reset()
    }
  }, [network.opened])

  const networks = network.all.map((network) => ({
    value: `n:${network.SSID}:${network.id}`,
    label: network.SSID
  }))

  useEffect(() => {
    if (!network.opened && !protocol.network.connected) {
      const id = notifications.show({
        autoClose: true,
        color: "violet",
        title: "No WiFi connection detected",
        message: (
          <>
            <Text size="sm" mb="xs">Please configure your WiFi settings.</Text>
            <Button
              variant="light"
              color="teal"
              onClick={() => {
                notifications.hide(id)
                network.open()
              }}
              size="xs">
              Configure WiFi
            </Button>
          </>
        ),
        icon: <IconWifi style={{ width: rem(18), height: rem(18) }} />
      })
      return () => {
        notifications.hide(id)
      }
    }
  }, [network.opened, protocol.network.connected])

  const Dialog = isMobile ? Drawer : Modal

  return (
    <Dialog
      withCloseButton={!network.connecting}
      opened={network.opened}
      onClose={network.close}
      title="Join WiFi Network"
      centered
      radius="lg"
      offset={20}
      size={isMobile ? 270 : "md"}
      position="bottom"
      fullScreen={isMobile}>
      <form onSubmit={connectToWiFi}>
        <Autocomplete
          data-autofocus
          label="SSID"
          placeholder="SSID"
          leftSection={<IconWifi size={20} />}
          rightSection={<ActionIcon radius="xl" variant="transparent" loading={network.loading} onClick={network.load}><IconReload size={20} /></ActionIcon>}
          data={networks}
          {...form.getInputProps('SSID')}
        />

        <PasswordInput
          mt="md"
          label="Password"
          placeholder="" {...form.getInputProps('password')} />

        <Group justify="right" mt="md">
          <Button type="submit" loading={network.connecting}>Connect</Button>
        </Group>
      </form>
    </Dialog>
  )
});
