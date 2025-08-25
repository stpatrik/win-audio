// Native binding loader without node-gyp-build.
// Strategy:
//   1) try prebuilds/<platform>-<arch>/node.napi.node
//   2) fallback to build/Release/win_audio.node (built by node-gyp)
//   3) support Electron asar by rewriting app.asar → app.asar.unpacked

const fs = require('fs');
const path = require('path');

function fixAsarPath(p) {
  // Electron cannot require .node from inside app.asar
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
    // Prebuilt binary (preferred)
    path.join(root, 'prebuilds', platArch, 'node.napi.node'),
    // Sometimes prebuilds may use plain file name
    path.join(root, 'prebuilds', platArch, 'win_audio.node'),
    // Built from source
    path.join(root, 'build', 'Release', 'win_audio.node'),
    path.join(root, 'build', 'Debug', 'win_audio.node'),
  ];

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

// ===== JavaScript wrapper (backward compatibility + new features) =====
function createController(kind /* 'render' | 'capture' */) {
  // In C++ addon: _create(true) = render (speaker), _create(false) = capture (mic)
  const inst = bindings._create(kind === 'render');

  return {
    // Original API
    get: () => inst.get(),                 // number 0..100 | null
    set: (v) => inst.set(Number(v)),       // boolean
    mute: () => inst.mute(),               // boolean
    unmute: () => inst.unmute(),           // boolean
    isMuted: () => inst.isMuted(),         // boolean | null

    // Helpers
    increase: (delta = 2) => {
      const cur = inst.get() || 0;
      return inst.set(Math.min(100, cur + Number(delta)));
    },
    decrease: (delta = 2) => {
      const cur = inst.get() || 0;
      return inst.set(Math.max(0, cur - Number(delta)));
    },

    // Extended API
    getDevices: () => bindings._getDevices(kind),              // devices of this type only
    selectDevice: (deviceId) => inst.use(String(deviceId)),    // bind to specific device
    clearDevice: () => inst.clearDevice(),                     // reset to system default
  };
}

const audio = {
  // Backward compatibility
  speaker: createController('render'),
  mic: createController('capture'),

  // Root-level aliases (default = speakers)
  getDevices: () => bindings._getDevices('render'),
  selectDevice: (deviceId) => audio.speaker.selectDevice(deviceId),
};

module.exports = audio;
