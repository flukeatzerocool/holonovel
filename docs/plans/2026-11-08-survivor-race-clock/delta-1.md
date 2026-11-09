# Delta 1 — Survivor race clock

Delta amendment under `build-review` §0 (execution discipline). Raised before
the first source edit, from evidence gathered while reading the target code.

## What changed against `plan.md` revision 2

**Δ1 — D2, the mirror's discriminator.** The plan said the mirror carries
`type: "faction"`. `Countdown.type` is a closed union
(`"round" | "narrative"`, `holonovel/src/core/state.ts:211`); adding a third
value is a persisted-discriminator change with no reader that needs it. The
`fast_forward` loop is the only path that decrements every `narrative`
countdown and deletes at zero (`holonovel/src/index.ts:6012-6019`). Revised: the
mirror keeps `type: "narrative"`, `on_scene_transition: false` keeps the
transition loop away, and the `fast_forward` loop skips
`cd.clock_type === "faction"`. No persisted enum widens; D10's no-op guarantee
still holds and T269 still asserts it.

**Δ2 — D6, the Player projection shape.** The plan said `{ id, name,
territory }`. `manage_faction (action: list)` already projects a Player row as
`{ id, name, description }` (`holonovel/src/index.ts:7022`), and `territory`
names rooms the Player may not have visited. Revised: `{ id, name, description }`
everywhere, so the resource and the tool agree and no unvisited room name leaks.

**Δ3 — D6, the leak has a third surface.** The non-detail `list` branch returns
the generic summary `["id", "name", "status"]` plus a description preview
(`holonovel/src/core/enumeration.ts:25`), for both badges — so `status` (the
goal text the fill rotates) reaches a Player there even after the detail branch
and the resources are filtered. Revised: `manage_faction (action: list)` applies
the same Player projection in both branches. This is inside R4's class, not new
scope.

## Not changed

The mechanism (D2's one-writer helper), fill semantics (D3), the descriptive
starter (D1), the spec clause (D8), `fast_forward` no-op (D10), and every
verification step.

## Evidence for the delta

- `grep -n "interface Countdown" -A 22 holonovel/src/core/state.ts` → line 211
  is `type: "round" | "narrative";` and line 214 is `clock_type?` with
  `"faction"` already among its values.
- `sed -n '6008,6040p' holonovel/src/index.ts` → the `fast_forward` loop
  decrements every `narrative` countdown and deletes it at zero.
- `sed -n '7020,7027p' holonovel/src/index.ts` → the Player detail projection is
  `{ id, name, description }`.
- `holonovel/src/core/enumeration.ts:25` → the faction summary fields are
  `["id", "name", "status"]`.
