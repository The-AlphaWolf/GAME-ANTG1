# Time and Weather System

## 1. Purpose
Control the flow of time and dynamically alter the world environment, affecting visibility, player stats, vehicle handling, and monster behavior.

## 2. Responsibilities
- Maintain the global game clock.
- Generate and manage weather states.
- Apply temperature and weather debuffs/buffs to the player and vehicle.
- Trigger time-based events (e.g., Novice Period ending after Day 7).

## 3. Global Clock
- **Start Time**: Day 1, 06:00 AM.
- **Time Scale**: Game time progresses only when the player takes meaningful actions, makes choices, or explicitly waits/travels. Time does not progress idly while waiting for user input.
- **Novice Period**: Days 1 through 7. Player is isolated. Monsters cannot damage the player if they are interacting with Novice chests.
- **Midnight Reset**: At 00:00 every day, daily limits reset (e.g., the 6 charges of the SSS Mythical Upgrade Talent).

## 4. Weather States & Effects
Weather is generated based on the current biome and danger level.
- **Clear**: Baseline. No modifiers.
- **Rain**: Lowers visibility. Extinguishes small fires. Increases vehicle slip (handling penalty).
- **Acid Rain**: Damages exposed player health and unarmored vehicle chassis. Drains Sanity.
- **Sandstorm**: Severely limits visibility to near zero. Radar sensors malfunction. Moving outside the vehicle drains health.
- **Extreme Heat**: Rapidly increases Thirst drain. Vehicle engine may overheat if pushed.
- **Freezing**: Rapidly increases Energy drain. Sleeping outside causes Health damage.
- **Blood Moon** (Special Event): Monster spawn rate increases by 300%. Monsters gain +1 Rarity tier stats.

## 5. Temperature
- Tracked globally and locally (e.g., inside the vehicle vs outside).
- If internal vehicle AC (from evolution tree) is active, player is immune to outside temperature while inside.

## 6. AI & Narration Considerations
- The AI Narrator must explicitly describe the weather and lighting in every scene.
- Prompt modules should adjust tone based on time: 12:00 PM is descriptive and clear; 03:00 AM is tense and shadowed.

## 7. Edge Cases
- **Time Skips**: When traveling long distances, time must advance correctly, applying Thirst/Hunger/Fatigue drains proportionally. If stats drop to critical levels during travel, the travel must be interrupted with a warning event.
- **Conflicting Weather**: Weather transitions must make sense (e.g., no instant jump from Sandstorm to Blizzard unless explained by a dimensional anomaly).

## 8. Persistence Requirements
- Save `CurrentDay`, `CurrentTime` (HH:MM), `CurrentWeather`, and `CurrentTemperature`.
- Time must never move backwards.
