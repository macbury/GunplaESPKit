import { useCallback } from "react";
import { observer } from "mobx-react-lite";
import { modals } from "@mantine/modals";
import { Modal, Text, Stack, Group, Button, Drawer } from "@mantine/core";

import { TManageDeviceWindow } from "../../../stores/ManageAccessoriesStore";
import { useAppStore } from "../../../stores";
import { IconCheck, IconFileUpload, IconPlus, IconTrash } from "@tabler/icons-react";
import { useFocusTrap } from "@mantine/hooks";

export interface IBaseLightModalProps {
  isMobile: boolean
  newRecord: boolean
  loading: boolean
  windowType: TManageDeviceWindow
  height: number,
  children: any
  save(e : any)
  onRemoveClick() : Promise<any>
}

export const BaseLightModal = observer((props : IBaseLightModalProps) => {
  const { accessories } = useAppStore();
  const {
    isMobile,
    loading,
    windowType,
    newRecord,
    onRemoveClick,
    children,
    height,
    save
  } = props

  const opened = accessories.openedWindow == windowType;
  const focusTrapRef = useFocusTrap(opened);

  const onRemoveHandler = useCallback((e) => {
    modals.openConfirmModal({
      title: "Remove entity",
      centered: true,
      closeOnConfirm: true,
      closeOnCancel: true,
      labels: { confirm: 'Remove', cancel: 'Cancel' },
      onConfirm: async () => {
        await onRemoveClick()
        accessories.closeModal()
      },
      children: (
        <Text size="sm">
          Are you sure you want to remove this entity?
        </Text>
      )
    })
  }, [accessories, onRemoveClick])

  const Wrapper = isMobile ? Drawer : Modal

  return (
    <Wrapper
      opened={opened}
      onClose={accessories.closeModal}
      title={newRecord ? "Create new accessory" : "Update accessory"}
      centered
      offset={20}
      position="bottom"
      size={isMobile ? height : "lg"}
      radius="lg"
      fullScreen={isMobile}>
      <form onSubmit={save} ref={focusTrapRef}>
        <Stack gap="xs">
          {opened ? children : null}
        </Stack>
        <Group justify="space-between" mt="md">
          { newRecord ? <div /> : <Button color="red" loading={loading} onClick={onRemoveHandler} leftSection={<IconTrash size={14} />}>Remove</Button> }
          <Group justify="right">
            <Button
              variant="light"
              disabled={loading}
              color="gray"
              onClick={accessories.closeModal}>
                Cancel
            </Button>
            <Button
              type="submit"
              loading={loading}
              leftSection={ newRecord ? <IconPlus size={14} /> : <IconCheck size={14} /> }>
                { newRecord ? "Create" : "Update" }
            </Button>
          </Group>
        </Group>
      </form>
    </Wrapper>
  )
});
