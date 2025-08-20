const readline = require('readline');
const audio = require('./'); // подключает index.js из текущей папки

// Общая функция выбора устройства
function chooseDevice(type) {
  const list = type === 'render'
    ? audio.speaker.getDevicesList()
    : audio.mic.getDevicesList();

  console.log(`\n=== ${type === 'render' ? 'Динамики' : 'Микрофоны'} ===`);
  list.forEach((d, i) => {
    console.log(`${i + 1}. ${d.name} ${d.isDefault ? '(default)' : ''}\n   id: ${d.id}`);
  });

  return list;
}

// Меню управления
function control(volumeObj, dev) {
  console.log(`
Выбран девайс: ${dev.name} (${dev.id})

Управление:
  ↑   увеличить громкость на 5%
  ↓   уменьшить громкость на 5%
  m   mute
  u   unmute
  g   показать громкость
  q   выход
`);

  function showStatus() {
    const vol = volumeObj.get();
    const muted = volumeObj.isMuted();
    console.log(`[${dev.name}] (${dev.id}) → volume: ${vol}% | mute: ${muted}`);
  }

  showStatus();

  readline.emitKeypressEvents(process.stdin);
  if (process.stdin.isTTY) process.stdin.setRawMode(true);

  process.stdin.on('keypress', (str, key) => {
    if (key.name === 'q' || (key.ctrl && key.name === 'c')) {
      console.log('Выход.');
      process.exit(0);
    } else if (key.name === 'up') {
      volumeObj.increase(5);
      showStatus();
    } else if (key.name === 'down') {
      volumeObj.decrease(5);
      showStatus();
    } else if (key.name === 'm') {
      volumeObj.mute();
      showStatus();
    } else if (key.name === 'u') {
      volumeObj.unmute();
      showStatus();
    } else if (key.name === 'g') {
      showStatus();
    }
  });
}

// === Запуск ===
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log('Что будем тестировать?');
console.log('1. Speaker (динамики)');
console.log('2. Mic (микрофоны)');

rl.question('Выбери 1 или 2: ', (ans) => {
  if (ans === '1') {
    const devices = chooseDevice('render');
    rl.question('Выбери номер устройства: ', (num) => {
      const dev = devices[parseInt(num) - 1];
      if (dev) {
        audio.speaker.selectDevice(dev.id);
        rl.close();
        control(audio.speaker, dev);
      } else {
        console.log('Неверный номер.');
        process.exit(1);
      }
    });
  } else if (ans === '2') {
    const devices = chooseDevice('capture');
    rl.question('Выбери номер устройства: ', (num) => {
      const dev = devices[parseInt(num) - 1];
      if (dev) {
        audio.mic.selectDevice(dev.id);
        rl.close();
        control(audio.mic, dev);
      } else {
        console.log('Неверный номер.');
        process.exit(1);
      }
    });
  } else {
    console.log('Нужно выбрать 1 или 2.');
    process.exit(1);
  }
});
