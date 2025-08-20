#pragma once
#include <string>
#include <wrl/client.h>
#include <mmdeviceapi.h>
#include <endpointvolume.h>
#include <functiondiscoverykeys_devpkey.h>
#include <vector>
#include <optional>
#include <functional>

enum class EndpointKind { Render, Capture };

struct DeviceInfo {
  std::wstring id;
  std::wstring name;
  bool isDefault;
};

// forward
class VolumeCallback;

class VolumeController {
public:
  VolumeController(EndpointKind kind);
  ~VolumeController();

  // device selection
  bool UseDevice(const std::wstring &deviceId);
  void ClearDevice();

  // volume & mute
  std::optional<float> GetVolume();   // 0..100
  bool SetVolume(float percent);      // 0..100
  std::optional<bool> GetMute();
  bool SetMute(bool mute);

  // notifications
  bool RegisterCallback(std::function<void(float,bool)> cb); // vol 0..100, mute
  void UnregisterCallback();

  // enumerate
  static std::vector<DeviceInfo> ListDevices(std::optional<EndpointKind> kind);

private:
  EndpointKind kind_;
  Microsoft::WRL::ComPtr<IAudioEndpointVolume> endpointVolume_;

  // listener state
  VolumeCallback* cb_ = nullptr;                // COM callback (ref-counted)
  bool listening_ = false;
  std::function<void(float,bool)> cb_fn_;       // bridge to JS

  bool EnsureDefaultEndpoint_();
  bool AttachCallback_();                       // attach cb_ to current endpoint
  void DetachCallback_();                       // detach cb_ from current endpoint
};

// COM init helper
bool EnsureCOMInitialized();
