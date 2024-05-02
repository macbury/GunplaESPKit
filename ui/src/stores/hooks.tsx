import { createContext, useContext, useState, useEffect } from "react"
import { AppStore } from "./AppStore"

export const AppStoreContext = createContext<AppStore>(null)

export function AppStoreProvider({ children }) {
  const [store, setStore] = useState<AppStore>(null)

  useEffect(() => {
    const store = new AppStore()
    setStore(store)

    return () => {
      console.log("Unmount app store provider")
      store.cleanup()
      setStore(null)
    }
  }, []);

  if (store == null) {
    return null
  }

  return (
    <AppStoreContext.Provider value={store}>
      {children}
    </AppStoreContext.Provider>
  )
}

export function useAppStore() {
  const store = useContext(AppStoreContext);
  return store
}
