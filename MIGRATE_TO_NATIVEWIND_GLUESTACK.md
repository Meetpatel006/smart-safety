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

5. Wrap your app with Gluestack provider

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

Git workflow: phased commits, tags, and rollback
-----------------------------------------------
Add the migration in small, reversible commits so it's easy to review and roll back if anything breaks. Below is a recommended phased commit strategy, example PowerShell commands, and rollback steps you can copy into your terminal.

IMPORTANT WARNING
-----------------
Do NOT commit or push migration changes directly to `main`. Work only on the feature branch `feature/remove-react-paper` (or other short-lived feature branches) and create a Pull Request for review. If you don't have permission to push branches or merge PRs to remote/main, coordinate with a maintainer. Avoid force-pushing `main` under any circumstance unless explicitly instructed by the release manager.

Suggested coordination steps if you lack permissions:
- Create the changes locally on `feature/remove-react-paper` and push the branch to your fork or request a maintainer to add your branch to the upstream repository.
- Open a PR and request at least one reviewer before merging.
- Do not use `git push --force` on shared branches (including `feature/remove-react-paper`) unless you have coordinated with reviewers and documented the reason in the PR.

1) Prepare branch
- Create and push a feature branch before starting work:

```powershell
# create branch and switch to it
git checkout -b feature/remove-react-paper
# push branch upstream
git push -u origin feature/remove-react-paper
```

2) Phased commits (small, focused commits with clear messages)
- Make changes in small logical chunks and commit each chunk with an explanatory message. Example phases and suggested commit messages:

- Phase A — Install & config
  - npm/yarn installs, add `babel.config.js` plugin, add `tailwind.config.js`.
  - Commit message: "chore(migrate): add NativeWind & Gluestack deps; add tailwind and babel configs"

- Phase B — Theme scaffolding
  - Add `ThemeContext`, migrate color tokens to `tailwind.config.js`.
  - Commit message: "feat(theme): add ThemeContext and map paper theme to Tailwind tokens"

- Phase C — Adapter components
  - Add small adapter components (Button/Text/Input) and update a few screens to use them.
  - Commit message: "refactor(ui): add Gluestack/NativeWind adapters and migrate sample components"

- Phase D — Replace Paper usage
  - Replace remaining `react-native-paper` usage progressively.
  - Commit message: "refactor(ui): replace react-native-paper usages with nativewind/gluestack"

- Phase E — Cleanup
  - Remove `react-native-paper` from package.json and run install.
  - Commit message: "chore(cleanup): remove react-native-paper and update deps"

Example PowerShell commit sequence (for Phase A):

```powershell
# stage files
git add babel.config.js tailwind.config.js package.json package-lock.json
# commit
git commit -m "chore(migrate): add NativeWind & Gluestack deps; add tailwind and babel configs"
# push
git push
```

3) Use tags for stable checkpoints
- After a working phase or milestone, create an annotated tag so you can easily return to a known-good state:

```powershell
# create an annotated tag
git tag -a v0.3.0-migrate-nativewind -m "Checkpoint: migrate to NativeWind/Gluestack - phase A"
# push tags
git push origin --tags
```

4) Code review and CI
- Open a PR from `feature/remove-react-paper` to your main branch. Keep each PR small (one or two phases). Run your CI/tests and make sure everything passes before merging.

5) Rollback strategies (when things go wrong)
- Rollback a single commit (not yet pushed):

```powershell
# undo last commit but keep working tree changes
git reset --soft HEAD~1
# or discard changes entirely
git reset --hard HEAD~1
```

- Revert a pushed commit (produces a new commit that undoes changes):

```powershell
# revert a single commit by hash
git revert <commit-hash>
git push
```

- Reset branch to a previous tag or commit (force push required if already pushed remotely). Use carefully — this rewrites history.

```powershell
# reset to annotated tag
git reset --hard v0.3.0-migrate-nativewind
# force push to update remote branch (only if you understand the history rewrite impact)
git push --force
```

6) Emergency rollback (restore main to a known-good tag)
- If a merge into `main` breaks production and you need to revert to a previous tag quickly:

```powershell
# switch to main
git checkout main
# reset main to tag
git reset --hard v0.2.5-stable
# push force to remote
git push --force origin main
```

Notes and best practices
- Keep commits atomic and focused. Prefer multiple small PRs over one massive change.
- Include test runs or smoke-test steps in PR descriptions so reviewers know how to validate.
- Avoid force pushes to shared branches unless coordinating with your team.
- Use annotated tags (with messages) for important checkpoints.
- When in doubt, create a backup branch before history-rewriting commands: `git branch backup-before-reset`.

With these Git practices added to the migration guide, the migration becomes much easier to review and revert if necessary.
