import { useCallback, useState } from "react";
import { observer } from "mobx-react-lite"
import { Button } from "@mantine/core"
import { IconCpu } from "@tabler/icons-react"
import { useAppStore } from "../../stores";

export const UpdateFirmwareButton = observer(() => {
  const { ota, protocol } = useAppStore()
  const [loading, setLoading] = useState(false)

  const startUpdate = useCallback(async () => {
    setLoading(true)
    await ota.start()
    setLoading(false)
  }, [ota, setLoading])

  const disabled = !(ota.isUpdateAvailable && protocol.network.connected);

  return (
    <Button
      disabled={disabled}
      color={ota.insecure ? "red" : "violet"}
      my="md"
      loading={loading}
      onClick={startUpdate}
      leftSection={<IconCpu size={24} />}>
        Update Firmware
    </Button>
  )
})
