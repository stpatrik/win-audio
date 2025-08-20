const readline = require('readline');
const audio = require('./');

// Выбираем первый микрофон (можно поменять на нужный)
const mics = audio.getDevices('capture');
if (!mics.length) {
  console.log('Микрофоны не найдены.');
  process.exit(1);
}
const mic = mics[0];
console.log('Используем микрофон:', mic.name);
audio.mic.use(mic.id);

console.log(`
Управление:
  ↑   увеличить громкость на 5%
  ↓   уменьшить громкость на 5%
  m   mute (выкл. микрофон)
  u   unmute (вкл. микрофон)
  q   выход
`);

function showVolume() {
  console.log('Текущая громкость:', audio.mic.get(), '% | mute:', audio.mic.isMuted());
}
showVolume();

readline.emitKeypressEvents(process.stdin);
if (process.stdin.isTTY) process.stdin.setRawMode(true);

process.stdin.on('keypress', (str, key) => {
  if (key.name === 'q' || (key.ctrl && key.name === 'c')) {
    process.exit();
  } else if (key.name === 'up') {
    audio.mic.increase(5);
    showVolume();
  } else if (key.name === 'down') {
    audio.mic.decrease(5);
    showVolume();
  } else if (key.name === 'm') {
    audio.mic.mute();
    showVolume();
  } else if (key.name === 'u') {
    audio.mic.unmute();
    showVolume();
  }
});
