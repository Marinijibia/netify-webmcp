const { getDefaultConfig } = require("expo/metro-config");
const { withNativewind } = require("nativewind/metro");
const path = require("path");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "..");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(projectRoot);

// 1. Watch all files in the monorepo (shared packages, root node_modules)
config.watchFolders = [monorepoRoot];

// 2. Let Metro know where to resolve packages (project node_modules first, then root node_modules)
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];

module.exports = withNativewind(config, { input: "./global.css" });
