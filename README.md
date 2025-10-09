# HomeAssistant Events Plugin

Send Discord events to HomeAssistant for automation and monitoring.

## Features

This plugin monitors various Discord events and sends them to your HomeAssistant instance via **webhooks** or the **REST API**. This allows you to:

-   Trigger automations when you join/leave voice channels
-   Track when you send/receive messages
-   Monitor your Discord status and presence
-   Create notifications based on Discord activity
-   And much more!

## Performance & Compatibility

**Zero Overhead When Not Configured**: If you haven't configured the plugin (no URL or Bearer Token), it uses virtually no resources. All event handlers immediately return without processing, ensuring zero performance impact on Discord.

Once configured, the plugin efficiently processes and sends events only when enabled event types occur.

**Desktop vs Web**:

-   **Desktop (Equicord/Vencord Desktop)**: Uses native module that **bypasses CORS** - no CORS configuration needed!
-   **Web (Browser)**: Uses browser fetch API - **CORS configuration required** in HomeAssistant (see troubleshooting section)

## Setup

You can configure this plugin using **either** the API method (with Bearer Token) **or** the Webhook method, **or BOTH simultaneously**. Choose the approach that works best for you:

**Note**: If you configure both methods, events will be sent to both endpoints in parallel. This is useful for:

-   Redundancy (backup to multiple HomeAssistant instances)
-   Different processing (webhook for some automations, API events for others)
-   Testing (compare webhook vs API behavior)

### Method 1: Webhook (Simpler, Recommended)

**Pros**: No authentication token needed, simpler setup, more secure (webhook ID acts as authentication)  
**Cons**: Can only POST data, not fire events directly

#### Steps:

1. Open your HomeAssistant `configuration.yaml`
2. Add a webhook automation trigger:
    ```yaml
    automation:
        - alias: "Discord Events Webhook"
          trigger:
              - platform: webhook
                webhook_id: YOUR_UNIQUE_WEBHOOK_ID
          action:
              - event: discord_event
                event_data:
                    event_type: "{{ trigger.json.event_type }}"
                    data: "{{ trigger.json }}"
    ```
3. Restart HomeAssistant
4. In Equicord settings, navigate to Plugins → HomeAssistantEvents
5. Enter your Webhook URL: `https://homeassistant.local:8123/api/webhook/YOUR_UNIQUE_WEBHOOK_ID`
6. Enable/disable event types as needed

### Method 2: API with Bearer Token (Advanced)

**Pros**: Directly creates events in HomeAssistant  
**Cons**: Requires managing access tokens

#### Steps:

