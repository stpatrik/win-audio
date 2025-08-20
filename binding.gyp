{
  "targets": [
    {
      "target_name": "win_audio",
      "sources": ["src/addon.cc", "src/volume.cc"],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")"
      ],
      "defines": [ "NAPI_DISABLE_CPP_EXCEPTIONS" ],
      "cflags!": ["-fno-exceptions"],
      "cflags_cc!": ["-fno-exceptions"],
      "msvs_settings": {
        "VCCLCompilerTool": {
          "ExceptionHandling": 1,
          "AdditionalIncludeDirectories": ["$(WindowsSdkDir)include"]
        }
      },
      "conditions": [
        ["OS=='win'", {
          "libraries": [
            "-lole32", "-lOleAut32", "-lUuid"
          ]
        }]
      ]
    }
  ]
}