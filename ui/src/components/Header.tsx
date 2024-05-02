import React, { useCallback, useState } from 'react'
import { observer } from "mobx-react-lite";
import { modals } from '@mantine/modals';
import { ActionIcon, Group, Menu, Text, ThemeIcon, Title, rem } from '@mantine/core';
import classes from "./Header.module.css";
import { IconDotsVertical, IconPower, IconReload, IconInfoCircle } from '@tabler/icons-react';
import { Screen, useAppStore } from '../stores';
import { REPO_URL } from './ForkCorner';
import { useDocumentTitle } from '@mantine/hooks';
import { WiFiIcon } from './WiFiIcon';

const Header = observer(() => {
  const app = useAppStore();

  const onDisconnect = useCallback(() => {
    app.changeScreen(Screen.Start);
  }, [app])

  const onReboot = useCallback(async () => {
    modals.openConfirmModal({
      title: "Reboot device",
      centered: true,
      closeOnConfirm: true,
      closeOnCancel: true,
      labels: { confirm: 'Restart', cancel: 'Cancel' },
      onConfirm: async () => {
        try {
          await app.protocol.rpc.reboot()
        } finally {
          app.changeScreen(Screen.Start)
        }
      },
      children: (
        <Text size="sm">
          Are you sure you want to restart this device? All unsaved changes will be lost.
        </Text>
      )
    })
  }, []);

  useDocumentTitle(`${app.manageDevice.config.name} - GunplaESPKit`);

  return (
    <header className={classes.header}>
      <div className={classes.inner}>
        <Group>
          <ThemeIcon variant="default" radius="xl">
            <img src="/pwa-64x64.png" className={classes.logo} />
          </ThemeIcon>
          <Text fw={700}>{app.manageDevice.config.name}</Text>
          {/* <Text truncate="end" c="dimmed">GunplaESPKit</Text> */}
        </Group>

        <Group>
          <ActionIcon variant="subtle" color="gray" onClick={app.network.open}>
            <WiFiIcon network={app.protocol.network} stroke={1.5} />
          </ActionIcon>
          <Menu shadow="md" width={200} position="left-start" offset={11} withArrow arrowPosition="center">
            <Menu.Target>
              <ActionIcon variant="subtle" color="gray">
                <IconDotsVertical style={{ width: '70%', height: '70%' }} stroke={1.5} />
              </ActionIcon>
            </Menu.Target>

            <Menu.Dropdown>
              <Menu.Item onClick={onDisconnect} leftSection={<IconPower style={{ width: rem(14), height: rem(14) }} />}>
                Disconnect
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item onClick={onReboot} leftSection={<IconReload style={{ width: rem(14), height: rem(14) }} />}>
                Restart
              </Menu.Item>
              <Menu.Item component="a" target="_blank" href={REPO_URL} leftSection={<IconInfoCircle style={{ width: rem(14), height: rem(14) }} />}>
                About
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </div>
    </header>
  )
});

export default Header
