import { NumberInput, Select, TextInput } from "@mantine/core";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "@mantine/form";
import { toJS } from "mobx";
import { useAppStore } from "../../../stores";
import { BaseLightModal } from "./BaseLightModal";
import { PinSelect } from "./PinSelect";

const valueToString = ({ value, label }) => ({ value: value.toString(), label })

const NEO_SPEED = [
  { label: "KHZ800", value: 0x0000 },
  { label: "KHZ400", value: 0x0100 },
].map(valueToString)

const NEO_PIXEL_COLOR_MODE = [
  { label: 'RGB', value: ((0 << 6) | (0 << 4) | (1 << 2) | (2)) },
  { label: 'RBG', value: ((0 << 6) | (0 << 4) | (2 << 2) | (1)) },
  { label: 'GRB', value: ((1 << 6) | (1 << 4) | (0 << 2) | (2)) },
  { label: 'GBR', value: ((2 << 6) | (2 << 4) | (0 << 2) | (1)) },
  { label: 'BRG', value: ((1 << 6) | (1 << 4) | (2 << 2) | (0)) },
  { label: 'BGR', value: ((2 << 6) | (2 << 4) | (1 << 2) | (0)) },
  { label: 'WRGB', value: ((0 << 6) | (1 << 4) | (2 << 2) | (3)) },
  { label: 'WRBG', value: ((0 << 6) | (1 << 4) | (3 << 2) | (2)) },
  { label: 'WGRB', value: ((0 << 6) | (2 << 4) | (1 << 2) | (3)) },
  { label: 'WGBR', value: ((0 << 6) | (3 << 4) | (1 << 2) | (2)) },
  { label: 'WBRG', value: ((0 << 6) | (2 << 4) | (3 << 2) | (1)) },
  { label: 'WBGR', value: ((0 << 6) | (3 << 4) | (2 << 2) | (1)) },
  { label: 'RWGB', value: ((1 << 6) | (0 << 4) | (2 << 2) | (3)) },
  { label: 'RWBG', value: ((1 << 6) | (0 << 4) | (3 << 2) | (2)) },
  { label: 'RGWB', value: ((2 << 6) | (0 << 4) | (1 << 2) | (3)) },
  { label: 'RGBW', value: ((3 << 6) | (0 << 4) | (1 << 2) | (2)) },
  { label: 'RBWG', value: ((2 << 6) | (0 << 4) | (3 << 2) | (1)) },
  { label: 'RBGW', value: ((3 << 6) | (0 << 4) | (2 << 2) | (1)) },
  { label: 'GWRB', value: ((1 << 6) | (2 << 4) | (0 << 2) | (3)) },
  { label: 'GWBR', value: ((1 << 6) | (3 << 4) | (0 << 2) | (2)) },
  { label: 'GRWB', value: ((2 << 6) | (1 << 4) | (0 << 2) | (3)) },
  { label: 'GRBW', value: ((3 << 6) | (1 << 4) | (0 << 2) | (2)) },
  { label: 'GBWR', value: ((2 << 6) | (3 << 4) | (0 << 2) | (1)) },
  { label: 'GBRW', value: ((3 << 6) | (2 << 4) | (0 << 2) | (1)) },
  { label: 'BWRG', value: ((1 << 6) | (2 << 4) | (3 << 2) | (0)) },
  { label: 'BWGR', value: ((1 << 6) | (3 << 4) | (2 << 2) | (0)) },
  { label: 'BRWG', value: ((2 << 6) | (1 << 4) | (3 << 2) | (0)) },
  { label: 'BRGW', value: ((3 << 6) | (1 << 4) | (2 << 2) | (0)) },
  { label: 'BGWR', value: ((2 << 6) | (3 << 4) | (1 << 2) | (0)) },
  { label: 'BGRW', value: ((3 << 6) | (2 << 4) | (1 << 2) | (0)) },
].map(valueToString);


// strip editor store
  // this can become complex very quickly
export const ColorStripModal = observer(({ isMobile }) => {
  const { accessories } = useAppStore()
  const [loading, setLoading] = useState(false)
  const newRecord = accessories.newRecord

  const form = useForm({
    initialValues: {
      id: 0,
      name: '',
      pin: null,
      colorMode: '6',
      count: 1,
      lights: [],
      speed: '0'
    },
    validate: (values) => ({
      name: values.name.length > 0 ? null : 'Name should be at least one character',
      pin: values.pin > 0 ? null : 'Pin is required',
      count: values.count > 0 ? null : 'Min 1 led is required',
      speed: values.speed != null ? null : 'Speed is required',
      colorMode: values.colorMode != null ? null : 'Speed is required',
    })
  });

  useEffect(() => {
    const record = toJS(accessories.colorStrip);

    if (record) {
      form.setValues({
        ...record,
        pin: record.pin?.toString(),
        colorMode: record.colorMode?.toString(),
        speed: record.speed?.toString(),
      })
    }

    return () => {
      setLoading(false)
      form.reset()
    }
  }, [accessories.colorStrip, setLoading])

  const save = useCallback(async (e) => {
    e.preventDefault()
    form.validate()

    if (form.isValid()) {
      setLoading(true)
      const record = form.values
      accessories.writeColorStrip({
        ...record,
        pin: parseInt(record.pin),
        colorMode: parseInt(record.colorMode),
        speed: parseInt(record.speed),
      });

      await accessories.save();
      accessories.closeModal();
    }

    setLoading(false)
  }, [form, setLoading])

  const onRemoveClick = useCallback(async () => {
    setLoading(true)
    accessories.removeColorStrip(accessories.colorStrip.id)
    await accessories.save()
    setLoading(false)
    accessories.closeModal()
  }, [form, setLoading, accessories])

  return (
    <BaseLightModal
      isMobile={isMobile}
      loading={loading}
      newRecord={newRecord}
      windowType="colorStrip"
      height={550}
      onRemoveClick={onRemoveClick}
      save={save}>
      <TextInput
        disabled={loading}
        label="Name"
        description="This name will be combined with name of model"
        placeholder="Body"
        {...form.getInputProps('name')}
      />
      <NumberInput
        label="Total pixel count"
        min={1}
        max={64}
        {...form.getInputProps('count')}/>
      <PinSelect
        {...form.getInputProps('pin')} />
      <Select
        label="Byte transmission speed"
        defaultValue="KHZ800"
        data={NEO_SPEED}
        {...form.getInputProps('speed')}
      />
      <Select
        label="Color mode"
        description="Please select in which order are colors sent to led. This information should be on strip itself"
        searchable
        data={NEO_PIXEL_COLOR_MODE}
        {...form.getInputProps('colorMode')}
      />
    </BaseLightModal>
  )
})
