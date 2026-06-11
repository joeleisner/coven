# Coven: Vite Prototype → Deno Conversion & Refinement — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the Coven web-component library from a Vite/pnpm project to an all-Deno project published to JSR as `@joeleisner/coven`, while refining the library's internal model (sharpened hex/charm boundary, `$bewitch` hex, `grimoire.shared`, `$shdw` exportparts propagation, sub-method API surface).

**Architecture:** Single `deno.json` at the repo root drives library publishing, playground dev (Vite via `npm:` specifier and `@deno/vite-plugin`), test running, and formatting. Library source lives under `src/` with co-located `*.test.ts` files; examples live under `src/_examples/`; happy-dom setup under `src/_test/`. Hexes and charms are categorized by whether they write to the grimoire. A new `$bewitch` hex is the single source of truth for every element's `AbortSignal`, used by `Familiar` and by any bring-your-own web component.

**Tech Stack:** Deno, TypeScript, Vite (via `npm:vite`), `@deno/vite-plugin`, `postcss-mixins`, `happy-dom`, `@std/assert` (JSR), GitHub Actions.

**Reference spec:** `docs/specs/2026-06-11-coven-deno-conversion-design.md`.

---

## Phase A — Toolchain swap (verify before deleting)

The toolchain swap happens first so subsequent library work runs under `deno test`. The Vite-via-Deno plugin is validated against the existing prototype *before* we remove the Node tooling — that way, if `@deno/vite-plugin` proves problematic, we fall back to the spec's documented Approach B (minimal `playground/` folder) without losing work.

### Task 1: Add `LICENSE` (Apache-2.0)

**Files:**
- Create: `LICENSE`

- [ ] **Step 1: Create the license file**

Run:
```bash
curl -fsSL https://www.apache.org/licenses/LICENSE-2.0.txt -o LICENSE
```

Expected: A new `LICENSE` file at the repo root (~11K). First line is `                                 Apache License`.

- [ ] **Step 2: Commit**

```bash
git add LICENSE
git commit -m "Add Apache-2.0 LICENSE"
```

---

### Task 2: Add minimal `deno.json`

**Files:**
- Create: `deno.json`

- [ ] **Step 1: Write the file**

```jsonc
{
  "name": "@joeleisner/coven",
  "version": "0.1.0",
  "license": "Apache-2.0",
  "exports": {
    ".": "./src/mod.ts"
  },
  "imports": {
    "vite": "npm:vite@^8",
    "@deno/vite-plugin": "npm:@deno/vite-plugin@^1",
    "postcss-mixins": "npm:postcss-mixins@^12",
    "happy-dom": "npm:happy-dom@^15",
    "@std/assert": "jsr:@std/assert@^1"
  },
  "tasks": {
    "dev": "deno run -A --node-modules-dir npm:vite",
    "build": "deno run -A --node-modules-dir npm:vite build",
    "preview": "deno run -A --node-modules-dir npm:vite preview",
    "test": "deno test --allow-env --allow-read --doc",
    "check": "deno check src",
    "fmt": "deno fmt",
    "lint": "deno lint",
    "publish:dry": "deno publish --dry-run",
    "publish:release": "deno publish"
  },
  "fmt": {
    "useTabs": true,
    "singleQuote": true,
    "semiColons": true,
    "lineWidth": 100
  },
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "deno.ns"],
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
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
}
```

- [ ] **Step 2: Verify Deno can read it**

Run: `deno check deno.json`
Expected: No output (success).

- [ ] **Step 3: Commit**

```bash
git add deno.json
git commit -m "Add deno.json with JSR metadata, tasks, and imports"
```

---

### Task 3: Update `vite.config.ts` to use `@deno/vite-plugin`

**Files:**
- Modify: `vite.config.ts`

- [ ] **Step 1: Replace the config**

Write `vite.config.ts`:

```ts
import { defineConfig } from 'vite';
import deno from '@deno/vite-plugin';
import postcssMixins from 'postcss-mixins';

export default defineConfig({
	plugins: [deno()],
	css: {
		postcss: {
			plugins: [postcssMixins],
		},
	},
});
```

- [ ] **Step 2: Verify the playground still runs**

Run: `deno task dev`
Expected: Vite starts on `http://localhost:5173/`. Visit it in a browser. The page renders without console errors; the `wcpg-ssd-digit`, `wcpg-ssd`, and `wcpg-int-example` components work as they did under the Node-based setup.

If the playground does NOT work: stop and fall back to Approach B in the spec (move playground into `playground/` with a minimal `package.json`). Update Task 4 to reflect.

Stop the dev server (Ctrl-C).

- [ ] **Step 3: Commit**

```bash
git add vite.config.ts
git commit -m "Switch Vite config to use @deno/vite-plugin"
```

---

### Task 4: Remove Node tooling

**Files:**
- Delete: `package.json`, `pnpm-lock.yaml`, `node_modules/`, `dist/`, `tsconfig.json`

- [ ] **Step 1: Update `.gitignore`**

Append to `.gitignore`:

```
# Deno
.deno/
node_modules/
```

(The plugin still creates `node_modules/` at dev time when `--node-modules-dir` is set; we ignore it.)

- [ ] **Step 2: Delete the files**

Run:
```bash
rm -f package.json pnpm-lock.yaml tsconfig.json
rm -rf node_modules dist
```

- [ ] **Step 3: Confirm the playground still runs**

Run: `deno task dev`
Expected: Vite starts cleanly; the page renders. Stop the dev server.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "Remove Node tooling (package.json, pnpm-lock.yaml, tsconfig.json)"
```

---

### Task 5: Add happy-dom test setup

**Files:**
- Create: `src/_test/setup.ts`

- [ ] **Step 1: Write the setup file**

```ts
import { Window } from 'happy-dom';

const window = new Window();

const globals = [
	'document',
	'HTMLElement',
	'HTMLTemplateElement',
	'customElements',
	'MutationObserver',
	'IntersectionObserver',
	'Event',
	'CustomEvent',
	'Node',
	'NodeList',
	'ShadowRoot',
	'DocumentFragment',
	'Element',
] as const;

for (const name of globals) {
	// deno-lint-ignore no-explicit-any
	(globalThis as any)[name] ??= (window as any)[name];
}
```

- [ ] **Step 2: Write a tiny smoke test to verify setup works**

Create `src/_test/setup.test.ts`:

```ts
import './setup.ts';
import { assert, assertEquals } from '@std/assert';

Deno.test('happy-dom is installed on globalThis', () => {
	assert(typeof HTMLElement === 'function');
	assert(typeof customElements === 'object');
	assert(typeof MutationObserver === 'function');
	assert(typeof IntersectionObserver === 'function');

	const div = document.createElement('div');
	assertEquals(div.tagName, 'DIV');
});
```

- [ ] **Step 3: Run it**

Run: `deno task test`
Expected: 1 test passes.

- [ ] **Step 4: Commit**

```bash
git add src/_test/
git commit -m "Add happy-dom test setup and smoke test"
```

---

## Phase B — Foundation: imports, grimoire, file moves

### Task 6: Add `.ts` extension to all relative imports

Deno requires explicit extensions on relative imports. Sweep `src/` and add them.

**Files:**
- Modify: every file under `src/` with a relative import.

- [ ] **Step 1: Identify all the imports**

Run: `grep -rEn "from ['\"]\\.\\.?/" src/ | grep -Ev "\\.ts['\"]|\\.d\\.ts['\"]|\\.css['\"]"`
Expected: A list of import lines missing `.ts` extensions. Examples:
- `src/mod.ts`: `from './familiar'` and similar
- `src/hexes/$attr.ts`: `from "../elements"`, `from "./$mut"`, `from "./$prop"`
- etc.

- [ ] **Step 2: Update each file**

For every file flagged above, add `.ts` to the relative import strings. Examples:

`src/mod.ts`:

```ts
export { Familiar } from './familiar.ts';
export * from './charms/mod.ts';

export { grimoire } from './grimoire.ts';
export * from './hexes/mod.ts';
```

`src/hexes/$attr.ts` first three lines:

```ts
import type { SignalElement } from "../elements.d.ts";
import $mut from "./$mut.ts";
import $prop from "./$prop.ts";
```

(`elements.d.ts` keeps its extension — we'll delete it in Task 12.)

Sweep every flagged file the same way.

- [ ] **Step 3: Verify it compiles**

Run: `deno task check`
Expected: No errors. (Warnings about ambient `.d.ts` are acceptable for now.)

- [ ] **Step 4: Verify playground still builds**

Run: `deno task build`
Expected: Successful build, `dist/` recreated.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Add .ts extensions to relative imports (Deno requirement)"
```

---

### Task 7: Tests for current grimoire (capture baseline behavior)

Before extending `grimoire`, lock in the current behavior so the extension can't regress it.

**Files:**
- Create: `src/grimoire.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
import './_test/setup.ts';
import { assert, assertEquals, assertStrictEquals } from '@std/assert';
import { grimoire, type GrimoireElement } from './grimoire.ts';

const SLOT_A = Symbol('test-a');
const SLOT_B = Symbol('test-b');

Deno.test('grimoire(element) creates a per-element store', () => {
	const el = document.createElement('div') as GrimoireElement;
	const store = grimoire(el);
	assert(typeof store === 'object');
});

Deno.test('grimoire(element) returns the same store on repeat calls', () => {
	const el = document.createElement('div') as GrimoireElement;
	assertStrictEquals(grimoire(el), grimoire(el));
});

Deno.test('grimoire(element, type) creates a typed slot', () => {
	const el = document.createElement('div') as GrimoireElement;
	const slot = grimoire<{ value?: number }>(el, SLOT_A);
	slot.value = 42;
	assertEquals(grimoire<{ value?: number }>(el, SLOT_A).value, 42);
});

Deno.test('different slot symbols do not collide', () => {
	const el = document.createElement('div') as GrimoireElement;
	const a = grimoire<{ x?: string }>(el, SLOT_A);
	const b = grimoire<{ x?: string }>(el, SLOT_B);
	a.x = 'A';
	b.x = 'B';
	assertEquals(grimoire<{ x?: string }>(el, SLOT_A).x, 'A');
	assertEquals(grimoire<{ x?: string }>(el, SLOT_B).x, 'B');
});

Deno.test('different elements have isolated grimoires', () => {
	const a = document.createElement('div') as GrimoireElement;
	const b = document.createElement('div') as GrimoireElement;
	const slotA = grimoire<{ v?: number }>(a, SLOT_A);
	const slotB = grimoire<{ v?: number }>(b, SLOT_A);
	slotA.v = 1;
	slotB.v = 2;
	assertEquals(grimoire<{ v?: number }>(a, SLOT_A).v, 1);
	assertEquals(grimoire<{ v?: number }>(b, SLOT_A).v, 2);
});
```

- [ ] **Step 2: Run the tests**

Run: `deno task test src/grimoire.test.ts`
Expected: 5 tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/grimoire.test.ts
git commit -m "Add baseline tests for grimoire(element[, type])"
```

---

### Task 8: Extend grimoire with `grimoire.shared`

**Files:**
- Modify: `src/grimoire.ts`
- Modify: `src/grimoire.test.ts`

- [ ] **Step 1: Write the failing tests**

Append to `src/grimoire.test.ts`:

```ts
const SHARED_SLOT = Symbol('shared');

