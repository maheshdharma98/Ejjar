const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
const {withNativeWind} = require('nativewind/metro');
const path = require('path');

const config = mergeConfig(getDefaultConfig(__dirname), {
  watchFolders: [
    path.resolve(__dirname, '../shared'),
  ],
  resolver: {
    blockList: [
      /node_modules\/.*\/android\/\.cxx\/.*/,
      /node_modules\/.*\/android\/build\/.*/,
    ],
    extraNodeModules: {
      shared: path.resolve(__dirname, '../shared'),
    },
  },
});

module.exports = withNativeWind(config, {input: './global.css'});