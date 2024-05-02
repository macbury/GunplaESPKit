import React, { useCallback, useEffect, useState } from 'react'
import { modals } from '@mantine/modals';
import { observer } from "mobx-react-lite";
import { Button, Title, Paper, Text, Menu, List, ThemeIcon, Alert, Tooltip } from '@mantine/core';
import { IconAlertCircle, IconBluetooth, IconUsb } from  "@tabler/icons-react";
import classes from './StartScreen.module.css';
import { useAppStore, Screen } from '../stores';
import { useIsMobile } from '../hooks/mobile';
import version from "../firmware/version?raw"
import ForkCorner from '../components/ForkCorner';
import VideoInfo from '../components/VideoInfo';
import { ConnectionFailureModal } from '../components/ConnectionFailureModal';

const ConditionalTooltip = ({ children, label, disabled }) => {
  if (disabled) {
    return (
      <Tooltip label={label}>
        {children}
      </Tooltip>
    )
  }

  return children
}

const StartScreen = observer(() => {
  const [loading, setLoading] = useState(false);
  const isMobile = useIsMobile();
  const app = useAppStore();

  useEffect(() => {
    app.protocol.cleanup()
  }, [app])

  const goToConnectBtScreen = useCallback(async () => {
    try {
      setLoading(true)
      if (await app.protocol.openDevice()) {
        app.changeScreen(Screen.ConnectToBluetoothDevice)
      }
    } catch(e) {
      console.error(e)
    }
    setLoading(false)
  }, [app, setLoading])

  const tryToOpenDevice = useCallback(async () => {
    try {
      await app.firmware.openDevice();
    } catch (e) {
      modals.open({
        title: "No port selected",
        centered: true,
        fullScreen: isMobile,
        children: (
          <>
            <Text size="md" mb="sm">
              If you didn't select a port because you didn't see your device listed, try the following steps:
            </Text>
            <List type="ordered" withPadding mr="md">
              <List.Item mb="xs">
                Make sure that the device is connected to this computer (the one that runs the browser that shows this website)
              </List.Item>
              <List.Item mb="xs">
                Most devices have a tiny light when it is powered on. If yours has one, make sure it is on.
              </List.Item>
              <List.Item mb="xs">
                Make sure that the USB cable you use can be used for data and is not a power-only cable.
              </List.Item>
            </List>
          </>
        )
      })
      throw e
    }
  }, [app, isMobile])

  const goToInstallFirmwareScreen = useCallback(async () => {
    setLoading(true)
    try {
      modals.openConfirmModal({
        title: "Prepare your board",
        centered: true,
        closeOnConfirm: true,
        closeOnCancel: true,
        labels: { confirm: 'I have pressed boot button', cancel: 'Cancel' },
        onCancel: () => app.firmware.cleanup(),
        onConfirm: async () => {
          await tryToOpenDevice()
          app.changeScreen(Screen.InstallFirmware)
        },
        children: (
          <Text size="md">
            Please ensure that your device has a button labeled <b>'Boot'</b> or <b>'Flash'</b>. Press the button multiple times to initiate the firmware installation process.
          </Text>
        )
      })
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }, [setLoading, tryToOpenDevice])

  return (
    <div className={classes.wrapper}>
      <ConnectionFailureModal
        enabled={loading} />
      <Paper className={classes.form} radius={isMobile ? 0 : "lg"} p={30} shadow="lg">
        <img src="/pwa-192x192.png" className={classes.logo} />
        <Title order={2} className={classes.title} ta="center">
          GunplaESPKit Manager
        </Title>
        <Text c="dimmed" ta="center" mb="50">{version}</Text>

        {app.features.missingBrowserFeatures && (
          <Alert variant="light" color="red" title="Not supported browser" mb="md" icon={<IconAlertCircle />}>
            Your browser is not fully supported. GunplaESPKit requires WebBluetooth and WebSerial to work. Currently, only Chromium-based browsers like Chromium, Google Chrome, and Microsoft Edge are fully supported. Brave and Opera have known issues with WebBluetooth implementation. Firefox and Safari are not supported at the moment.
          </Alert>
        )}

        <Menu shadow="md" width={200}>
          <Button.Group>
            <ConditionalTooltip label="Your browse has missing support for WebBluetooth" disabled={!app.features.hasBrowserBluetooth}>
              <Button
                disabled={!app.features.hasBrowserBluetooth}
                loading={loading}
                variant="light"
                fullWidth
                mb="md"
                size="lg"
                onClick={goToConnectBtScreen}
                leftSection={<IconBluetooth size={32} />}>
                Configure Device using Bluetooth
              </Button>
            </ConditionalTooltip>
            {/* <Menu.Target>
              <Button variant="filled" mb="md" size="md">
                <IconCaretDown />
              </Button>
            </Menu.Target> */}
          </Button.Group>
          {/* <Menu.Dropdown>
            <Menu.Item>
              Gundam Exia
              <Text size="xs" c="dimmed">
                GunplaESPKit: 82DC
              </Text>
            </Menu.Item>
          </Menu.Dropdown> */}
        </Menu>

        <ConditionalTooltip label="Your browse has missing support for WebSerial" disabled={!app.features.hasBrowserSerial}>
          <Button
            disabled={!app.features.hasBrowserSerial}
            color="red"
            loading={loading}
            variant="light"
            fullWidth
            size="lg"
            onClick={goToInstallFirmwareScreen}
            leftSection={<IconUsb size={32} />}>
            Prepare new device using USB
          </Button>
        </ConditionalTooltip>

        <VideoInfo />
        <Text mt="lg">
          Control your Gunpla LEDs with the ESP32 micro controller using HomeKit or Home Assistant.
          <b> GunplaESPKit</b> empowers you to easily set up and manage your ESP32 device, install updates, all from the convenience of your web browser.
          With GunplaESPKit, you have full control over each LED, enabling you to create stunning lighting effects and bring your Gunpla to life:
        </Text>
        <ul>
          <li>Simple on/off control for each LED.</li>
          <li>Adjust the brightness of each LED.</li>
          <li>Create dynamic lighting effects with a NeoPixel RGB light strip.</li>
        </ul>
      </Paper>

      <ForkCorner />
    </div>
  )
});

export default StartScreen
