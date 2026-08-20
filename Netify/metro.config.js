const { getDefaultConfig } = require("expo/metro-config");
const { withNativewind } = require("nativewind/metro");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Enable modern package exports resolution for TanStack Query and ESM modules
config.resolver.unstable_enablePackageExports = true;

module.exports = withNativewind(config);
