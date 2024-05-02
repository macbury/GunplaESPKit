import React, { useEffect } from "react"
import { observer } from "mobx-react-lite"
import { useWindowScroll } from "@mantine/hooks"
import { useAppStore, Screen } from "../stores"

import StartScreen from "./StartScreen"
import ConnectToBluetoothDeviceScreen from "./ConnectToBluetoothDeviceScreen"
import BluetoothDashboardScreen from './BluetoothDashboardScreen';
import FirstDeviceSetupScreen from "./FirstDeviceSetupScreen";
import InstallFirmwareScreen from "./InstallFirmwareScreen";
import OTAUpdateScreen from './OTAUpdateScreen';

const Screens = observer(() => {
  const [_scroll, scrollTo] = useWindowScroll();
  const store = useAppStore()

  useEffect(() => {
    scrollTo({ x: 0, y: 0 })
  }, [store.currentScreen])

  switch (store.currentScreen) {
    case Screen.Start:
      return <StartScreen />
    case Screen.ConnectToBluetoothDevice:
      return <ConnectToBluetoothDeviceScreen />
    case Screen.BluetoothDashboard:
      return <BluetoothDashboardScreen />
    case Screen.FirstDeviceSetup:
      return <FirstDeviceSetupScreen />
    case Screen.InstallFirmware:
      return <InstallFirmwareScreen />
    case Screen.OTAUpdate:
      return <OTAUpdateScreen />
    default:
      return <p>Unsupported screen: {store.currentScreen}</p>
  }
})

export default Screens
