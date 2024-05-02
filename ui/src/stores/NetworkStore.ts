import { action, computed, flow, makeAutoObservable } from "mobx";
import GunplaProtocol, { Network } from "./Protocol"

export enum NetworkState {
  Normal,
  Loading,
  Connecting
}

export class NetworkStore {
  private protocol: GunplaProtocol;
  public state: NetworkState
  public all: Network[]
  public opened: boolean

  constructor(protocol : GunplaProtocol) {
    this.protocol = protocol
    this.state = NetworkState.Normal
    this.all = []
    this.opened
    makeAutoObservable(this, {
      load: flow.bound,
      connect: flow.bound,
      open: action.bound,
      close: action.bound,
      loading: computed,
      connecting: computed
    })
  }

  public open() {
    this.opened = true
  }

  public close() {
    this.opened = false
  }

  public get loading() {
    return this.state == NetworkState.Loading || this.connecting
  }

  public get connecting() {
    return this.state == NetworkState.Connecting
  }

  public *connect(SSID: string, password: string) {
    this.state = NetworkState.Connecting
    yield this.protocol.rpc.connectWiFi({ SSID, password })
    this.state = NetworkState.Normal
  }

  public *load() {
    if (this.loading) {
      return;
    }

    this.state = NetworkState.Loading;

    try {
      const { networks } = yield this.protocol.rpc.listWifi();
      this.all = networks;
    } catch (e) {
      console.error("Could not fetch networks", e);
    }

    this.state = NetworkState.Normal
  }
}
