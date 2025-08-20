const bindings = require('node-gyp-build')(__dirname);

function createVolume(render) {
  const inst = bindings._create(!!render);
  let currentDevice = null; // { id, name }
  const kind = render ? 'render' : 'capture';

  return {
    // список устройств
    getDevicesList: () => bindings._getDevices(kind),

    // выбор устройства
    selectDevice: (deviceId) => {
      const ok = inst.use(String(deviceId));
      if (ok) {
        const list = bindings._getDevices(kind);
        currentDevice = list.find(d => d.id === deviceId) || { id: deviceId, name: 'Unknown' };
      } else {
        console.warn(`[${render ? 'speaker' : 'mic'}] selectDevice FAILED for id: ${deviceId}`);
      }
      return ok;
    },

    clearDevice: () => {
      inst.clearDevice();
      currentDevice = null;
    },

    // управление громкостью
    get: () => {
      const vol = inst.get();
      const tag = render ? 'speaker' : 'mic';
      const label = currentDevice ? `${currentDevice.name} (${currentDevice.id})` : 'DEFAULT DEVICE';
      if (vol != null) console.log(`[${tag}] ${label} → volume: ${Math.round(vol)}%`);
      return vol;
    },
    set: (v) => inst.set(Number(v)),
    increase: (delta = 2) => inst.set(Math.min(100, (inst.get() || 0) + Number(delta))),
    decrease: (delta = 2) => inst.set(Math.max(0, (inst.get() || 0) - Number(delta))),
    mute: () => inst.mute(),
    unmute: () => inst.unmute(),
    isMuted: () => inst.isMuted(),

    // события изменения из системы
    onVolumeChange: (cb) => {
      if (typeof cb !== 'function') throw new Error('Callback must be a function');
      return inst.onVolumeChange((state) => {
        cb({
          volume: state.volume,
          mute: state.mute,
          device: currentDevice,
          kind
        });
      });
    },
    offVolumeChange: () => inst.offVolumeChange(),
  };
}

module.exports = {
  speaker: createVolume(true),
  mic: createVolume(false),
};
