import React, { useCallback, useEffect, useState } from 'react'
import license from '../firmware/LICENSE?raw';
import { observer } from "mobx-react-lite";
import { Button, Code, Container, Group, Paper, PinInput, ScrollArea, Stepper, Text, TextInput, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useFocusTrap } from '@mantine/hooks';

import classes from './FirstDeviceSetupScreen.module.css';
import { GunplaConfig, Screen, useAppStore } from '../stores';
import { ConnectionFailureModal } from '../components/ConnectionFailureModal';

const FirstDeviceSetupScreen = observer(() => {
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(false);
  const app = useAppStore();
  const focusTrapRef = useFocusTrap();

  const form = useForm({
    initialValues: {
      name: '',
      pinConfirmation: '',
      pin: ''
    },

    validate: (values) => {
      console.log('values', values)
      if (active === 1) {
        return {
          name:
            values.name.trim().length < 3
              ? 'Name must include at least 3 characters'
              : null,
        };
      }

      if (active === 2) {
        return {
          pin: /\d{6}/.test(values.pin) ? null : 'Pin should have 6 digits',
          pinConfirmation: values.pinConfirmation == values.pin ? null : 'Confirmation is not equal pin'
        };
      }

      return {};
    },
  });

  const nextStep = useCallback(() => {
    setActive((current) => {
      if (form.validate().hasErrors) {
        return current;
      }
      return current + 1;
    })
  }, [setActive, form])

  const goBack = useCallback(() => {
    setActive((current) => {
      if (current == 0) {
        app.changeScreen(Screen.Start)
        return 0
      } else {
        return current - 1
      }
    })
  }, [setActive, app])

  const submit = useCallback(async () => {
    setLoading(true);
    const config : GunplaConfig = {
      name: form.values.name,
      pin: parseInt(form.values.pin),
      pairingCode: Math.floor(10000000 + Math.random() * 90000000).toString()
    }
    console.log("Writing config", config);

    try {
      await app.protocol.rpc.writeConfig(config);
      app.changeScreen(Screen.ConnectToBluetoothDevice)
    } catch (e) {
      setLoading(false)
    }

  }, [setLoading, form]);

  useEffect(() => {
    return () => {
      setLoading(false);
      setActive(0)
      form.reset();
    }
  }, []);

  const onFormSubmit = useCallback((e) => {
    e.preventDefault();
    if (active < 3) {
      nextStep()
    } else {
      submit()
    }
  }, [active, nextStep, active])

  return (
    <Container size="sm" my={40}>
      <ConnectionFailureModal enabled={!loading} />

      <Title ta="center" className={classes.title}>
        Setup new device
      </Title>

      <form onSubmit={onFormSubmit}>
        <Paper withBorder shadow="md" p={30} mt="lg" radius="lg">
          <Stepper active={active}>
            <Stepper.Step label="License">
              <ScrollArea h={320}>
                <Code block>{license}</Code>
              </ScrollArea>
            </Stepper.Step>
            <Stepper.Step label="Name device">
              <TextInput
                ref={focusTrapRef}
                label="Name"
                placeholder="Zaku Warrior Lunemaria"
                size="lg"
                {...form.getInputProps('name')} />
              <Text size="sm" mt="sm">Enter a name for your device. This name will be used to identify the device on your network and as the name for each device exposed to HomeKit/HomeAssistant.</Text>
            </Stepper.Step>
            <Stepper.Step label="Security">
              <Text size="md" mb="xs">Bluetooth Pin</Text>
              <PinInput
                ref={focusTrapRef}
                size="lg"
                mb="md"
                radius="xl"
                length={6}
                type="number"
                {...form.getInputProps('pin')} />

              <Text size="md" mb="xs">Confirm Bluetooth Pin</Text>
              <PinInput
                size="lg"
                length={6}
                radius="xl"
                type="number"
                {...form.getInputProps('pinConfirmation')} />

              <Text size="sm" mt="sm">Please choose a unique Bluetooth PIN. This PIN is essential for accessing your device and ensuring its security.</Text>
            </Stepper.Step>
            <Stepper.Completed>
              Ready to finish setting up your device? Click 'Continue' to proceed. <br />
              You can always change these settings later. Click 'Back' if you want to make any changes.
            </Stepper.Completed>
          </Stepper>
        </Paper>

        <Group justify="right" mt="xl">
          <Button radius="lg" size="md" variant="outline" onClick={goBack} disabled={loading}>
            Back
          </Button>
          <Button radius="lg" type="submit" size="md" loading={loading}>
            {active == 0 ? 'Accept License' : 'Continue'}
          </Button>
        </Group>
      </form>
    </Container>
  )
});

export default FirstDeviceSetupScreen
