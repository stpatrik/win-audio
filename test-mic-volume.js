const audio = require('./');

console.log('Список микрофонов:');
const mics = audio.getDevices('capture');
console.log(mics);

if (mics.length > 0) {
  const mic = mics[0]; // выберем первый
  console.log('Используем:', mic.name);
  audio.mic.use(mic.id);

  console.log('Текущая громкость микрофона:', audio.mic.get());

  console.log('Ставим громкость на 50%...');
  audio.mic.set(50);
  console.log('Теперь:', audio.mic.get());

  console.log('Увеличиваем на 10%...');
  audio.mic.increase(10);
  console.log('Теперь:', audio.mic.get());

  console.log('Уменьшаем на 20%...');
  audio.mic.decrease(20);
  console.log('Теперь:', audio.mic.get());
} else {
  console.log('Микрофоны не найдены.');
}
