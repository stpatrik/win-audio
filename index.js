const bindings = require('node-gyp-build')(__dirname);

// Новый общий метод: вернуть оба списка устройств
function getDevices() {
  return {
    render: bindings._getDevices('render'),
    capture: bindings._getDevices('capture'),
  };
}

function createVolume(render) {
  const inst = bindings._create(!!render);
  let currentDevice = null; // { id, name }
  const kind = render ? 'render' : 'capture';

  return {
    // Оставил для обратной совместимости (можно больше не использовать)
    getDevicesList: () => bindings._getDevices(kind),

    // Выбор устройства. Вернет false, если тип устройства не совпадает (например, микрофон для speaker)
    selectDevice: (deviceId) => {
      const ok = inst.use(String(deviceId));
      if (ok) {
        const list = bindings._getDevices(kind);
        currentDevice =
          list.find((d) => d.id === deviceId) || { id: deviceId, name: 'Unknown' };
      } else {
        console.warn(
          `[${render ? 'speaker' : 'mic'}] selectDevice FAILED for id: ${deviceId}`
        );
      }
      return ok;
    },

    clearDevice: () => {
      inst.clearDevice();
      currentDevice = null;
    },

    // громкость
    get: () => inst.get(),
    set: (v) => inst.set(Number(v)),
    increase: (delta = 2) => inst.set(Math.min(100, (inst.get() || 0) + Number(delta))),
    decrease: (delta = 2) => inst.set(Math.max(0, (inst.get() || 0) - Number(delta))),

    // mute
    mute: () => inst.mute(),
    unmute: () => inst.unmute(),
    isMuted: () => inst.isMuted(),
  };
}

module.exports = {
  // новый единый метод
  getDevices,

  // контролы для вывода и ввода
  speaker: createVolume(true),
  mic: createVolume(false),
};
