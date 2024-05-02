import { observer } from "mobx-react-lite"
import { Card, Group, Text, Button, Modal, PinInput, Drawer } from "@mantine/core"
import { useAppStore } from "../../stores"
import { useCallback, useEffect, useState } from "react"
import { useForm } from "@mantine/form"
import { useDisclosure, useFocusTrap } from "@mantine/hooks"
import { IconBluetooth } from "@tabler/icons-react"
import { useIsMobile } from "../../hooks/mobile"

export const BluetoothCard = observer(() => {
  const [loading, setLoading] = useState(false);
  const focusTrapRef = useFocusTrap();
  const { manageDevice, features } = useAppStore()
  const isMobile = useIsMobile();
  const bluetooth = manageDevice.systemInfo.bluetooth
  const [opened, { open, close }] = useDisclosure(false);
  const form = useForm({
    initialValues: {
      pin: '',
      pinConfirmation: ''
    },
    validate: (values) => ({
      pin: /\d{6}/.test(values.pin) ? null : 'Pin should have 6 digits',
      pinConfirmation: values.pinConfirmation == values.pin ? null : 'Confirmation is not equal pin'
    })
  });

  const changeBluetoothPin = useCallback(async (e) => {
    e.preventDefault()
    const validation = form.validate()
    if (validation.hasErrors) {
      console.log('form.validate()', validation)
      return
    }

    setLoading(true)
    try {
      console.log('values', form.values)
      await manageDevice.updateBluetoothPin(parseInt(form.values.pin))
      close()
    } catch (e) {
      console.error(e)
    }

    setLoading(false)
  }, [manageDevice, close, form]);

  useEffect(() => {
    return () => {
      setLoading(false);
      form.reset();
    }
  }, []);


  if (!features.hasBluetoothPinChange) {
    return
  }

  const Dialog = isMobile ? Drawer : Modal

  return (
    <>
      <Dialog
        opened={opened}
        onClose={close}
        title="Change Bluetooth Pin"
        centered
        radius="lg"
        offset={20}
        size={isMobile ? 390 : "md"}
        position="bottom"
        fullScreen={isMobile}>
        <form onSubmit={changeBluetoothPin}>
          <Text size="md" mb="xs">
            Please enter new Bluetooth Pin below:
          </Text>
          <PinInput
            ref={focusTrapRef}
            size="lg"
            radius="xl"
            mb="md"
            disabled={loading}
            length={6}
            type="number"
            tabIndex={0}
            {...form.getInputProps('pin')} />

          <Text size="md" mb="xs">Confirm Bluetooth Pin:</Text>
          <PinInput
            size="lg"
            length={6}
            radius="xl"
            disabled={loading}
            type="number"
            tabIndex={1}
            {...form.getInputProps('pinConfirmation')} />
          <Text c="dimmed" size="sm" mt="sm">Please choose a unique Bluetooth PIN. This PIN is essential for accessing your device and ensuring its security.</Text>
          <Group justify="right" mt="md">
            <Button type="submit" loading={loading}>Save</Button>
          </Group>
        </form>
      </Dialog>
      <Card withBorder shadow="md" w={340}>
        <Card.Section withBorder inheritPadding py="xs">
          <Group justify="space-between">
            <Text fw={500}>Bluetooth</Text>
          </Group>
        </Card.Section>
        <Card.Section withBorder inheritPadding py="xs">
          <Text size="sm">
            <b>MAC:</b><br/>{bluetooth.mac || '...'}<br/>
            <b>Name:</b><br/>{bluetooth.name || '...'}<br/>
          </Text>
        </Card.Section>
        <Button mt="md" onClick={open} leftSection={<IconBluetooth size={24} />}>Change Bluetooth PIN</Button>
      </Card>
    </>
  )
})
