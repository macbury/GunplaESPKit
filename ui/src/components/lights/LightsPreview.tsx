import { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { Card } from "@mantine/core";
import { useAppStore } from "../../stores";
import { ColorSwitch, DimmableSwitch, OnOffSwitch } from "./LightSwitch";
import { toJS } from "mobx";

export const LightsPreview = observer(({ isMobile }) => {
  const { preview, protocol, accessories } = useAppStore()

  useEffect(() => {
    preview.load()

    protocol.state.addEventListener('characteristicvaluechanged', preview.load);

    return () => {
      protocol.state.removeEventListener('characteristicvaluechanged', preview.load);
    }
  }, [preview, protocol])

  const switches = preview.switches.map(({ state, accessory }) => {
    return (
      <Card.Section withBorder inheritPadding py="xs" key={accessory.id}>
        <OnOffSwitch
          state={state}
          accessory={accessory} />
      </Card.Section>
    )
  });

  const dimmable = preview.dimmable.map(({ state, accessory }) => {
    return (
      <Card.Section withBorder inheritPadding py="xs" key={accessory.id}>
        <DimmableSwitch
          state={state}
          accessory={accessory} />
      </Card.Section>
    )
  });

  const colored = preview.colored.map(({ state, accessory }) => {
    return (
      <Card.Section withBorder inheritPadding py="xs" key={accessory.id}>
        <ColorSwitch
          state={state}
          accessory={accessory} />
      </Card.Section>
    )
  });

  // console.log('preview.colored', toJS(preview.colored))

  if (!preview.isPresent) {
    return null
  }

  return (
    <Card withBorder={!isMobile} shadow="lg" radius={isMobile ? 0 : "lg"}>
      {switches}
      {dimmable}
      {colored}
    </Card>
  )
})
