# Coven: Vite Prototype → Deno Conversion & Refinement

**Date:** 2026-06-11
**Owner:** Joel Eisner (`@joeleisner`)
**Status:** Approved for planning

## Summary

Convert the Coven web-component library from a Vite/pnpm project to an
entirely-Deno project so it can be published to JSR as
`@joeleisner/coven`. While we're touching every module, refine the
library along three axes that have come up while documenting it:

1. **Sharpen the hex/charm boundary** to "hex = writes to grimoire;
   charm = doesn't," and reclassify the existing modules to match.
2. **Lift signal management out of `Familiar`** into a new `$bewitch`
   hex so the same mechanism powers Familiars and bring-your-own
   web components. Hexes auto-bewitch the elements they touch.
3. **Grow each hex a small sub-method surface** (Svelte-rune style)
   that exposes read-only internals for auditing and advanced use.

End state: a single `deno.json`-driven repo, full test coverage via
`deno test` + `happy-dom`, JSDoc on every export, a JSR-rendered README
that introduces the magical-naming conventions, and a `docs/` folder of
long-form concept guides.

## Non-goals

- Visual redesign of the playground.
- Performance work beyond the `$template` per-class cache.
- Dev-mode tooling (debug logs, `console.warn` on auto-bewitch).
- Browser-based testing infrastructure.
- Auto-publishing on `main` push (we publish on tag).

## Background

Coven is a tiny web-component library with a magical theme. The core
concepts:

- **Familiar** — abstract base class extending `HTMLElement`, providing
  a per-instance `AbortSignal` and three optional lifecycle hooks
  (`setup`, `connected`, `disconnected`).
- **Grimoire** — per-element symbol-keyed storage for hooks to keep
  state. Currently per-element only.
- **Hexes** (`src/hexes/`) — hooks with side effects: `$attr`, `$emit`,
  `$mut`, `$on`, `$prop`, `$scry`, `$shdw`.
- **Charms** (`src/charms/`) — stateless helpers: `$assert`, `$define`,
  `$error`, `$template`.

Today the project uses Vite + pnpm + PostCSS mixins and has no tests.
The goal is to ship to JSR with a clean Deno-native story while
completing the library's internal model.

## Decisions

### Toolchain: all-Deno with Vite via `npm:` specifiers

- Single `deno.json` at the repo root holds JSR metadata, imports,
  tasks, `fmt`/`lint`/`check` config, and compiler options.
- `package.json`, `pnpm-lock.yaml`, `node_modules/`, `dist/`, and
  `tsconfig.json` are removed.
- Vite is invoked via Deno's npm support
  (`deno run -A --node-modules-dir npm:vite`). The playground uses
  `@deno/vite-plugin` to resolve Deno-style `.ts` extensions and (later)
  `jsr:` imports.
- `postcss-mixins` continues to be loaded via Vite's PostCSS plugin
  chain, imported through an `npm:postcss-mixins` specifier.

Known risk: `@deno/vite-plugin` is the linchpin. If a resolver edge case
proves blocking, fall back to a minimal `package.json` in a
`playground/` subfolder (the "Approach B" variant). This fallback is
local and reversible.

### Project layout

```
coven/
  deno.json
  README.md
  LICENSE                  # Apache-2.0
  index.html               # playground entry
  vite.config.ts           # uses @deno/vite-plugin
  src/
    mod.ts
    familiar.ts            + familiar.test.ts
    grimoire.ts            + grimoire.test.ts
    hexes/
      mod.ts
      $attr.ts             + $attr.test.ts
      $bewitch.ts          + $bewitch.test.ts
      $mut.ts              + $mut.test.ts
      $prop.ts             + $prop.test.ts
      $scry.ts             + $scry.test.ts
      $shdw.ts             + $shdw.test.ts
      $template.ts         + $template.test.ts
    charms/
      mod.ts
      $assert.ts           + $assert.test.ts
      $define.ts           + $define.test.ts
      $emit.ts             + $emit.test.ts
      $error.ts            + $error.test.ts
      $on.ts               + $on.test.ts
    _examples/
      example.ts, example.css
      ssd.ts, ssd.css
    _test/
      setup.ts             # happy-dom global install
  docs/
    naming.md
    familiar-lifecycle.md
    writing-a-hex.md
    writing-a-charm.md
    grimoire-and-coven.md
    progressive-enhancement.md
    exportparts-propagation.md
  .github/workflows/
    ci.yml
    publish.yml
```

