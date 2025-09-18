module.exports = function(api) {
  api.cache(true);
  return {
    // `nativewind/babel` returns an object containing `plugins` and is a
    // preset-style export. Using it as a plugin causes Babel to see the
    // returned object and complain that `.plugins` is not a valid Plugin
    // property. Move it into `presets` so Babel treats it correctly.
    presets: ['babel-preset-expo', require('nativewind/babel')],
    plugins: [],
  };
};
