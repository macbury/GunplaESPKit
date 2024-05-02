import { observer } from "mobx-react-lite"
import { Container, Progress, Title, Text, Button, Group, ThemeIcon } from "@mantine/core"
import { FirmwareUpdate, Screen, useAppStore } from "../stores"
import { IconMoodSmile, IconReload, IconSmoking, IconX } from "@tabler/icons-react"
import { useCallback, useMemo, useState } from "react"
import { sleep } from "../utils/time"

const OTAUpdateScreen = observer(() => {
  const { ota, protocol } = useAppStore()
  const app = useAppStore()
  const [loading, setLoading] = useState(false)

  const color = useMemo(() => {
    switch (ota.state) {
      case FirmwareUpdate.Done:
        return "green"
      case FirmwareUpdate.Failure:
        return "red"
      default:
        return "blue"
    }
  }, [ota.state])

  const icon = useMemo(() => {
    const style = { width: '70%', height: '70%' };
    switch (ota.state) {
      case FirmwareUpdate.Done:
        return <IconMoodSmile style={style} />
      case FirmwareUpdate.Failure:
        return <IconX style={style} />
      default:
        return <IconSmoking style={style} />
    }
  }, [ota.state])

  const restartDevice = useCallback(async () => {
    setLoading(true)
    try {
      await protocol.rpc.reboot()
    } finally {
      await sleep(10 * 1000)
      app.changeScreen(Screen.Start)
    }
  }, [setLoading, protocol, app])

  return (
    <Container size="xs" mt="lg">
      <Group justify="center" mt="60">
        <ThemeIcon radius="xl" size="xl" color={color}>
          {icon}
        </ThemeIcon>
      </Group>
      <Title order={2} ta="center" mt="md" mb="xs">
        Update GunplaESPKit Firmware
      </Title>
      <Text mb="lg" c="dimmed" ta="center">
        {protocol.currentVersion} → {ota.futureVersion}
      </Text>

      <Text>
        Please wait while the firmware is being updated in the background. This process may take some time and requires an internet connection. Please do not reset the board or close the window.
      </Text>
      <Progress radius="xl" size="xl" mt={30} mb="xs" value={ota.progress * 100.0} />
      {ota.isError && <Text c="red"><b>Failed to update firmware</b></Text>}

      <Group justify="center" mt={30}>
        <Button radius="xl" size="lg" disabled={ota.isRunning} color={color} loading={loading} onClick={restartDevice} leftSection={<IconReload />}>
          {ota.isRunning ? ota.eta : "Restart Device"}
        </Button>
      </Group>
    </Container>
  )
})

export default OTAUpdateScreen
