module.exports = function (api) {
  api.cache(true);
  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'],
    plugins: [
      ...(process.env.EXPO_ROUTER_ENV !== 'web'
        ? [require.resolve('react-native-worklets-core/plugin')]
        : []),
      'react-native-reanimated/plugin',
    ],
  };
};
