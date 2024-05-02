import { Card, NavLink, ThemeIcon } from "@mantine/core";
import { IconCircuitSwitchOpen, IconPlus, IconBrightnessHalf, IconColorSwatch, IconBulb, IconFolderBolt } from "@tabler/icons-react";
import { observer } from "mobx-react-lite";
import { useAppStore } from "../../stores";
import { SwitchLightEditor } from "./modals/SwitchLightModal";
import { DimmableLightModal } from "./modals/DimmableLightModal";
import { ColorStripModal } from "./modals/ColorStripModal";
import { ColoredModal } from "./modals/ColoredModal";

export const UIEditor = observer(({ isMobile }) => {
  const { accessories, features } = useAppStore()

  const switches = accessories.entities.switch.map((light) => {
    return (
      <NavLink
        component="div"
        label={light.name}
        key={light.id}
        description={"Used pins: " + light.pins.join(", ")}
        leftSection={<IconBulb size="1.8rem" stroke={1.5} />}
        onClick={(e) => {
          e.stopPropagation();
          accessories.editSwitch(light.id)
        }} />
    )
  });

  const dimmable = accessories.entities.dimmable.map((light) => {
    return (
      <NavLink
        component="div"
        label={light.name}
        key={light.id}
        description={"Used pins: " + light.pins.join(", ")}
        leftSection={<IconBulb size="1.8rem" stroke={1.5} />}
        onClick={(e) => {
          e.stopPropagation();
          accessories.editDimmable(light.id)
        }} />
    )
  });

  const colored = accessories.entities.colored.map((strip) => {
    const lights = strip.lights.map((light) => {
      return (
        <NavLink
          component="div"
          label={light.name}
          key={light.id}
          leftSection={<IconBulb size="1.8rem" stroke={1.5} />}
          onClick={(e) => {
            e.stopPropagation();
            accessories.editColored(strip, light.id)
          }} />
      )
    })
    return (
      <NavLink
        component="div"
        label={strip.name}
        key={strip.id}
        description={"Used pin: " + strip.pin}
        childrenOffset={28}
        opened={true}
        rightSection={null}
        onClick={(e) => {
          e.stopPropagation();
          accessories.editColorStrip(strip.id)
        }}
        leftSection={<IconFolderBolt size="1.8rem" stroke={1.5} />}>
          {lights}
          <NavLink
            label="Add RGB light"
            onClick={() => accessories.createColorLed(strip)}
            leftSection={<ThemeIcon variant="light"><IconPlus size="1.2rem" stroke={2.0} /></ThemeIcon>} />
      </NavLink>
    )
  });

  const defaultOpened = switches.length + dimmable.length == 0
  const cardMb = isMobile ? null : "md";
  const cardRadius = isMobile ? 0 : "lg";

  return (
    <>
      <Card withBorder={!isMobile} radius={cardRadius} shadow="md" padding="sm" mb={cardMb}>
        <Card.Section>
          <NavLink
            label="Switch lights"
            defaultOpened={defaultOpened}
            description="These lights can be only ON or OFF"
            leftSection={<IconCircuitSwitchOpen size="1.8rem" stroke={1.5} />}
            childrenOffset={28}
          >
            {switches}
            <NavLink
              onClick={accessories.createSwitch}
              label="Add new Switch"
              leftSection={<ThemeIcon variant="light"><IconPlus size="1.2rem" stroke={2} /></ThemeIcon>} />
          </NavLink>
        </Card.Section>
      </Card>
      <Card withBorder={!isMobile} radius={cardRadius} shadow="md" padding="sm" mb={cardMb}>
        <Card.Section>
          <NavLink
            label="Dimmable Lights"
            defaultOpened={defaultOpened}
            description="The brightness of these lights can be adjusted"
            leftSection={<IconBrightnessHalf size="1.8rem" stroke={1.5} />}
            childrenOffset={28}
          >
            {dimmable}
            <NavLink
              onClick={accessories.createDimmable}
              label="Add new Dimmable Light"
              leftSection={<ThemeIcon variant="light"><IconPlus size="1.2rem" stroke={2} /></ThemeIcon>} />
            </NavLink>
          </Card.Section>
      </Card>
      {
        features.hasRGBEditor &&
          <Card withBorder={!isMobile} radius={cardRadius} shadow="md" padding="sm" mb={cardMb}>
            <Card.Section>
              <NavLink
                label="Color Lights"
                defaultOpened={defaultOpened}
                description="These lights are capable of displaying colors."
                leftSection={<IconColorSwatch size="1.8rem" stroke={1.5} />}
                childrenOffset={28}
              >
                {colored}
                <NavLink
                  label="Add new Color Strip"
                  onClick={accessories.createColorStrip}
                  leftSection={<ThemeIcon variant="light"><IconPlus size="1.2rem" stroke={2.0} /></ThemeIcon>} />
              </NavLink>
            </Card.Section>
          </Card>
      }
      <SwitchLightEditor isMobile={isMobile} />
      <DimmableLightModal isMobile={isMobile} />
      <ColorStripModal isMobile={isMobile} />
      <ColoredModal isMobile={isMobile} />
    </>
  )
});
