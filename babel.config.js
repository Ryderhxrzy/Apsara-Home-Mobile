module.exports = function (api) {
  api.cache(true)
  return {
    presets: ["babel-preset-expo"],
    env: {
      // Strip console.* (except error/warn) from production builds only.
      // Dev builds keep all logs for debugging.
      production: {
        plugins: [["transform-remove-console", { exclude: ["error", "warn"] }]],
      },
    },
  }
}
