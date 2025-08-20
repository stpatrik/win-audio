# win-audio-fork (per-device)

```js
const audio = require('win-audio-fork');

const devices = audio.getDevices('render');
const myHeadset = devices.find(d => d.name.includes('Headset'));
if (myHeadset) {
  audio.speaker.use(myHeadset.id); // set once
}

audio.speaker.set(30);
audio.speaker.mute();
audio.speaker.unmute();

// Switch back to default device later
audio.speaker.clearDevice();
```

### Build
```
npm i
npm run rebuild
```

### Notes
- `use()` will return `false` if you pass a capture device to `speaker` (or render device to `mic`).
- If you never call `use()`, operations run against the system default endpoint — preserving classic `win-audio` behavior.
```