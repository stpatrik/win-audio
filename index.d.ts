export interface DeviceInfo {
  id: string;
  name: string;
  isDefault: boolean;
}

export interface VolumeController {
  // ОРИГИНАЛЬНЫЙ API
  get(): number | null;                 // 0..100
  set(v: number): boolean;
  mute(): boolean;
  unmute(): boolean;
  isMuted(): boolean | null;

  // УДОБНЫЕ ХЕЛПЕРЫ
  increase(delta?: number): boolean;
  decrease(delta?: number): boolean;

  // НОВЫЕ ФУНКЦИИ ДЛЯ ВЫБОРА УСТРОЙСТВА
  getDevices(): DeviceInfo[];           // только своего типа: speaker → render, mic → capture
  selectDevice(deviceId: string): boolean;
  clearDevice(): void;
}

export interface AudioRoot {
  // Совместимость
  speaker: VolumeController;            // вывод (render)
  mic: VolumeController;                // ввод (capture)

  // Новые алиасы (по умолчанию — динамики)
  getDevices(): DeviceInfo[];           // устройства render (спикеры/наушники)
  selectDevice(deviceId: string): boolean; // выбрать render-устройство
}

declare const audio: AudioRoot;
export = audio;
