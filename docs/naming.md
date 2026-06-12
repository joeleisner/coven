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
- **`$on`** — type-safe wrapper around `addEventListener`. Accepts an
  optional signal for cleanup.

## Abbreviations

A few names are shortened (`$mut`, `$shdw`) because they're called
often. The full meaning lives in the JSDoc and here.

## Inspiration

The `$rune.subMethod()` shape is borrowed from Svelte 5's runes. Coven
hexes are runtime functions instead of compiler primitives, but the
shape is intentionally the same — Svelte devs should recognize the
ergonomics.
