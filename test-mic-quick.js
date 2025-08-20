// test-mic-quick.js — интерактивное управление микрофоном (фикс для PowerShell)
const readline = require('readline');
const audio = require('./');

function listMics() {
  const mics = audio.mic.getDevicesList();
  console.log('\n=== Микрофоны ===');
  if (!mics.length) {
    console.log('Микрофоны не найдены.');
    process.exit(1);
  }
  mics.forEach((d, i) => {
    console.log(`${i + 1}. ${d.name} ${d.isDefault ? '(default)' : ''}\n   id: ${d.id}`);
  });
  return mics;
}

function help(name, id) {
  console.log(`
Выбран: ${name} (${id})

Управление:
  ↑ / +   увеличить громкость на 5%
  ↓ / -   уменьшить громкость на 5%
  m       mute
  u       unmute
  g       показать текущую громкость/состояние
  d       выбрать другой микрофон
  h       помощь (эта подсказка)
  q       выход
`);
}

function roundPct(v) {
  if (v == null) return v;
  return Math.round(Number(v));
}

function showStatus(name, id) {
  const vol = roundPct(audio.mic.get());
  const muted = audio.mic.isMuted();
  console.log(`[mic] ${name} (${id}) → volume: ${vol}% | mute: ${muted}`);
}

function pickMic(cb) {
  const mics = listMics();
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.question('\nВыбери номер микрофона: ', (ans) => {
    const idx = parseInt(ans, 10) - 1;
    const mic = mics[idx];
    rl.close();
    if (!mic) {
      console.log('Неверный номер. Повторим выбор.');
      return pickMic(cb);
    }
    const ok = audio.mic.selectDevice(mic.id);
    if (!ok) {
      console.log('Не удалось выбрать устройство. Повторим выбор.');
      return pickMic(cb);
    }
    cb(mic);
  });
}

function attachKeyHandler(state) {
  // гарантируем «живой» stdin, иначе процесс может завершиться
  readline.emitKeypressEvents(process.stdin);
  if (process.stdin.isTTY) process.stdin.setRawMode(true);
  process.stdin.resume();

  const onKey = (str, key = {}) => {
    if (key.name === 'q' || (key.ctrl && key.name === 'c')) {
      console.log('Выход.');
      process.stdin.setRawMode && process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdin.removeListener('keypress', onKey);
      process.exit(0);
    } else if (key.name === 'up' || str === '+') {
      audio.mic.increase(5);
      showStatus(state.name, state.id);
    } else if (key.name === 'down' || str === '-') {
      audio.mic.decrease(5);
      showStatus(state.name, state.id);
    } else if (key.name === 'm') {
      audio.mic.mute();
      showStatus(state.name, state.id);
    } else if (key.name === 'u') {
      audio.mic.unmute();
      showStatus(state.name, state.id);
    } else if (key.name === 'g') {
      showStatus(state.name, state.id);
    } else if (key.name === 'h') {
      help(state.name, state.id);
    } else if (key.name === 'd') {
      // переключение устройства: временно отключаем rawMode/обработчик
      console.log('\nПереключение устройства…');
      process.stdin.setRawMode && process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdin.removeListener('keypress', onKey);

      pickMic((newMic) => {
        state.name = newMic.name;
        state.id = newMic.id;
        help(state.name, state.id);
        showStatus(state.name, state.id);
        // заново активируем обработчик и rawMode
        attachKeyHandler(state);
      });
    }
  };

  process.stdin.on('keypress', onKey);
}

function startControl(mic) {
  const state = { name: mic.name, id: mic.id };
  help(state.name, state.id);
  showStatus(state.name, state.id);
  attachKeyHandler(state);
}

// Старт
pickMic(startControl);
