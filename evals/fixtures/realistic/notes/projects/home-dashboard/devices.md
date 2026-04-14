# Home Dashboard — Devices

Current device inventory and integration notes.

## Sensors

- **Aqara temp/humidity** (living room, bedroom, office) — Zigbee via Home Assistant
- **Shelly water leak** (kitchen, bathroom, basement) — Wi-Fi, MQTT
- **Nest Protect** (smoke + CO) — cloud only, but reliable
- **Eufy motion** (entryway, garage) — local only, RTSP

## Switches + outlets

- **Shelly 1** (light switches, 4 of them) — Wi-Fi, MQTT, relay-only
- **TP-Link Kasa** (smart outlets, 3) — local API, LAN
- **Lutron Caséta** (dimmers, 2) — hub required but rock-solid

## Lights

- **Hue** (hub + bulbs) — local API works, cloud works, API is stable
- **Wyze bulbs** — replaced; unreliable and phone-home

## Media

- **Plex server** (NAS) — music, movies
- **Spotify Connect** — living room speaker
- **Apple TV** — routed through HomeKit + HA

## Integration pattern

All of this ends up in Home Assistant. HA publishes state to MQTT. Dashboard subscribes to MQTT topics.

Why not talk to devices directly:
- Too many protocols (Zigbee, Z-Wave, Wi-Fi, cloud APIs)
- HA handles reconnects, polling, fallbacks
- Single source of truth for automations

## Avoided

- Matter (still flaky in 2025, despite promises)
- Cloud-only devices (Ring, Nest thermostat) — outages break house
- Alexa / Google as primary control (voice is flaky + privacy cost)

## Debugging notes

- Zigbee network map updates after changes — check for weak signal nodes
- MQTT retained messages cause stale state after reboot; use explicit clears
- HA recorder keeps ~10 days by default; tune to what you actually review
