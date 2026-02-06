const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Allow web fonts bundled inside SCORM packages
config.resolver.assetExts = Array.from(
  new Set([...(config.resolver.assetExts || []), "woff", "woff2"]),
);

module.exports = config;
