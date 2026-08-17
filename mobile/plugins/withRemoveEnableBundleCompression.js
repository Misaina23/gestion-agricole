const { withAppBuildGradle } = require("expo/config-plugins");

/**
 * Expo SDK 54's prebuild template injects `enableBundleCompression` into the
 * generated `android/app/build.gradle`. That property does not exist in the
 * `@react-native/gradle-plugin` shipped with React Native 0.76.x (it was added
 * in RN 0.77+), which breaks the Gradle evaluation:
 *
 *   > Could not set unknown property 'enableBundleCompression' for extension 'react'
 *
 * This plugin removes the offending line from the generated build.gradle.
 */
module.exports = function withRemoveEnableBundleCompression(config) {
  return withAppBuildGradle(config, (modConfig) => {
    modConfig.modResults.contents = modConfig.modResults.contents.replace(
      /^[ \t]*enableBundleCompression[^\n]*\n/gm,
      ""
    );
    return modConfig;
  });
};
