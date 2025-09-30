# TODO – build-missing-module-deps

- [x] Verify `package.json` still lists `react-hot-toast` and `react-tooltip` under `dependencies`.
- [x] Run `pnpm install` to rehydrate `node_modules`.
- [x] (Not required) run `pnpm add react-hot-toast react-tooltip` to force re-linking.
- [ ] Run `pnpm run build` and confirm success.
- [ ] Record any residual warnings or follow-ups.
