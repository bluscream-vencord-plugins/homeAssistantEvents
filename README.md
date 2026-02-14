# HomeAssistant Events Plugin

Send Discord events to HomeAssistant for automation and monitoring.

## Features

- **39 granular event toggles** - Control exactly which events to track (self/others/mentions/same channel)
- **Dual mode support** - Use webhooks, API, or both simultaneously
- **Native CORS bypass** - Desktop version bypasses CORS restrictions
- **Mention detection** - Separate toggle for when you get @mentioned
- **Voice channel awareness** - Track only your current voice channel
- **Automatic redaction** - Sensitive credentials never sent in events
- **Complete event data** - All JSON-serializable Discord event properties included
- **Zero overhead** - No performance impact when not configured

## Quick Start

### Method 1: Webhook (Recommended)

1. Add to HomeAssistant `configuration.yaml`:

   ```yaml
   automation:
     - alias: "Discord Events"
       trigger:
         - platform: webhook
           webhook_id: YOUR_UNIQUE_ID
       action:
         - event: discord_event
           event_data:
             event_type: "{{ trigger.json.event_type }}"
             data: "{{ trigger.json }}"
   ```

2. In Discord plugin settings:
   - Webhook URL: `http://homeassistant.local:8123/api/webhook/YOUR_UNIQUE_ID`
   - Enable desired event types

### Method 2: API with Token

1. Create Long-Lived Access Token in HomeAssistant (Profile → Long-Lived Access Tokens)

2. In Discord plugin settings:
   - Event URL: `http://homeassistant.local:8123/api/events/discord`
   - Bearer Token: (paste your token)
   - Enable desired event types

## Event Types

### Messages

- `message_create` - Message sent (toggles: self/others/mentions)
- `message_update` - Message edited (toggles: self/others)
- `message_delete` - Message deleted

### Voice

- `voice_channel_join/leave/move` - Voice activity (toggles: self/same channel/others)
- `audio_toggle_mute/deaf` - Audio settings changed

### Other

- Channel selection, guild join/leave, friend events, typing, presence, calls, streaming
- See plugin settings for complete list (39 toggles total)

## Event Data Fields

All events include:

- `event_type` - Type of event
- `now` - ISO timestamp
- `discord_user` / `discord_user_id` - Your Discord info
- `is_self` - Boolean indicating if it's your action
- Event-specific fields (channel names, user info, etc.)
- Complete raw Discord event data (serialized)

### Special Fields

- **Mentions**: `is_mentioned`, `mention_everyone`, `mentions_count`
- **Voice**: `is_in_my_channel`, `my_channel_id`
- **Redacted**: `bearerToken`, `webhookUrl` → `[REDACTED]`

## Automation Examples

### Notification on Mention

```yaml
trigger:
  - platform: event
    event_type: discord
    event_data:
      event_type: message_create
      is_mentioned: true
action:
  - service: notify.notify
    data:
      message: "{{ trigger.event.data.author_name }} mentioned you"
```

### Someone Joins Your Voice Channel

```yaml
trigger:
  - platform: event
    event_type: discord
    event_data:
      event_type: voice_channel_join
      is_in_my_channel: true
      is_self: false
action:
  - service: notify.notify
    data:
      message: "{{ trigger.event.data.user_name }} joined"
```







## Installation 

### 🪄 Installation Wizard
The easiest way to install this plugin is to use the **[Plugin Installer Generator](https://bluscream-vencord-plugins.github.io)**. 
Simply select this plugin from the list and download your custom install script.

### 💻 Manual Installation (PowerShell)
Alternatively, you can run this snippet in your Equicord/Vencord source directory:
```powershell
$ErrorActionPreference = "Stop"
winget install -e --id Git.Git
winget install -e --id OpenJS.NodeJS
npm install -g pnpm
git clone https://github.com/Equicord/Equicord Equicord
New-Item -ItemType Directory -Force -Path "Equicord\src\userplugins" | Out-Null
git clone https://github.com/bluscream-vencord-plugins/blu-homeassistant-events.git -b "main" "Equicord\src\userplugins\blu-homeassistant-events"
cd "Equicord"
npm install -g pnpm
pnpm install --frozen-lockfile
pnpm build
pnpm buildWeb
pnpm inject
```
