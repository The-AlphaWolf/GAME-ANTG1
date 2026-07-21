# Handoff: Game mechanics rebalance + core-loop/state fixes

**Source:** AI council (agent mode + debate) — antigravity (architecture), copilot (performance), antigravity-as-devil (openai quota-failed). Both real vendors high-confidence, strong agreement.
**Goal:** lower difficulty (reported far too high), fix state-management race, remove core-loop dead ends, add a real storyline arc.
**Status:** analysis done, nothing implemented yet. This file is the work order.

---

## TL;DR — do these, in this order

1. **Auto-equip the starter chest weapon** (biggest single difficulty fix).
2. **Rebalance enemies + encounter rates** (numbers below).
3. **Playtest.** Then add heal-on-win + softer respawn.
4. **Audit survival-stat attrition** (Hunger/Thirst/Fatigue/Sanity) — may be a _second, independent_ death source; don't assume combat math is the only cause.
5. **Fix the read-then-write race** (concurrency).
6. **Perf:** narrow revalidation, denormalize weapon stat, add indexes.
7. **Core loop:** turn `submitAction` free-text into a real parser.
8. **Storyline:** add a win condition + distance-banded acts.
9. **Guard economy** before loosening costs+bounty+penalty together.

---

## 1. Difficulty rebalance (STAGED — do not apply all at once)

Root cause: chest `Improvised Weapon` is granted but **not equipped**, so lvl-1 damage = `10 + level + 0` = **11**. Highway Raider has up to 50 hp and hits 8/turn → ~5 turns, ~40 dmg/fight, no heal between fights, no HP regen → death by 3rd encounter.

### Stage A — ship first, playtest before Stage B

| Change                           | File                            | Current           | New                                                       |
| -------------------------------- | ------------------------------- | ----------------- | --------------------------------------------------------- |
| Auto-equip chest weapon on grant | `src/lib/game/starter-chest.ts` | `equipSlot` unset | set `equipSlot: 'WEAPON'` on the Improvised Weapon insert |

Effect: lvl-1 damage 11 → **26** (`10 + 1 + 15*rarityMult`), Raider kill 5 turns → ~2.

### Stage B — enemy + rate rebalance

| Knob                   | File                                    | Current                 | New (consensus)         |
| ---------------------- | --------------------------------------- | ----------------------- | ----------------------- |
| Highway Raider HP      | `src/actions/exploration.ts`            | `35 + rand(15)` (35-50) | `20 + rand(11)` (20-30) |
| Highway Raider attack  | `exploration.ts`                        | 8                       | 5                       |
| Feral Scavenger HP     | `exploration.ts`                        | `25 + rand(10)` (25-35) | `15 + rand(8)` (15-22)  |
| Feral Scavenger attack | `exploration.ts`                        | 6                       | 3                       |
| Explore combat chance  | `exploration.ts`                        | 15% (`>=0.85`)          | 8% (`>=0.92`)           |
| Explore loot chance    | `exploration.ts`                        | 40%                     | ~50% (`>=0.42`)         |
| Scavenge combat chance | `exploration.ts`                        | 10% (`>=0.9`)           | 6% (`>=0.94`)           |
| Explore fuel cost      | `exploration.ts` `FUEL_COST`            | 5                       | 3                       |
| Scavenge energy cost   | `exploration.ts` `SCAVENGE_ENERGY_COST` | 5                       | 3                       |

### Stage C — combat forgiveness (after playtesting A+B; avoid over-correcting)

| Knob                | File                    | Current                    | New                                                                                       |
| ------------------- | ----------------------- | -------------------------- | ----------------------------------------------------------------------------------------- |
| DEFEND damage taken | `src/actions/combat.ts` | `max(0, enemyAttack - 15)` | `max(1, floor(enemyAttack * 0.4))` — old formula → 0 once attack is 5                     |
| FLEE success        | `combat.ts`             | 50% (`>0.5`)               | 65% (`>0.35`)                                                                             |
| FLEE fail damage    | `combat.ts`             | `floor(enemyAttack * 1.2)` | `floor(enemyAttack * 0.7)`                                                                |
| Heal-on-win         | `combat.ts`             | none                       | `+10% max HP` on victory (event-based, NOT passive — respects design doc "no auto-regen") |
| Win bounty          | `combat.ts`             | 15-25 EC                   | 20-35 EC                                                                                  |

### Stage D — death loop

| Knob                  | File                              | Current | New                     |
| --------------------- | --------------------------------- | ------- | ----------------------- |
| Respawn health/energy | `src/actions/game.ts` `respawn()` | 50 / 50 | 70 / 70                 |
| Respawn credit loss   | `game.ts`                         | 50%     | 20-25%, keep min 100 EC |

> **Devil's-advocate warning:** applying A+B+C+D together may over-correct to trivially easy. Playtest between A+B and C+D.

---

## 2. Survival-stat attrition (audit BEFORE trusting the combat rebalance)

Devil lens flagged: combat math may not be the real killer. Hunger/Thirst/Fatigue/Sanity debuffs stacking on top of **no HP regen** could kill players independently.