1. Get a Long-Lived Access Token from HomeAssistant:

    - Open your HomeAssistant instance
    - Go to your Profile (click your username in the bottom left)
    - Scroll down to "Long-Lived Access Tokens"
    - Click "Create Token"
    - Give it a name like "Discord Events"
    - Copy the token (you won't be able to see it again!)

2. Configure the Plugin:
    - Open Equicord/Vencord settings
    - Navigate to Plugins → HomeAssistantEvents
    - Enter your complete Event URL (e.g., `http://homeassistant.local:8123/api/events/discord`)
        - The event name is part of the URL (e.g., `/api/events/discord` where "discord" is the event name)
    - Paste your Bearer Token
    - Enable/disable event types as needed

### Using Both Methods Simultaneously

You can configure **both** the Event URL (with Bearer Token) **and** the Webhook URL at the same time. When both are configured:

-   Events are sent to **both endpoints in parallel**
-   Each endpoint receives identical event data
-   Failures on one endpoint don't affect the other
-   Useful for redundancy or sending to multiple HomeAssistant instances

### General Configuration

1. (Optional) Toggle "Only send events that directly affect the current user" (enabled by default)
    - When enabled: Only sends events about YOUR actions (your messages, voice state, etc.)
    - When disabled: Sends events about all messages and activities you see
2. Enable/disable specific event types as needed

## Event Types

The plugin can send the following events:

### Message Events

-   `message_create` - When a message is sent
-   Separate toggles for: YOUR messages, OTHERS' messages, and messages that MENTION you
-   Includes `is_mentioned`, `mention_everyone`, `mentions_count` fields
-   `message_update` - When a message is edited
-   `message_delete` - When a message is deleted

### Voice Events

-   `voice_channel_join` - When a user joins a voice channel
-   `voice_channel_leave` - When a user leaves a voice channel
-   `voice_channel_move` - When a user moves to a different voice channel
-   `audio_toggle_mute` - When you mute/unmute (always current user only)
-   `audio_toggle_deaf` - When you deafen/undeafen (always current user only)

**Voice Event Filtering**:

-   `event_VOICE_STATE_UPDATES_self`: YOUR voice state changes
-   `event_VOICE_STATE_UPDATES_sameChannel`: Users in YOUR current voice channel (enabled by default!) ⭐
-   `event_VOICE_STATE_UPDATES_others`: All other voice channels

Voice events include: `user_name`, `user_global_name`, `is_self`, `is_in_my_channel`, and `my_channel_id` fields.

### Channel Events

-   `channel_select` - When you switch to a different channel

### Guild (Server) Events

-   `guild_join` - When you join a new server
-   `guild_leave` - When you leave a server

### Relationship Events

-   `friend_add` - When you add a friend or receive a friend request
-   `friend_remove` - When you remove a friend or they remove you

### Connection Events

-   `discord_connected` - When Discord connects
-   `discord_disconnected` - When Discord disconnects

### Call Events

-   `call_update` - When a call is updated (incoming calls, etc.)

### Streaming Events

-   `stream_start` - When you or someone starts streaming
-   `stream_stop` - When you or someone stops streaming

### Guild Selection Events

-   `guild_select` - When you switch to a different server (disabled by default)

### Channel Creation/Deletion Events

-   `channel_create` - When a channel is created
-   `channel_delete` - When a channel is deleted

### Relationship Update Events

-   `relationship_update` - When a friend's details change (name, etc.)

### Message Action Events (Non-Flux Hooks)

-   `before_message_send` - When you're about to send a message (fires before the message is sent)
-   `before_message_edit` - When you're about to edit a message (fires before the edit is saved)
-   `message_click` - When you click on a message (includes double-click, shift-click, ctrl-click detection)

### Other Events

-   `typing_start` - When you start typing (disabled by default)
-   `presence_update` - When your status changes (disabled by default)
-   `plugin_started` - When the plugin starts (includes full plugin config with sensitive data redacted)
-   `plugin_stopped` - When the plugin stops

## Event Data Structure

All events include the following base data:

```json
{
  "now": "2024-01-01T12:00:00.000Z",
  "pc": "Windows",
  "user": "YourUsername",
  "discord_user": "YourDiscordUsername",
  "discord_user_id": "123456789",
  "event_type": "message_create",
  ... additional event-specific data ...
  ... ALL raw event properties (JSON-serializable) ...
}
```

### Complete Event Data

**All JSON-serializable properties from the Discord flux event are automatically included** in the event data sent to HomeAssistant. This means you get:

-   All custom fields we've added (like `message_id`, `channel_name`, etc.)
-   All original event properties from Discord's flux events
-   Automatic filtering of non-serializable data (functions, circular references, etc.)

This gives you complete visibility into Discord events for advanced automation and debugging!

**Example**: A `MESSAGE_CREATE` event will include not just our custom fields like `message_id` and `channel_name`, but also all properties from Discord's original event like `message.content`, `message.timestamp`, `message.tts`, `message.mentions`, etc.

## HomeAssistant Automation Examples

### Example 1: Voice Channel Join Notification (API Method)

If you're using the API method with a Bearer Token:

```yaml
alias: Discord Voice Channel Join
description: Notify when joining a Discord voice channel
trigger:
    - platform: event
      event_type: discord # This matches the "Event name" setting
      event_data:
          event_type: voice_channel_join
condition: []
action:
    - service: notify.notify
      data:
          message: "You joined voice channel: {{ trigger.event.data.channel_name }}"
mode: single
```

### Example 2: Voice Channel Join Notification (Webhook Method)

If you're using the Webhook method, first set up the webhook automation as shown in the setup section, then create automations that listen to the `discord_event` event:

```yaml
alias: Discord Voice Channel Join (Webhook)
description: Notify when joining a Discord voice channel via webhook
trigger:
    - platform: event
      event_type: discord_event # Fired by the webhook automation
      event_data:
          event_type: voice_channel_join
condition: []
action:
    - service: notify.notify
      data:
          message: "You joined voice channel: {{ trigger.event.data.data.channel_name }}"
mode: single
```

### Example 3: Notification When You Get Mentioned

```yaml
alias: Discord Mention Notification
description: Send notification when you get mentioned/pinged in Discord
trigger:
    - platform: event
      event_type: discord # or discord_event for webhook
      event_data:
          event_type: message_create
          is_mentioned: true
action:
    - service: notify.notify
      data:
          title: "Discord Mention"
          message: "{{ trigger.event.data.author_name }} mentioned you in {{ trigger.event.data.channel_name }}"
          data:
              priority: high
mode: queued
max: 10
```

### Example 4: Notify When Someone Joins Your Voice Channel

```yaml
alias: Someone Joined My Voice Channel
description: Notify when someone joins your current voice channel
trigger:
    - platform: event
      event_type: discord # or discord_event for webhook
      event_data:
          event_type: voice_channel_join
          is_in_my_channel: true
          is_self: false
action:
    - service: notify.notify
      data:
          title: "Voice Channel"
          message: "{{ trigger.event.data.user_name }} joined your voice channel"
mode: queued
```

### Example 5: Track When You Start Typing

```yaml
alias: Discord Typing Started
description: Track when you start typing in Discord
trigger:
    - platform: event
      event_type: discord # or discord_event for webhook
      event_data:
          event_type: typing_start
          is_self: true
action:
    - service: input_boolean.turn_on
      target:
          entity_id: input_boolean.discord_typing
mode: restart
```

## Troubleshooting

### Events not being sent

#### For Webhook Method:

1. **CORS Configuration (Web Discord Only)**: If you're using Discord in a **web browser** and see "Failed to fetch" errors, you need to configure CORS in HomeAssistant.

    **Desktop users (Equicord/Vencord Desktop) can skip this step** - the native module bypasses CORS!

    For web users, add this to your `configuration.yaml`:

    ```yaml
    http:
        cors_allowed_origins:
            - https://discord.com
            - https://canary.discord.com
            - https://ptb.discord.com
        use_x_forwarded_for: true
        trusted_proxies:
            - 127.0.0.1
    ```

    Then restart HomeAssistant.

2. Verify your Webhook URL is correct and includes the webhook ID
3. Make sure the webhook automation is properly configured in HomeAssistant
4. Check HomeAssistant logs for webhook errors
5. Test the webhook manually with curl:
    ```bash
    curl -X POST https://homeassistant.local:8123/api/webhook/YOUR_WEBHOOK_ID \
      -H "Content-Type: application/json" \
      -d '{"test": "data"}'
    ```

**Note**: The "Failed to fetch" error only affects web Discord. **Desktop Discord (Equicord/Vencord Desktop) uses a native module that bypasses CORS entirely**, so no CORS configuration is needed!

#### For API Method:

1. Check that both Event URL and Bearer Token are configured correctly
2. Make sure your HomeAssistant is accessible from your device
3. Verify your Bearer Token is valid and hasn't expired
4. Ensure the event name in the URL (e.g., `/api/events/discord`) matches what you're listening for in automations
5. Check that the Event URL includes the full path: `http://YOUR_HASS/api/events/EVENT_NAME`

#### General:

1. Enable "Log events to console" in settings to see debug information
2. Check the browser console (Ctrl+Shift+I) for error messages
3. Verify the plugin is enabled and started

### Too many events

-   Disable event types you don't need in the plugin settings
-   Consider disabling "Typing Events" and "Presence Events" as they fire very frequently

## Granular Event Control

Each event type has its own individual toggle(s) for maximum control:

### Message Events with Mention Detection

The `MESSAGE_CREATE` event has **three separate toggles**:

-   **Send when YOU send messages** (`event_MESSAGE_CREATE_self`) - Default: **ON**
-   **Send when YOU get mentioned/pinged** (`event_MESSAGE_CREATE_mention`) - Default: **ON** ⭐
-   **Send when OTHERS send messages** (`event_MESSAGE_CREATE_others`) - Default: **OFF**

When you're mentioned, the event includes:

-   `is_mentioned: true` - You were mentioned
-   `mention_everyone: true/false` - Was it an @everyone/@here mention
-   `mentions_count: N` - Number of users mentioned

### Self vs Others Toggles

Events that can involve multiple users have separate `_self` and `_others` toggles:

| Event Type          | Self Toggle                      | Same Channel Toggle                        | Others Toggle                      | Default Self | Default Same | Default Others |
| ------------------- | -------------------------------- | ------------------------------------------ | ---------------------------------- | ------------ | ------------ | -------------- |
| Message Create      | `event_MESSAGE_CREATE_self`      | `event_MESSAGE_CREATE_mention`             | `event_MESSAGE_CREATE_others`      | ✅ ON        | ✅ ON        | ❌ OFF         |
| Message Update      | `event_MESSAGE_UPDATE_self`      | -                                          | `event_MESSAGE_UPDATE_others`      | ✅ ON        | -            | ❌ OFF         |
| Voice State Updates | `event_VOICE_STATE_UPDATES_self` | `event_VOICE_STATE_UPDATES_sameChannel` ⭐ | `event_VOICE_STATE_UPDATES_others` | ✅ ON        | ✅ ON        | ❌ OFF         |
| Typing Start        | `event_TYPING_START_self`        | -                                          | `event_TYPING_START_others`        | ❌ OFF       | -            | ❌ OFF         |
| Presence Update     | `event_PRESENCE_UPDATE_self`     | -                                          | `event_PRESENCE_UPDATE_others`     | ❌ OFF       | -            | ❌ OFF         |
| Call Update         | `event_CALL_UPDATE_self`         | -                                          | `event_CALL_UPDATE_others`         | ✅ ON        | -            | ❌ OFF         |
| Message Click       | `event_onMessageClick_self`      | -                                          | `event_onMessageClick_others`      | ❌ OFF       | -            | ❌ OFF         |

**Note**:

-   **Message Create "Same Channel"** toggle actually means "mentions" - when YOU get pinged
-   **Voice State Updates "Same Channel"** toggle tracks users in YOUR current voice channel ⭐

### Self-Only Events

These events only track your own actions (no `_others` toggle needed):

-   All guild events (join/leave/select)
-   All channel events (select/create/delete)
-   All relationship events (friend add/remove/update)
-   Connection events (open/closed)
-   Stream events (start/stop)
-   Message action events (before send/edit)
-   Plugin lifecycle events (start/stop)

All include an `is_self` field in the event data for consistency.

## Security & Privacy

### Sensitive Data Redaction

**By default**, the plugin automatically redacts sensitive information before sending events:

-   **Bearer Token field**: Any field named `bearerToken` is replaced with `[REDACTED]`
-   **Webhook URL field**: Any field named `webhookUrl` is replaced with `[REDACTED]`
-   **Bearer Token value**: Any string value that matches your configured bearer token is replaced with `[REDACTED]`
-   **Webhook URL value**: Any string value that matches your configured webhook URL is replaced with `[REDACTED]`

This comprehensive redaction prevents your authentication credentials from appearing **anywhere** in the event data sent to HomeAssistant, even if Discord includes them in event properties or if they appear in nested objects.

You can disable redaction in the plugin settings if needed (e.g., for debugging), but this is **not recommended** for production use.

### Privacy Note

This plugin sends event data to your HomeAssistant instance. Make sure you trust the connection and that your HomeAssistant is properly secured. Event data includes:

-   Discord usernames and IDs
-   Channel and server names
-   Timestamps and system information
-   Full plugin configuration (with sensitive fields redacted by default)

No message content is sent, only metadata about the events.

## Installation

1. Copy the `blu-homeassistant-events` folder to your Vencord `src/userplugins` directory
2. Rebuild Vencord: `pnpm run build`
3. Restart Discord
4. Enable the plugin in Vencord settings
5. Configure your HomeAssistant connection (Event URL + Token or Webhook URL)
6. Enable/disable specific event types as needed

## AI Disclaimer

This plugin was developed with the assistance of AI (Claude Sonnet 4.5). The AI helped with code structure, implementation details, and debugging. While the code has been reviewed and tested, please use it at your own discretion. If you encounter any issues, please report them through the GitHub issues page.

## Credits

Based on the PowerShell script example by Bluscream.