`src/elements.d.ts` is deleted. The `SignalElement` type is removed in
favor of plain `HTMLElement` everywhere (see "BYO web components"
below).

### Hex/charm boundary

Working rule: **a hex writes to the grimoire; a charm does not.** The
grimoire becomes the audit log of all magic currently abstracted away
on a given element — `grimoire(element)` returns exactly the set of
slots whose hexes are active.

Final classification:

| Hex            | Grimoire slot stores             |
| -------------- | -------------------------------- |
| `$attr`        | Set of bound attribute names     |
| `$bewitch`     | Owned `AbortController` + signal |
| `$mut`         | Observer + per-type listener set |
| `$prop`        | Property descriptors             |
| `$scry`        | `Set<IntersectionObserver>`      |
| `$shdw`        | Set of tracked `part` values     |
| `$template`    | Per-class template cache (shared)|

| Charm          | Reason                                  |
| -------------- | --------------------------------------- |
| `$assert`      | Throws or passes; no state.             |
| `$define`      | Idempotent global registry write.       |
| `$emit`        | Fire-and-forget event dispatch.         |
| `$error`       | Throws a `CovenError`; no state.        |
| `$on`          | Listener cleanup delegated to browser via `{ signal }`. Uses a signal but stores nothing. |

Moves from the existing tree:

- `src/hexes/$emit.ts` → `src/charms/$emit.ts`.
- `src/hexes/$on.ts` → `src/charms/$on.ts`.
- `src/charms/$template.ts` → `src/hexes/$template.ts` (rewritten —
  see below).
- `src/hexes/$bewitch.ts` (new).

### `$bewitch` and bring-your-own web components

`$bewitch` owns every element's `AbortSignal`. It replaces Familiar's
private `#controller`, so the same mechanism powers Familiars and any
plain `HTMLElement` a user wants to apply hexes to.

Public surface:

```ts
$bewitch(element, signal?)   // idempotent; ensures bewitched; returns signal
$bewitch.signal(element)     // read-only; returns current signal or undefined
$bewitch.abort(element)      // abort owned controller (no-op for adopted signals)
$bewitch.renew(element)      // abort + create fresh; returns new signal
```

Grimoire shape:

```ts
type $BewitchGrimoire = {
  controller?: AbortController;   // present only when $bewitch owns the signal
  signal?: AbortSignal;            // always the current signal
};
```

When `$bewitch(element, externalSignal)` is called, `controller` is
omitted (adopted signals are not ours to abort).

**Auto-bewitch:** any hex auto-bewitches the element it's called on.
Each hex's first line becomes:

```ts
const signal = $bewitch(element);
```

A plain `<button>` passed to `$mut(button, ...)` is silently bewitched;
the grimoire then contains both `$bewitch` and `$mut` slots, so the
audit log faithfully shows that `$bewitch` was wired up. No console
warnings, no markers — the slot is the audit.

**Signals are mandatory across the ecosystem.** Every hex/charm that
wants cleanup uses `$bewitch(element)` to obtain a signal. `$on` is a
charm but participates: it calls `$bewitch(element)` to get a signal
and passes it to `addEventListener({ signal })`. No more optional
chaining on `element.signal?.…` anywhere in the library.

### Familiar uses `$bewitch`

```ts
export abstract class Familiar extends HTMLElement {
  setup?(signal: AbortSignal): void;
  connected?(signal: AbortSignal): void;
  disconnected?(): void;

  constructor() {
    super();
    $bewitch(this);
    this.setup?.(this.signal);
  }

  get signal(): AbortSignal {
    return $bewitch.signal(this)!;
  }

  connectedCallback(): void {
    if (this.signal.aborted) $bewitch.renew(this);

    const connect = () => {
      this.connected?.(this.signal);
      if (typeof this.disconnected === 'function') {
        this.signal.addEventListener(
          'abort',
          () => this.disconnected!(),
          { once: true },
        );
      }
    };

    if (document.readyState !== 'loading') connect();
    else {
      document.addEventListener('DOMContentLoaded', connect, {
        once: true,
        signal: this.signal,
      });
    }
  }

  disconnectedCallback(): void {
    $bewitch.abort(this);
  }
}
```

No more `#controller`. Audit log on any Familiar instance shows a
`$bewitch` slot identical to what a bewitched plain element would have.

