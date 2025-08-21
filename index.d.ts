export interface DeviceInfo {
  id: string;
  name: string;
  isDefault: boolean;
}

export interface DevicesBundle {
  render: DeviceInfo[];  // устройства вывода (speakers/headphones)
  capture: DeviceInfo[]; // устройства ввода (microphones)
}

// Новый общий метод: без аргументов, вернёт оба списка
export function getDevices(): DevicesBundle;

export interface Volume {
  // (legacy, можно не использовать) — список для конкретного типа
  getDevicesList(): DeviceInfo[];

  // выбор устройства; вернёт false, если тип устройства не подходит этому контроллеру
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

export const speaker: Volume; // контроллер вывода (render)
export const mic: Volume;     // контроллер ввода (capture)
