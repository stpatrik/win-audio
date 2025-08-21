export interface DeviceInfo {
  id: string;
  name: string;
  isDefault: boolean;
}

export interface Volume {
  // устройства
  getDevicesList(): DeviceInfo[];
  selectDevice(deviceId: string): boolean;
  clearDevice(): void;

  // громкость 0–100
  get(): number | null;
  set(v: number): boolean;
  increase(delta?: number): boolean;
  decrease(delta?: number): boolean;

  // mute
  mute(): boolean;
  unmute(): boolean;
  isMuted(): boolean | null;
}

export const speaker: Volume;
export const mic: Volume;
