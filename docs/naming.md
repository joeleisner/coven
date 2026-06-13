# Naming and etymology

Every name in Coven is chosen so the metaphor and the mechanism point
in the same direction. This guide walks through each piece.

## The big concepts

**Coven**: a community of witches who share rituals and lore.
In the library this lends its name to two things: the project as a
whole, and the `grimoire.shared(element, type)` accessor (the slot the
whole "coven" of instances of the same class share).

**Familiar**: a witch's animal companion, magically bound to her. In
the library, a `Familiar` is the canonical custom-element base class:
it carries an AbortSignal (the binding) and three lifecycle hooks.

**Grimoire**: a witch's spellbook. In the library, the grimoire is the
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

- **`$attr`**: bind property ↔ attribute (the binding magic).
- **`$bewitch`**: cast Coven's spell on an element so it's ready for
  hexes (binds a signal).
- **`$mut`**: wrap MutationObserver. Short for "mutation."
- **`$on`**: type-safe addEventListener, auto-wired to the element's
  signal.
- **`$prop`**: define an observable property.
- **`$scry`**: observe by magical means from afar. To scry is to peer
  into a crystal ball; here, it's `IntersectionObserver`.
- **`$shdw`**: attach and manage a shadow root. Short for "shadow."
- **`$soul`**: full connected/disconnected lifecycle for plain elements.
  Like a Familiar's lifecycle, but for any HTMLElement.
- **`$template`**: cached `<template>` factory, shared per class.

## The charms

- **`$assert`**: throw a `CovenError` on a falsey condition.
- **`$define`**: idempotent `customElements.define`.
- **`$emit`**: dispatch an event named for the tag. Pass `name` to
  emit `tag:name` events.
- **`$error`**: throw a `CovenError`.
- **`$on`**: type-safe wrapper around `addEventListener`. Accepts an
  optional signal for cleanup.
- **`$shdw`**: bare shadow attachment. No parts tracking, no grimoire
  writes.
- **`$template`**: bare `<template>` factory. No caching, no grimoire
  writes.
- **`$wake`**: run a callback when the DOM is ready (deferred if still
  loading, immediate otherwise).

## Twin pairs

`$on`, `$shdw`, and `$template` exist in both namespaces under the
same name. The hex version layers signal management and grimoire state
on top of the charm. Pick one or the other for a given element — use
the charm when you're managing the signal yourself, the hex when you
want Coven to handle it.

`$wake` and `$soul` are not twins. `$wake` (charm) defers a single
callback until the DOM is ready. `$soul` (hex) wraps `$wake` and adds a
full connected/disconnected lifecycle.

## Abbreviations

A few names are shortened (`$mut`, `$shdw`) because they're called
often. The full meaning lives in the JSDoc and here.

## Inspiration

The `$rune.subMethod()` shape is borrowed from Svelte 5's runes. Coven
hexes are runtime functions instead of compiler primitives, but the
shape is intentionally the same — Svelte devs should recognize the
ergonomics.