class MyA extends HTMLElement {}
class MyB extends HTMLElement {}
customElements.define('coven-test-a', MyA);
customElements.define('coven-test-b', MyB);

Deno.test('grimoire.shared(element, type) stores on the constructor', () => {
	const a1 = document.createElement('coven-test-a') as MyA as GrimoireElement;
	const a2 = document.createElement('coven-test-a') as MyA as GrimoireElement;
	const slot = grimoire.shared<{ value?: number }>(a1, SHARED_SLOT);
	slot.value = 99;
	assertEquals(
		grimoire.shared<{ value?: number }>(a2, SHARED_SLOT).value,
		99,
		'instances of the same class share the shared slot',
	);
});

Deno.test('grimoire.shared is isolated between classes', () => {
	const a = document.createElement('coven-test-a') as MyA as GrimoireElement;
	const b = document.createElement('coven-test-b') as MyB as GrimoireElement;
	const slotA = grimoire.shared<{ x?: string }>(a, SHARED_SLOT);
	const slotB = grimoire.shared<{ x?: string }>(b, SHARED_SLOT);
	slotA.x = 'A-class';
	slotB.x = 'B-class';
	assertEquals(grimoire.shared<{ x?: string }>(a, SHARED_SLOT).x, 'A-class');
	assertEquals(grimoire.shared<{ x?: string }>(b, SHARED_SLOT).x, 'B-class');
});

