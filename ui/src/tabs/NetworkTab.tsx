import React from 'react'
import { observer } from "mobx-react-lite";
import { Flex } from '@mantine/core';
import { ChangeNetworkTab } from '../components/network/ChangeNetworkCard';
import { PairCard } from '../components/network/PairCard';
import { BluetoothCard } from '../components/network/BluetoothCard';
import { FirmwareCard } from '../components/network/FirmwareCard';
import { SystemCard } from '../components/network/SystemCard';

const NetworkTab = observer(() => {
  return (
    <Flex
      gap="lg"
      justify="center"
      align="flex-start"
      direction="row"
      p="xs"
      mt={60}
      pb={60}
      wrap="wrap">

      <ChangeNetworkTab />
      <BluetoothCard />
      <FirmwareCard />
      <SystemCard />
    </Flex>
  )
})

export default NetworkTab
