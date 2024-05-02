import { useCallback, useEffect, useState } from "react";
import { Button, Card, Code, Group, Text } from "@mantine/core";
import { observer } from "mobx-react-lite";
import Editor, { useMonaco } from '@monaco-editor/react';
import { IconUpload } from "@tabler/icons-react";
import { useAppStore } from "../../stores";
import accessoriesSchema from "./schema.json?json";

export const CodeEditor = observer(({ isMobile }) => {
  const [loading, setLoading] = useState(false)
  const monaco = useMonaco();
  const { accessories } = useAppStore()
  const [rawAccessories, setRawAccessories] = useState('')
  const [errors, setErrors] = useState([])

  useEffect(() => {
    if (monaco) {
      monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
        validate: true,
        schemaValidation: "error",
        schemas: [{ schema: accessoriesSchema, fileMatch: ["*"], uri: "https://gunpla-esp-kit.vercel.app/" }]
      })
      setLoading(false)
    }
  }, [monaco])

  useEffect(() => {
    setRawAccessories(JSON.stringify(accessories.entities, null, 2))
  }, [accessories.entities])

  const onValidate = useCallback((markers) => {
    console.log('validation', markers)
    setErrors(markers.map(({ message }) => message))
  }, [setErrors, rawAccessories])

  const isValid = errors.length == 0 && rawAccessories.length > 0;

  const save = useCallback(async () => {
    if (!isValid) {
      return
    }

    setLoading(true)
    const data = JSON.parse(rawAccessories)
    accessories.update(data)
    await accessories.save()
    setLoading(false)
  }, [isValid, setLoading, rawAccessories])

  return (
    <Card withBorder={!isMobile} radius={isMobile ? 0 : "lg"} shadow="md" padding="sm">
      <Card.Section withBorder inheritPadding py="xs">
        <Group justify="space-between">
          <Text size="xs" c={isValid ? "green" : "red"} fw={700}>{isValid ? 'Valid' : "There are errors in code"}</Text>
          <Button disabled={!isValid} loading={loading} onClick={save} color="violet" size="xs" rightSection={<IconUpload size={14} />}>
            Save
          </Button>
        </Group>
      </Card.Section>
      <Card.Section>
        <Editor
          onValidate={onValidate}
          height="60vh"
          language="json"
          value={rawAccessories}
          onChange={setRawAccessories}
          theme="vs-dark" />
      </Card.Section>
      {
        !isValid && (
          <Card.Section withBorder inheritPadding py="xs">
            <Code block>
              {errors.join("\n")}
            </Code>
          </Card.Section>
        )
      }
    </Card>
  )
});
