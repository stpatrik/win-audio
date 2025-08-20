const audio = require('./'); // подхватит index.js из текущей папки

console.log('Render devices (выход):');
console.log(audio.getDevices('render'));

console.log('Capture devices (микрофоны):');
console.log(audio.getDevices('capture'));

// Проверка громкости на дефолтном устройстве
audio.speaker.set(20);
console.log('Громкость установлена на 20%');
console.log('Текущая громкость:', audio.speaker.get());

// Попробуем переключиться на другое устройство
const devices = audio.getDevices('render');
if (devices.length > 1) {
  console.log('Переключаемся на:', devices[1].name);
  audio.speaker.use(devices[1].id);
  audio.speaker.set(40);
  console.log('Громкость на втором устройстве:', audio.speaker.get());
}
