# Familiar lifecycle

`Familiar` extends `HTMLElement` and adds three optional methods plus a
managed `AbortSignal`.

## Hooks

- **`setup(signal)`** — called from the constructor. Use for one-time
  setup of shadow DOM (`$shdw`), property definitions (`$prop`), and
  template caching. Runs before the element is connected.
- **`connected(signal)`** — called from `connectedCallback` once the
  document is ready. Use for `$attr` bindings, event subscriptions
  (`$on`), and observers (`$mut`, `$scry`).
- **`disconnected()`** — called when the signal aborts on disconnect.
  Use to clean up anything not already tied to the signal.

## The signal

`this.signal` is an `AbortSignal` managed by `$bewitch`. It is fresh on
every connection: on disconnect, `$bewitch.abort(this)` aborts it; on
reconnect, `$bewitch.renew(this)` produces a new one. Pass it to any
DOM API (`addEventListener({ signal })`) for automatic cleanup.

## Reconnection

If an element is removed and re-inserted, the signal renews. Any
`setup`-time work persists; any `connected`-time work re-runs on the
new signal.

## Why $bewitch?

Familiar uses `$bewitch` so the same mechanism works for non-Familiar
elements. See [Progressive enhancement](progressive-enhancement.md).
