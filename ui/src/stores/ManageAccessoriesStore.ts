import { action, computed, flow, makeAutoObservable } from "mobx";
import GunplaProtocol, { RPCCommand } from "./Protocol";
import { rgbToHsv } from "../utils/colors";

const BASE_ACCESSORIES = {
  "usedIds": [],
  "switch": [],
  "dimmable": [],
  "colored": []
}

export interface IAccessories {
  usedIds: number[];
  switch: ISwitch[];
  dimmable: IDimmable[];
  colored: IColorStrip[];
}

export interface ISwitch {
  id: number;
  pins: number[];
  name: string;
}

export interface IDimmable {
  id: number;
  pins: number[];
  name: string;
  brightness: number;
}

export interface IColorStrip {
  id: number;
  pin: number;
  count: number;
  name: string;
  speed: number;
  colorMode: number;
  lights: IColoredLight[];
}

export interface IColoredLight {
  id: number;
  name: string;
  count: number;
  offset: number;
  h: number;
  s: number;
  v: number;
}

export type TManageDeviceWindow = 'switch' | 'dimmable' | 'colorStrip' | 'colored' | null

export class ManageAccessoriesStore {
  private protocol: GunplaProtocol;
  public openedWindow : TManageDeviceWindow
  public switch : ISwitch
  public dimmable : IDimmable
  public entities: IAccessories
  public colorStrip : IColorStrip
  public colored : IColoredLight
  public newRecord: boolean

  constructor(protocol : GunplaProtocol) {
    this.protocol = protocol;

    makeAutoObservable(this, {
      load: flow.bound,
      usedPins: computed,
      createSwitch: action.bound,
      editSwitch: action.bound,
      writeSwitch: action.bound,
      closeModal: action.bound,
      removeSwitch: action.bound,
      createDimmable: action.bound,
      writeDimmable: action.bound,
      editDimmable: action.bound,
      removeDimmable: action.bound,
      createColorStrip: action.bound,
      writeColorStrip: action.bound,
      removeColorStrip: action.bound,
      editColorStrip: action.bound
    });
  }

  public get totalPins() {
    // [2,3,4,5,6,7,8,9]
    //TODO: get pin number from board?
    return Array.from({ length: 44 }, (_, i) => (i + 2))
  }

  public *load() {
    try {
      const accessories = yield this.protocol.rpc.readAccessories()
      // console.log('accessories', accessories)
      this.entities = {...BASE_ACCESSORIES, ...accessories}
    } catch (e) {
      if (!this.entities) {
        this.entities = {...BASE_ACCESSORIES}
      }
    }
  }

  public get usedPins() {
    const switchPins = this.entities.switch.flatMap(({ pins }) => pins);
    const dimmablePins = this.entities.dimmable.flatMap(({ pins }) => pins);
    const coloredPins = this.entities.colored.map(({ pin }) => pin);

    return [...switchPins, ...dimmablePins, ...coloredPins]
  }

  public update(entities : IAccessories) {
    this.entities = entities
  }

  public async save() {
    await this.protocol.call(RPCCommand.WRITE_ACCESSORIES, this.entities);
  }

  public closeModal() {
    this.openedWindow = null
    this.switch = null
  }

  public editDimmable(dimmableId) {
    this.newRecord = false
    this.dimmable = this.entities.dimmable.find(({ id }) => id == dimmableId)
    this.openedWindow = 'dimmable'
  }

  public removeSwitch(switchId) {
    this.entities.switch = this.entities.switch.filter(({ id }) => switchId !== id)
  }

  public removeDimmable(dimmableId) {
    this.entities.dimmable = this.entities.dimmable.filter(({ id }) => dimmableId !== id)
  }

  public get nextId() {
    const maxId = this.entities.usedIds.length > 0 ? Math.max(...this.entities.usedIds) : 0;
    const nextId = maxId + 1 || 2;
    return nextId
  }

  public createColorLed(strip : IColorStrip) {
    this.newRecord = true
    this.colorStrip = strip
    const offset = Math.max(...[0, ...strip.lights.map((light) => light.count + light.offset)]);
    const [h, s, v] = rgbToHsv("#ffffff");
    this.colored = {
      id: this.nextId,
      offset,
      count: 1,// auto calculate?
      name: "",
      h, s, v
    }
    this.openedWindow = 'colored'
  }

  public createSwitch() {
    this.newRecord = true
    this.switch = {
      id: this.nextId,
      name: "",
      pins: []
    }
    this.openedWindow = 'switch'
  }

  public createDimmable() {
    this.newRecord = true
    this.dimmable = {
      id: this.nextId,
      name: "",
      pins: [],
      brightness: 100
    }
    this.openedWindow = 'dimmable'
  }

  public createColorStrip() {
    this.newRecord = true
    this.openedWindow = 'colorStrip'
    this.colorStrip = {
      id: this.nextId,
      name: "",
      pin: null,
      colorMode: 6,
      count: 1,
      lights: [],
      speed: 0
    }
  }

  public removeColorStrip(recordId : number) {
    this.entities.colored = this.entities.colored.filter(({ id }) => recordId !== id)
  }

  public removeColored(strip : IColorStrip, recordId : number) {
    strip.lights = strip.lights.filter(({ id }) => id !== recordId)
    this.writeColorStrip(strip)
  }

  public writeColored(strip : IColorStrip, record : IColoredLight) {
    strip.lights = strip.lights.filter(({ id }) => id !== record.id)
    strip.lights.push(record)
    this.writeColorStrip(strip)
  }

  public writeColorStrip(record : IColorStrip) {
    this.entities.colored = this.entities.colored.filter(({ id }) => id !== record.id)
    this.entities.colored.push(record)
    this.pushUsedIds(record.id)
    record.lights.forEach(({ id }) => this.pushUsedIds(id))
  }

  public editColorStrip(recordId) {
    this.newRecord = false
    this.colorStrip = this.entities.colored.find(({ id }) => id == recordId)
    this.openedWindow = 'colorStrip'
  }

  public editColored(strip : IColorStrip, recordId : number) {
    this.newRecord = false
    this.colorStrip = strip
    this.colored = strip.lights.find(({ id }) => recordId == id)
    this.openedWindow = 'colored'
  }

  public editSwitch(switchId) {
    this.newRecord = false
    this.switch = this.entities.switch.find(({ id }) => id == switchId)
    this.openedWindow = 'switch'
  }

  public pushUsedIds(recordId : number) {
    if (!this.entities.usedIds.includes(recordId)) {
      this.entities.usedIds.push(recordId)
    }
  }

  public writeSwitch(record : ISwitch) {
    this.entities.switch = this.entities.switch.filter(({ id }) => id !== record.id)
    this.entities.switch.push(record)
    this.pushUsedIds(record.id)
  }

  public writeDimmable(record : IDimmable) {
    this.entities.dimmable = this.entities.dimmable.filter(({ id }) => id !== record.id)
    this.entities.dimmable.push(record)
    this.pushUsedIds(record.id)
  }

  public cleanup() {
    this.entities = {...BASE_ACCESSORIES}
    this.newRecord = false
    this.openedWindow = null
  }
}
