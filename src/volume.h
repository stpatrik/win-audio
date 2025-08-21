#pragma once
#include <string>
#include <wrl/client.h>
#include <mmdeviceapi.h>
#include <endpointvolume.h>
#include <functiondiscoverykeys_devpkey.h>
#include <vector>
#include <optional>

enum class EndpointKind { Render, Capture };

struct DeviceInfo {
  std::wstring id;
  std::wstring name;
  bool isDefault;
};

class VolumeController {
public:
  VolumeController(EndpointKind kind);
  ~VolumeController();

  // выбор устройства
  bool UseDevice(const std::wstring &deviceId);
  void ClearDevice();

  // громкость / mute
  std::optional<float> GetVolume();   // 0..100
  bool SetVolume(float percent);      // 0..100
  std::optional<bool> GetMute();
  bool SetMute(bool mute);

  // перечисление устройств
  static std::vector<DeviceInfo> ListDevices(std::optional<EndpointKind> kind);

private:
  EndpointKind kind_;
  Microsoft::WRL::ComPtr<IAudioEndpointVolume> endpointVolume_;

  bool EnsureDefaultEndpoint_();
};

// COM init helper
bool EnsureCOMInitialized();
