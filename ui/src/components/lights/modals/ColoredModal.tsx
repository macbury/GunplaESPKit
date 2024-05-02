import { useState, useEffect, useCallback } from "react";
import { observer } from "mobx-react-lite";
import { IconColorSwatch } from "@tabler/icons-react";
import { TextInput, NumberInput, ColorInput, Alert } from "@mantine/core";
import { useForm } from "@mantine/form";
import { toJS } from "mobx";
import { useAppStore } from "../../../stores";
import { hsvToRgb, rgbToHsv } from "../../../utils/colors";
import { BaseLightModal } from "./BaseLightModal";

export const ColoredModal = observer(({ isMobile }) => {
  const { accessories } = useAppStore()
  const [loading, setLoading] = useState(false)
  const newRecord = accessories.newRecord
  const colorStrip = accessories.colorStrip

  const form = useForm({
    initialValues: {
      id: 0,
      name: '',
      count: 1,
      offset: 1,
      color: "#ffffff"
    },
    validate: (values) => ({
      name: values.name.length > 0 ? null : 'Name should be at least one character',
      color: values.color.length > 0 ? null : 'Color is required',
      offset: values.offset >= 0 ? null : "Offset is required",
      count: values.count > 0 ? null : "Count is required"
    })
  });

  useEffect(() => {
    const record = toJS(accessories.colored);

    if (record) {
      form.setValues({
        ...record,
        color: hsvToRgb(record.h, record.s, record.v)
      })
    }

    return () => {
      setLoading(false)
      form.reset()
    }
  }, [accessories.colorStrip, accessories.colored, setLoading])

  const save = useCallback(async (e) => {
    e.preventDefault()
    form.validate()

    if (form.isValid()) {
      setLoading(true)

      const { color, ...record } = form.values
      const [h, s, v] = rgbToHsv(color);
      accessories.writeColored(accessories.colorStrip, {
        ...record,
        h,
        s,
        v
      });

      await accessories.save();
      accessories.closeModal();
    }

    setLoading(false)
  }, [form, setLoading, accessories.colorStrip])

  const onRemoveClick = useCallback(async () => {
    setLoading(true)
    accessories.removeColored(accessories.colorStrip, accessories.colored.id)
    await accessories.save()
    setLoading(false)
    accessories.closeModal()
  }, [form, setLoading, accessories.colored, accessories.colorStrip])

  return (
    <BaseLightModal
      isMobile={isMobile}
      loading={loading}
      newRecord={newRecord}
      windowType="colored"
      height={550}
      onRemoveClick={onRemoveClick}
      save={save}>

      <Alert variant="light" color="yellow" icon={<IconColorSwatch />}>
        This light will part of Color Strip: <b>{colorStrip?.name}</b>
      </Alert>

      <TextInput
        disabled={loading}
        label="Name"
        description="This name will be combined with name of model"
        placeholder="Body"
        {...form.getInputProps('name')}
      />

      <ColorInput
        label="Default Color"
        description="This will be default color for this light. You can always then change it in ui"
        {...form.getInputProps('color')} />

      <NumberInput
        label="Offset"
        description="Offset defines from what pixel on strip led should start glowing"
        min={1}
        {...form.getInputProps('offset')}/>

      <NumberInput
        label="Pixel count"
        description="Pixel count defines how many pixels should glow after offset pixel is set"
        min={1}
        max={colorStrip?.count}
        {...form.getInputProps('count')}/>
    </BaseLightModal>
  )
})
