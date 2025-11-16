# Vitest Command Quick Reference

## Correct Command Patterns

### ❌ **INCORRECT** (these will fail)

```bash
# --filter is not a valid Vitest option
pnpm test --filter reserve/features/reservations/wizard/

# Duplicate --config error (package.json already has one)
pnpm test --config reserve/vitest.config.ts --run tests/
```

### ✅ **CORRECT** (use these instead)

#### Run all tests

```bash
pnpm test
# OR
pnpm vitest run --config reserve/vitest.config.ts
```

#### Run with watch mode

```bash
pnpm test:watch
# OR
pnpm vitest --config reserve/vitest.config.ts
```

#### Run specific pattern (path-based)

```bash
# Wizard analytics tests
pnpm vitest run --config reserve/vitest.config.ts tests/features/wizard/

# Wizard UI tests
pnpm vitest run --config reserve/vitest.config.ts features/reservations/wizard/ui/__tests__/

# All wizard tests
pnpm vitest run --config reserve/vitest.config.ts features/reservations/wizard/

# Specific test file
pnpm vitest run --config reserve/vitest.config.ts features/reservations/wizard/model/__tests__/store.test.ts
```

#### Run with name pattern

```bash
# Run tests matching a name pattern
pnpm vitest run --config reserve/vitest.config.ts -t "resets wizard state"

# Run tests in a specific file matching pattern
pnpm vitest run --config reserve/vitest.config.ts features/reservations/wizard/model/__tests__/store.test.ts -t "resets"
```

## Key Points

1. **Path patterns** are relative to the `reserve/` directory (the config root)
2. **No `--filter` option** - Vitest uses path patterns instead
3. **Package.json script** already includes `--config`, so don't duplicate it when using `pnpm test`
4. **Use `pnpm vitest` directly** when you need full control over options

## Common Test Suites

| Suite           | Command                                                                           |
| --------------- | --------------------------------------------------------------------------------- |
| All tests       | `pnpm test`                                                                       |
| Watch mode      | `pnpm test:watch`                                                                 |
| Ops tests       | `pnpm test:ops`                                                                   |
| E2E tests       | `pnpm test:e2e`                                                                   |
| Component tests | `pnpm test:component`                                                             |
| Wizard tests    | `pnpm vitest run --config reserve/vitest.config.ts features/reservations/wizard/` |

## Test Results Summary

Latest run (2025-11-16):

- **Wizard analytics**: 6/6 passed ✅
- **Wizard UI**: 5/5 passed ✅
- **Full wizard suite**: 56/57 passed (98.2%) ⚠️
  - 1 failure in store reset test (known issue)
