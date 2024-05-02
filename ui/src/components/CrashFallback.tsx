import React, { useMemo } from "react"
import { Button, Center, Container, Group, Paper, Progress, Text, ThemeIcon, Title } from "@mantine/core"
import { IconReload, IconSkull } from "@tabler/icons-react";

function generateRandomErrorMessage(): string {
  const errorMessages = [
    "Oops! Something went wrong 😱",
    "Uh oh! An error occurred 🙈",
    "Error: Please try turning it off and on again 🔄",
    "Error: Insufficient coffee intake ☕️",
    "Error: Brain.exe has stopped working 🧠",
    "Error: Reality not found 🌌",
    "Error: The gremlins are at it again 🐲",
    "Error: This is not the error you're looking for 🚫",
    "Error: An unexpected error has occurred. Please try again later. 🤔",
    "Error: The universe has encountered a glitch. Please stand by. 🌌",
    "Error: The error gremlins have taken over. Brace yourself! 🐲",
    "Error: You have entered the Twilight Zone. Proceed with caution. 🌀",
    "Error: The error monster has escaped from its cage. Hide your code! 🙀",
  ];

  const randomIndex = Math.floor(Math.random() * errorMessages.length);
  return errorMessages[randomIndex];
}


export default function CrashFallback() {
  const error = useMemo(generateRandomErrorMessage, [])

  return (
    <Container size="xs" mt="lg">
      <Group justify="center" mt={120}>
        <ThemeIcon radius="xl" size="xl" color="red">
          <IconSkull />
        </ThemeIcon>
      </Group>
      <Title order={2} ta="center" mt="md" mb="xs">
        App Crashed
      </Title>
      <Text mb="lg" c="dimmed" ta="center">
        {error}
      </Text>

      <Group justify="center" mt={30}>
        <Button radius="xl" size="lg" leftSection={<IconReload />} onClick={() => window.location.reload()}>
          Restart App
        </Button>
      </Group>
    </Container>
  )
}
