# win-audio (fork)

Control Windows audio devices directly from Node.js.  
Supports both **speakers (render devices)** and **microphones (capture devices)**.  
Forked from [fcannizzaro/win-audio](https://github.com/fcannizzaro/win-audio).

---

## 🔧 Installation

```sh
npm install win-audio-fork
```

> ⚠️ Works on **Windows only**.  
> For macOS/Linux support use conditionals in your app (see below).

---

## 🎵 Compatibility API (unchanged)

The **original API is fully supported**.  
This means your existing code will continue to work without any changes.

```js
const audio = require("win-audio");

audio.speaker.get();      // current speaker volume
audio.speaker.set(50);    // set speaker volume
audio.speaker.mute();     // mute speakers
audio.speaker.unmute();   // unmute speakers
audio.speaker.isMuted();  // check mute state

audio.mic.get();          // current mic volume
audio.mic.set(70);        // set mic volume
audio.mic.mute();         // mute mic
audio.mic.unmute();       // unmute mic
audio.mic.isMuted();      // check mic mute state
```

---

## 🚀 Extended API (new in fork)

### 🔊 Speakers (render devices)

```js
audio.speaker.getDevices();
// → [{ id, name, isDefault }, ...]

audio.speaker.selectDevice(deviceId);
// select specific speaker

audio.speaker.clearDevice();
// reset to system default

audio.speaker.increase(5);
audio.speaker.decrease(5);
```

### 🎙 Microphones (capture devices)

```js
audio.mic.getDevices();
// → [{ id, name, isDefault }, ...]

audio.mic.selectDevice(deviceId);
// select specific microphone

audio.mic.clearDevice();
// reset to system default

audio.mic.increase(5);
audio.mic.decrease(5);
```

---

### 🌍 Root-level aliases (for speakers)

For convenience, `audio.getDevices()` and `audio.selectDevice()` control **speakers**.

```js
audio.getDevices();
// speaker devices only

audio.selectDevice(deviceId);
// choose speaker device
```

---

## 📖 Example

```js
const audio = require("win-audio");

// List speakers
const speakers = audio.getDevices();
console.log("Speakers:", speakers);

audio.selectDevice(speakers[0].id);
audio.speaker.set(40);

// List microphones
const mics = audio.mic.getDevices();
console.log("Mics:", mics);

audio.mic.selectDevice(mics[0].id);
audio.mic.mute();

// Volume control
audio.speaker.increase(10);
```

---

## 🖥 Cross-platform usage

This fork is **Windows-only** (uses WASAPI).  
For apps that run on macOS/Linux (e.g. Electron, Vue, etc.), use:

```js
const os = require("os");
if (os.platform() === "win32") {
  const audio = require("win-audio-fork");
  // safe to use here
}
```

---

## 🆕 Changelog

### v1.2.0
- Added `getDevices()` and `selectDevice()` for **speakers** and **microphones**
- Added `clearDevice()` to reset selection to system default
- Added `increase(step)` / `decrease(step)` helpers
- Preserved full backward compatibility with original API
- Root-level `audio.getDevices()` and `audio.selectDevice()` control **speakers**
