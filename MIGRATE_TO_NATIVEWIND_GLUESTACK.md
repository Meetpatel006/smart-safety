## Migrating from react-native-paper to NativeWind + Gluestack UI

This document explains where `react-native-paper` is used in this project and provides step-by-step instructions to migrate to NativeWind (Tailwind for React Native) combined with Gluestack UI.

Summary of current usage
- `react-native-paper` is listed in `package.json` and used across the project.
- Files importing Paper components (partial list):
  - `App.tsx` (wraps app with `PaperProvider`)
  - `src/theme/paper.ts` (custom Paper theme)
  - `src/navigation/index.tsx` (uses `useTheme`)
  - Many screens and components import Paper components: `SettingsScreen.tsx`, `DashboardScreen.tsx`, `EmergencyScreen.tsx`, `ItineraryScreen.tsx`, `TransitionsScreen.tsx`, `AuthorityDashboardScreen.tsx`, `auth/LoginScreen.tsx`, `auth/RegisterScreen.tsx`, and many components under `src/components` (e.g., `PanicActions.tsx`, `ToastListener.tsx`, `Map*`, `OsmMap/*`, etc.).

Why switch
- NativeWind gives small, predictable styles with Tailwind syntax and works well with Expo + React Native.
- Gluestack UI provides ready-made components styled with NativeWind utilities and offers theme primitives that align with Tailwind design tokens.
- Migrating simplifies theming and reduces reliance on Material-specific components if you prefer Tailwind patterns.

High-level migration plan
1. Install NativeWind and Gluestack UI packages.
2. Add NativeWind/GlueStack config (tailwind.config.js) and Babel plugin.
3. Replace or adapt `PaperProvider` usage with a global theme/provider for Gluestack (if needed).
4. Replace common Paper components with equivalent Gluestack components or small custom components using NativeWind classes.
5. Migrate theme colors from `src/theme/paper.ts` into Tailwind theme colors and Gluestack tokens.
6. Remove `react-native-paper` dependency after verifying app works.

Exact commands (Expo / project root)
1. Install NativeWind and dependencies (Expo compatible):

```powershell
npm install nativewind
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init
```

2. Install Gluestack UI + NativeWind adapter

```powershell
npm install @gluestack-ui/core @gluestack-ui/nativewind
```

3. Add NativeWind Babel plugin (enable className support)

Install plugin:

```powershell
npm install -D babel-plugin-nativewind
```

Then in `babel.config.js` add the plugin to the plugins list (or create it if missing):

```js
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['nativewind/babel'],
  };
};
```

4. Configure `tailwind.config.js`

Add your project's color tokens (map from `src/theme/paper.ts`):

```js
module.exports = {
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
};
```

5. Wrap your app with Gluestack provider (optional)

Gluestack UI may expose a Provider for themes — check `@gluestack-ui/core` docs. If you don't need a provider, you can simply use NativeWind classes and Gluestack components directly.

Example replacement snippets

- Paper button to Tailwind/Gluestack Button:

Paper:

```tsx
import { Button } from 'react-native-paper'

<Button mode="contained" onPress={onPress}>Save</Button>
```

Gluestack / NativeWind:

```tsx
import { Button } from '@gluestack-ui/core'

<Button className="bg-primary px-4 py-2 rounded" onPress={onPress}>Save</Button>
```

- Paper Text / Typography

Paper:

```tsx
import { Text } from 'react-native-paper'

<Text>Message</Text>
```

NativeWind:

```tsx
import { Text } from 'react-native'

<Text className="text-base text-gray-800">Message</Text>
```

- Snackbar / Toast

Paper's `Snackbar`/`Snackbar` usage is in `src/components/ToastListener.tsx` and `PanicActions.tsx`.

Options:
- Use a small local Toast component (e.g., `react-native-toast-message`) or build a simple `Snackbar` using absolute-positioned `View` with NativeWind styles.
- Gluestack may include a `Toast` or `Snackbar` component — check docs for `@gluestack-ui/nativewind`.

Mapping checklist (common components)
- Appbar -> custom header using `View` + `Text` + `Icon` or Gluestack `Header`.
- Buttons -> Gluestack `Button` or `TouchableOpacity` with classes.
- Card -> Gluestack `Card` or custom `View` with shadow, padding.
- TextInput -> `TextInput` from `react-native` styled with NativeWind classes, or Gluestack input.
- List -> `FlatList` / `SectionList` + custom item component.
- Avatar -> `Image` with rounded classes or Gluestack Image/Avatar.

Theme migration
1. Copy colors from `src/theme/paper.ts` into `tailwind.config.js`'s `extend.colors` as shown above.
2. If you use typography scales, add them under `extend.fontSize` or custom tokens.

Provider and useTheme
- Currently `App.tsx` wraps the app with `PaperProvider` and many components call `useTheme()` from Paper.
- Replace `PaperProvider` with a small context that exposes the theme colors (a `ThemeContext`) or use Gluestack's theme provider if available.

Example minimal ThemeContext replacement

```tsx
// src/context/ThemeContext.tsx
import React, { createContext, useContext } from 'react'

const theme = {
  colors: {
    primary: '#0077CC',
    secondary: '#FF7A00',
    surface: '#FFFFFF',
    background: '#FFFFFF',
    error: '#D11A2A',
  }
}

const ThemeContext = createContext(theme)
export const ThemeProvider = ({ children }) => (
  <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
)

export const useAppTheme = () => useContext(ThemeContext)
```

Replace `useTheme()` imports with `useAppTheme()` and update consumers accordingly.

Testing and verification
- Replace components progressively and test screens locally in Expo.
- Remove `react-native-paper` from `package.json` only after all references are removed.

Removing react-native-paper

```powershell
npm uninstall react-native-paper
```

Follow-ups and optional helpers
- Create small adapter components to map Paper props to nativewind/gluestack props for large components. Example: `src/components/Adapters/PaperButton.tsx` that renders Gluestack `Button` but accepts Paper-like props.
- Add unit/snapshot tests for critical UI pieces during migration.

References
- Gluestack UI docs: https://gluestack.io/ui/docs/home/getting-started/installation
- Gluestack NativeWind utilities: https://gluestack.io/ui/docs/home/getting-started/gluestack-ui-nativewind-utils
- NativeWind docs: https://www.nativewind.dev

---
If you'd like, I can:
- Generate a `tailwind.config.js` and update `babel.config.js` for you now.
- Create a `ThemeContext` and small adapter components for Button/Text/TextInput to make migration incremental.

Mark which option you prefer and I'll continue with the edits.