### Grimoire grows shared-by-class slots

The grimoire stays a single function with one new shape:

```ts
grimoire(element)                // → full Grimoire on the instance
grimoire<T>(element, type)       // → typed slot on the instance
grimoire.shared<T>(element, type)// → typed slot on element.constructor
```

`grimoire.shared` stores the slot on the element's *constructor*, so
every instance of the same custom-element class sees the same slot. The
caller passes an element (not a constructor) so call sites in hexes
stay uniform with the instance form.

Sketch:

```ts
const GRIMOIRE_SYMBOL = Symbol('grimoire');
type Grimoire = { [key: symbol]: Record<string, unknown> };
type GrimoireCarrier = { [GRIMOIRE_SYMBOL]?: Grimoire };
export type GrimoireElement = HTMLElement & GrimoireCarrier;

function readSlot<T>(carrier: GrimoireCarrier, type: symbol): T {
  carrier[GRIMOIRE_SYMBOL] ??= {};
  carrier[GRIMOIRE_SYMBOL]![type] ??= {};
  return carrier[GRIMOIRE_SYMBOL]![type] as T;
}

export function grimoire(element: GrimoireElement): Grimoire;
export function grimoire<T extends Record<string, unknown>>(
  element: GrimoireElement,
  type: symbol,
): T;
export function grimoire(element: GrimoireElement, type?: symbol) {
  element[GRIMOIRE_SYMBOL] ??= {};
  return type ? readSlot(element, type) : element[GRIMOIRE_SYMBOL]!;
}

grimoire.shared = <T extends Record<string, unknown>>(
  element: GrimoireElement,
  type: symbol,
): T => readSlot<T>(element.constructor as unknown as GrimoireCarrier, type);
```

### `$template` becomes a hex with per-class caching

`$template` now writes to `grimoire.shared`, keyed by HTML string:

```ts
const $TEMPLATE_GRIMOIRE_SYMBOL = Symbol('$template');
type $TemplateGrimoire = {
  templates?: Map<string, HTMLTemplateElement>;
};

export function $template(
  element: HTMLElement,
  html: string,
): HTMLTemplateElement {
  $bewitch(element);
  const store = grimoire.shared<$TemplateGrimoire>(
    element,
    $TEMPLATE_GRIMOIRE_SYMBOL,
  );
  store.templates ??= new Map();

  let template = store.templates.get(html);
  if (!template) {
    template = document.createElement('template');
    template.innerHTML = html;
    store.templates.set(html, template);
  }
  return template;
}

$template.cache = (element: HTMLElement) =>
  grimoire.shared<$TemplateGrimoire>(element, $TEMPLATE_GRIMOIRE_SYMBOL)
    .templates;

$template.clone = (element: HTMLElement, html: string) =>
  $template(element, html).content.cloneNode(true) as DocumentFragment;
```

Every instance of a given `Familiar` subclass shares one parsed template
per distinct HTML string. `$shdw` switches to calling `$template.clone`
to drop the boilerplate at its call site.

### `$shdw` tracks `[part]` and auto-propagates `exportparts`

Three new behaviors layered onto today's `$shdw`:

1. **Collect parts on setup.** After populating the shadow root, walk
   for `[part]` and split values on whitespace into a `Set<string>`
   stored in an instance grimoire slot:

   ```ts
   const $SHDW_GRIMOIRE_SYMBOL = Symbol('$shdw');
   type $ShdwGrimoire = { parts?: Set<string> };
   ```

2. **Stay in sync with late-added parts.** Internally call `$mut`
   against the shadow root with `{ type: 'childList', subtree: true }`
   so newly inserted children with `[part]` extend the set. This
   requires generalizing `$mut`'s observe target to accept a node other
   than the host element — a small change isolated to `$mut.ts`.

3. **Auto-propagate `exportparts` upward.** On `$bewitch`-driven
   connect, the element schedules a microtask
   (`queueMicrotask`) to walk `element.getRootNode()`. If the root is a
   `ShadowRoot`, merge the tracked parts into the host's `exportparts`
   attribute (deduped via Set). Because the host's own `$shdw` runs the
   same logic, parts cascade up multiple shadow boundaries
   automatically.

   The microtask defers the walk so a child Familiar connected before
   its host's `$shdw` ran still sees a populated host slot.

Sub-methods:

