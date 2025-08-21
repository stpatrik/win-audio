#include <napi.h>
#include <windows.h>
#include <string>
#include <optional>
#include <memory>
#include "volume.h"

// UTF-8 -> UTF-16
static std::wstring Utf8ToWide(const std::string& s) {
  if (s.empty()) return std::wstring();
  int len = MultiByteToWideChar(CP_UTF8, 0, s.c_str(), (int)s.size(), nullptr, 0);
  if (len <= 0) return std::wstring();
  std::wstring w(len, L'\0');
  MultiByteToWideChar(CP_UTF8, 0, s.c_str(), (int)s.size(), &w[0], len);
  return w;
}

class NapiVolume : public Napi::ObjectWrap<NapiVolume> {
public:
  static Napi::Object Init(Napi::Env env, Napi::Object exports) {
    Napi::Function func = DefineClass(env, "Volume", {
      InstanceMethod("use", &NapiVolume::Use),
      InstanceMethod("clearDevice", &NapiVolume::ClearDevice),
      InstanceMethod("get", &NapiVolume::Get),
      InstanceMethod("set", &NapiVolume::Set),
      InstanceMethod("mute", &NapiVolume::Mute),
      InstanceMethod("unmute", &NapiVolume::Unmute),
      InstanceMethod("isMuted", &NapiVolume::IsMuted)
    });

    constructor = Napi::Persistent(func);
    constructor.SuppressDestruct();

    exports.Set("_create", Napi::Function::New(env, Create));
    exports.Set("_getDevices", Napi::Function::New(env, GetDevices));
    return exports;
  }

  NapiVolume(const Napi::CallbackInfo &info) : Napi::ObjectWrap<NapiVolume>(info) {}

  static Napi::Value Create(const Napi::CallbackInfo &info) {
    Napi::Env env = info.Env();
    bool render = info[0].As<Napi::Boolean>().Value();
    auto obj = constructor.New({});
    auto *self = Napi::ObjectWrap<NapiVolume>::Unwrap(obj);
    self->ctrl_ = std::make_unique<VolumeController>(render ? EndpointKind::Render : EndpointKind::Capture);
    return obj;
  }

  static Napi::Value GetDevices(const Napi::CallbackInfo &info) {
    Napi::Env env = info.Env();
    std::optional<EndpointKind> kind;
    if (info.Length() > 0 && info[0].IsString()) {
      std::string k = info[0].As<Napi::String>();
      if (k == "render") kind = EndpointKind::Render;
      else if (k == "capture") kind = EndpointKind::Capture;
    }
    auto list = VolumeController::ListDevices(kind);
    Napi::Array arr = Napi::Array::New(env, list.size());
    for (size_t i = 0; i < list.size(); ++i) {
      Napi::Object o = Napi::Object::New(env);
      o.Set("id",   Napi::String::New(env, std::string(list[i].id.begin(),   list[i].id.end())));
      o.Set("name", Napi::String::New(env, std::string(list[i].name.begin(), list[i].name.end())));
      o.Set("isDefault", Napi::Boolean::New(env, list[i].isDefault));
      arr.Set(i, o);
    }
    return arr;
  }

private:
  // выбор устройства
  Napi::Value Use(const Napi::CallbackInfo &info) {
    Napi::Env env = info.Env();
    if (info.Length() < 1 || !info[0].IsString()) return Napi::Boolean::New(env, false);
    std::wstring idW = Utf8ToWide(info[0].As<Napi::String>().Utf8Value());
    bool ok = ctrl_->UseDevice(idW);
    return Napi::Boolean::New(env, ok);
  }

  Napi::Value ClearDevice(const Napi::CallbackInfo &info) {
    ctrl_->ClearDevice();
    return info.Env().Undefined();
  }

  // громкость
  Napi::Value Get(const Napi::CallbackInfo &info) {
    auto v = ctrl_->GetVolume();
    if (!v.has_value()) return info.Env().Null();
    return Napi::Number::New(info.Env(), *v);
  }

  Napi::Value Set(const Napi::CallbackInfo &info) {
    if (info.Length() < 1 || !info[0].IsNumber())
      return Napi::Boolean::New(info.Env(), false);
    float p = info[0].As<Napi::Number>().FloatValue();
    bool ok = ctrl_->SetVolume(p);
    return Napi::Boolean::New(info.Env(), ok);
  }

  Napi::Value Mute(const Napi::CallbackInfo &info) {
    bool ok = ctrl_->SetMute(true);
    return Napi::Boolean::New(info.Env(), ok);
  }

  Napi::Value Unmute(const Napi::CallbackInfo &info) {
    bool ok = ctrl_->SetMute(false);
    return Napi::Boolean::New(info.Env(), ok);
  }

  Napi::Value IsMuted(const Napi::CallbackInfo &info) {
    auto m = ctrl_->GetMute();
    if (!m.has_value()) return info.Env().Null();
    return Napi::Boolean::New(info.Env(), *m);
  }

  static Napi::FunctionReference constructor;
  std::unique_ptr<VolumeController> ctrl_;
};

Napi::FunctionReference NapiVolume::constructor;

Napi::Object InitAll(Napi::Env env, Napi::Object exports) {
  return NapiVolume::Init(env, exports);
}

NODE_API_MODULE(win_audio, InitAll)
