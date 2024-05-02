import React, { useLayoutEffect, useState } from 'react'
import { observer } from "mobx-react-lite";
import { modals } from '@mantine/modals';
import { IconCpu } from '@tabler/icons-react';
import { Container, Stepper, Title, Text, Code, Group, ThemeIcon, Paper } from '@mantine/core';
import { useAppStore, Screen } from '../stores';
import { useIsMobile } from '../hooks/mobile';
import classes from "./StartScreen.module.css"
import { track } from '@vercel/analytics';

const ConnectToBluetoothDeviceScreen = observer(() => {
  const app = useAppStore();
  const isMobile = useIsMobile();
  const [step, setStep] = useState(0);

  useLayoutEffect(() => {
    const connect = async () => {
      try {
        console.log("Reconnect");
        setStep(1)
        await app.protocol.reconnect()
        await app.protocol.check()
        setStep(2)
        console.log("Load config");
        if (!await app.manageDevice.loadConfig()) {
          app.changeScreen(Screen.FirstDeviceSetup);
          return;
        }
        setStep(3)
        console.log("Load system info");
        await app.manageDevice.loadSystemInfo()
        setStep(4)
        console.log("Load accessories");
        await app.accessories.load()
        await app.preview.load()

        const {
          esp: { variant, model }
        } = app.manageDevice.systemInfo

        /// Track some information about what version device is using
        track('Manage', {
          variant,
          model,
          id: app.manageDevice.redactedMac.toUpperCase(),
          version: app.protocol.currentVersion
        })

        app.changeScreen(Screen.BluetoothDashboard)
      } catch (e) {
        console.error(e)
        modals.openConfirmModal({
          title: "Failed to connect to bluetooth device",
          centered: true,
          closeOnConfirm: true,
          closeOnCancel: true,
          labels: { confirm: 'Try again', cancel: 'Cancel' },
          onCancel: () => app.changeScreen(Screen.Start),
          onConfirm: () => connect(),
          children: (
            <>
              <Text size="sm">
                Could not connect to the Bluetooth device: <br/>
                <Code>{e.toString()}</Code>.
              </Text>
              <ul>
                <li>Make sure the device is plugged in and turned on.</li>
                <li>Ensure that the device is in close proximity to your device.</li>
                <li>Verify that the device has the proper version of firmware.</li>
                <li>Try restarting the device.</li>
                <li>Try unpair the device from your laptop/phone and then pair it again.</li>
              </ul>
            </>
          )
        })
      }
    }
    connect()

    return () => setStep(0)
  }, [setStep])

  return (
    <div className={classes.wrapper}>
      <Paper className={classes.form} radius={isMobile ? 0 : "lg"} p={30} shadow="lg">
        <Container size="xs">
          <Group justify="center">
            <ThemeIcon radius="xl" size="xl" color="violet">
              <IconCpu style={{ width: '70%', height: '70%' }} />
            </ThemeIcon>
          </Group>
          <Title order={2} ta="center" mt="md">
            GunplaESPKit Manager
          </Title>
          <Text mb={40} c="dimmed" ta="center">
            Connecting to: {app.protocol.name}
          </Text>
          <Stepper active={step} orientation="vertical">
            <Stepper.Step
              loading={step == 1}
              label="Step 1"
              description={`Connecting... Default pin is: 123456`} />
            <Stepper.Step
              loading={step == 2}
              label="Step 2"
              description="Loading config..." />
            <Stepper.Step
              loading={step == 3}
              label="Step 3"
              description="Loading accessories..." />
            <Stepper.Step
              loading={step == 4}
              label="Step 4"
              description="Loading system info..." />
          </Stepper>
        </Container>
      </Paper>
    </div>
  )
})

export default ConnectToBluetoothDeviceScreen
