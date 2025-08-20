const audio = require('./');

const mics = audio.mic.getDevicesList();
if (!mics.length) { console.log('Микрофоны не найдены'); process.exit(1); }
audio.mic.selectDevice(mics[0].id);

audio.mic.onVolumeChange((e) => {
  const name = e.device?.name || 'DEFAULT';
  console.log(`(event) [mic] ${name} → volume=${Math.round(e.volume)}% mute=${e.mute}`);
});

// Протестируй ползунком в Windows → Система → Звук → Ввод, либо:
setTimeout(() => audio.mic.set(70), 1000);
setTimeout(() => audio.mic.mute(), 2000);
setTimeout(() => audio.mic.unmute(), 3000);

// держим процесс активным
setInterval(() => {}, 1 << 30);
