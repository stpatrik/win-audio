#include "volume.h"
#include <audiopolicy.h>
#include <combaseapi.h>
#include <propvarutil.h>

using Microsoft::WRL::ComPtr;

static thread_local bool g_comInitialized = false;

bool EnsureCOMInitialized() {
  if (!g_comInitialized) {
    HRESULT hr = CoInitializeEx(nullptr, COINIT_APARTMENTTHREADED);
    if (SUCCEEDED(hr) || hr == RPC_E_CHANGED_MODE) {
      g_comInitialized = true;
    } else {
      return false;
    }
  }
  return true;
}

static EDataFlow ToDataFlow(EndpointKind k) {
  return k == EndpointKind::Render ? eRender : eCapture;
}

VolumeController::VolumeController(EndpointKind kind) : kind_(kind) {
  EnsureCOMInitialized();
}

VolumeController::~VolumeController() {
  endpointVolume_.Reset();
}

bool VolumeController::EnsureDefaultEndpoint_() {
  if (endpointVolume_) return true;

  ComPtr<IMMDeviceEnumerator> enumerator;
  HRESULT hr = CoCreateInstance(__uuidof(MMDeviceEnumerator), nullptr, CLSCTX_ALL,
                                IID_PPV_ARGS(&enumerator));
  if (FAILED(hr)) return false;

  ComPtr<IMMDevice> device;
  hr = enumerator->GetDefaultAudioEndpoint(ToDataFlow(kind_), eConsole, &device);
  if (FAILED(hr)) return false;

  ComPtr<IAudioEndpointVolume> volume;
  hr = device->Activate(__uuidof(IAudioEndpointVolume), CLSCTX_ALL, nullptr,
                        reinterpret_cast<void **>(volume.GetAddressOf()));
  if (FAILED(hr)) return false;

  endpointVolume_ = volume;
  return true;
}

bool VolumeController::UseDevice(const std::wstring &deviceId) {
  EnsureCOMInitialized();

  ComPtr<IMMDeviceEnumerator> enumerator;
  HRESULT hr = CoCreateInstance(__uuidof(MMDeviceEnumerator), nullptr, CLSCTX_ALL,
                                IID_PPV_ARGS(&enumerator));
  if (FAILED(hr)) return false;

  ComPtr<IMMDevice> device;
  hr = enumerator->GetDevice(deviceId.c_str(), &device);
  if (FAILED(hr)) return false;

  // убедимся, что тип совпадает (render/capture)
  ComPtr<IMMEndpoint> ep;
  if (SUCCEEDED(device.As(&ep))) {
    EDataFlow flow;
    if (SUCCEEDED(ep->GetDataFlow(&flow))) {
      if (flow != ToDataFlow(kind_)) return false;
    }
  }

  ComPtr<IAudioEndpointVolume> volume;
  hr = device->Activate(__uuidof(IAudioEndpointVolume), CLSCTX_ALL, nullptr,
                        reinterpret_cast<void **>(volume.GetAddressOf()));
  if (FAILED(hr)) return false;

  endpointVolume_ = volume;
  return true;
}

void VolumeController::ClearDevice() {
  endpointVolume_.Reset();
}

std::optional<float> VolumeController::GetVolume() {
  EnsureCOMInitialized();
  if (!endpointVolume_ && !EnsureDefaultEndpoint_()) return std::nullopt;
  float level = 0.0f;
  if (FAILED(endpointVolume_->GetMasterVolumeLevelScalar(&level))) return std::nullopt;
  return level * 100.0f;
}

bool VolumeController::SetVolume(float percent) {
  EnsureCOMInitialized();
  if (!endpointVolume_ && !EnsureDefaultEndpoint_()) return false;
  if (percent < 0.0f) percent = 0.0f;
  if (percent > 100.0f) percent = 100.0f;
  return SUCCEEDED(endpointVolume_->SetMasterVolumeLevelScalar(percent / 100.0f, nullptr));
}

std::optional<bool> VolumeController::GetMute() {
  EnsureCOMInitialized();
  if (!endpointVolume_ && !EnsureDefaultEndpoint_()) return std::nullopt;
  BOOL mute = FALSE;
  if (FAILED(endpointVolume_->GetMute(&mute))) return std::nullopt;
  return mute ? true : false;
}

bool VolumeController::SetMute(bool mute) {
  EnsureCOMInitialized();
  if (!endpointVolume_ && !EnsureDefaultEndpoint_()) return false;
  return SUCCEEDED(endpointVolume_->SetMute(mute ? TRUE : FALSE, nullptr));
}

static std::wstring GetPropString(ComPtr<IMMDevice> &dev, const PROPERTYKEY &key) {
  ComPtr<IPropertyStore> store;
  if (FAILED(dev->OpenPropertyStore(STGM_READ, &store))) return L"";
  PROPVARIANT var; PropVariantInit(&var);
  std::wstring res;
  if (SUCCEEDED(store->GetValue(key, &var))) {
    if (var.vt == VT_LPWSTR && var.pwszVal) res = var.pwszVal;
  }
  PropVariantClear(&var);
  return res;
}

std::vector<DeviceInfo> VolumeController::ListDevices(std::optional<EndpointKind> kind) {
  EnsureCOMInitialized();
  std::vector<DeviceInfo> out;

  ComPtr<IMMDeviceEnumerator> enumerator;
  if (FAILED(CoCreateInstance(__uuidof(MMDeviceEnumerator), nullptr, CLSCTX_ALL,
                              IID_PPV_ARGS(&enumerator)))) return out;

  auto pushList = [&](EndpointKind k) {
    ComPtr<IMMDeviceCollection> coll;
    if (FAILED(enumerator->EnumAudioEndpoints(ToDataFlow(k), DEVICE_STATE_ACTIVE, &coll))) return;
    UINT count = 0; coll->GetCount(&count);

    ComPtr<IMMDevice> def;
    std::wstring defId;
    if (SUCCEEDED(enumerator->GetDefaultAudioEndpoint(ToDataFlow(k), eConsole, &def))) {
      LPWSTR p = nullptr; if (SUCCEEDED(def->GetId(&p)) && p) { defId = p; CoTaskMemFree(p); }
    }

    for (UINT i = 0; i < count; ++i) {
      ComPtr<IMMDevice> dev; if (FAILED(coll->Item(i, &dev))) continue;
      LPWSTR idW = nullptr; if (FAILED(dev->GetId(&idW))) continue;
      std::wstring id = idW; CoTaskMemFree(idW);

      std::wstring name = GetPropString(dev, PKEY_Device_FriendlyName);
      bool isDef = (!defId.empty() && id == defId);
      out.push_back({ id, name, isDef });
    }
  };

  if (kind.has_value()) {
    pushList(*kind);
  } else {
    pushList(EndpointKind::Render);
    pushList(EndpointKind::Capture);
  }

  return out;
}
