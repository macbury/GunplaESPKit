import { useCallback } from "react";
import { observer } from "mobx-react-lite"
import { Button, Code, FileButton, Modal, Progress, Text } from "@mantine/core"
import { IconUpload } from "@tabler/icons-react"
import { useAppStore } from "../../stores";
import { useIsMobile } from "../../hooks/mobile";
import { useDisclosure } from "@mantine/hooks";


export const UploadFirmwareButton = observer(() => {
  const { protocol } = useAppStore()
  const [modalOpened, modalActions] = useDisclosure(false);

  const isMobile = useIsMobile()

  const updateFirmware = useCallback(() => {
    modalActions.open()
    protocol.rpc.updateFirmware('sss', 'ssss', 'sss')
  }, [protocol, modalActions])

  return (
    <>
      <Modal
        withCloseButton={false}
        opened={modalOpened}
        title="Update firmware"
        centered
        onClose={console.log}
        fullScreen={isMobile}>
        <Code>{'ota.checksum'}</Code>
        <Text>Eta: {'ota.eta'}</Text>
        <Progress animated size="xl" my="md" value={'ota.progress * 100.0'} />
      </Modal>
      <FileButton onChange={updateFirmware}>
        {(props) => <Button variant="light" mt="md" mb="md" leftSection={<IconUpload size={24} />} {...props}>Upload Firmware</Button>}
      </FileButton>
    </>
  )
})
