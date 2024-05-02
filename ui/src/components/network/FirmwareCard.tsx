import { observer } from "mobx-react-lite"
import { Card, Group, Switch, Text, Tooltip } from "@mantine/core"
import { useAppStore } from "../../stores"
import { UpdateFirmwareButton } from "../firmware/UpdateFirmwareButton"

export const FirmwareCard = observer(() => {
  const { manageDevice, protocol, features, ota } = useAppStore()
  if (!features.hasSystemInfo) {
    return
  }

  const esp = manageDevice.systemInfo.esp

  return (
    <Card withBorder shadow="md" w={340}>
      <Card.Section withBorder inheritPadding py="xs">
        <Group justify="space-between">
          <Text fw={500}>Firmware</Text>
        </Group>
      </Card.Section>
      <Card.Section withBorder inheritPadding py="xs">
        <Text size="sm">
          <Tooltip label={`${ota.currentBuildVersion} - ${ota.chip}`}>
            <span>
              <b>Version:</b><br/>{protocol.currentVersion} {ota.isUpdateAvailable && "(Update required)"}<br/>
            </span>
          </Tooltip>
          <b>Hash:</b><br/>{esp.md5.toLocaleUpperCase()}<br/>
          <b>Git Ref:</b><br/><a href="#">{'...'}</a>
        </Text>
      </Card.Section>
      <UpdateFirmwareButton />
      {/* <UploadFirmwareButton /> */}
      <Card.Section inheritPadding py="xs" withBorder>
        <Switch
          checked={ota.insecure}
          label="Enable insecure connection"
          description="Allow to download firmware from unsecure location"
          onChange={(event) => ota.setInsecure(event.currentTarget.checked)}
        />
      </Card.Section>
    </Card>
  )
})
