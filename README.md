# win-audio-fork (per-device)

## Changes in fork (stpatrik/win-audio)

- Removed experimental volume change listener API (`onVolumeChange` / `offVolumeChange`).
- Codebase simplified: now only explicit calls `get/set/increase/decrease`, `mute/unmute/isMuted`.
- Added support for selecting and clearing specific audio devices (`selectDevice`, `clearDevice`).
- Works for both render (speakers) and capture (microphones).

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