import React from 'react'
import { observer } from "mobx-react-lite";
import { Flex } from '@mantine/core';
import { PairCard } from '../components/network/PairCard';

const AutomationTab = observer(() => {
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

      <PairCard />
    </Flex>
  )
})

export default AutomationTab