Action:

- Trace where Hunger/Thirst/Fatigue/Sanity actually drain (grep the actions + any tick logic). Design doc `docs/game_design/core/player_stats.md` says Thirst<30 and Hunger<20 debuff, Sanity 0 = narrator deceives, simultaneous Hunger+Thirst 0 stacks HP-drain multipliers.
- If drain is fast with no recovery path, that's a separate difficulty source. Consider: passive `+2% max HP per explore` **gated on Hunger>80 & Thirst>80** (ties healing to survival management, keeps tension).

---

## 3. State-management / concurrency fix

**Problem:** every action does `prisma.player.findUnique(...)` **outside** the transaction, then mutates. Two in-flight actions (double-click Explore/Attack) both read the same state and write conflicting results → lost updates: double-attack, energy-cost bypass, surviving a lethal sequence. EventLog is write-only ("CQRS-lite / worst-of-both-worlds event sourcing") — never replayed, so drift is permanent.

**Fix (consensus: prefer optimistic for this low-concurrency single-player loop):**

- Add `version Int @default(0)` to `Player`.
- Add `actionId` (uuid) per client action + unique `(playerId, actionId)` on `EventLog` for idempotency vs Server-Action double-submit/retry.
- Do read + conditional write in ONE `prisma.$transaction`:

```ts
await prisma.$transaction(async (tx) => {
  const p = await tx.player.findUnique({
    where: { username },
    select: {
      id: true,
      version: true,
      energy: true,
      health: true,
      isAlive: true,
    },
  });
  const updated = await tx.player.updateMany({
    where: {
      id: p.id,
      version: p.version,
      isAlive: true,
      energy: { gte: cost },
    },
    data: { energy: { decrement: cost }, version: { increment: 1 } },
  });
  if (updated.count === 0)
    throw new Error('Conflict or insufficient resources');
  await tx.eventLog.create({
    data: { playerId: p.id, actionId, eventType: 'PLAYER_ACTION', payload },
  });
});
```

- Escalate to pessimistic `SELECT ... FOR UPDATE` ONLY if real contention shows up.
- **Migration/backfill:** add `version`/`actionId`/`equippedWeaponId` columns with defaults for existing Player rows (no provider covered this — do not forget it).

---

## 4. Performance / bottlenecks

- Replace `revalidatePath('/')` (purges + re-renders whole tree per click) with narrow `revalidateTag` / targeted path, or return updated state as JSON from the action and update client via `useState` for transient combat/scavenge turns.
- Denormalize equipped-weapon stats onto `Player` (`equippedWeaponDamage`, `equippedWeaponRarityMult`) updated only on equip/unequip → kills per-turn O(N) inventory scan.
- Use column-scoped `select` instead of wide `include`.
- Indexes: `ActiveEncounter(playerId)`, `PlayerInventory(playerId, equipSlot)`, `EventLog(playerId, createdAt DESC)`.

---

## 5. Core-loop: kill the free-text dead end

`submitAction` currently drains 2 energy and echoes "It echoes into the void." — pure negative. Replace with an intent parser:

- Verbs: `rest`/`sleep`, `repair`/`fix` (spend 3 Scrap → +15 vehicle condition), `eat`, `drink`, `use`, `equip`, `inspect`, `siphon fuel`.
- Unknown input: low-risk narrative roll (~40% lore/clue, ~40% flavor no-op, ~20% minor resource) with **0-1 energy** drain, not a flat penalty.
- `rest` example: +25 energy, +10 sanity at cost of hunger/thirst, only if Hunger>30 & Thirst>30.

---

## 6. Storyline arc

Both vendors independently proposed the same shape: give the endless grind a **destination + distance-banded acts, scaling by band not RNG spikes**.

- **Win condition:** reach a safe haven at ~1,000 miles ("The Horizon" evac port / "Sector 7 – Last Oasis" / "Haven-9") before a soft doom-timer (ash-storm / Redline Storm) — resting/stalling costs sanity+health.
- **4 zones / 3 acts**, boss or choice milestone every ~250 miles (e.g. Toll Bridge boss, military-outpost choice, Raider ambush, final gate). Enemy tier scales by distance band.
- **Ending server action** at mile 1000 + leaderboard (remaining credits/time/health).
- Hallucination/unreliable-narrator hook already in design doc for low Sanity — wire it into Zone 4 isolation.

---

## 7. Economy guard (no provider covered this)

Lowering fuel+energy costs, raising bounties, AND cheapening death **together** may collapse the EC sink and trivialize shop markup (2x) → currency inflation. Re-check EC balance after the rebalance; re-tune `ITEM_PRICES` / `SHOP_MARKUP` in `src/lib/game/economy.ts` if needed.

---

## Open questions for the implementer

- Confirm the exact survival-stat drain rates before committing to passive heal.
- Decide optimistic vs pessimistic lock after checking real concurrency.
- Stage the difficulty changes — playtest gates between A+B and C+D.

Full verbatim council responses: `.claude/council-cache/council-agents-1784620745.md`
