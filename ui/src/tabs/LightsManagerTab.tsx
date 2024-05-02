import React, { useState } from 'react'
import { observer } from "mobx-react-lite";
import { Box, SegmentedControl, Center, rem, Group } from '@mantine/core';
import { IconHomeEdit, IconSmartHome, IconSourceCode } from '@tabler/icons-react';

import { UIEditor } from '../components/lights/UIEditor';
import { CodeEditor } from '../components/lights/CodeEditor';
import { useIsMobile } from '../hooks/mobile';
import { LightsPreview } from '../components/lights/LightsPreview';
import { useAppStore } from '../stores';

type Tab = 'manage' | 'edit' | 'code'

const LightsManagerTab = observer(() => {
  const { features, preview } = useAppStore();
  // TODO: load tab from app store?
  const [tab, setTab] = useState<Tab>(features.hasLightManagement && preview.isPresent ? 'manage' : 'edit'); //TODO: defaultOpened only if no lights
  const isMobile = useIsMobile();
  const iconStyle = { width: rem(16), height: rem(16) }

  return (
    <>
      <Box maw={isMobile ? "100%" : 960} mt={isMobile ? 0 : 60} mx="auto" mb="lg">
        <Group justify={isMobile ? "center" : "right"}>
          <SegmentedControl
            m="xs"
            ml={isMobile ? "xs" : 0}
            value={tab}
            onChange={setTab}
            data={[
              {
                value: 'manage',
                disabled: !features.hasLightManagement,
                label: (
                  <Center style={{ gap: 10 }}>
                    <IconSmartHome style={iconStyle} />
                    <span>Control</span>
                  </Center>
                ),
              },
              {
                value: 'edit',
                label: (
                  <Center style={{ gap: 10 }}>
                    <IconHomeEdit style={iconStyle} />
                    <span>Edit</span>
                  </Center>
                ),
              },
              {
                value: 'code',
                label: (
                  <Center style={{ gap: 10 }}>
                    <IconSourceCode style={iconStyle} />
                    <span>Code</span>
                  </Center>
                ),
              },
            ]}
          />
        </Group>
        {tab == 'manage' && <LightsPreview isMobile={isMobile} />}
        {tab == 'edit' && <UIEditor isMobile={isMobile} />}
        {tab == 'code' && <CodeEditor isMobile={isMobile} />}
      </Box>
    </>
  )
})

export default LightsManagerTab
