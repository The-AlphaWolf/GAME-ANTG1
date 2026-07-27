# ANTG1

A full-stack browser survival RPG. A thousand miles of Highway 17 stand between you
and the evac port at Vantage. Drive, scavenge, fight, trade, and outlast the Convoy.

Next.js 16 · React 19 · Prisma · Postgres (Neon) · Auth.js · Tailwind 4

## Getting started

```bash
npm install
```

Copy `.env.example` to `.env` and set `DATABASE_URL` (and `DIRECT_URL` if you are on
a pooled Postgres such as Neon), then push the schema:

```bash
npm run db:push
```

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and register a survivor.

## Scripts

| Command           | What it does                           |
| ----------------- | -------------------------------------- |
| `npm run dev`     | Dev server                             |
| `npm run build`   | `prisma generate` + production build   |
| `npm test`        | Vitest suite                           |
| `npm run lint`    | ESLint                                 |
| `npm run db:push` | Sync the Prisma schema to the database |
| `npm run db:seed` | Seed a demo player                     |

## How the game works

**The loop.** Drive east to cover miles, or scavenge where you are. Both cost a
resource and advance the world clock. Driving burns fuel and can turn up loot, a
sealed cache, an NPC, or a fight; scavenging costs energy and is loot-heavier.

**Progression.** Everything that costs a turn pays XP. Levelling raises max HP,
grants a skill point and EC, and heals you to full. Enemy pools, loot quality and
shop stock all scale with the chapter you have reached.

**Survival.** Hunger, thirst and fatigue rise each turn and only bite once a stat
goes critical (85+), where it starts draining HP. Weather changes how fast you get
thirsty and how much fuel you burn.

**Story.** Five chapters, gated on mileage, with a named cast — Wren, Boone, Doc
Marlow, Tick, Sister Ada, Kestrel — and Marshal Vane running the Convoy that owns
the road. NPCs broadcast on the world radio, answer when you talk to them, and can
be met on the road, where they remember you through an affinity score.

**SSS Talent.** Push any item or vehicle component up the rarity ladder. Costs
daily charges plus EC, and the cost climbs with the tier. Items can be upgraded
repeatedly, all the way to Mythical.

## Layout

```
src/lib/game/   Rules and content: items, enemies, loot, quests, story, NPCs,
                progression, world clock. Pure functions, no I/O.
src/actions/    Server actions. All state changes run in a transaction.
src/components/ HUD, panels and station drawers.
prisma/         Schema and seed.
__tests__/      Vitest — action guards plus content-integrity checks that fail
                if a quest, recipe or drop references content that does not exist.
```
