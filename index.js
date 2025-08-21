// Совместимость с оригиналом + расширения для выбора устройств.
// Внутри используем нативные биндинги (_create для инстанса и _getDevices для списка).
const bindings = require('node-gyp-build')(__dirname);

// Вспомогательная функция создания контроллера для типа устройства
function createController(kind /* 'render' | 'capture' */) {
  // В нативном аддоне _create ожидает boolean: true => render (speaker), false => capture (mic)
  const inst = bindings._create(kind === 'render');

  return {
    // ОРИГИНАЛЬНЫЙ API
    get: () => inst.get(),                 // 0..100 или null
    set: (v) => inst.set(Number(v)),       // boolean
    mute: () => inst.mute(),               // boolean
    unmute: () => inst.unmute(),           // boolean
    isMuted: () => inst.isMuted(),         // boolean | null

    // УДОБНЫЕ ХЕЛПЕРЫ (не ломают совместимость)
    increase: (delta = 2) => {
      const cur = inst.get();
      return inst.set(Math.min(100, (cur || 0) + Number(delta)));
    },
    decrease: (delta = 2) => {
      const cur = inst.get();
      return inst.set(Math.max(0, (cur || 0) - Number(delta)));
    },

    // НАШИ НОВЫЕ ФУНКЦИИ ДЛЯ РАБОТЫ С КОНКРЕТНЫМИ УСТРОЙСТВАМИ
    getDevices: () => bindings._getDevices(kind),     // только этого типа
    selectDevice: (deviceId) => inst.use(String(deviceId)), // привязка к устройству
    clearDevice: () => inst.clearDevice(),            // вернуться к системному default
  };
}

const audio = {
  // ОРИГИНАЛЬНЫЙ API (совместимость)
  speaker: createController('render'), // динамики/наушники
  mic: createController('capture'),    // микрофоны

  // НОВЫЕ КОРОНЕВЫЕ АЛИАСЫ (по умолчанию управляют динамиками, чтобы не ломать поведение)
  // audio.getDevices() — только РЕНДЕР (динамики), как и просили
  getDevices: () => bindings._getDevices('render'),
  // audio.selectDevice(id) — выбирает устройство для speaker (render)
  selectDevice: (deviceId) => audio.speaker.selectDevice(deviceId),
};

module.exports = audio;
