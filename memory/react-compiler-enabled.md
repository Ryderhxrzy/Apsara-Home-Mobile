---
name: react-compiler-enabled
description: React Compiler is enabled — do not add manual memoization (useMemo/useCallback/memo)
metadata:
  type: feedback
---

This project has React Compiler enabled (`app.json` → `experiments.reactCompiler: true`, `babel-plugin-react-compiler` installed). It auto-memoizes components, values, and callbacks.

**Why:** Manual `useMemo`/`useCallback`/`React.memo` is unnecessary and can DISABLE the compiler for the whole component ("existing memoization could not be preserved" — confirmed via IDE diagnostics). Writing clean idiomatic code (inline callbacks/objects) is the correct, performant choice here.

**How to apply:** Don't add manual memoization to components in this repo. Keep scroll position in refs (not state). The pre-existing `useMemo` in some files is fine to leave, but don't add more. Performance wins come from removing render-phase work (e.g. `console.log` in render) and keeping clean code, not from memo hooks.
