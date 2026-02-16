import { definePluginSettings } from "@api/Settings";
import { OptionType } from "@utils/types";

export const settings = definePluginSettings({
    eventUrl: {
        type: OptionType.STRING,
        description: "HomeAssistant Event URL (e.g., http://homeassistant.local:8123/api/events/discord)",
        placeholder: "http://homeassistant.local:8123/api/events/discord",
        default: "",
        restartNeeded: false,
    },
    bearerToken: {
        type: OptionType.STRING,
        description: "HomeAssistant Bearer Token (required for Event URL method, leave empty for webhook)",
        placeholder: "Your long-lived access token",
        default: "",
        restartNeeded: false,
    },
    webhookUrl: {
        type: OptionType.STRING,
        description: "HomeAssistant Webhook URL (alternative to Event URL + Token, e.g., https://homeassistant.local:8123/api/webhook/YOUR_WEBHOOK_ID)",
        placeholder: "https://homeassistant.local:8123/api/webhook/YOUR_WEBHOOK_ID",
        default: "",
        restartNeeded: false,
    },
    // Message Events
    event_MESSAGE_CREATE_self: {
        type: OptionType.BOOLEAN,
        description: "Send events when YOU send messages",
        default: true,
        restartNeeded: false,
    },
    event_MESSAGE_CREATE_others: {
        type: OptionType.BOOLEAN,
        description: "Send events when OTHERS send messages",
        default: false,
        restartNeeded: false,
    },
    event_MESSAGE_CREATE_mention: {
        type: OptionType.BOOLEAN,
        description: "Send events when YOU get mentioned/pinged in a message",
        default: true,
        restartNeeded: false,
    },
    event_MESSAGE_UPDATE_self: {
        type: OptionType.BOOLEAN,
        description: "Send events when YOU edit messages",
        default: true,
        restartNeeded: false,
    },
    event_MESSAGE_UPDATE_others: {
        type: OptionType.BOOLEAN,
        description: "Send events when OTHERS edit messages",
        default: false,
        restartNeeded: false,
    },
    event_MESSAGE_DELETE: {
        type: OptionType.BOOLEAN,
        description: "Send message delete events (can't filter by user)",
        default: false,
        restartNeeded: false,
    },

    // Voice Events
    event_VOICE_STATE_UPDATES_self: {
        type: OptionType.BOOLEAN,
        description: "Send events when YOU join/leave/move voice channels",
        default: true,
        restartNeeded: false,
    },
    event_VOICE_STATE_UPDATES_sameChannel: {
        type: OptionType.BOOLEAN,
        description: "Send events when OTHERS join/leave/move in YOUR current voice channel",
        default: true,
        restartNeeded: false,
    },
    event_VOICE_STATE_UPDATES_others: {
        type: OptionType.BOOLEAN,
        description: "Send events when OTHERS join/leave/move in OTHER voice channels (not yours)",
        default: false,
        restartNeeded: false,
    },
    event_AUDIO_TOGGLE_SELF_MUTE: {
        type: OptionType.BOOLEAN,
        description: "Send events when YOU mute/unmute (self only)",
        default: true,
        restartNeeded: false,
    },
    event_AUDIO_TOGGLE_SELF_DEAF: {
        type: OptionType.BOOLEAN,
        description: "Send events when YOU deafen/undeafen (self only)",
        default: true,
        restartNeeded: false,
    },

    // Channel Events
    event_CHANNEL_SELECT: {
        type: OptionType.BOOLEAN,
        description: "Send events when YOU select channels (self only)",
        default: true,
        restartNeeded: false,
    },
    event_CHANNEL_CREATE: {
        type: OptionType.BOOLEAN,
        description: "Send channel create events",
        default: true,
        restartNeeded: false,
    },
    event_CHANNEL_DELETE: {
        type: OptionType.BOOLEAN,
        description: "Send channel delete events",
        default: true,
        restartNeeded: false,
    },

    // Guild Events
    event_GUILD_CREATE: {
        type: OptionType.BOOLEAN,
        description: "Send events when joining guilds/servers (self only)",
        default: true,
        restartNeeded: false,
    },
    event_GUILD_DELETE: {
        type: OptionType.BOOLEAN,
        description: "Send events when leaving guilds/servers (self only)",
        default: true,
        restartNeeded: false,
    },
    event_GUILD_SELECT: {
        type: OptionType.BOOLEAN,
        description: "Send events when YOU select guilds/servers (self only)",
        default: false,
        restartNeeded: false,
    },

    // Relationship Events
    event_RELATIONSHIP_ADD: {
        type: OptionType.BOOLEAN,
        description: "Send friend add events (self only)",
        default: true,
        restartNeeded: false,
    },
    event_RELATIONSHIP_REMOVE: {
        type: OptionType.BOOLEAN,
        description: "Send friend remove events (self only)",
        default: true,
        restartNeeded: false,
    },
    event_RELATIONSHIP_UPDATE: {
        type: OptionType.BOOLEAN,
        description: "Send relationship update events (self only)",
        default: true,
        restartNeeded: false,
    },

    // Connection Events
    event_CONNECTION_OPEN: {
        type: OptionType.BOOLEAN,
        description: "Send Discord connection open events (self only)",
        default: true,
        restartNeeded: false,
    },
    event_CONNECTION_CLOSED: {
        type: OptionType.BOOLEAN,
        description: "Send Discord connection closed events (self only)",
        default: true,
        restartNeeded: false,
    },

    // Typing Events
    event_TYPING_START_self: {
        type: OptionType.BOOLEAN,
        description: "Send events when YOU start typing",
        default: false,
        restartNeeded: false,
    },
    event_TYPING_START_others: {
        type: OptionType.BOOLEAN,
        description: "Send events when OTHERS start typing",
        default: false,
        restartNeeded: false,
    },

    // Presence Events
    event_PRESENCE_UPDATE_self: {
        type: OptionType.BOOLEAN,
        description: "Send events when YOUR status changes",
        default: false,
        restartNeeded: false,
    },
    event_PRESENCE_UPDATE_others: {
        type: OptionType.BOOLEAN,
        description: "Send events when OTHERS' status changes",
        default: false,
        restartNeeded: false,
    },

    // Call Events
    event_CALL_UPDATE_self: {
        type: OptionType.BOOLEAN,
        description: "Send events for calls YOU are involved in",
        default: true,
        restartNeeded: false,
    },
    event_CALL_UPDATE_others: {
        type: OptionType.BOOLEAN,
        description: "Send events for calls involving OTHERS",
        default: false,
        restartNeeded: false,
    },

    // Stream Events
    event_STREAM_CREATE: {
        type: OptionType.BOOLEAN,
        description: "Send stream start events (self only)",
        default: true,
        restartNeeded: false,
    },
    event_STREAM_DELETE: {
        type: OptionType.BOOLEAN,
        description: "Send stream stop events (self only)",
        default: true,
        restartNeeded: false,
    },

    // Message Action Events
    event_onBeforeMessageSend: {
        type: OptionType.BOOLEAN,
        description: "Send events before YOU send messages (self only)",
        default: false,
        restartNeeded: false,
    },
    event_onBeforeMessageEdit: {
        type: OptionType.BOOLEAN,
        description: "Send events before YOU edit messages (self only)",
        default: false,
        restartNeeded: false,
    },
    event_onMessageClick_self: {
        type: OptionType.BOOLEAN,
        description: "Send events when YOU click on YOUR messages",
        default: false,
        restartNeeded: false,
    },
    event_onMessageClick_others: {
        type: OptionType.BOOLEAN,
        description: "Send events when YOU click on OTHERS' messages",
        default: false,
        restartNeeded: false,
    },

    // Plugin Lifecycle Events
    event_PLUGIN_START: {
        type: OptionType.BOOLEAN,
        description: "Send event when plugin starts (includes full config)",
        default: true,
        restartNeeded: false,
    },
    event_PLUGIN_STOP: {
        type: OptionType.BOOLEAN,
        description: "Send event when plugin stops",
        default: true,
        restartNeeded: false,
    },

    logEvents: {
        type: OptionType.BOOLEAN,
        description: "Log events to console for debugging",
        default: false,
        restartNeeded: false,
    },
    redactSensitiveData: {
        type: OptionType.BOOLEAN,
        description: "Redact bearer token and webhook URL in sent events (replaces with [REDACTED])",
        default: true,
        restartNeeded: false,
    },
});
