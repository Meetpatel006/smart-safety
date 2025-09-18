// Use the preset entrypoint exported by the nativewind package
// (nativewind/preset -> ../dist/tailwind)
const nativewindPreset = require('nativewind/preset');

module.exports = {
  presets: [nativewindPreset],
  content: ['./**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#0077CC',
        secondary: '#FF7A00',
        surface: '#FFFFFF',
        background: '#FFFFFF',
        error: '#D11A2A',
      },
    },
  },
  plugins: [],
}


