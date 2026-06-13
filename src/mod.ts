/**
 * @module
 * Coven's primary entrypoint. Exports {@link Familiar} (the base
 * custom-element class), {@link grimoire} (per-element and per-class
 * symbol-keyed storage), and the {@link hexes} and {@link charms} namespaces.
 */
export { Familiar } from './familiar.ts';
export { grimoire } from './grimoire.ts';
export * as hexes from './hexes/mod.ts';
export * as charms from './charms/mod.ts';
