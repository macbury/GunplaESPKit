import { useMantineTheme, rem, Card, Group, Switch, AlphaSlider, ColorInput } from "@mantine/core";
import { IconBulb, IconBulbOff } from "@tabler/icons-react";
import { observer } from "mobx-react-lite";
import { useDebouncedValue } from "@mantine/hooks";
import { IState, useAppStore } from "../../stores";
import { ISwitch } from "../../stores/ManageAccessoriesStore";
import { useCallback, useEffect, useMemo, useState } from "react";
import { hsvToRgb, rgbToHsv } from "../../utils/colors";

const TOGGLE_ICON_SIZE = rem(24);

function OnIcon() {
  const theme = useMantineTheme();

  return (
    <IconBulb
      style={{ width: TOGGLE_ICON_SIZE, height: TOGGLE_ICON_SIZE }}
      stroke={2.0}
      color={theme.colors.yellow[4]}
    />
  )
}

function OffIcon() {
  const theme = useMantineTheme();

  return (
    <IconBulbOff
      style={{ width: TOGGLE_ICON_SIZE, height: TOGGLE_ICON_SIZE }}
      stroke={2.0}
      color={theme.colors.blue[6]}
    />
  )
}

export interface IOnOffSwitch {
  state: IState,
  accessory: ISwitch,
  children?: any
}

export const OnOffSwitch = observer(({ state, accessory, children, ...props } : IOnOffSwitch) => {
  const { preview } = useAppStore()
  const [loading, setLoading] = useState(false);

  const onChange = useCallback(async (e) => {
    const checked = e.target.checked;
    setLoading(true)

    await preview.setState(state, checked)

    setLoading(false)
  }, [preview, state])

  return (
    <Group grow {...props}>
      <Switch
        checked={state.sta}
        size="xl"
        disabled={loading}
        color="dark.4"
        onLabel={<OnIcon />}
        offLabel={<OffIcon />}
        onChange={onChange}
        label={accessory.name}
      />
      {children}
    </Group>
  )
});

export const DimmableSwitch = observer(({ state, accessory, ...props } : IOnOffSwitch) => {
  const { preview } = useAppStore()
  const [brightness, setBrightness] = useState(state.b / 100.0);
  const [targetBrightness] = useDebouncedValue(brightness, 200, { leading: true });

  useEffect(() => {
    const b = targetBrightness * Math.round(100);
    if (b != state.b) {
      preview.setBrightness(state, b)
    }
  }, [targetBrightness, state])

  return (
    <OnOffSwitch state={state} accessory={accessory} {...props}>
      <AlphaSlider value={brightness} color="rgba(255,255,255,0.7)" onChange={setBrightness} />
    </OnOffSwitch>
  )
})

export const ColorSwitch = observer(({ state, accessory, ...props } : IOnOffSwitch) => {
  const { preview } = useAppStore()
  const color = useMemo(() => {
    return hsvToRgb(state.h, state.s, state.v);
  }, [state.h, state.v, state.s])

  const setHSV = useCallback((color : string) => {
    const [h, s, v] = rgbToHsv(color);
    preview.setHSV(state, h, s, v)
  }, [preview, state])

  return (
    <OnOffSwitch state={state} accessory={accessory} {...props}>
      <ColorInput
        variant="filled"
        value={color}
        onChangeEnd={setHSV}
      />
    </OnOffSwitch>
  )
})
