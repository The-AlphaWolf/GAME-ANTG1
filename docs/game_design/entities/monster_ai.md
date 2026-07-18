# Monster AI and Boss Mechanics

## 1. Purpose
Define the behavior, threat level, and tactical patterns of hostile entities in the Survival Road World.

## 2. Responsibilities
- Dictate monster aggression and targeting logic.
- Define boss phase transitions and unique mechanics.
- Govern monster waves after the Novice Period ends.

## 3. Monster Archetypes
- **Swarmers**: Low health, high agility. Attack in packs. Target the player's vehicle tires or try to surround.
- **Brutes**: High health, high damage, slow. Susceptible to kiting.
- **Ranged/Artillery**: Attack from a distance (e.g., acid spitters). Target the vehicle's windows or armor.
- **Stalkers**: Invisible or camouflaged. Wait for the player to leave the vehicle. High critical damage.

## 4. Monster Waves (Post-Day 7)
- After the Novice Period, the road becomes highly hostile.
- Every few days (or based on Danger Level), a wave of monsters will actively hunt the player's vehicle.
- The player must decide to outrun them (Fuel check) or fight them (Ammo/Durability check).

## 5. Boss Mechanics
- Bosses are massive, complex entities that guard Orange/Purple/Black chests or dimensional rifts.
- **Multi-Phase**: Bosses change behavior at 50% and 25% Health.
- **Environmental Interaction**: Bosses can destroy cover, alter the weather (e.g., summoning a Sandstorm), or disable vehicle components (e.g., EMP blasts).
- **Immunity**: Bosses cannot be one-shot. They have hard caps on maximum damage taken per turn to prevent cheese tactics.

## 6. Edge Cases
- **Vehicle as a Weapon**: If the player rams a boss with the vehicle, the damage calculated must factor in vehicle mass, speed, and front-armor rarity. The vehicle must also take proportional recoil damage.
- **Fleeing a Boss**: Fleeing a boss encounter usually results in the boss pursuing the vehicle until a certain distance is reached.

## 7. Dependencies
- Relies on: `combat_system`, `vehicle_core`, `time_weather`.

## 8. AI Considerations
- The AI Prompt must vividly describe the grotesque or terrifying nature of the monsters.
- Boss attacks must be telegraphed in the text (e.g., "The Behemoth inhales deeply, its chest glowing red...") giving the player one turn to react.
