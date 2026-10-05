// front-matter.ts — colophon/front-matter heading classifier (REQ-562).
//
// The Convert workflow (§6.2) must not carry front matter into Discovery. This
// helper is the shared, tested predicate: conversion/extraction tooling imports
// it so the exclusion is one implementation, not per-pipeline regexes.

// Role/surname stems match as prefixes (no trailing \b) so "Acknowledgments",
// "Illustrator", and "Editorial" classify; concrete nouns that would collide
// with ruleset vocabulary (e.g. "cover fire") are omitted.
const COLOPHON_RE = /\b(?:editor|artist|typography|printing|copyright|credits?|dedication|acknowledg|illustrat|writer|designer|layout|isbn|staff|palladium books|siembieda|marciniszyn|wujcik|vancleave)/i;

/** True when a heading belongs to front matter or a colophon and MUST NOT be
 *  indexed as ruleset content. */
export function isColophonHeading(heading: string): boolean {
  return COLOPHON_RE.test(String(heading).replace(/[*_#]/g, ""));
}
