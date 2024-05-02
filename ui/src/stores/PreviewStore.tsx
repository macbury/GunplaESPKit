import { flow, makeAutoObservable, toJS } from "mobx";
import GunplaProtocol, { AllStates, IState } from "./Protocol"
import FeatureFlagsStore from "./FeatureFlagsStore";
import { ManageAccessoriesStore } from "./ManageAccessoriesStore";

const hasState = ({ state }) => !!state

export class PreviewStore {
  private protocol: GunplaProtocol;
  private features: FeatureFlagsStore;
  private accessories: ManageAccessoriesStore;
  public states : AllStates

  constructor(protocol : GunplaProtocol, features : FeatureFlagsStore, accessories : ManageAccessoriesStore) {
    this.protocol = protocol;
    this.features = features;
    this.accessories = accessories;
    this.states = { accessories: [] }

    makeAutoObservable(this, {
      load: flow.bound,
      setState: flow.bound,
      setBrightness: flow.bound,
    });
  }

  public get isPresent() {
    return this.states.accessories && this.states.accessories.length > 0
  }

  public *load() {
    console.log("Load light states")
    if (this.features.hasLightManagement) {
      this.states = yield this.protocol.rpc.getAllStates()
    } else {
      this.states = { accessories: [] }
    }
  }

  private withState(accessory) {
    const state = this.states.accessories.find((state) => state.id == accessory.id)
    return {
      state,
      accessory
    }
  }

  public *setState(state : IState, checked : boolean) {
    state.sta = checked
    const config = toJS(state)

    yield this.protocol.rpc.setState(config)
  }

  public *setBrightness(state : IState, brightness : number) {
    state.b = brightness
    const config = toJS(state)

    yield this.protocol.rpc.setState(config)
  }

  public *setHSV(state : IState, h : number, s : number, v: number) {
    state.h = h;
    state.v = v;
    state.s = s;
    const config = toJS(state)

    yield this.protocol.rpc.setState(config)
  }


  public get switches() {
    if (!this.isPresent) {
      return []
    }

    return this.accessories
      .entities
      .switch.map(this.withState.bind(this))
      .filter(hasState);
  }

  public get dimmable() {
    if (!this.isPresent) {
      return []
    }

    return this.accessories
      .entities
      .dimmable.map(this.withState.bind(this))
      .filter(hasState);
  }

  public get colored() {
    if (!this.isPresent) {
      return []
    }

    // console.log('colored', toJS(this.accessories.entities.colored.map((l) => l.lights)).flat())
    // console.log('this.states', toJS(this.states.accessories))
    return this.accessories
      .entities
      .colored
      .map((l) => l.lights)
      .flat()
      .map(this.withState.bind(this))
      .filter(hasState);
  }
}
