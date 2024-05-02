import React from 'react';
import { observer } from "mobx-react-lite";
import { Text, Group, Button, Card, Badge } from '@mantine/core';
import { IconWifi } from '@tabler/icons-react';
import { useAppStore } from '../../stores';
import { getWifiSignalQuality } from '../WiFiIcon';

export const ChangeNetworkTab = observer(() => {
  const { protocol, network } = useAppStore()

  return (
    <Card withBorder shadow="md" w={340}>
      <Card.Section withBorder inheritPadding py="xs">
        <Group justify="space-between">
          <Text fw={500}>WiFi</Text>
          <Badge color={protocol.network?.connected ? 'green' : 'red'}>{protocol.network?.connected ? 'Connected' : 'Disconnected'}</Badge>
        </Group>
      </Card.Section>
      <Card.Section withBorder inheritPadding py="xs">
        <Text size="sm">
          <b>SSID:</b><br/>{protocol.network?.ssid || '...'}<br/>
          <b>IP:</b><br/>{protocol.network?.ip || '...'}<br/>
          <b>MAC:</b><br/>{protocol.network?.mac || '...'}<br/>
          <b>Hostname:</b><br/>{protocol.network?.hostname || '...'}<br/>
          <b>Signal strength:</b><br/>{getWifiSignalQuality(protocol.network?.rssi)}<br/>
        </Text>
      </Card.Section>
      <Button mt="md" onClick={network?.open} leftSection={<IconWifi size={24} />}>Change Network</Button>
    </Card>
  )
})
