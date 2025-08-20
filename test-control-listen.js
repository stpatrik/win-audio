// test-control-listen.js — интерактив: выбор устройства, управление, live-listener
const readline = require('readline');
const audio = require('./'); // твой модуль

function list(kind) {
  const arr = kind === 'render' ? audio.speaker.getDevicesList() : audio.mic.getDevicesList();
  console.log(`\n=== ${kind === 'render' ? 'Динамики' : 'Микрофоны'} ===`);
  if (!arr.length) {
    console.log('Устройства не найдены.'); process.exit(1);
  }
  arr.forEach((d, i) => console.log(`${i + 1}. ${d.name} ${d.isDefault ? '(default)' : ''}\n   id: ${d.id}`));
  return arr;
}

function pick(kind, cb) {
  const arr = list(kind);
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.question('\nВыбери номер устройства: ', (ans) => {
    const idx = parseInt(ans, 10) - 1;
    const dev = arr[idx];
    rl.close();
    if (!dev) return pick(kind, cb);
    const ok = (kind === 'render' ? audio.speaker : audio.mic).selectDevice(dev.id);
    if (!ok) {
      console.log('Не удалось выбрать устройство. Повторим.'); 
      return pick(kind, cb);
    }
    cb(dev);
  });
}

function help(kind, dev) {
  console.log(`
Выбрано: [${kind}] ${dev.name} (${dev.id})
Управление:
  ↑ / +    увеличить громкость на 5%
  ↓ / -    уменьшить громкость на 5%
  [0..9]   задать громкость кратно 10% (0=0%, 9=90%)
  m        mute
  u        unmute
  g        показать текущую громкость/состояние
  d        выбрать другое устройство (того же типа)
  t        переключить тип (speaker ↔ mic)
  h        помощь (эта подсказка)
  q        выход
События onVolumeChange отображаются автоматически.
`);
}

function roundPct(v) { return v == null ? v : Math.round(Number(v)); }

function showStatus(kind, obj, dev) {
  const vol = roundPct(obj.get());
  const muted = obj.isMuted();
  console.log(`[${kind}] ${dev.name} (${dev.id}) → volume: ${vol}% | mute: ${muted}`);
}

function attachListener(kind, obj) {
  obj.offVolumeChange?.();
  obj.onVolumeChange?.((e) => {
    const label = e.device?.name ? `${e.device.name}` : 'DEFAULT DEVICE';
    console.log(`(event) [${kind}] ${label} → volume: ${Math.round(e.volume)}% | mute: ${e.mute}`);
  });
}

function attachKeys(state) {
  const { kind, obj } = state;

  readline.emitKeypressEvents(process.stdin);
  if (process.stdin.isTTY) process.stdin.setRawMode(true);
  process.stdin.resume();

  const onKey = (str, key = {}) => {
    if (key.name === 'q' || (key.ctrl && key.name === 'c')) {
      obj.offVolumeChange?.();
      process.stdin.setRawMode && process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdin.removeListener('keypress', onKey);
      console.log('Выход.'); process.exit(0);
    } else if (key.name === 'up' || str === '+') {
      obj.increase(5); showStatus(kind, obj, state.dev);
    } else if (key.name === 'down' || str === '-') {
      obj.decrease(5); showStatus(kind, obj, state.dev);
    } else if (key.name === 'm') {
      obj.mute(); showStatus(kind, obj, state.dev);
    } else if (key.name === 'u') {
      obj.unmute(); showStatus(kind, obj, state.dev);
    } else if (key.name === 'g') {
      showStatus(kind, obj, state.dev);
    } else if (/^[0-9]$/.test(str)) {
      const pct = Number(str) * 10; obj.set(pct); showStatus(kind, obj, state.dev);
    } else if (key.name === 'h') {
      help(kind, state.dev);
    } else if (key.name === 'd') {
      // выбрать другое устройство того же типа
      console.log('\nПереключение устройства…');
      obj.offVolumeChange?.();
      process.stdin.setRawMode && process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdin.removeListener('keypress', onKey);
      pick(kind === 'render' ? 'render' : 'capture', (dev) => {
        state.dev = dev;
        attachListener(kind, obj);
        help(kind, dev);
        showStatus(kind, obj, dev);
        attachKeys(state);
      });
    } else if (key.name === 't') {
      // переключение типа speaker↔mic
      console.log('\nПереключение типа…');
      obj.offVolumeChange?.();
      process.stdin.setRawMode && process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdin.removeListener('keypress', onKey);

      const newKind = kind === 'render' ? 'capture' : 'render';
      const newObj = newKind === 'render' ? audio.speaker : audio.mic;
      pick(newKind, (dev) => {
        state.kind = newKind;
        state.obj = newObj;
        state.dev = dev;
        attachListener(newKind, newObj);
        help(newKind, dev);
        showStatus(newKind, newObj, dev);
        attachKeys(state);
      });
    }
  };

  process.stdin.on('keypress', onKey);
}

function start(kind) {
  const obj = kind === 'render' ? audio.speaker : audio.mic;
  pick(kind, (dev) => {
    const state = { kind, obj, dev };
    attachListener(kind, obj);
    help(kind, dev);
    showStatus(kind, obj, dev);
    attachKeys(state);
  });
}

// старт: спросим тип
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
console.log('Что тестируем? 1) Speaker (динамики)  2) Mic (микрофоны)');
rl.question('Выбери 1 или 2: ', (ans) => {
  rl.close();
  if (ans === '1') start('render');
  else start('capture');
});