```ts
$shdw(element, html?)        // attach + populate
$shdw.parts(element)         // readonly view of tracked parts
$shdw.root(element)          // returns the shadow root
$shdw.propagate(element)     // manually re-run exportparts propagation
```

### Sub-methods on existing hexes

Convention: **the main call performs the effect; sub-methods read
state or expose internals.**

- `$bewitch`: `signal`, `abort`, `renew` (already covered).
- `$prop`: `list(el)` → bound property names; `readonly(el, name)` → bool.
- `$attr`: `list(el)` → bound attribute names. Also gets a small new
  grimoire slot recording the bound names, so the audit log shows
  `$attr` explicitly (not only the underlying `$prop`/`$mut`).
- `$mut`: `observer(el)` → the `MutationObserver`; `listeners(el, type)`
  → the listener `Set`.
- `$scry`: `observers(el)` → `Set<IntersectionObserver>`;
  `disconnect(el)` → disconnect all without aborting the element.
- `$shdw`: `parts`, `root`, `propagate` (above).
- `$template`: `cache`, `clone` (above).

Sub-methods are part of the public API; each gets its own JSDoc block.

### Tests

- `*.test.ts` next to each `*.ts`. Examples have no tests.
- `src/_test/setup.ts` installs `happy-dom` globals (`document`,
  `HTMLElement`, `customElements`, `MutationObserver`,
  `IntersectionObserver`, `Event`, `CustomEvent`, `Node`, `ShadowRoot`,
  `DocumentFragment`, etc.) onto `globalThis`. Imported at the top of
  every test file.
- Runner: `deno test --allow-env --allow-read --doc`. The `--doc` flag
  runs JSDoc `@example` blocks as tests, keeping examples honest.

**Per-module coverage targets:**

| Module      | What gets tested                                                                                                  |
| ----------- | ----------------------------------------------------------------------------------------------------------------- |
| `familiar`  | constructor calls `setup`; `signal` getter; `connectedCallback` invokes `connected`; disconnect aborts; reconnect renews; `$bewitch` slot is present in the grimoire after construction. |
| `grimoire`  | per-element slot creation; `grimoire.shared` stores on constructor and is shared across instances; multiple symbols don't collide; typed accessor. |
| `$bewitch`  | first call creates owned signal; second call returns same; external signal is adopted (not owned); `abort` no-ops on adopted; `renew` produces a fresh signal; auto-bewitch on any other hex. |
| `$prop`     | defines getter/setter; readonly throws on set; callback fires on change; signal abort clears grimoire entry; `list` returns names; `readonly` reflects state. |
| `$mut`      | observes attributes / childList / characterData; multi-listener; signal abort disconnects; sub-methods (`observer`, `listeners`) return the live structures. |
| `$attr`     | initial value parsed; boolean / number / string coercion; two-way property↔attribute sync; callback fires; grimoire records bound name; `list` returns names. |
| `$scry`     | observer created; signal-aborted-pre-call returns disconnected; abort disconnects; sub-methods (`observers`, `disconnect`). |
| `$shdw`     | attaches shadow once (idempotent); template injected; parts collected from `[part]`; late-added `[part]` extends the set via internal `$mut`; nested parts propagate `exportparts` to host; `parts`/`root`/`propagate` sub-methods. |
| `$template` | caches per-constructor; same HTML returns same template; different HTML gets different entries; two instances of same class share entry; `cache` and `clone` sub-methods. |
| `$on`       | binds listener; signal abort removes; auto-bewitches if not yet bewitched. |
| `$emit`     | dispatches event with correct tagName; cancelable; CustomEvent vs Event branch. |
| `$assert`   | throws `CovenError` on falsey; passes through truthy. |
| `$error`    | throws `CovenError` with `[tagname]:` prefix. |
| `$define`   | registers; idempotent if already registered. |

Smoke test for the audit-log model: a single cross-cutting test
constructs a Familiar, applies `$attr` + `$shdw` + `$on`, and asserts
`Object.getOwnPropertySymbols(grimoire(element))` includes
`$BEWITCH_GRIMOIRE_SYMBOL`, `$ATTR_GRIMOIRE_SYMBOL`, and
`$SHDW_GRIMOIRE_SYMBOL`.

Risk: `happy-dom`'s `connectedCallback` timing isn't byte-identical to
browsers around microtask ordering. Tests that depend on
`queueMicrotask`-driven behavior (notably `$shdw` propagation) should
`await Promise.resolve()` between act and assert.

