// Metro configuration — extends Expo's defaults.
// https://docs.expo.dev/guides/customizing-metro/
//
// `inlineRequires` defers each module's evaluation until the first time it's
// actually used, instead of running every module's top-level code at startup.
// That cuts time-to-interactive on a large app like this one. Expo turns it on
// by default; we set it explicitly so it can't be silently lost.
//
// Tree-shaking of unused exports is handled by Expo's production minifier. This
// codebase already avoids barrel re-exports (CLAUDE.md), which is what keeps
// that effective — so no extra config is needed here.
const { getDefaultConfig } = require("expo/metro-config")

const config = getDefaultConfig(__dirname)

config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: false,
    inlineRequires: true,
  },
})

module.exports = config
