import React, { useEffect } from "react"
import { IconWifi, IconWifiOff, IconWifi1, IconWifi2, IconWifi0 } from "@tabler/icons-react"
import { WiFiState } from "../stores"
import { Tooltip, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";

export function getWifiSignalQuality(rssi: number) {
  if (rssi >= -50) {
    return `Excellent (${rssi} RSSI)`;
  } else if (rssi >= -60) {
    return `Good (${rssi} RSSI)`;
  } else if (rssi >= -70) {
    return `Fair (${rssi} RSSI)`;
  } else if (rssi >= -80) {
    return `Weak (${rssi} RSSI)`;
  } else {
    return `Very weak (${rssi || 0} RSSI)`;
  }
}

export interface IWiFiIconProps {
  network : WiFiState,
  className?: string
}

export function WiFiIcon({ network, ...props } : IWiFiIconProps) {
  const [opened, { toggle }] = useDisclosure(false);
  useEffect(() => {
    const handler = setInterval(toggle, 800)
    return () => clearTimeout(handler)
  }, [toggle])

  if (network?.connected) {
    let signalStrengthIcon = <IconWifiOff {...props} />

    if (network.rssi >= -50) {
      signalStrengthIcon = <IconWifi {...props} />
    } else if (network.rssi >= -60) {
      signalStrengthIcon = <IconWifi2 {...props} />
    } else if (network.rssi >= -70) {
      signalStrengthIcon = <IconWifi1 {...props} />
    } else if (network.rssi >= -80) {
      signalStrengthIcon = <IconWifi0 {...props} />
    }

    const label = (
      <Text ta="center">
        {network.ssid}<br />
        {getWifiSignalQuality(network.rssi)}
      </Text>
    )

    return (
      <Tooltip label={label}>
        {opened ? <IconWifi {...props} /> : signalStrengthIcon}
      </Tooltip>
    )
  } else {
    return (
      <Tooltip label="Disconnected">
        <IconWifiOff {...props} />
      </Tooltip>
    )
  }
}
