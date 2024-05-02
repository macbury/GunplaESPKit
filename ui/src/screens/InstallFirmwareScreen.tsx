import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react'
import { observer } from "mobx-react-lite";
import { modals } from '@mantine/modals';
import { IconCheck, IconCpu } from '@tabler/icons-react';
import { Container, Timeline, Text, Loader, Title, ThemeIcon, Progress, Button, Code, Group, SimpleGrid } from '@mantine/core';
import { Screen, useAppStore } from '../stores';
import { sleep } from '../utils/time';
import { InstallFirmwareState } from '../stores/FirmwareStore';
import { useIsMobile } from '../hooks/mobile';

const OkIcon = () => {
  return (
    <ThemeIcon
      size={22}
      color="green"
      radius="xl"
    >
      <IconCheck size="0.8rem" />
    </ThemeIcon>
  )
}

const Bullet = ({ target, active }) => {
  if (target == active) {
    return <Loader color="blue" />
  } else if (active > target) {
    return <OkIcon />
  } else {
    return null
  }
}

const InstallFirmwareScreen = observer(() => {
  const app = useAppStore()
  const [active, setActive] = useState(0);
  const isMobile = useIsMobile();
  const install = useCallback(async () => {
    try {
      const success = await app.firmware.start()
      if (success) {
        await sleep(2000)
      }
    } catch (e) {
      alert(e.toString())
      app.changeScreen(Screen.Start)
    }

  }, [app])

  const state = app.firmware.state;
  useEffect(() => {
    const states = [
      InstallFirmwareState.Pending,
      InstallFirmwareState.OpeningPort,
      InstallFirmwareState.DetectingChip,
      InstallFirmwareState.Downloading,
      InstallFirmwareState.Writing,
      InstallFirmwareState.Resetting,
      InstallFirmwareState.Success,
    ]
    setActive(states.indexOf(state))
  }, [state])

  const goToConnectBtScreen = useCallback(() => {
    modals.openConfirmModal({
      title: "Prepare your board",
      centered: true,
      closeOnConfirm: true,
      closeOnCancel: true,
      labels: { confirm: 'I have pressed reset button', cancel: 'Cancel' },
      onCancel: () => app.firmware.cleanup(),
      onConfirm: async () => {
        try {
          await app.protocol.openDevice(app.firmware.bluetoothName);
          app.changeScreen(Screen.ConnectToBluetoothDevice)
        } catch(e) {
          console.error(e)
        }
      },
      children: (
        <Text size="md">
          Please locate Reset button on your board and press it. You can also unplug your device and plug it again
        </Text>
      )
    })
  }, [app])

  useLayoutEffect(() => {
    install()
  }, [install]);

  return (
    <Container size={isMobile ? "xs" : "lg"} mt="lg" pb="lg">
      <Group justify="center" mt="60">
        <ThemeIcon radius="xl" size="xl" color="violet">
          <IconCpu style={{ width: '70%', height: '70%' }} />
        </ThemeIcon>
      </Group>
      <Title order={2} ta="center" mt="md" mb="lg">
        Install GunplaESPKit Firmware
      </Title>

      <SimpleGrid cols={isMobile ? 1 : 2}>
        <Timeline active={active} bulletSize={24} lineWidth={2}>
          <Timeline.Item title="Waiting for USB device" bullet={<Bullet target={0} active={active} />} lineVariant="dashed">
            <Text size="xs" mt={4}>
              It looks like ESP32 device that is connected, do not contain GunplaESPKit firmware.
              This will install a basic version of GunplaESPKit to your device and help you connect it to your network.
            </Text>
          </Timeline.Item>

          <Timeline.Item title="Connecting to USB device..." lineVariant="dashed" bullet={<Bullet target={1} active={active} />}>
            <Text size="xs" mt={4}>
              Please ensure that your device has a button labeled 'Boot' or 'Flash'. Press the button multiple times to initiate the firmware installation process.
            </Text>
          </Timeline.Item>

          <Timeline.Item title="Detecting chip" lineVariant="dashed" bullet={<Bullet target={2} active={active} />}>
            <Text size="xs" mt={4}>{app.firmware.chipId || '...'}</Text>
          </Timeline.Item>

          <Timeline.Item title="Downloading firmware" lineVariant="dashed" bullet={<Bullet target={3} active={active} />}>
            <Text size="xs" mt={4}>{active >= 3 ? "Please wait..." : "..."}</Text>
          </Timeline.Item>

          <Timeline.Item title={`Uploading firmware ${app.firmware.progress}%`} lineVariant="dashed" bullet={<Bullet target={4} active={active} />}>
            <Progress.Root radius="xl" size="xl" mt={10}>
              <Progress.Section value={app.firmware.progress}>
                <Progress.Label></Progress.Label>
              </Progress.Section>
            </Progress.Root>
            <Text size="xs" mt={4}>This will take 2 minutes. Keep this page visible to prevent slow down</Text>
          </Timeline.Item>

          <Timeline.Item title="Sending reset signal..." lineVariant="dashed" bullet={<Bullet target={5} active={active} />}>
            <Text size="xs" mt={4}>{active >= 5 ? "Please wait..." : "..."}</Text>
          </Timeline.Item>

          <Timeline.Item title="Finished" lineVariant="dashed" bullet={active == 6 && <OkIcon />}>
            <Text size="xs" mt={4}>
              You can now proceed to start screen and configuration over bluetooth! Press reset button before proceeding!. Device name is:
            </Text>
            <Code>
              {app.firmware.bluetoothName}
            </Code>
            <br/>
            <Button mt={8} disabled={active != 6} mr="xs" color='violet' onClick={goToConnectBtScreen}>Connect using bluetooth</Button>
            <Button mt={8} disabled={active != 6} variant="outline" onClick={() => app.changeScreen(Screen.Start)}>Go back to start screen</Button>
          </Timeline.Item>
        </Timeline>

        <Code block mah={600}>{app.firmware.logs}</Code>
      </SimpleGrid>

    </Container>
  )
})

export default InstallFirmwareScreen
