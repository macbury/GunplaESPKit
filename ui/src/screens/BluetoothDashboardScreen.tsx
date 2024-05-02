import React, { useEffect } from 'react'
import { observer } from "mobx-react-lite";
import { notifications } from '@mantine/notifications';
import { Tabs, rem, Text, Button, AppShell } from '@mantine/core';
import { IconBulb, IconCpu2, IconSettings2, IconSmartHome } from '@tabler/icons-react';
import { Screen, useAppStore } from '../stores';
import Header from '../components/Header';
import LightsManagerTab from '../tabs/LightsManagerTab';
import NetworkTab from '../tabs/NetworkTab';
import classes from "./BluetoothDashbaordScreenScreen.module.css"
import { useIsMobile } from '../hooks/mobile';
import AutomationTab from '../tabs/AutomationTab';
import { ChangeNetworkModal } from '../components/network/ChangeNetworkModal';
import { ConnectionFailureModal } from '../components/ConnectionFailureModal';

const BluetoothDashboardScreen = observer(() => {
  const app = useAppStore();
  const isMobile = useIsMobile();
  const isDesktop = !isMobile;

  useEffect(() => {
    if (!app.ota.isPending) {
      app.changeScreen(Screen.OTAUpdate)
    }
  }, [app.ota.isPending])

  useEffect(() => {
    if (app.ota.isUpdateAvailable) {
      notifications.show({
        autoClose: 5000,
        title: 'Firmware Update',
        color: 'teal',
        message: (
          <>
            <Text size="sm" mb="xs">There is firmware update for this device</Text>
            <Button
              variant="light"
              color="teal"
              onClick={() => {
                notifications.clean()
                app.ota.start()
                app.changeScreen(Screen.OTAUpdate)
              }}
              size="xs">
              Update firmware now
            </Button>
          </>
        ),
        icon: <IconCpu2 style={{ width: rem(18), height: rem(18) }} />
      })

      return () => {
        notifications.clean()
      }
    }
  }, [app.ota.isUpdateAvailable])

  const tabs = (
    <Tabs.List grow={isMobile} className={classes.tabs}>
      <Tabs.Tab value="lights" leftSection={isDesktop && <IconBulb />}>
        {isMobile && <IconBulb className={classes.tabIcon} />}
        Accessories
      </Tabs.Tab>
      <Tabs.Tab value="automation" leftSection={isDesktop && <IconSmartHome />}>
        {isMobile && <IconSmartHome className={classes.tabIcon} />}
        Automation
      </Tabs.Tab>
      <Tabs.Tab value="wifi" leftSection={isDesktop && <IconSettings2 />}>
        {isMobile && <IconSettings2 className={classes.tabIcon} />}
        Settings
      </Tabs.Tab>
    </Tabs.List>
  )

  return (
    <div className={classes.container}>
      <Tabs radius="xs" defaultValue="lights" keepMounted={false} inverted={isMobile}>
        <AppShell header={{ height: isMobile ? 57 : 100 }} withBorder={isMobile}>
          <AppShell.Header className={classes.header}>
            <Header />
            {!isMobile && tabs}
          </AppShell.Header>
          <AppShell.Main className={classes.main}>
            <Tabs.Panel value="lights">
              <LightsManagerTab />
            </Tabs.Panel>
            <Tabs.Panel value="automation">
              <AutomationTab />
            </Tabs.Panel>
            <Tabs.Panel value="wifi">
              <NetworkTab />
            </Tabs.Panel>
          </AppShell.Main>
          <AppShell.Footer>
            {isMobile && tabs}
          </AppShell.Footer>
        </AppShell>
      </Tabs>
      <ChangeNetworkModal />
      <ConnectionFailureModal />
    </div>
  )
});

export default BluetoothDashboardScreen
