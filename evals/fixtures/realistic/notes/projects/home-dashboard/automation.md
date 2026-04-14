# Home Dashboard — Automations

Home Assistant automations, ordered by how much I'd miss them.

## Daily

- **Morning routine** (7am weekdays) — kitchen lights warm-white, coffee maker on, dashboard shows full brightness, music starts low
- **Evening wind-down** (9pm) — hallway lights to amber, bedroom warm dim, block bright phone notifications
- **Goodnight** (motion trigger in bedroom after 10pm) — all other rooms off, dashboard off

## Conditional

- **Sunrise / sunset triggers** — outdoor lights, not time-based, tracks seasons
- **Away mode** (no phones on network for 30+ min) — turn off lights, set thermostat back 2°, start a random-light-on schedule
- **Someone home** — reverse of the above, ramp temp before arrival based on GPS

## Safety

- **Leak detected** — shut off water valve, send push notification, flash kitchen lights red
- **Smoke/CO** — turn all lights on full, unlock doors, send push + SMS
- **Door unlocked > 10 min** — notify
- **Long-absence checks** — water leak sensors are worthless if you're gone a week and not looking at phone

## Entertainment

- **Movie mode** — dim living room to 10%, close blinds, volume up
- **Party mode** — colored lights, music louder, dashboard off
- **Reading** — single lamp on, everything else off

## Principles

- **No cascades** — automations should do one thing, reliably
- **Manual override always wins** — if I flip a switch, the automation doesn't re-trigger for X minutes
- **Fail silent** — if a device is offline, skip it, don't error
- **Local first** — automations run on HA even when internet is down

## What I removed

- Voice control of automations (unreliable, confusing for guests)
- Notification-heavy automations (I stopped reading them)
- Time-of-day automations based on clock, not sun position — seasonal drift is real