### Documentation surfaces

Three surfaces, distinct jobs:

**JSDoc on every export.** One-sentence summary, longer description if
non-obvious, `@param`, `@returns`, `@example` for hexes/charms/Familiar
/grimoire, `@see` to related symbols. No naming etymology here — that
lives in the README.

**README.md (JSR landing page).** Sections in order:

1. One-line pitch.
2. Install (Deno block + npm-via-JSR block).
3. 30-second example on a plain element (leads with BYO).
4. 30-second example on a `Familiar`.
5. Concepts (the naming guide): Familiar, Grimoire, Coven, Hex, Charm,
   `$bewitch`, `$scry`, abbreviations (`$shdw`, `$mut`).
6. "If you've used Svelte runes…" — the `$rune.subMethod()` shape is
   the inspiration. Small comparison table.
7. API at a glance — table of every export with link to its JSR doc
   page.
8. Links to `docs/` guides.

**`docs/` long-form guides.** Initial set listed in the layout above.
Markdown only; ship with the repo on GitHub; not included in the JSR
tarball (kept small).

### JSR publishing

Package: `@joeleisner/coven`, license `Apache-2.0`, starting at
`0.1.0`.

`deno.json` publishing fields:

```jsonc
"publish": {
  "include": [
    "src/**/*.ts",
    "README.md",
    "LICENSE",
    "deno.json"
  ],
  "exclude": [
    "src/**/*.test.ts",
    "src/_examples/**",
    "src/_test/**",
    "vite.config.ts",
    "index.html"
  ]
}
```

Pre-publish gates (locally and in CI): `fmt --check`, `lint`, `check`,
`test`, `publish:dry`. JSR also runs slow-type checking; every exported
function gets an explicit return type — a sweep is required for `$emit`
and `$on`, plus the new sub-methods.

Versioning after `1.0.0`: patch = behavior-preserving bug fix, minor =
new export, major = removed/renamed export or observable grimoire-shape
change.

### CI workflows

Two workflows under `.github/workflows/`:

- `ci.yml` (push to `main`, all PRs): checkout → setup-deno → `fmt
  --check`, `lint`, `check`, `test`, `publish:dry`.
- `publish.yml` (tags matching `v*`): checkout → setup-deno →
  `deno publish` with `id-token: write` permission for JSR OIDC.

OIDC pairing is a one-time setup on jsr.io: the package is linked to
`github.com/joeleisner/coven`; thereafter `deno publish` authenticates
without a token. The workflow can optionally pre-check that the
`deno.json` version matches the pushed tag.

### Repo bootstrap (prerequisite to CI publishing)

Implementation assumes these manual steps happen alongside the work:

1. Create `github.com/joeleisner/coven` in the GitHub UI.
2. `git remote add origin git@github.com:joeleisner/coven.git`, push.
3. On jsr.io, create `@joeleisner/coven` and link to the GitHub repo
   (one-time, manual).
4. Tag `v0.1.0` to trigger the publish workflow.

Steps 1 and 3 are user actions in external UIs; the spec assumes they
happen before tag publishing.

## Risks

- **`@deno/vite-plugin` resolver edge cases.** Linchpin of the
  all-Deno layout. Fallback: minimal `playground/package.json`
  (Approach B from brainstorming). Mitigation: smoke check the
  playground at the beginning of implementation, before code moves.
- **`postcss-mixins` via `npm:`.** PostCSS plugins can be finicky under
  Deno's npm resolution. Fallback: inline the few mixins as plain CSS
  or move to native CSS nesting.
- **`happy-dom` custom-element timing.** Microtask ordering differs
  slightly from browsers. Mitigation: tests that exercise propagation
  timing await one microtask between act and assert.
- **JSR slow-types rejection.** Every public function needs an
  explicit return type. Mitigation: an early type-pass before the first
  `publish:dry`.
- **Auto-bewitch on plain elements leaks if user forgets `$bewitch.abort`.**
  Documented in the BYO guide; not the library's job to enforce.

## Open questions

None blocking. Items that may surface during implementation:

- Whether `docs/` should ship in the JSR tarball after all (currently
  excluded for size). Trivial to flip later.
- Whether `$attr` should also expose `$attr.config(el, name)` to read
  back the parsed config of a binding. Worth revisiting if the audit
  log feels thin in practice.
