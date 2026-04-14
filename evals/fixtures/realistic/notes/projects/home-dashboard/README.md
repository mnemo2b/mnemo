# Home Dashboard

Single screen for the things I care about at home: temperature, lights, music, weather, calendar. Running on a Raspberry Pi in the kitchen.

## Philosophy

- **Glanceable** — every element must be readable from across the room
- **Silent** — no notifications, no animation, no sound by default
- **Reliable** — if the network's down, show yesterday's data, not an error
- **Tactile** — prefer physical buttons where possible (volume knob, light switch)

## What's on the screen

- Date + time (big, center)
- Weather (today + 3 days)
- Next 3 calendar events
- Music "now playing"
- Living room temp + humidity (with history graph)
- Any active timers (kitchen, laundry)

## What's NOT on the screen

- Notifications from anything
- Social feeds
- News
- Email
- Work anything

## Hardware

- Raspberry Pi 4 + 10" HDMI display
- Physical kiosk mount (wood frame, matte finish)
- Motion sensor — screen dims after 30s of no movement

## Stack

- Svelte frontend (static, served locally)
- Small Node.js backend for sensor polling and API aggregation
- Home Assistant as the source of truth for all devices
- Mosquitto (MQTT) for sensor → HA → dashboard

## Status

- Basic layout: done
- Weather + calendar: done
- Temperature + humidity: done
- Music: in progress (Spotify + local Plex)
- Motion dim: done
