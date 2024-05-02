import { ComboboxData, Select, SelectProps } from "@mantine/core"
import { observer } from "mobx-react-lite";
import { useMemo } from "react";
import { useAppStore } from "../../../stores";

export type IPinSelectProps = {
  loading?: boolean
} & SelectProps;

export const PinSelect = observer(({ loading, ...props} : IPinSelectProps) => {
  const { accessories } = useAppStore()

  const pins : ComboboxData = useMemo(() => {
    return accessories.totalPins.map((pin) => {
      return {
        value: pin.toString(),
        label: `Pin: ${pin}`,
        disabled: accessories.usedPins.includes(pin) && !accessories.switch?.pins?.includes(pin)
      }
    });
  }, [accessories.totalPins, accessories.usedPins, accessories.switch?.pins]);

  return (
    <Select
      disabled={loading}
      label="Use pin:"
      description="Check your ESP board if it has these numbers"
      data={pins}
      searchable
      checkIconPosition="right"
      {...props}
    />
  )
})
