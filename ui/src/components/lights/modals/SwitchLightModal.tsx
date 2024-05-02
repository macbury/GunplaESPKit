import { TextInput } from "@mantine/core";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "@mantine/form";
import { toJS } from "mobx";
import { useAppStore } from "../../../stores";
import { MultiPinSelect } from "./MultiPinSelect";
import { BaseLightModal } from "./BaseLightModal";

export const SwitchLightEditor = observer(({ isMobile }) => {
  const { accessories } = useAppStore()
  const [loading, setLoading] = useState(false)
  const newRecord = accessories.newRecord

  const form = useForm({
    initialValues: {
      id: 0,
      name: '',
      pins: []
    },
    validate: (values) => ({
      name: values.name.length > 0 ? null : 'Name should be at least one character',
      pins: values.pins.length > 0 ? null : 'You need to select at least one pin'
    })
  });

  useEffect(() => {
    const record = toJS(accessories.switch)
    if (record) {
      form.setValues({
        ...record,
        pins: record.pins.map((p) => p.toString())
      })
    }

    return () => {
      form.reset()
      setLoading(false)
    }
  }, [accessories.switch, setLoading])

  const save = useCallback(async (e) => {
    e.preventDefault()
    form.validate()

    if (form.isValid()) {
      setLoading(true)
      const record = form.values
      accessories.writeSwitch({
        ...record,
        pins: record.pins.map((i) => parseInt(i))
      })
      await accessories.save()
      accessories.closeModal()
    }

    setLoading(false)
  }, [form, setLoading])

  const onRemoveClick = useCallback(async () => {
    setLoading(true)
    accessories.removeSwitch(accessories.switch.id)
    await accessories.save()
    setLoading(false)
    accessories.closeModal()
  }, [form, setLoading, accessories])

  return (
    <BaseLightModal
      isMobile={isMobile}
      loading={loading}
      newRecord={newRecord}
      windowType="switch"
      height={300}
      onRemoveClick={onRemoveClick}
      save={save}>
      <TextInput
        disabled={loading}
        label="Name"
        description="This name will be combined with name of model"
        placeholder="Body"
        {...form.getInputProps('name')}
      />

      <MultiPinSelect
        loading={loading}
        {...form.getInputProps('pins')}
      />
    </BaseLightModal>
  )
})
