import { AlphaSlider, Slider, Text, TextInput } from "@mantine/core";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "@mantine/form";
import { toJS } from "mobx";
import { useAppStore } from "../../../stores";
import { MultiPinSelect } from "./MultiPinSelect";
import { BaseLightModal } from "./BaseLightModal";

export const DimmableLightModal = observer(({ isMobile }) => {
  const { accessories } = useAppStore()
  const [loading, setLoading] = useState(false)
  const newRecord = accessories.newRecord

  const form = useForm({
    initialValues: {
      id: 0,
      name: '',
      pins: [],
      brightness: 1,
    },
    validate: (values) => ({
      name: values.name.length > 0 ? null : 'Name should be at least one character',
      pins: values.pins.length > 0 ? null : 'You need to select at least one pin',
    })
  });

  useEffect(() => {
    const record = toJS(accessories.dimmable)
    // console.log('record.brightness', record.brightness)
    if (record) {
      form.setValues({
        ...record,
        brightness: record.brightness / 100.0,
        pins: record.pins.map((p) => p.toString())
      })
    }

    return () => {
      setLoading(false)
      form.reset()
    }
  }, [accessories.dimmable, setLoading])

  const save = useCallback(async (e) => {
    e.preventDefault()
    form.validate()

    if (form.isValid()) {
      setLoading(true)
      const record = form.values
      accessories.writeDimmable({
        ...record,
        brightness: Math.round(record.brightness * 100.0),
        pins: record.pins.map((i) => parseInt(i))
      })
      await accessories.save()
      accessories.closeModal()
    }

    setLoading(false)
  }, [form, setLoading])

  const onRemoveClick = useCallback(async () => {
    setLoading(true)
    accessories.removeDimmable(accessories.dimmable.id)
    await accessories.save()
    setLoading(false)
    accessories.closeModal()
  }, [form, setLoading, accessories])

  return (
    <BaseLightModal
      isMobile={isMobile}
      loading={loading}
      newRecord={newRecord}
      windowType="dimmable"
      onRemoveClick={onRemoveClick}
      height={360}
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

      <Text size="sm" component="label">Default brightness: {Math.round(form.values.brightness * 100.0)}%</Text>
      <AlphaSlider color="violet" disabled={loading} mb="bd" {...form.getInputProps('brightness')} />
    </BaseLightModal>
  )
})
