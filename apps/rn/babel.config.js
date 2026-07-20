// Babel config for the Debt Planner RN app.
//
// Reanimated 4 drives its worklets through `react-native-worklets`; the worklets Babel plugin
// MUST be listed LAST (it rewrites function bodies for the UI thread). This is the only plugin —
// `babel-preset-expo` covers expo-router, JSX, and the rest.
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['react-native-worklets/plugin'],
  };
};
