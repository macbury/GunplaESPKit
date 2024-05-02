import { observer } from "mobx-react-lite"
import { Card, Group, Text } from "@mantine/core"
import { useAppStore } from "../../stores"
import { convertMillisecondsToTime } from "../../utils/time"

export const SystemCard = observer(() => {
  const { manageDevice, protocol, features } = useAppStore()
  if (!features.hasSystemInfo) {
    return
  }

  const esp = manageDevice.systemInfo.esp

  return (
    <Card withBorder shadow="md" mb={60} w={340}>
      <Card.Section withBorder inheritPadding py="xs">
        <Group justify="space-between">
          <Text fw={500}>System</Text>
        </Group>
      </Card.Section>
      <Card.Section withBorder inheritPadding py="xs">
        <Text size="sm">
          <b>Chip Model:</b><br/>{esp.model}<br />
          <b>Chip Revision:</b><br/>{esp.revision}<br />
          <b>Board:</b><br/>{esp.board}<br />
          <b>Board Variant:</b><br/>{esp.variant}<br />
          <b>Uptime:</b><br/>{convertMillisecondsToTime(protocol.network.uptime)}<br/>
        </Text>
      </Card.Section>
    </Card>
  )
})
