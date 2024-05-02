import { ComboboxData, MultiSelect, MultiSelectProps } from "@mantine/core"
import { observer } from "mobx-react-lite";
import { useMemo } from "react";
import { useAppStore } from "../../../stores";

export type IMultiPinSelectProps = {
  loading: boolean
} & MultiSelectProps;

export const MultiPinSelect = observer(({ loading, ...props} : IMultiPinSelectProps) => {
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
    <MultiSelect
      disabled={loading}
      label="Use pins:"
      placeholder="Pin number"
      description="Check your ESP board if it has these numbers"
      searchable
      checkIconPosition="right"
      maxValues={12}
      maxDropdownHeight={200}
      data={pins}
      {...props}
    />
  )
})
