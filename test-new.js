const audio = require('./'); // подключает index.js из текущей папки

console.log('--- Проверка speaker (динамики) ---');
const speakers = audio.speaker.getDevicesList();
console.log('Список динамиков:', speakers);

if (speakers.length > 0) {
  console.log('Выбираем первый динамик:', speakers[0].name);
  const ok = audio.speaker.selectDevice(speakers[0].id);
  console.log('selectDevice вернул:', ok);

  audio.speaker.set(30);
  console.log('Текущая громкость динамика:', audio.speaker.get());

  audio.speaker.mute();
  console.log('Mute:', audio.speaker.isMuted());
  audio.speaker.unmute();
  console.log('Unmute:', audio.speaker.isMuted());

  audio.speaker.clearDevice();
  console.log('Сброс на default. Текущая громкость:', audio.speaker.get());
} else {
  console.log('Динамики не найдены.');
}

console.log('\n--- Проверка mic (микрофоны) ---');
const mics = audio.mic.getDevicesList();
console.log('Список микрофонов:', mics);

if (mics.length > 0) {
  console.log('Выбираем первый микрофон:', mics[0].name);
  const ok = audio.mic.selectDevice(mics[0].id);
  console.log('selectDevice вернул:', ok);

  console.log('Текущая громкость микрофона:', audio.mic.get());
  console.log('Ставим громкость на 50%...');
  audio.mic.set(50);
  console.log('Теперь громкость:', audio.mic.get());

  audio.mic.mute();
  console.log('Mute:', audio.mic.isMuted());
  audio.mic.unmute();
  console.log('Unmute:', audio.mic.isMuted());

  audio.mic.clearDevice();
  console.log('Сброс на default. Текущая громкость:', audio.mic.get());
} else {
  console.log('Микрофоны не найдены.');
}
