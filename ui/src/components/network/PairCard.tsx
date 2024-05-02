import { Card, Group, Badge, Input, Text, UnstyledButton } from "@mantine/core";
import { observer } from "mobx-react-lite";
import { QRCodeCanvas } from "qrcode.react";
import CopyCodeButton from "../CopyCodeButton";
import classes from './PairCard.module.css';
import { useAppStore } from "../../stores";
import configStartFlowImageUrl from "../../images/config_flow_start.svg";

const ADD_INTEGRATION_TO_HOME_ASSISTANT = "https://my.home-assistant.io/redirect/config_flow_start?domain=homekit_controller";

export const PairCard = observer(() => {
  const { manageDevice } = useAppStore()

  return (
    <Card withBorder shadow="md" w={340} mb={60}>
      <Card.Section withBorder inheritPadding py="xs">
        <Group justify="space-between">
          <Text fw={500}>HomeKit</Text>
          <Badge color="violet">{manageDevice.pairingCode}</Badge>
        </Group>
      </Card.Section>
      <Card.Section>
        <QRCodeCanvas value={manageDevice.homekitUri} size={340} includeMargin />
        {/* <Text c="dimmed" size="sm" py="xs" px="md">{manageDevice.homekitUri}</Text> */}
      </Card.Section>
      <Card.Section withBorder inheritPadding py="xs">
        <Text size="sm" c="dimmed" ta="center">
          Scan code using your iPhone.
          You should see there this device, pairing code is:
        </Text>
        <Input
          mt="sm"
          mb="sm"
          value={manageDevice.pairingCode}
          rightSectionPointerEvents="all"
          size="md"
          variant="filled"
          rightSection={<CopyCodeButton code={manageDevice.pairingCode} />}
        />
      </Card.Section>

      <Card.Section withBorder inheritPadding py="xs">
        <Text size="sm" c="dimmed" mb="sm" ta="center">
          Configure this device using <a href="https://home-assistant.io/">HomeAssistant</a>.
        </Text>
        <UnstyledButton component="a" href={ADD_INTEGRATION_TO_HOME_ASSISTANT} target="_blank" className={classes.ha}>
          <img src={configStartFlowImageUrl} alt="Add integration to my HomeAssistant" />
        </UnstyledButton>
      </Card.Section>
    </Card>
  )
});
