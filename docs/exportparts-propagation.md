# Exportparts propagation

`$shdw` tracks every `[part]` value inside the shadow root and
auto-propagates them to the enclosing shadow host as `exportparts`. The
propagation cascades multiple shadow boundaries.

## How it works

1. After attaching the shadow, `$shdw` walks `[part]` and stores the
   set in the grimoire (under `Symbol($shdw)`).
2. A `$mut` subscription on the shadow root keeps the set fresh as
   children are added.
3. After the microtask boundary, `$shdw` walks up the parent chain
   until it finds an enclosing `ShadowRoot`. If found, it merges the
   tracked parts into that root's host's `exportparts` attribute.
   (`getRootNode()` would be the obvious API here, but it's sidestepped
   because of polyfill inconsistencies — happy-dom doesn't return the
   enclosing `ShadowRoot` from `getRootNode()` in the cases we need.)

Because the host's own `$shdw` runs the same logic, parts cascade all
the way up.

## Reading the parts

```ts
const parts = $shdw.parts(element); // ReadonlySet<string> | undefined
```

## Manual propagation

If you mutate the shadow imperatively outside the `$mut` subscription's
view (rare), trigger propagation manually:

```ts
$shdw.propagate(element);
```

## Opting out

Currently there's no opt-out — every `$shdw`-using element propagates.
If you need that, file an issue describing the use case.
