// Robust native binding loader without node-gyp-build.
// 1) prebuilds/<platform>-<arch>/node.napi.node
// 2) build/Release/win_audio.node
// + asar-safe: replace app.asar -> app.asar.unpacked

const fs = require('fs');
const path = require('path');

function fixAsarPath(p) {
  // Electron can't require .node from inside app.asar; use unpacked path
  return p.replace(/app\.asar([\\/])/g, 'app.asar.unpacked$1');
}

function firstExisting(paths) {
  for (const p of paths) {
    try {
      if (fs.existsSync(p)) return p;
    } catch (_) {}
  }
  return null;
}

function resolveNative() {
  const root = __dirname;
  const platArch = `${process.platform}-${process.arch}`;

  const candidates = [
    // prebuild (preferred)
    path.join(root, 'prebuilds', platArch, 'node.napi.node'),
    // common aliases for prebuild dirs (optional)
    path.join(root, 'prebuilds', `${platArch}`, 'win_audio.node'),
    // built from source via node-gyp
    path.join(root, 'build', 'Release', 'win_audio.node'),
    path.join(root, 'build', 'Debug', 'win_audio.node'),
  ];

  // also try .asar.unpacked variants for packaged Electron apps
  const expanded = candidates.flatMap((p) => [p, fixAsarPath(p)]);
  const found = firstExisting(expanded);
  if (!found) {
    const hint = [
      `Tried paths:`,
      ...expanded.map((p) => ` - ${p}`),
      ``,
      `If running in Electron, ensure .node files are unpacked (asarUnpack):`,
      `  - node_modules/win-audio-fork/prebuilds/**`,
      `  - node_modules/win-audio-fork/build/Release/*.node`,
    ].join('\n');
    throw new Error(`win-audio-fork: native binary (.node) not found.\n${hint}`);
  }
  return require(found);
}

// Load native bindings
const bindings = resolveNative();

// ===== JS wrapper (совместимость с оригиналом + наши расширения) =====
function createController(kind /* 'render' | 'capture' */) {
  // Внутри C++: _create(true)=render (speaker), _create(false)=capture (mic)
  const inst = bindings._create(kind === 'render');

  return {
    // ОРИГИНАЛЬНЫЙ API
    get: () => inst.get(),                 // 0..100 | null
    set: (v) => inst.set(Number(v)),       // boolean
    mute: () => inst.mute(),               // boolean
    unmute: () => inst.unmute(),           // boolean
    isMuted: () => inst.isMuted(),         // boolean | null

    // ХЕЛПЕРЫ
    increase: (delta = 2) => {
      const cur = inst.get() || 0;
      return inst.set(Math.min(100, cur + Number(delta)));
    },
    decrease: (delta = 2) => {
      const cur = inst.get() || 0;
      return inst.set(Math.max(0, cur - Number(delta)));
    },

    // НОВОЕ
    getDevices: () => bindings._getDevices(kind),              // только своего типа
    selectDevice: (deviceId) => inst.use(String(deviceId)),    // привязка к девайсу
    clearDevice: () => inst.clearDevice(),                     // вернуть системный default
  };
}

const audio = {
  // Совместимость с оригиналом
  speaker: createController('render'),
  mic: createController('capture'),

  // Алиасы по умолчанию для динамиков (render)
  getDevices: () => bindings._getDevices('render'),
  selectDevice: (deviceId) => audio.speaker.selectDevice(deviceId),
};

module.exports = audio;
