const audio = require('./'); // index.js из папки проекта

console.log('Capture devices (микрофоны):');
const mics = audio.getDevices('capture');
console.log(mics);

if (mics.length > 0) {
  // используем первый микрофон в списке
  console.log('Выбираем:', mics[0].name);
  const ok = audio.mic.use(mics[0].id);
  console.log('Результат use():', ok);

  // Проверяем mute/unmute
  console.log('Состояние mute:', audio.mic.isMuted());
  console.log('Мьютим микрофон...');
  audio.mic.mute();
  console.log('Теперь mute:', audio.mic.isMuted());
  console.log('Снимаем mute...');
  audio.mic.unmute();
  console.log('Теперь mute:', audio.mic.isMuted());
} else {
  console.log('Микрофонов не найдено.');
}
