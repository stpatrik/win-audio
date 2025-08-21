const bindings = require('node-gyp-build')(__dirname);

function createVolume(render) {
  const inst = bindings._create(!!render);
  let currentDevice = null; // { id, name }
  const kind = render ? 'render' : 'capture';

  return {
    // устройства
    getDevicesList: () => bindings._getDevices(kind),

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
  speaker: createVolume(true),
  mic: createVolume(false),
};