Deno.test('grimoire and grimoire.shared do not collide on the same symbol', () => {
	const el = document.createElement('coven-test-a') as MyA as GrimoireElement;
	const inst = grimoire<{ scope?: string }>(el, SHARED_SLOT);
	const shared = grimoire.shared<{ scope?: string }>(el, SHARED_SLOT);
	inst.scope = 'instance';
	shared.scope = 'class';
	assertEquals(grimoire<{ scope?: string }>(el, SHARED_SLOT).scope, 'instance');
	assertEquals(grimoire.shared<{ scope?: string }>(el, SHARED_SLOT).scope, 'class');
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `deno task test src/grimoire.test.ts`
Expected: 3 new tests fail with "grimoire.shared is not a function" or similar.

- [ ] **Step 3: Implement `grimoire.shared`**

Replace `src/grimoire.ts` with:

```ts
const GRIMOIRE_SYMBOL = Symbol('grimoire');

type Grimoire = {
	[key: symbol]: Record<string, unknown>;
};

type GrimoireCarrier = {
	[GRIMOIRE_SYMBOL]?: Grimoire;
};

export type GrimoireElement = HTMLElement & GrimoireCarrier;

function readSlot<TInterface extends Record<string, unknown>>(
	carrier: GrimoireCarrier,
	type: symbol,
): TInterface {
	carrier[GRIMOIRE_SYMBOL] ??= {};
	carrier[GRIMOIRE_SYMBOL]![type] ??= {};
	return carrier[GRIMOIRE_SYMBOL]![type] as TInterface;
}

export function grimoire(element: GrimoireElement): Grimoire;
export function grimoire<TInterface extends Record<string, unknown>>(
	element: GrimoireElement,
	type: symbol,
): TInterface;
export function grimoire<TInterface extends Record<string, unknown>>(
	element: GrimoireElement,
	type?: symbol,
): Grimoire | TInterface {
	element[GRIMOIRE_SYMBOL] ??= {};
	if (!type) return element[GRIMOIRE_SYMBOL]!;
	return readSlot<TInterface>(element, type);
}

grimoire.shared = <TInterface extends Record<string, unknown>>(
	element: GrimoireElement,
	type: symbol,
): TInterface =>
	readSlot<TInterface>(
		element.constructor as unknown as GrimoireCarrier,
		type,
	);
```

- [ ] **Step 4: Run the tests**

Run: `deno task test src/grimoire.test.ts`
Expected: 8 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/grimoire.ts src/grimoire.test.ts
git commit -m "Extend grimoire with grimoire.shared (class-level slots)"
```

---

### Task 9: Move `$emit` and `$on` from hexes to charms

These are pure helpers; they belong with the charms.

**Files:**
- Move: `src/hexes/$emit.ts` → `src/charms/$emit.ts`
- Move: `src/hexes/$on.ts` → `src/charms/$on.ts`
- Modify: `src/hexes/mod.ts`
- Modify: `src/charms/mod.ts`

- [ ] **Step 1: Move the files**

Run:
```bash
git mv src/hexes/$emit.ts src/charms/$emit.ts
git mv src/hexes/$on.ts src/charms/$on.ts
```

- [ ] **Step 2: Update `src/hexes/mod.ts`**

Replace with:

```ts
export { $attr } from './$attr.ts';
export { $mut } from './$mut.ts';
export { $prop } from './$prop.ts';
export { $scry } from './$scry.ts';
export { $shdw } from './$shdw.ts';
```

- [ ] **Step 3: Update `src/charms/mod.ts`**

Replace with:

```ts
export { $assert } from './$assert.ts';
export { $define } from './$define.ts';
export { $emit } from './$emit.ts';
export { $error } from './$error.ts';
export { $on } from './$on.ts';
export { $template } from './$template.ts';
```

(`$template` still imports the original charm. We replace it with the hex version in Task 17.)

- [ ] **Step 4: Update relative imports inside the moved files**

`src/charms/$on.ts` — change `from "../elements"` to `from "../elements.d.ts"` (path depth is the same; nothing else changes).
`src/charms/$emit.ts` — has no relative imports; nothing to change.

- [ ] **Step 5: Verify**

Run: `deno task check`
Expected: No errors. (If `$shdw.ts` still imports `$template` from `../charms/$template`, that path is still valid because the file hasn't moved; check by reading `src/hexes/$shdw.ts`.)

Run: `deno task build`
Expected: Successful build.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "Move \$emit and \$on from hexes to charms (no logic changes)"
```

---

## Phase C — `$bewitch` and signal plumbing

### Task 10: Create `$bewitch` hex (TDD)

**Files:**
- Create: `src/hexes/$bewitch.test.ts`
- Create: `src/hexes/$bewitch.ts`

- [ ] **Step 1: Write the failing tests**

`src/hexes/$bewitch.test.ts`:

```ts
import '../_test/setup.ts';
import { assert, assertEquals, assertNotStrictEquals, assertStrictEquals, assertThrows } from '@std/assert';
import { $bewitch } from './$bewitch.ts';
import { grimoire } from '../grimoire.ts';

Deno.test('$bewitch(element) creates an owned controller and returns its signal', () => {
	const el = document.createElement('div');
	const signal = $bewitch(el);
	assert(signal instanceof AbortSignal);
	assert(!signal.aborted);
});

Deno.test('$bewitch is idempotent — repeat calls return the same signal', () => {
	const el = document.createElement('div');
	const s1 = $bewitch(el);
	const s2 = $bewitch(el);
	assertStrictEquals(s1, s2);
});

Deno.test('$bewitch(element, externalSignal) adopts the signal without ownership', () => {
	const el = document.createElement('div');
	const ctrl = new AbortController();
	const signal = $bewitch(el, ctrl.signal);
	assertStrictEquals(signal, ctrl.signal);
});

Deno.test('$bewitch.signal(element) returns undefined when not yet bewitched', () => {
	const el = document.createElement('div');
	assertEquals($bewitch.signal(el), undefined);
});

Deno.test('$bewitch.signal(element) returns the current signal after bewitching', () => {
	const el = document.createElement('div');
	const signal = $bewitch(el);
	assertStrictEquals($bewitch.signal(el), signal);
});

Deno.test('$bewitch.abort(element) aborts an owned controller', () => {
	const el = document.createElement('div');
	const signal = $bewitch(el);
	$bewitch.abort(el);
	assert(signal.aborted);
});

Deno.test('$bewitch.abort(element) is a no-op for adopted signals', () => {
	const el = document.createElement('div');
	const ctrl = new AbortController();
	$bewitch(el, ctrl.signal);
	$bewitch.abort(el);
	assert(!ctrl.signal.aborted);
});

Deno.test('$bewitch.renew(element) aborts owned and creates a fresh signal', () => {
	const el = document.createElement('div');
	const first = $bewitch(el);
	const next = $bewitch.renew(el);
	assert(first.aborted);
	assertNotStrictEquals(first, next);
	assert(!next.aborted);
});

Deno.test('$bewitch records itself in the grimoire (audit log)', () => {
	const el = document.createElement('div');
	$bewitch(el);
	const symbols = Object.getOwnPropertySymbols(grimoire(el as never));
	assertEquals(symbols.length, 1, 'one slot: $bewitch itself');
});

Deno.test('passing a new external signal after bewitching does not replace the original', () => {
	const el = document.createElement('div');
	const first = $bewitch(el);
	const ctrl = new AbortController();
	const second = $bewitch(el, ctrl.signal);
	assertStrictEquals(second, first, 'idempotent: first signal wins');
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `deno task test src/hexes/$bewitch.test.ts`
Expected: All tests fail — module not found.

- [ ] **Step 3: Implement `$bewitch`**

`src/hexes/$bewitch.ts`:

```ts
import { grimoire, type GrimoireElement } from '../grimoire.ts';

const $BEWITCH_GRIMOIRE_SYMBOL = Symbol('$bewitch');

type $BewitchGrimoire = {
	controller?: AbortController;
	signal?: AbortSignal;
};

/**
 * Casts Coven's spell on an element, binding an AbortSignal to it so any
 * hex applied later can register cleanup. Idempotent — a second call
 * returns the same signal.
 *
 * Pass an existing signal to adopt it (the element is bewitched but
 * $bewitch does not own the lifecycle). Without an argument, $bewitch
 * creates and owns an AbortController.
 *
 * @param element - The element to bewitch.
 * @param signal - Optional external signal to adopt.
 * @returns The element's signal.
 */
export function $bewitch(
	element: HTMLElement,
	signal?: AbortSignal,
): AbortSignal {
	const store = grimoire<$BewitchGrimoire>(
		element as GrimoireElement,
		$BEWITCH_GRIMOIRE_SYMBOL,
	);
	if (store.signal) return store.signal;

	if (signal) {
		store.signal = signal;
		return signal;
	}

	const controller = new AbortController();
	store.controller = controller;
	store.signal = controller.signal;
	return controller.signal;
}

/**
 * Returns the current signal bound to the element, or undefined if not
 * yet bewitched. Read-only; does not trigger bewitching.
 */
$bewitch.signal = (element: HTMLElement): AbortSignal | undefined =>
	grimoire<$BewitchGrimoire>(
		element as GrimoireElement,
		$BEWITCH_GRIMOIRE_SYMBOL,
	).signal;

/**
 * Aborts the controller owned by $bewitch. No-op for adopted signals.
 */
$bewitch.abort = (element: HTMLElement): void => {
	const store = grimoire<$BewitchGrimoire>(
		element as GrimoireElement,
		$BEWITCH_GRIMOIRE_SYMBOL,
	);
	store.controller?.abort();
};

/**
 * Aborts the current owned controller and creates a fresh one. Returns
 * the new signal. Used by Familiar on reconnection.
 */
$bewitch.renew = (element: HTMLElement): AbortSignal => {
	const store = grimoire<$BewitchGrimoire>(
		element as GrimoireElement,
		$BEWITCH_GRIMOIRE_SYMBOL,
	);
	store.controller?.abort();
	const controller = new AbortController();
	store.controller = controller;
	store.signal = controller.signal;
	return controller.signal;
};

export default $bewitch;
```

- [ ] **Step 4: Run the tests**

Run: `deno task test src/hexes/$bewitch.test.ts`
Expected: 10 tests pass.

- [ ] **Step 5: Export from `src/hexes/mod.ts`**

Update `src/hexes/mod.ts`:

```ts
export { $attr } from './$attr.ts';
export { $bewitch } from './$bewitch.ts';
export { $mut } from './$mut.ts';
export { $prop } from './$prop.ts';
export { $scry } from './$scry.ts';
export { $shdw } from './$shdw.ts';
```

- [ ] **Step 6: Commit**

```bash
git add src/hexes/\$bewitch.ts src/hexes/\$bewitch.test.ts src/hexes/mod.ts
git commit -m "Add \$bewitch hex (signal/abort/renew + grimoire audit slot)"
```

---

### Task 11: Tests for current `Familiar` behavior (capture baseline)

Before rewriting `Familiar` to use `$bewitch`, lock down its observable contract.

**Files:**
- Create: `src/familiar.test.ts`

- [ ] **Step 1: Write the tests**

```ts
import './_test/setup.ts';
import { assert, assertEquals, assertNotStrictEquals } from '@std/assert';
import { Familiar } from './familiar.ts';

let counter = 0;
function tagName(): string {
	return `coven-fam-${++counter}`;
}

Deno.test('constructor calls setup with a signal', () => {
	let received: AbortSignal | null = null;
	class T extends Familiar {
		override setup(signal: AbortSignal) {
			received = signal;
		}
	}
	const name = tagName();
	customElements.define(name, T);
	const el = document.createElement(name) as T;
	assert(received instanceof AbortSignal);
	assertEquals(received, el.signal);
});

Deno.test('connectedCallback invokes connected with the signal', async () => {
	let connectedSignal: AbortSignal | null = null;
	class T extends Familiar {
		override connected(signal: AbortSignal) {
			connectedSignal = signal;
		}
	}
	const name = tagName();
	customElements.define(name, T);
	const el = document.createElement(name) as T;
	document.body.appendChild(el);
	await Promise.resolve();
	assertEquals(connectedSignal, el.signal);
	el.remove();
});

Deno.test('disconnectedCallback aborts the signal', () => {
	class T extends Familiar {}
	const name = tagName();
	customElements.define(name, T);
	const el = document.createElement(name) as T;
	document.body.appendChild(el);
	const sig = el.signal;
	el.remove();
	assert(sig.aborted);
});

Deno.test('reconnect renews the signal', async () => {
	class T extends Familiar {}
	const name = tagName();
	customElements.define(name, T);
	const el = document.createElement(name) as T;
	document.body.appendChild(el);
	const first = el.signal;
	el.remove();
	document.body.appendChild(el);
	await Promise.resolve();
	assert(first.aborted);
	assertNotStrictEquals(el.signal, first);
	assert(!el.signal.aborted);
	el.remove();
});
```

- [ ] **Step 2: Run the tests**

Run: `deno task test src/familiar.test.ts`
Expected: 4 tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/familiar.test.ts
git commit -m "Add baseline tests for Familiar lifecycle"
```

---

### Task 12: Rewrite `Familiar` to use `$bewitch`

**Files:**
- Modify: `src/familiar.ts`

- [ ] **Step 1: Replace `Familiar`**

`src/familiar.ts`:

```ts
import { $bewitch } from './hexes/$bewitch.ts';

/**
 * Coven's canonical custom-element base class. Owns lifecycle hooks
 * (setup / connected / disconnected) and exposes an AbortSignal that
 * hexes use for cleanup. The signal is managed by $bewitch — the same
 * mechanism that powers any bring-your-own web component.
 */
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

		if (document.readyState !== 'loading') {
			connect();
		} else {
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

- [ ] **Step 2: Run the Familiar tests**

Run: `deno task test src/familiar.test.ts`
Expected: 4 tests pass.

- [ ] **Step 3: Add a test confirming Familiar uses $bewitch**

Append to `src/familiar.test.ts`:

```ts
import { $bewitch } from './hexes/$bewitch.ts';

Deno.test('Familiar bewitches itself in the constructor', () => {
	class T extends Familiar {}
	const name = tagName();
	customElements.define(name, T);
	const el = document.createElement(name) as T;
	assertEquals(el.signal, $bewitch.signal(el));
});
```

Run: `deno task test src/familiar.test.ts`
Expected: 5 tests pass.

- [ ] **Step 4: Run the full test suite**

Run: `deno task test`
Expected: All tests pass (grimoire + $bewitch + familiar + setup smoke).

- [ ] **Step 5: Verify the playground still works**

Run: `deno task dev`
Expected: Playground renders correctly. Stop the dev server.

- [ ] **Step 6: Commit**

```bash
git add src/familiar.ts src/familiar.test.ts
git commit -m "Rewrite Familiar to use \$bewitch for signal management"
```

---

### Task 13: Update existing hexes to use `$bewitch`

Every hex currently reads `element.signal?.…`. Replace with `$bewitch(element)` so signals become mandatory and auto-bewitch works on plain elements. One file per step, one commit each, so blast radius stays small.

**Files:**
- Modify: `src/hexes/$prop.ts`
- Modify: `src/hexes/$mut.ts`
- Modify: `src/hexes/$scry.ts`
- Modify: `src/hexes/$shdw.ts`
- Modify: `src/hexes/$attr.ts`
- Modify: `src/charms/$on.ts`

- [ ] **Step 1: Update `$prop.ts`**

Replace the imports and the body where `element.signal?.…` appears.

In `src/hexes/$prop.ts`:

Change the top imports:

```ts
import { $assert } from "../charms/$assert.ts";
import { grimoire } from "../grimoire.ts";
import { $bewitch } from "./$bewitch.ts";
```

(remove the `SignalElement` import.)

Change the function signature:

```ts
export function $prop<
	TValue = unknown,
>(
	element: HTMLElement,
	{
		name,
		value: defaultValue,
		callback,
		readonly,
	}: $PropConfig<TValue>
): TValue {
```

At the top of the function body, replace any signal lookup with:

```ts
const signal = $bewitch(element);
```

Replace `element.signal?.addEventListener('abort', …)` with `signal.addEventListener('abort', …)` (no optional chaining).

- [ ] **Step 2: Verify**

Run: `deno task test`
Expected: All tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/hexes/\$prop.ts
git commit -m "Update \$prop to use \$bewitch (signal mandatory)"
```

- [ ] **Step 4: Update `$mut.ts`**

Apply the same pattern:

```ts
import type { GrimoireElement } from "../grimoire.ts";
import { grimoire } from "../grimoire.ts";
import { $bewitch } from "./$bewitch.ts";
```

Change signature to `element: HTMLElement`.

After `const store = grimoire<$MutGrimoire>(element as GrimoireElement, $MUT_GRIMOIRE_SYMBOL);`, add:

```ts
const signal = $bewitch(element);
```

Replace the `element.signal?.addEventListener('abort', …)` block with `signal.addEventListener('abort', …)`.

(Keep the `SignalElement` import removed and replace any internal `as SignalElement` casts.)

- [ ] **Step 5: Verify and commit**

```bash
deno task test
git add src/hexes/\$mut.ts
git commit -m "Update \$mut to use \$bewitch"
```

- [ ] **Step 6: Update `$scry.ts`**

Same pattern. Replace:

```ts
import type { SignalElement } from "../elements.d.ts";
```

with:

```ts
import { $bewitch } from "./$bewitch.ts";
```

Change `element: SignalElement` → `element: HTMLElement`. Add `const signal = $bewitch(element);` at the top. Replace the `element.signal?.aborted` gate with `signal.aborted` and replace the abort listener registration with `signal.addEventListener('abort', …)`.

- [ ] **Step 7: Verify and commit**

```bash
deno task test
git add src/hexes/\$scry.ts
git commit -m "Update \$scry to use \$bewitch"
```

- [ ] **Step 8: Update `$shdw.ts`**

Currently has no signal interaction beyond what `$template` brings in. Add `$bewitch(component)` at the top of the function body so the grimoire records that the element has been bewitched (even if the hex itself doesn't use the signal yet — Task 18 will). The signature `component: HTMLElement` stays as-is.

Add to the imports: `import { $bewitch } from "./$bewitch.ts";`

In the function body, the first statement becomes:

```ts
$bewitch(component);
```

(before the existing `if (typeof html === 'string')` line.)

- [ ] **Step 9: Verify and commit**

```bash
deno task test
git add src/hexes/\$shdw.ts
git commit -m "Update \$shdw to use \$bewitch"
```

- [ ] **Step 10: Update `$attr.ts`**

Replace `import type { SignalElement } from "../elements"` with `import { $bewitch } from "./$bewitch.ts";`.

Change `element: SignalElement` → `element: HTMLElement`.

Add `const signal = $bewitch(element);` at the top of the function body.

Replace `if (callback && !element.signal?.aborted)` with `if (callback && !signal.aborted)`.

- [ ] **Step 11: Verify and commit**

```bash
deno task test
git add src/hexes/\$attr.ts
git commit -m "Update \$attr to use \$bewitch"
```

- [ ] **Step 12: Update `$on.ts` (charm)**

`src/charms/$on.ts`:

```ts
import { $bewitch } from "../hexes/$bewitch.ts";

export type $OnOptions<
	TDetail extends unknown | never = never,
	TEvent = [TDetail] extends [never] ? Event : CustomEvent<TDetail>
> = {
	type: string;
	callback: (event: TEvent) => void;
	target?: EventTarget;
}

export function $on<
	TDetail extends unknown | never = never,
	TEvent = [TDetail] extends [never] ? Event : CustomEvent<TDetail>
>(
	element: HTMLElement,
	{
		type,
		callback,
		target = document,
	}: $OnOptions<TDetail, TEvent>
): void {
	const signal = $bewitch(element);
	target.addEventListener(
		type,
		callback as EventListenerOrEventListenerObject,
		{ signal },
	);
}
```

- [ ] **Step 13: Verify the playground still works**

Run: `deno task dev`
Expected: Playground renders correctly; the SSD digits and intersection example still function. Stop the dev server.

- [ ] **Step 14: Commit**

```bash
git add src/charms/\$on.ts
git commit -m "Update \$on charm to use \$bewitch"
```

---

### Task 14: Delete `src/elements.d.ts`

**Files:**
- Delete: `src/elements.d.ts`

- [ ] **Step 1: Confirm no remaining references**

Run: `grep -rn "elements.d.ts\|SignalElement" src/`
Expected: No output (all references replaced in Task 13).

If anything appears, fix the imports and re-run.

- [ ] **Step 2: Delete the file**

```bash
git rm src/elements.d.ts
```

- [ ] **Step 3: Verify**

Run: `deno task check && deno task test`
Expected: Clean check, all tests pass.

- [ ] **Step 4: Commit**

```bash
git commit -m "Remove SignalElement type (replaced by \$bewitch grimoire)"
```

---

## Phase D — `$template` rewrite, `$mut` generalization, `$shdw` part-tracking

### Task 15: Tests for the existing `$template` (capture baseline)

Although `$template` is being rewritten as a hex, its core behavior — "create a template element from an HTML string" — must remain. Lock that in first.

**Files:**
- Create: `src/charms/$template.test.ts`

- [ ] **Step 1: Write the tests**

```ts
import '../_test/setup.ts';
import { assert, assertEquals } from '@std/assert';
import { $template } from './$template.ts';

Deno.test('$template returns an HTMLTemplateElement with the given HTML', () => {
	const t = $template('<span>hi</span>');
	assert(t instanceof HTMLTemplateElement);
	assertEquals(t.content.querySelector('span')?.textContent, 'hi');
});
```

- [ ] **Step 2: Run**

Run: `deno task test src/charms/$template.test.ts`
Expected: 1 test passes.

- [ ] **Step 3: Commit**

```bash
git add src/charms/\$template.test.ts
git commit -m "Add baseline test for \$template behavior"
```

---

### Task 16: Move `$template` to hexes and add caching

**Files:**
- Move: `src/charms/$template.ts` → `src/hexes/$template.ts`
- Move: `src/charms/$template.test.ts` → `src/hexes/$template.test.ts`
- Modify: `src/charms/mod.ts`
- Modify: `src/hexes/mod.ts`
- Modify: `src/hexes/$shdw.ts` (its `$template` import)

- [ ] **Step 1: Move the files**

```bash
git mv src/charms/\$template.ts src/hexes/\$template.ts
git mv src/charms/\$template.test.ts src/hexes/\$template.test.ts
```

- [ ] **Step 2: Update `src/charms/mod.ts`**

Remove the `$template` export:

```ts
export { $assert } from './$assert.ts';
export { $define } from './$define.ts';
export { $emit } from './$emit.ts';
export { $error } from './$error.ts';
export { $on } from './$on.ts';
```

- [ ] **Step 3: Update `src/hexes/mod.ts`**

Add `$template`:

```ts
export { $attr } from './$attr.ts';
export { $bewitch } from './$bewitch.ts';
export { $mut } from './$mut.ts';
export { $prop } from './$prop.ts';
export { $scry } from './$scry.ts';
export { $shdw } from './$shdw.ts';
export { $template } from './$template.ts';
```

- [ ] **Step 4: Update the test file's `_test/setup.ts` path**

After the move, the test imports `../_test/setup.ts`. Verify that path still resolves (it does — both `hexes/` and `charms/` are one level under `src/`).

- [ ] **Step 5: Write failing tests for the new behavior**

Replace `src/hexes/$template.test.ts`:

```ts
import '../_test/setup.ts';
import { assert, assertEquals, assertStrictEquals, assertNotStrictEquals } from '@std/assert';
import { $template } from './$template.ts';

let counter = 0;
function tagName(): string {
	return `coven-tmpl-${++counter}`;
}

Deno.test('$template returns an HTMLTemplateElement with the given HTML', () => {
	class T extends HTMLElement {}
	const name = tagName();
	customElements.define(name, T);
	const el = document.createElement(name);
	const t = $template(el, '<span>hi</span>');
	assert(t instanceof HTMLTemplateElement);
	assertEquals(t.content.querySelector('span')?.textContent, 'hi');
});

Deno.test('$template caches per constructor: same HTML → same template across instances', () => {
	class T extends HTMLElement {}
	const name = tagName();
	customElements.define(name, T);
	const a = document.createElement(name);
	const b = document.createElement(name);
	const ta = $template(a, '<i>same</i>');
	const tb = $template(b, '<i>same</i>');
	assertStrictEquals(ta, tb);
});

Deno.test('$template stores different HTML strings as different cache entries', () => {
	class T extends HTMLElement {}
	const name = tagName();
	customElements.define(name, T);
	const el = document.createElement(name);
	const a = $template(el, '<i>a</i>');
	const b = $template(el, '<i>b</i>');
	assertNotStrictEquals(a, b);
});

Deno.test('$template caches are isolated between classes', () => {
	class A extends HTMLElement {}
	class B extends HTMLElement {}
	const nameA = tagName();
	const nameB = tagName();
	customElements.define(nameA, A);
	customElements.define(nameB, B);
	const a = document.createElement(nameA);
	const b = document.createElement(nameB);
	const ta = $template(a, '<i>x</i>');
	const tb = $template(b, '<i>x</i>');
	assertNotStrictEquals(ta, tb);
});

Deno.test('$template.cache(element) returns the cache map', () => {
	class T extends HTMLElement {}
	const name = tagName();
	customElements.define(name, T);
	const el = document.createElement(name);
	$template(el, '<i>cached</i>');
	const cache = $template.cache(el);
	assert(cache instanceof Map);
	assertEquals(cache!.size, 1);
});

Deno.test('$template.clone(element, html) returns a DocumentFragment', () => {
	class T extends HTMLElement {}
	const name = tagName();
	customElements.define(name, T);
	const el = document.createElement(name);
	const frag = $template.clone(el, '<i>cloned</i>');
	assert(frag instanceof DocumentFragment);
	assertEquals(frag.querySelector('i')?.textContent, 'cloned');
});
```

Run: `deno task test src/hexes/$template.test.ts`
Expected: 1st test passes (legacy behavior). New tests fail — the function signature still takes only one argument.

- [ ] **Step 6: Rewrite `$template.ts` as a hex**

`src/hexes/$template.ts`:

```ts
import { $bewitch } from './$bewitch.ts';
import { grimoire, type GrimoireElement } from '../grimoire.ts';

const $TEMPLATE_GRIMOIRE_SYMBOL = Symbol('$template');

type $TemplateGrimoire = {
	templates?: Map<string, HTMLTemplateElement>;
};

/**
 * Cached <template> factory. Caches parsed templates per element
 * constructor (so every instance of the same custom element shares one
 * parsed template per distinct HTML string).
 *
 * @param element - The element whose class owns the cache.
 * @param html - The HTML string to parse.
 * @returns The cached HTMLTemplateElement.
 */
export function $template(
	element: HTMLElement,
	html: string,
): HTMLTemplateElement {
	$bewitch(element);
	const store = grimoire.shared<$TemplateGrimoire>(
		element as GrimoireElement,
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

/**
 * Read the per-class template cache for an element.
 */
$template.cache = (
	element: HTMLElement,
): Map<string, HTMLTemplateElement> | undefined =>
	grimoire.shared<$TemplateGrimoire>(
		element as GrimoireElement,
		$TEMPLATE_GRIMOIRE_SYMBOL,
	).templates;

/**
 * Returns a fresh cloned DocumentFragment from the cached template.
 */
$template.clone = (
	element: HTMLElement,
	html: string,
): DocumentFragment =>
	$template(element, html).content.cloneNode(true) as DocumentFragment;

export default $template;
```

- [ ] **Step 7: Run the tests**

Run: `deno task test src/hexes/$template.test.ts`
Expected: 6 tests pass.

- [ ] **Step 8: Update `$shdw.ts` to thread the element and use `$template.clone`**

In `src/hexes/$shdw.ts`:

Change the import:

```ts
import { $template } from "./$template.ts";
import { $bewitch } from "./$bewitch.ts";
```

Change the body where `$template(html)` is called. The new code path:

```ts
if (typeof html === 'string') {
	const template = $template(component, html);
	html = template;
}
```

(The `html.content.cloneNode(true)` call later in the function is unchanged.)


- [ ] **Step 9: Run full test suite + playground smoke**

Run: `deno task test`
Expected: All pass.

Run: `deno task dev`
Expected: Playground renders. Stop the dev server.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "Move \$template to hexes with per-class caching"
```

---

### Task 17: Generalize `$mut` to accept an observe target

Currently `$mut` observes the element itself. `$shdw` (Task 19) needs to observe the shadow root. Add an optional `target` to the config.

**Files:**
- Modify: `src/hexes/$mut.ts`
- Modify: `src/hexes/$mut.test.ts` (create if doesn't exist)

- [ ] **Step 1: Write the failing test**

Create or append to `src/hexes/$mut.test.ts`:

```ts
import '../_test/setup.ts';
import { assert, assertEquals } from '@std/assert';
import { $mut } from './$mut.ts';
import { $bewitch } from './$bewitch.ts';

Deno.test('$mut can observe an alternate target (e.g. a shadow root)', async () => {
	const host = document.createElement('div');
	host.attachShadow({ mode: 'open' });
	$bewitch(host);

	let observedChild: Node | null = null;
	$mut(host, {
		type: 'childList',
		target: host.shadowRoot!,
		callback: (nodes) => {
			observedChild = nodes[0] ?? null;
		},
	});

	const span = document.createElement('span');
	host.shadowRoot!.appendChild(span);
	await new Promise((r) => queueMicrotask(() => r(null)));

	assertEquals(observedChild, span);
});
```

Run: `deno task test src/hexes/$mut.test.ts`
Expected: New test fails (no `target` option).

- [ ] **Step 2: Add `target` to `$mut`**

In `src/hexes/$mut.ts`, extend `$MutConfig`:

```ts
export type $MutConfig<
	TType extends keyof $MutValueMap = keyof $MutValueMap,
> = {
	type: TType;
	callback: $MutCallbacks[TType];
	subtree?: boolean;
	target?: Node;
};
```

In the function body, destructure `target`:

```ts
	{
		type,
		callback,
		subtree = false,
		target,
	}: $MutConfig<TType>
```

Replace `observer.observe(element, …)` with:

```ts
observer.observe(target ?? element, {
	attributes: type === 'attributes',
	childList: type === 'childList',
	characterData: type === 'characterData',
	subtree,
	attributeOldValue: type === 'attributes',
	characterDataOldValue: type === 'characterData',
});
```

- [ ] **Step 3: Run tests**

Run: `deno task test src/hexes/$mut.test.ts`
Expected: New test passes; existing tests still pass.

Run: `deno task test`
Expected: Full suite green.

- [ ] **Step 4: Commit**

```bash
git add src/hexes/\$mut.ts src/hexes/\$mut.test.ts
git commit -m "Allow \$mut to observe a custom target (needed by \$shdw)"
```

---

### Task 18: `$shdw` tracks `[part]` attributes

**Files:**
- Modify: `src/hexes/$shdw.ts`
- Create or extend: `src/hexes/$shdw.test.ts`

- [ ] **Step 1: Write failing tests**

`src/hexes/$shdw.test.ts`:

```ts
import '../_test/setup.ts';
import { assert, assertEquals } from '@std/assert';
import { $shdw } from './$shdw.ts';

Deno.test('$shdw attaches a shadow root and populates it', () => {
	const el = document.createElement('div');
	const root = $shdw(el, '<span part="label">x</span>');
	assert(root instanceof ShadowRoot);
	assertEquals(root.querySelector('span')?.textContent, 'x');
});

Deno.test('$shdw is idempotent on the same element', () => {
	const el = document.createElement('div');
	const a = $shdw(el, '<span>1</span>');
	const b = $shdw(el, '<span>2</span>');
	assert(a === b);
});

Deno.test('$shdw.parts(element) returns tracked [part] values', () => {
	const el = document.createElement('div');
	$shdw(el, `
		<div part="header"></div>
		<div part="body footer"></div>
	`);
	const parts = $shdw.parts(el)!;
	assert(parts.has('header'));
	assert(parts.has('body'));
	assert(parts.has('footer'));
});

Deno.test('$shdw.root(element) returns the shadow root', () => {
	const el = document.createElement('div');
	const root = $shdw(el, '<i></i>');
	assertEquals($shdw.root(el), root);
});

Deno.test('$shdw collects late-added [part] values via internal $mut', async () => {
	const el = document.createElement('div');
	$shdw(el, '<div part="initial"></div>');
	const later = document.createElement('span');
	later.setAttribute('part', 'late');
	$shdw.root(el)!.appendChild(later);
	await new Promise((r) => queueMicrotask(() => r(null)));
	const parts = $shdw.parts(el)!;
	assert(parts.has('late'), `expected 'late' in ${[...parts].join(',')}`);
});
```

Run: `deno task test src/hexes/$shdw.test.ts`
Expected: Tests for `$shdw.parts`/`$shdw.root` fail (sub-methods don't exist yet). First two may already pass.

- [ ] **Step 2: Extend `$shdw.ts`**

`src/hexes/$shdw.ts`:

```ts
import { $template } from "./$template.ts";
import { $bewitch } from "./$bewitch.ts";
import { $mut } from "./$mut.ts";
import { grimoire, type GrimoireElement } from "../grimoire.ts";

const $SHDW_GRIMOIRE_SYMBOL = Symbol('$shdw');

type $ShdwGrimoire = {
	parts?: Set<string>;
};

function collectParts(root: ParentNode, into: Set<string>): void {
	for (const node of root.querySelectorAll('[part]')) {
		const raw = node.getAttribute('part') ?? '';
		for (const token of raw.split(/\s+/)) {
			if (token) into.add(token);
		}
	}
}

/**
 * Attaches a shadow root to the element (if not already attached),
 * populates it with the given HTML, and tracks every [part] value
 * inside so the parts set can be inspected via $shdw.parts(element).
 *
 * @param component - The element to attach the shadow root to.
 * @param html - Optional HTML to populate the shadow with.
 * @returns The shadow root.
 */
export function $shdw(
	component: HTMLElement,
	html?: HTMLTemplateElement | string,
): ShadowRoot {
	$bewitch(component);

	if (typeof html === 'string') html = $template(component, html);

	if (!component.shadowRoot) {
		component.attachShadow({ mode: 'open' });
		if (html) {
			component.shadowRoot!.appendChild(html.content.cloneNode(true));
		}
	}

	const store = grimoire<$ShdwGrimoire>(
		component as GrimoireElement,
		$SHDW_GRIMOIRE_SYMBOL,
	);
	store.parts ??= new Set();
	collectParts(component.shadowRoot!, store.parts);

	// Stay in sync with late-added [part] values.
	$mut(component, {
		type: 'childList',
		subtree: true,
		target: component.shadowRoot!,
		callback: () => {
			collectParts(component.shadowRoot!, store.parts!);
		},
	});

	return component.shadowRoot!;
}

/**
 * Returns the readonly set of tracked [part] values.
 */
$shdw.parts = (element: HTMLElement): ReadonlySet<string> | undefined =>
	grimoire<$ShdwGrimoire>(
		element as GrimoireElement,
		$SHDW_GRIMOIRE_SYMBOL,
	).parts;

/**
 * Returns the element's shadow root.
 */
$shdw.root = (element: HTMLElement): ShadowRoot | null =>
	element.shadowRoot;

export default $shdw;
```

- [ ] **Step 3: Run the tests**

Run: `deno task test src/hexes/$shdw.test.ts`
Expected: 5 tests pass.

- [ ] **Step 4: Run full suite**

Run: `deno task test`
Expected: All green.

- [ ] **Step 5: Commit**

```bash
git add src/hexes/\$shdw.ts src/hexes/\$shdw.test.ts
git commit -m "\$shdw tracks [part] values + adds .parts/.root sub-methods"
```

---

### Task 19: `$shdw` auto-propagates `exportparts` upward

**Files:**
- Modify: `src/hexes/$shdw.ts`
- Modify: `src/hexes/$shdw.test.ts`

- [ ] **Step 1: Write failing tests**

Append to `src/hexes/$shdw.test.ts`:

```ts
Deno.test('$shdw auto-sets exportparts on parent shadow host', async () => {
	const host = document.createElement('div');
	$shdw(host, '<slot></slot>');

	const child = document.createElement('div');
	$shdw(child, '<i part="inner"></i>');
	host.shadowRoot!.appendChild(child);

	await new Promise((r) => queueMicrotask(() => r(null)));
	await new Promise((r) => queueMicrotask(() => r(null)));

	const exported = child.getAttribute('exportparts') ?? '';
	assert(exported.includes('inner'), `exportparts="${exported}"`);
});

Deno.test('$shdw.propagate(element) manually triggers propagation', () => {
	const host = document.createElement('div');
	$shdw(host, '<slot></slot>');

	const child = document.createElement('div');
	$shdw(child, '<i part="manual"></i>');
	host.shadowRoot!.appendChild(child);
	child.removeAttribute('exportparts');

	$shdw.propagate(child);
	const exported = child.getAttribute('exportparts') ?? '';
	assert(exported.includes('manual'), `exportparts="${exported}"`);
});
```

Run: `deno task test src/hexes/$shdw.test.ts`
Expected: New tests fail (no propagation, no `.propagate`).

- [ ] **Step 2: Add propagation**

Append to `src/hexes/$shdw.ts`, after the existing function body (inside the same file). Update the main function to schedule propagation; add `$shdw.propagate`:

In `$shdw(component, html?)`, before the `return component.shadowRoot!;`, add:

```ts
	queueMicrotask(() => propagate(component));
```

Add helper at the bottom of the file (before the default export):

```ts
function propagate(element: HTMLElement): void {
	const parts = grimoire<$ShdwGrimoire>(
		element as GrimoireElement,
		$SHDW_GRIMOIRE_SYMBOL,
	).parts;
	if (!parts || !parts.size) return;

	const root = element.getRootNode();
	if (!(root instanceof ShadowRoot)) return;

	const existing = (element.getAttribute('exportparts') ?? '')
		.split(',')
		.map((s) => s.trim())
		.filter(Boolean);
	const merged = new Set<string>([...existing, ...parts]);
	element.setAttribute('exportparts', [...merged].join(', '));
}

/**
 * Re-run exportparts propagation manually. Useful when shadow contents
 * change outside the internal $mut subscription's view.
 */
$shdw.propagate = (element: HTMLElement): void => propagate(element);
```

Also extend the internal `$mut` callback so the late-arrival case re-runs propagation:

```ts
	$mut(component, {
		type: 'childList',
		subtree: true,
		target: component.shadowRoot!,
		callback: () => {
			collectParts(component.shadowRoot!, store.parts!);
			propagate(component);
		},
	});
```

- [ ] **Step 3: Run the tests**

Run: `deno task test src/hexes/$shdw.test.ts`
Expected: All `$shdw` tests pass.

Run: `deno task test`
Expected: Full suite green.

- [ ] **Step 4: Smoke-test the playground**

Run: `deno task dev`
Expected: The `wcpg-ssd` example renders the digits correctly. (The current example manually sets `exportparts`; with auto-propagation, the manual set is redundant but harmless.) Stop the dev server.

- [ ] **Step 5: Commit**

```bash
git add src/hexes/\$shdw.ts src/hexes/\$shdw.test.ts
git commit -m "\$shdw auto-propagates exportparts to enclosing shadow host"
```

---

## Phase E — Sub-methods on existing hexes

Each sub-task adds the small read-only accessors agreed in the spec. Pattern: failing test → implementation → commit.

### Task 20: `$prop` sub-methods (`list`, `readonly`)

**Files:**
- Modify: `src/hexes/$prop.ts`
- Create: `src/hexes/$prop.test.ts`

- [ ] **Step 1: Write tests**

```ts
import '../_test/setup.ts';
import { assert, assertEquals, assertThrows } from '@std/assert';
import { $prop } from './$prop.ts';

Deno.test('$prop defines a get/set property', () => {
	const el = document.createElement('div');
	$prop(el, { name: 'value', value: 'initial' });
	// deno-lint-ignore no-explicit-any
	assertEquals((el as any).value, 'initial');
	// deno-lint-ignore no-explicit-any
	(el as any).value = 'next';
	// deno-lint-ignore no-explicit-any
	assertEquals((el as any).value, 'next');
});

Deno.test('$prop callback fires on change', () => {
	const el = document.createElement('div');
	let calls = 0;
	$prop(el, {
		name: 'count',
		value: 0,
		callback: () => { calls++; },
	});
	// deno-lint-ignore no-explicit-any
	(el as any).count = 1;
	// deno-lint-ignore no-explicit-any
	(el as any).count = 2;
	assertEquals(calls, 2);
});

Deno.test('$prop readonly throws on set', () => {
	const el = document.createElement('div');
	$prop(el, { name: 'frozen', value: 'x', readonly: true });
	assertThrows(() => {
		// deno-lint-ignore no-explicit-any
		(el as any).frozen = 'y';
	});
});

Deno.test('$prop.list(element) returns bound property names', () => {
	const el = document.createElement('div');
	$prop(el, { name: 'a', value: 1 });
	$prop(el, { name: 'b', value: 2 });
	const names = $prop.list(el);
	assertEquals(new Set(names), new Set(['a', 'b']));
});

Deno.test('$prop.readonly(element, name) reflects state', () => {
	const el = document.createElement('div');
	$prop(el, { name: 'rw', value: 1 });
	$prop(el, { name: 'ro', value: 2, readonly: true });
	assertEquals($prop.readonly(el, 'rw'), false);
	assertEquals($prop.readonly(el, 'ro'), true);
});
```

Run: `deno task test src/hexes/$prop.test.ts`
Expected: Sub-method tests fail.

- [ ] **Step 2: Implement sub-methods**

Append to `src/hexes/$prop.ts` (after `export function $prop(...)`):

```ts
$prop.list = (element: HTMLElement): string[] => {
	const store = grimoire<$PropGrimoire>(
		element as GrimoireElement,
		$PROP_GRIMOIRE_SYMBOL,
	);
	return Object.keys(store.props ?? {});
};

$prop.readonly = (
	element: HTMLElement,
	name: string,
): boolean | undefined => {
	const store = grimoire<$PropGrimoire>(
		element as GrimoireElement,
		$PROP_GRIMOIRE_SYMBOL,
	);
	return store.props?.[name]?.readonly;
};
```

(Import `GrimoireElement` from `../grimoire.ts` if not already.)

- [ ] **Step 3: Run tests, commit**

```bash
deno task test src/hexes/\$prop.test.ts
git add src/hexes/\$prop.ts src/hexes/\$prop.test.ts
git commit -m "\$prop: add list and readonly sub-methods"
```

---

### Task 21: `$attr` audit slot + `list` sub-method

**Files:**
- Modify: `src/hexes/$attr.ts`
- Create: `src/hexes/$attr.test.ts`

- [ ] **Step 1: Write tests**

```ts
import '../_test/setup.ts';
import { assert, assertEquals } from '@std/assert';
import { $attr } from './$attr.ts';
import { grimoire, type GrimoireElement } from '../grimoire.ts';

Deno.test('$attr binds property to attribute', () => {
	const el = document.createElement('div');
	$attr(el, { name: 'data-flag', value: false });
	// deno-lint-ignore no-explicit-any
	(el as any)['data-flag'] = true;
	assertEquals(el.getAttribute('data-flag'), '');
});

Deno.test('$attr.list(element) returns names of bound attributes', () => {
	const el = document.createElement('div');
	$attr(el, { name: 'one', value: '' });
	$attr(el, { name: 'two', value: '' });
	assertEquals(new Set($attr.list(el)), new Set(['one', 'two']));
});

Deno.test('$attr writes an audit slot to the grimoire', () => {
	const el = document.createElement('div');
	$attr(el, { name: 'audited', value: '' });
	const symbols = Object.getOwnPropertySymbols(grimoire(el as GrimoireElement));
	// At least one symbol description should mention $attr.
	const found = symbols.some((s) => s.description === '$attr');
	assert(found, 'expected a $attr grimoire slot');
});
```

Run: `deno task test src/hexes/$attr.test.ts`
Expected: Sub-method tests fail.

- [ ] **Step 2: Add the audit slot and sub-method**

In `src/hexes/$attr.ts`, near the top:

```ts
import { grimoire, type GrimoireElement } from '../grimoire.ts';

const $ATTR_GRIMOIRE_SYMBOL = Symbol('$attr');
type $AttrGrimoire = { names?: Set<string> };
```

Inside `$attr(element, …)`, right after `const signal = $bewitch(element);`, add:

```ts
const store = grimoire<$AttrGrimoire>(
	element as GrimoireElement,
	$ATTR_GRIMOIRE_SYMBOL,
);
store.names ??= new Set();
store.names.add(name);
```

After `export function $attr(...)`, add the sub-method:

```ts
$attr.list = (element: HTMLElement): string[] => {
	const store = grimoire<$AttrGrimoire>(
		element as GrimoireElement,
		$ATTR_GRIMOIRE_SYMBOL,
	);
	return [...(store.names ?? new Set<string>())];
};
```

- [ ] **Step 3: Run tests, commit**

```bash
deno task test
git add src/hexes/\$attr.ts src/hexes/\$attr.test.ts
git commit -m "\$attr: add audit slot and list sub-method"
```

---

### Task 22: `$mut` sub-methods (`observer`, `listeners`)

**Files:**
- Modify: `src/hexes/$mut.ts`
- Modify: `src/hexes/$mut.test.ts`

- [ ] **Step 1: Write tests**

Append to `src/hexes/$mut.test.ts`:

```ts
Deno.test('$mut.observer(element) returns the underlying MutationObserver', () => {
	const el = document.createElement('div');
	$mut(el, { type: 'attributes', callback: () => {} });
	assert($mut.observer(el) instanceof MutationObserver);
});

Deno.test('$mut.listeners(element, type) returns the listener Set', () => {
	const el = document.createElement('div');
	const cb = () => {};
	$mut(el, { type: 'attributes', callback: cb });
	const listeners = $mut.listeners(el, 'attributes');
	assert(listeners?.has(cb));
});
```

Run: `deno task test src/hexes/$mut.test.ts`
Expected: New tests fail.

- [ ] **Step 2: Implement**

Append to `src/hexes/$mut.ts`:

```ts
$mut.observer = (element: HTMLElement): MutationObserver | undefined =>
	grimoire<$MutGrimoire>(
		element as GrimoireElement,
		$MUT_GRIMOIRE_SYMBOL,
	).observer;

$mut.listeners = <TType extends keyof $MutValueMap>(
	element: HTMLElement,
	type: TType,
): Set<$MutCallbacks[TType]> | undefined => {
	const store = grimoire<$MutGrimoire>(
		element as GrimoireElement,
		$MUT_GRIMOIRE_SYMBOL,
	);
	return store.listeners?.[type] as Set<$MutCallbacks[TType]> | undefined;
};
```

- [ ] **Step 3: Run tests, commit**

```bash
deno task test
git add src/hexes/\$mut.ts src/hexes/\$mut.test.ts
git commit -m "\$mut: add observer and listeners sub-methods"
```

---

### Task 23: `$scry` sub-methods (`observers`, `disconnect`)

**Files:**
- Modify: `src/hexes/$scry.ts`
- Create: `src/hexes/$scry.test.ts`

- [ ] **Step 1: Write tests**

```ts
import '../_test/setup.ts';
import { assert, assertEquals } from '@std/assert';
import { $scry } from './$scry.ts';

Deno.test('$scry creates an IntersectionObserver', () => {
	const el = document.createElement('div');
	const obs = $scry(el, { callback: () => {} });
	assert(obs instanceof IntersectionObserver);
});

Deno.test('$scry.observers(element) returns the set of observers', () => {
	const el = document.createElement('div');
	const obs = $scry(el, { callback: () => {} });
	const set = $scry.observers(el);
	assert(set?.has(obs));
});

Deno.test('$scry.disconnect(element) disconnects all observers', () => {
	const el = document.createElement('div');
	const obs = $scry(el, { callback: () => {} });
	let disconnected = false;
	const orig = obs.disconnect.bind(obs);
	obs.disconnect = () => { disconnected = true; orig(); };
	$scry.disconnect(el);
	assert(disconnected);
});
```

Run: `deno task test src/hexes/$scry.test.ts`
Expected: Sub-method tests fail.

- [ ] **Step 2: Implement**

Append to `src/hexes/$scry.ts`:

```ts
$scry.observers = (element: HTMLElement): Set<IntersectionObserver> | undefined =>
	grimoire<$IntGrimoire>(
		element as GrimoireElement,
		$INT_GRIMOIRE_SYMBOL,
	).observers;

$scry.disconnect = (element: HTMLElement): void => {
	const store = grimoire<$IntGrimoire>(
		element as GrimoireElement,
		$INT_GRIMOIRE_SYMBOL,
	);
	store.observers?.forEach((o) => o.disconnect());
	store.observers?.clear();
};
```

Import `GrimoireElement` if not already.

- [ ] **Step 3: Run tests, commit**

```bash
deno task test
git add src/hexes/\$scry.ts src/hexes/\$scry.test.ts
git commit -m "\$scry: add observers and disconnect sub-methods"
```

---

### Task 24: Round out remaining tests for `$on`, `$emit`, `$assert`, `$error`, `$define`

**Files:**
- Create: `src/charms/$on.test.ts`
- Create: `src/charms/$emit.test.ts`
- Create: `src/charms/$assert.test.ts`
- Create: `src/charms/$error.test.ts`
- Create: `src/charms/$define.test.ts`

- [ ] **Step 1: `$on` tests**

`src/charms/$on.test.ts`:

```ts
import '../_test/setup.ts';
import { assert, assertEquals } from '@std/assert';
import { $on } from './$on.ts';
import { $bewitch } from '../hexes/$bewitch.ts';

Deno.test('$on binds a listener', () => {
	const el = document.createElement('div');
	let count = 0;
	$on(el, { type: 'click', callback: () => { count++; }, target: el });
	el.dispatchEvent(new Event('click'));
	assertEquals(count, 1);
});

Deno.test('$on listener is removed when the signal aborts', () => {
	const el = document.createElement('div');
	let count = 0;
	$on(el, { type: 'click', callback: () => { count++; }, target: el });
	$bewitch.abort(el);
	el.dispatchEvent(new Event('click'));
	assertEquals(count, 0);
});

Deno.test('$on auto-bewitches the element', () => {
	const el = document.createElement('div');
	$on(el, { type: 'click', callback: () => {}, target: el });
	assert($bewitch.signal(el) instanceof AbortSignal);
});
```

- [ ] **Step 2: `$emit` tests**

`src/charms/$emit.test.ts`:

```ts
import '../_test/setup.ts';
import { assert, assertEquals } from '@std/assert';
import { $emit } from './$emit.ts';

Deno.test('$emit dispatches an event named for the tag', () => {
	class T extends HTMLElement {}
	customElements.define('coven-emit-1', T);
	const el = document.createElement('coven-emit-1');
	let type = '';
	el.addEventListener('coven-emit-1', (e) => { type = e.type; });
	$emit(el);
	assertEquals(type, 'coven-emit-1');
});

Deno.test('$emit dispatches a CustomEvent when detail is provided', () => {
	class T extends HTMLElement {}
	customElements.define('coven-emit-2', T);
	const el = document.createElement('coven-emit-2');
	let detail: unknown;
	el.addEventListener('coven-emit-2', (e) => {
		detail = (e as CustomEvent).detail;
	});
	$emit(el, { detail: { value: 42 } });
	assertEquals(detail, { value: 42 });
});
```

- [ ] **Step 3: `$assert` and `$error` tests**

`src/charms/$assert.test.ts`:

```ts
import '../_test/setup.ts';
import { assertThrows } from '@std/assert';
import { $assert } from './$assert.ts';

Deno.test('$assert throws on falsey', () => {
	const el = document.createElement('div');
	assertThrows(() => $assert(el, false, 'nope'));
});

Deno.test('$assert passes through truthy', () => {
	const el = document.createElement('div');
	$assert(el, true, 'fine');
});
```

`src/charms/$error.test.ts`:

```ts
import '../_test/setup.ts';
import { assert, assertThrows } from '@std/assert';
import { $error, COVEN_ERROR_NAME } from './$error.ts';

Deno.test('$error throws a CovenError with [tagname]: prefix', () => {
	const el = document.createElement('div');
	try {
		$error(el, 'something');
	} catch (e) {
		assert((e as Error).name === COVEN_ERROR_NAME);
		assert((e as Error).message.includes('[div]:'));
	}
});
```

(Verify `$error.ts` exports `COVEN_ERROR_NAME` — it already does per `src/charms/$error.ts`.)

- [ ] **Step 4: `$define` tests**

`src/charms/$define.test.ts`:

```ts
import '../_test/setup.ts';
import { assert, assertEquals } from '@std/assert';
import { $define } from './$define.ts';

Deno.test('$define registers a custom element', () => {
	class T extends HTMLElement {}
	$define('coven-def-1', T);
	assertEquals(customElements.get('coven-def-1'), T);
});

Deno.test('$define is idempotent', () => {
	class T extends HTMLElement {}
	$define('coven-def-2', T);
	$define('coven-def-2', T);
	assert(true); // would have thrown if duplicate registration
});
```

- [ ] **Step 5: Run them all**

Run: `deno task test`
Expected: All tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/charms/
git commit -m "Add tests for charm modules (\$on \$emit \$assert \$error \$define)"
```

---

### Task 25: Cross-cutting audit-log smoke test

**Files:**
- Create: `src/_test/audit.test.ts`

- [ ] **Step 1: Write the test**

```ts
import './setup.ts';
import { assert, assertEquals } from '@std/assert';
import { Familiar } from '../familiar.ts';
import { grimoire, type GrimoireElement } from '../grimoire.ts';
import { $attr } from '../hexes/$attr.ts';
import { $shdw } from '../hexes/$shdw.ts';
import { $on } from '../charms/$on.ts';

Deno.test('audit log shows every hex active on an element', () => {
	let counter = 0;

	class Audited extends Familiar {
		override setup() {
			$shdw(this, '<div part="root"></div>');
			$attr(this, { name: 'mode', value: 'idle' });
			$on(this, { type: 'click', callback: () => {}, target: this });
		}
	}

	const name = `coven-audit-${++counter}`;
	customElements.define(name, Audited);
	const el = document.createElement(name) as Audited;

	const descriptions = Object.getOwnPropertySymbols(grimoire(el as GrimoireElement))
		.map((s) => s.description);

	for (const expected of ['$bewitch', '$shdw', '$attr', '$prop', '$mut']) {
		assert(
			descriptions.includes(expected),
			`expected ${expected} in audit log; got ${descriptions.join(', ')}`,
		);
	}
});
```

- [ ] **Step 2: Run**

Run: `deno task test src/_test/audit.test.ts`
Expected: Test passes.

- [ ] **Step 3: Commit**

```bash
git add src/_test/audit.test.ts
git commit -m "Add cross-cutting audit-log smoke test"
```

---

## Phase F — Documentation

### Task 26: JSDoc sweep on every exported symbol

**Files:**
- Modify: every file that has exports under `src/` (except `_examples/` and `_test/`).

- [ ] **Step 1: Audit current state**

Run: `grep -rEn "^export " src/ | grep -v "_examples\|_test\|\\.test\\.ts"`
Expected: A list of every export. Note which have JSDoc blocks already.

- [ ] **Step 2: Add JSDoc to every export**

For each export missing a JSDoc block (or with a thin one), add a block with:

- One-sentence summary on the first line.
- Longer description if behavior isn't obvious.
- `@param` for each parameter.
- `@returns` (omit only when `void`).
- `@example` for hexes, charms, `Familiar`, and `grimoire`.
- `@see` for related symbols.

Example (`$emit`):

```ts
/**
 * Dispatches an Event (or CustomEvent if a detail is provided) on the
 * given element. Bubbles, is cancelable, and crosses shadow boundaries
 * by default; pass options to override.
 *
 * The event's type is the element's tag name in lowercase, so
 * consumers can listen with `el.addEventListener('my-tag', ...)`.
 *
 * @param element - The element to dispatch from.
 * @param options - EventInit or CustomEventInit. Pass `detail` to
 *   dispatch a CustomEvent.
 * @returns Whether the event was not cancelled.
 *
 * @example
 * ```ts
 * $emit(this, { detail: { value: 42 } });
 * ```
 *
 * @see $on
 */
export function $emit<...>(...) { ... }
```

Work through each file. Where a `@example` requires a Familiar context, prefer concise inline examples that still type-check under `deno task test --doc`.

- [ ] **Step 3: Run doc tests**

Run: `deno task test`
Expected: `--doc` extracts and type-checks `@example` blocks; all pass.

- [ ] **Step 4: Commit**

```bash
git add src/
git commit -m "JSDoc sweep on every exported symbol"
```

---

### Task 27: Write `README.md`

**Files:**
- Create: `README.md`

- [ ] **Step 1: Write the README**

```markdown
# Coven

A tiny set of runtime conveniences for building (or upgrading) web
components. Coven is magical in name only — the abstractions are small,
explicit, and inspired by Svelte's runes.

## Install

Deno:

\`\`\`bash
deno add jsr:@joeleisner/coven
\`\`\`

Node (via JSR's npm bridge):

\`\`\`bash
npx jsr add @joeleisner/coven
\`\`\`

## 30-second example — on a plain element

\`\`\`ts
import { $bewitch, $on, $attr } from '@joeleisner/coven';

const button = document.querySelector('button')!;
$bewitch(button);
$on(button, { type: 'click', callback: () => console.log('clicked!') });
$attr(button, { name: 'disabled', value: false });
\`\`\`

Coven hexes work on any HTMLElement. If you only want a couple of
helpers and don't want to rewrite your components, you can.

## 30-second example — using `Familiar`

\`\`\`ts
import { Familiar, $shdw, $attr, $define } from '@joeleisner/coven';

class Counter extends Familiar {
	declare count: number;

	setup() {
		$shdw(this, '<button part="btn"><slot></slot> <span part="n">0</span></button>');
	}

	connected() {
		$attr<number>(this, {
			name: 'count',
			value: 0,
			callback: (v) => {
				$shdw.root(this)!.querySelector('span')!.textContent = String(v);
			},
		});
	}
}

$define('my-counter', Counter);
\`\`\`

## Concepts (the magical naming guide)

- **Familiar** — a witch's animal companion. The base custom-element class
  Coven provides. It has a signal and three lifecycle hooks
  (`setup`, `connected`, `disconnected`).
- **Grimoire** — a witch's spellbook. Per-element (and per-class)
  symbol-keyed storage. Coven uses it as the audit log: every active
  hex shows up as a slot.
- **Hex** — a binding that hides convenience work. Hexes write to the
  grimoire so their effect is visible and auditable.
- **Charm** — a small helper that does one thing transparently. Touches
  no grimoire.
- **\`$bewitch\`** — casts the spell that makes an element ready for
  hexes. Binds (or adopts) an AbortSignal.
- **\`$scry\`** — to scry is to observe by magical means from afar; here,
  IntersectionObserver.
- **\`$shdw\`**, **\`$mut\`** — abbreviated names for high-frequency
  calls (shadow DOM, MutationObserver).

## If you've used Svelte runes…

The `$rune.subMethod()` shape is the inspiration. Coven hexes are
runtime functions, not compiler primitives, but the mental model is the
same.

| Svelte rune      | Coven analogue                             |
| ---------------- | ------------------------------------------ |
| `$state(value)`  | `$prop(el, { name, value })`               |
| `$derived(expr)` | (compute in `connected()` from `$prop`)    |
| `$effect(fn)`    | `$on(el, ...)` / signal abort listeners    |
| `$bindable()`    | `$attr(el, { name, value })`               |

## API at a glance

| Export       | Kind  | What it does                                                |
| ------------ | ----- | ----------------------------------------------------------- |
| `Familiar`   | class | Base custom-element with lifecycle hooks and a signal.      |
| `grimoire`   | fn    | Per-element symbol-keyed storage; `.shared` is class-level. |
| `$bewitch`   | hex   | Binds an AbortSignal to an element.                         |
| `$attr`      | hex   | Two-way property↔attribute binding.                         |
| `$prop`      | hex   | Defines a get/set property with optional change callback.   |
| `$mut`       | hex   | Wraps MutationObserver.                                     |
| `$scry`      | hex   | Wraps IntersectionObserver.                                 |
| `$shdw`      | hex   | Attaches & populates a shadow root; tracks `[part]` values. |
| `$template`  | hex   | Cached \`<template>\` factory, shared per class.            |
| `$assert`    | charm | Throws a CovenError on a falsey condition.                  |
| `$define`    | charm | Idempotent `customElements.define`.                         |
| `$emit`      | charm | Dispatches an event named for the element's tag.            |
| `$error`     | charm | Throws a CovenError with `[tagname]:` prefix.               |
| `$on`        | charm | Adds an event listener bound to the element's signal.       |

## Guides

- [Naming and etymology](docs/naming.md)
- [Familiar lifecycle](docs/familiar-lifecycle.md)
- [Writing a hex](docs/writing-a-hex.md)
- [Writing a charm](docs/writing-a-charm.md)
- [The grimoire and the coven](docs/grimoire-and-coven.md)
- [Progressive enhancement](docs/progressive-enhancement.md)
- [Exportparts propagation](docs/exportparts-propagation.md)

## License

Apache-2.0. See [LICENSE](LICENSE).
```

(Note: the backslash-escaped code fences in the snippet above are the literal characters in the file; ensure the final README has normal triple-backticks.)

- [ ] **Step 2: Verify formatting**

Run: `deno task fmt --check README.md`
Expected: No diff.

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "Add README with quick-start and concept guide"
```

---

### Task 28: Write `docs/` long-form guides

**Files:**
- Create: `docs/naming.md`
- Create: `docs/familiar-lifecycle.md`
- Create: `docs/writing-a-hex.md`
- Create: `docs/writing-a-charm.md`
- Create: `docs/grimoire-and-coven.md`
- Create: `docs/progressive-enhancement.md`
- Create: `docs/exportparts-propagation.md`

- [ ] **Step 1: Write `docs/naming.md`**

```markdown
# Naming and etymology

Every name in Coven is chosen so the metaphor and the mechanism point
in the same direction. This guide walks through each piece.

## The big concepts

**Coven** — a community of witches who share rituals and lore.
In the library this lends its name to two things: the project as a
whole, and the `grimoire.shared(element, type)` accessor (the slot the
whole "coven" of instances of the same class share).

**Familiar** — a witch's animal companion, magically bound to her. In
the library, a `Familiar` is the canonical custom-element base class:
it carries an AbortSignal (the binding) and three lifecycle hooks.

**Grimoire** — a witch's spellbook. In the library, the grimoire is the
per-element (and per-class) storage hooks read and write. Reading the
grimoire is the canonical way to audit what magic is active on an
element.

## Hexes vs. charms

A **hex** is a binding that hides convenience work — say, two-way
attribute reflection, an observer, or a signal. Hexes always write to
the grimoire; that's how the audit works.

A **charm** is a small helper that does one thing transparently. Charms
touch no grimoire.

The naming itself is the test: a hex *does something to* an element
(binds it, observes it); a charm *helps you with* something (asserts,
throws, defines, emits).

## The hexes

- **`$attr`** — bind property ↔ attribute (the binding magic).
- **`$bewitch`** — cast Coven's spell on an element so it's ready for
  hexes (binds a signal).
- **`$mut`** — wrap MutationObserver. Short for "mutation."
- **`$prop`** — define an observable property.
- **`$scry`** — observe by magical means from afar. To scry is to peer
  into a crystal ball; here, it's `IntersectionObserver`.
- **`$shdw`** — attach and manage a shadow root. Short for "shadow."
- **`$template`** — cached `<template>` factory.

## The charms

- **`$assert`** — throw a `CovenError` on a falsey condition.
- **`$define`** — idempotent `customElements.define`.
- **`$emit`** — dispatch an event named for the tag.
- **`$error`** — throw a `CovenError`.
- **`$on`** — add an event listener bound to the element's signal.

## Abbreviations

A few names are shortened (`$mut`, `$shdw`) because they're called
often. The full meaning lives in the JSDoc and here.

## Inspiration

The `$rune.subMethod()` shape is borrowed from Svelte 5's runes. Coven
hexes are runtime functions instead of compiler primitives, but the
shape is intentionally the same — Svelte devs should recognize the
ergonomics.
```

- [ ] **Step 2: Write `docs/familiar-lifecycle.md`**

```markdown
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
```

- [ ] **Step 3: Write `docs/writing-a-hex.md`**

```markdown
# Writing a hex

A hex is a binding that:

1. Takes an element as its first argument.
2. Calls `$bewitch(element)` (explicitly or transitively).
3. Stores per-element state in the grimoire under a private symbol.
4. Registers any cleanup on the element's signal.
5. Optionally exposes read-only sub-methods.

## Skeleton

\`\`\`ts
import { $bewitch } from './$bewitch.ts';
import { grimoire, type GrimoireElement } from '../grimoire.ts';

const $MY_HEX_GRIMOIRE_SYMBOL = Symbol('$myHex');

type $MyHexGrimoire = {
	values?: Set<string>;
};

/**
 * One-line description of what this hex does.
 *
 * @param element - The element to apply the hex to.
 * @param config  - Hex configuration.
 */
export function $myHex(element: HTMLElement, config: { name: string }): void {
	const signal = $bewitch(element);
	const store = grimoire<$MyHexGrimoire>(
		element as GrimoireElement,
		$MY_HEX_GRIMOIRE_SYMBOL,
	);
	store.values ??= new Set();
	store.values.add(config.name);

	signal.addEventListener('abort', () => {
		store.values?.delete(config.name);
	}, { once: true });
}

/**
 * Read the names tracked by $myHex.
 */
$myHex.list = (element: HTMLElement): string[] => [
	...(grimoire<$MyHexGrimoire>(
		element as GrimoireElement,
		$MY_HEX_GRIMOIRE_SYMBOL,
	).values ?? new Set<string>()),
];

export default $myHex;
\`\`\`

## Sub-method conventions

- The main call does the side effect.
- Sub-methods read state or expose internals (no side effects).
- Names: `list`, `signal`, `abort`, `renew`, `observer`, `observers`,
  `parts`, `root`, `cache`, `clone`, `propagate`.

## Class-level state

If your hex needs state shared across every instance of the same class
(e.g. a template cache), use `grimoire.shared(element, type)` instead
of `grimoire(element, type)`.

## Don't write a hex if…

…the function has no per-element state and doesn't subscribe to
anything cleanup-worthy. That's a charm; see [Writing a charm](writing-a-charm.md).
```

- [ ] **Step 4: Write `docs/writing-a-charm.md`**

```markdown
# Writing a charm

A charm is a small helper that:

- Takes the element it operates on as the first argument (for symmetry).
- Has no per-element state.
- Does not write to the grimoire.

## Skeleton

\`\`\`ts
/**
 * Throws a friendly error if condition is falsey.
 *
 * @param element - The element to scope the error to.
 * @param condition - The truthy value to assert.
 * @param message - The message to throw.
 */
export function $myCharm(
	element: HTMLElement,
	condition: unknown,
	message: string,
): asserts condition {
	if (!condition) {
		throw new Error(\`[\${element.tagName.toLowerCase()}]: \${message}\`);
	}
}

export default $myCharm;
\`\`\`

## When a charm should become a hex

If you find yourself adding any of these to your charm, it's a hex:

- A subscription you need to clean up later.
- A piece of state you want a sibling hex to read.
- An idempotency cache.

## Charms that use signals

A charm can still call `$bewitch(element)` to get a signal (`$on` does
this). It just doesn't store anything in the grimoire of its own.
```

- [ ] **Step 5: Write `docs/grimoire-and-coven.md`**

```markdown
# The grimoire and the coven

The grimoire is per-element symbol-keyed storage. Every hex owns a
symbol and stores its state under that symbol. Reading the grimoire is
the canonical way to audit what magic is active.

\`\`\`ts
import { grimoire } from '@joeleisner/coven';

// Symbols of every active hex on this element:
Object.getOwnPropertySymbols(grimoire(el));
\`\`\`

## Instance vs. shared

- **`grimoire(element)`** / **`grimoire(element, type)`** — per-element
  storage. Each instance has its own.
- **`grimoire.shared(element, type)`** — per-constructor storage. Every
  instance of the same class sees the same slot. Used by `$template`
  to cache parsed templates once per custom-element class.

## Debugging with the grimoire

Dump the grimoire to see which hexes have touched an element:

\`\`\`ts
console.log(grimoire(el));
// → { Symbol($bewitch): { signal, controller },
//     Symbol($shdw): { parts: Set(3) { 'header', ... } },
//     Symbol($attr): { names: Set(2) { 'mode', 'disabled' } },
//     ... }
\`\`\`

If you see a hex you didn't expect, something invoked it. If you don't
see one you expect, the call didn't reach the hex.
```

- [ ] **Step 6: Write `docs/progressive-enhancement.md`**

```markdown
# Progressive enhancement

Coven hexes work on any `HTMLElement`. You don't need to extend
`Familiar`. This means you can adopt Coven one helper at a time inside
an existing component library.

## The bewitch pattern

For any element you want to apply hexes to, call `$bewitch` first
(implicitly via any other hex, or explicitly to make the intent clear):

\`\`\`ts
import { $bewitch, $on, $attr } from '@joeleisner/coven';

const card = document.querySelector('.card')!;
$bewitch(card);

$on(card, { type: 'click', callback: () => { /* … */ } });
$attr(card, { name: 'expanded', value: false });
\`\`\`

Every other hex (`$attr`, `$on`, etc.) will auto-`$bewitch` if you
haven't already. Calling `$bewitch` explicitly is a documentation
gesture more than a requirement.

## Adopting an external signal

If you already manage an `AbortController` for the element's lifecycle,
pass its signal to `$bewitch` so Coven adopts it:

\`\`\`ts
const ctrl = new AbortController();
$bewitch(card, ctrl.signal);
// later:
ctrl.abort();
\`\`\`

`$bewitch.abort(card)` is a no-op for adopted signals — only the owner
of the controller should abort it.

## Cleanup when you don't have a Familiar

If you bewitched explicitly (no external signal), call
`$bewitch.abort(element)` when you're done with the element. Otherwise
the signal stays open and its listeners stay alive.
```

- [ ] **Step 7: Write `docs/exportparts-propagation.md`**

```markdown
# Exportparts propagation

`$shdw` tracks every `[part]` value inside the shadow root and
auto-propagates them to the enclosing shadow host as `exportparts`. The
propagation cascades multiple shadow boundaries.

## How it works

1. After attaching the shadow, `$shdw` walks `[part]` and stores the
   set in the grimoire (under `Symbol($shdw)`).
2. A `$mut` subscription on the shadow root keeps the set fresh as
   children are added.
3. After the microtask boundary, `$shdw` looks at
   `element.getRootNode()`. If it's a `ShadowRoot`, it merges the
   tracked parts into the host's `exportparts` attribute.

Because the host's own `$shdw` runs the same logic, parts cascade all
the way up.

## Reading the parts

\`\`\`ts
const parts = $shdw.parts(element); // ReadonlySet<string> | undefined
\`\`\`

## Manual propagation

If you mutate the shadow imperatively outside the `$mut` subscription's
view (rare), trigger propagation manually:

\`\`\`ts
$shdw.propagate(element);
\`\`\`

## Opting out

Currently there's no opt-out — every `$shdw`-using element propagates.
If you need that, file an issue describing the use case.
```

- [ ] **Step 8: Verify formatting**

Run: `deno task fmt --check docs/`
Expected: No diff. If diffs appear, run `deno task fmt docs/`.

- [ ] **Step 9: Commit**

```bash
git add docs/naming.md docs/familiar-lifecycle.md docs/writing-a-hex.md docs/writing-a-charm.md docs/grimoire-and-coven.md docs/progressive-enhancement.md docs/exportparts-propagation.md
git commit -m "Add long-form concept guides under docs/"
```

---

## Phase G — CI and publish

### Task 29: Add CI workflow

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Write the workflow**

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: denoland/setup-deno@v2
        with:
          deno-version: v2.x
      - run: deno task fmt --check
      - run: deno task lint
      - run: deno task check
      - run: deno task test
      - run: deno task publish:dry
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "Add CI workflow: fmt, lint, check, test, publish:dry"
```

---

### Task 30: Add publish workflow

**Files:**
- Create: `.github/workflows/publish.yml`

- [ ] **Step 1: Write the workflow**

```yaml
name: Publish

on:
  push:
    tags:
      - 'v*'

permissions:
  contents: read
  id-token: write   # required for JSR OIDC

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: denoland/setup-deno@v2
        with:
          deno-version: v2.x
      - name: Verify tag matches deno.json version
        run: |
          tag="${GITHUB_REF_NAME#v}"
          version=$(deno eval 'console.log(JSON.parse(Deno.readTextFileSync("deno.json")).version)')
          if [ "$tag" != "$version" ]; then
            echo "Tag $GITHUB_REF_NAME does not match deno.json version $version"
            exit 1
          fi
      - run: deno publish
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/publish.yml
git commit -m "Add publish workflow (JSR via GitHub OIDC on tag push)"
```

---

### Task 31: Final pre-publish gates

**Files:**
- (no file changes; verification only)

- [ ] **Step 1: Format**

Run: `deno task fmt`
Expected: Any reformatting applied; review the diff.

If anything changed, commit:

```bash
git add -A
git commit -m "Apply deno fmt"
```

- [ ] **Step 2: Lint**

Run: `deno task lint`
Expected: No warnings.

- [ ] **Step 3: Check types**

Run: `deno task check`
Expected: No errors.

- [ ] **Step 4: Run tests**

Run: `deno task test`
Expected: All green.

- [ ] **Step 5: Publish dry-run**

Run: `deno task publish:dry`
Expected: JSR-side validation passes. If "slow type" diagnostics appear, sweep `src/` and add explicit return types to the named symbols, then re-run. Common offenders: `$emit`, `$on`, sub-methods on hexes.

If diagnostics need code changes:

```bash
git add -A
git commit -m "Add explicit return types to satisfy JSR slow-type check"
```

- [ ] **Step 6: Inventory of what JSR will ship**

The dry-run prints the file list. Sanity-check: no `*.test.ts`, no
`_examples/`, no `_test/`, no `vite.config.ts`, no `index.html`.

- [ ] **Step 7: Stop and hand off**

At this point the conversion is complete. The remaining steps are
manual user actions (not steps for the engineer executing this plan):

1. Push the branch and tag (`git push && git push --tags`).
2. Create `github.com/joeleisner/coven` on GitHub; add the remote and
   push.
3. On jsr.io, create `@joeleisner/coven` and link it to the GitHub
   repo (one-time, manual; enables OIDC publishing).
4. Tag `v0.1.0` to trigger the publish workflow.

Do not run `git push`, create the repo, or tag a release as part of
executing this plan — those steps are the project owner's call.
