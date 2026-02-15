export const pluginInfo = {
    id: "homeAssistantEvents",
    name: "HomeAssistantEvents",
    description: "Send Discord events to HomeAssistant for automation",
    color: "#00bcd4"
};

// Created at 2025-10-09 09:12:14
import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import { Logger } from "@utils/Logger";
import definePlugin, { OptionType, PluginNative } from "@utils/types";
import { ChannelStore, GuildStore, SelectedChannelStore, SelectedGuildStore, UserStore } from "@webpack/common";

const logger = new Logger(pluginInfo.name, pluginInfo.color);

const Native = VencordNative.pluginHelpers.HomeAssistantEvents as PluginNative<typeof import("./native")>;

const settings = definePluginSettings({
    eventUrl: {
        type: OptionType.STRING,
        description: "HomeAssistant Event URL (e.g., http://homeassistant.local:8123/api/events/discord)",
        placeholder: "http://homeassistant.local:8123/api/events/discord",
        default: "",
    },
    bearerToken: {
        type: OptionType.STRING,
        description: "HomeAssistant Bearer Token (required for Event URL method, leave empty for webhook)",
        placeholder: "Your long-lived access token",
        default: "",
    },
    webhookUrl: {
        type: OptionType.STRING,
        description: "HomeAssistant Webhook URL (alternative to Event URL + Token, e.g., https://homeassistant.local:8123/api/webhook/YOUR_WEBHOOK_ID)",
        placeholder: "https://homeassistant.local:8123/api/webhook/YOUR_WEBHOOK_ID",
        default: "",
    },
    // Message Events
    event_MESSAGE_CREATE_self: {
        type: OptionType.BOOLEAN,
        description: "Send events when YOU send messages",
        default: true,
    },
    event_MESSAGE_CREATE_others: {
        type: OptionType.BOOLEAN,
        description: "Send events when OTHERS send messages",
        default: false,
    },
    event_MESSAGE_CREATE_mention: {
        type: OptionType.BOOLEAN,
        description: "Send events when YOU get mentioned/pinged in a message",
        default: true,
    },
    event_MESSAGE_UPDATE_self: {
        type: OptionType.BOOLEAN,
        description: "Send events when YOU edit messages",
        default: true,
    },
    event_MESSAGE_UPDATE_others: {
        type: OptionType.BOOLEAN,
        description: "Send events when OTHERS edit messages",
        default: false,
    },
    event_MESSAGE_DELETE: {
        type: OptionType.BOOLEAN,
        description: "Send message delete events (can't filter by user)",
        default: false,
    },

    // Voice Events
    event_VOICE_STATE_UPDATES_self: {
        type: OptionType.BOOLEAN,
        description: "Send events when YOU join/leave/move voice channels",
        default: true,
    },
    event_VOICE_STATE_UPDATES_sameChannel: {
        type: OptionType.BOOLEAN,
        description: "Send events when OTHERS join/leave/move in YOUR current voice channel",
        default: true,
    },
    event_VOICE_STATE_UPDATES_others: {
        type: OptionType.BOOLEAN,
        description: "Send events when OTHERS join/leave/move in OTHER voice channels (not yours)",
        default: false,
    },
    event_AUDIO_TOGGLE_SELF_MUTE: {
        type: OptionType.BOOLEAN,
        description: "Send events when YOU mute/unmute (self only)",
        default: true,
    },
    event_AUDIO_TOGGLE_SELF_DEAF: {
        type: OptionType.BOOLEAN,
        description: "Send events when YOU deafen/undeafen (self only)",
        default: true,
    },

    // Channel Events
    event_CHANNEL_SELECT: {
        type: OptionType.BOOLEAN,
        description: "Send events when YOU select channels (self only)",
        default: true,
    },
    event_CHANNEL_CREATE: {
        type: OptionType.BOOLEAN,
        description: "Send channel create events",
        default: true,
    },
    event_CHANNEL_DELETE: {
        type: OptionType.BOOLEAN,
        description: "Send channel delete events",
        default: true,
    },

    // Guild Events
    event_GUILD_CREATE: {
        type: OptionType.BOOLEAN,
        description: "Send events when joining guilds/servers (self only)",
        default: true,
    },
    event_GUILD_DELETE: {
        type: OptionType.BOOLEAN,
        description: "Send events when leaving guilds/servers (self only)",
        default: true,
    },
    event_GUILD_SELECT: {
        type: OptionType.BOOLEAN,
        description: "Send events when YOU select guilds/servers (self only)",
        default: false,
    },

    // Relationship Events
    event_RELATIONSHIP_ADD: {
        type: OptionType.BOOLEAN,
        description: "Send friend add events (self only)",
        default: true,
    },
    event_RELATIONSHIP_REMOVE: {
        type: OptionType.BOOLEAN,
        description: "Send friend remove events (self only)",
        default: true,
    },
    event_RELATIONSHIP_UPDATE: {
        type: OptionType.BOOLEAN,
        description: "Send relationship update events (self only)",
        default: true,
    },

    // Connection Events
    event_CONNECTION_OPEN: {
        type: OptionType.BOOLEAN,
        description: "Send Discord connection open events (self only)",
        default: true,
    },
    event_CONNECTION_CLOSED: {
        type: OptionType.BOOLEAN,
        description: "Send Discord connection closed events (self only)",
        default: true,
    },

    // Typing Events
    event_TYPING_START_self: {
        type: OptionType.BOOLEAN,
        description: "Send events when YOU start typing",
        default: false,
    },
    event_TYPING_START_others: {
        type: OptionType.BOOLEAN,
        description: "Send events when OTHERS start typing",
        default: false,
    },

    // Presence Events
    event_PRESENCE_UPDATE_self: {
        type: OptionType.BOOLEAN,
        description: "Send events when YOUR status changes",
        default: false,
    },
    event_PRESENCE_UPDATE_others: {
        type: OptionType.BOOLEAN,
        description: "Send events when OTHERS' status changes",
        default: false,
    },

    // Call Events
    event_CALL_UPDATE_self: {
        type: OptionType.BOOLEAN,
        description: "Send events for calls YOU are involved in",
        default: true,
    },
    event_CALL_UPDATE_others: {
        type: OptionType.BOOLEAN,
        description: "Send events for calls involving OTHERS",
        default: false,
    },

    // Stream Events
    event_STREAM_CREATE: {
        type: OptionType.BOOLEAN,
        description: "Send stream start events (self only)",
        default: true,
    },
    event_STREAM_DELETE: {
        type: OptionType.BOOLEAN,
        description: "Send stream stop events (self only)",
        default: true,
    },

    // Message Action Events
    event_onBeforeMessageSend: {
        type: OptionType.BOOLEAN,
        description: "Send events before YOU send messages (self only)",
        default: false,
    },
    event_onBeforeMessageEdit: {
        type: OptionType.BOOLEAN,
        description: "Send events before YOU edit messages (self only)",
        default: false,
    },
    event_onMessageClick_self: {
        type: OptionType.BOOLEAN,
        description: "Send events when YOU click on YOUR messages",
        default: false,
    },
    event_onMessageClick_others: {
        type: OptionType.BOOLEAN,
        description: "Send events when YOU click on OTHERS' messages",
        default: false,
    },

    // Plugin Lifecycle Events
    event_PLUGIN_START: {
        type: OptionType.BOOLEAN,
        description: "Send event when plugin starts (includes full config)",
        default: true,
    },
    event_PLUGIN_STOP: {
        type: OptionType.BOOLEAN,
        description: "Send event when plugin stops",
        default: true,
    },

    logEvents: {
        type: OptionType.BOOLEAN,
        description: "Log events to console for debugging",
        default: false,
    },
    redactSensitiveData: {
        type: OptionType.BOOLEAN,
        description: "Redact bearer token and webhook URL in sent events (replaces with [REDACTED])",
        default: true,
    },
});

interface HomeAssistantEventData {
    now: string;
    pc: string;
    user: string;
    event_type: string;
    discord_user?: string;
    discord_user_id?: string;
    [key: string]: any;
}

/**
 * Check if the plugin is properly configured
 */
function isConfigured(): boolean {
    const hasWebhook = !!settings.store.webhookUrl?.trim();
    const hasApiAuth = !!(settings.store.eventUrl?.trim() && settings.store.bearerToken?.trim());
    return hasWebhook || hasApiAuth;
}

/**
 * Redact sensitive fields from settings (recursively handles nested objects)
 */
function redactSensitiveFields(obj: any): any {
    if (!settings.store.redactSensitiveData) {
        return obj;
    }

    if (obj === null || typeof obj !== 'object') {
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map(item => redactSensitiveFields(item));
    }

    const redacted: any = {};
    const sensitiveValues = [
        settings.store.bearerToken?.trim(),
        settings.store.webhookUrl?.trim()
    ].filter(v => v && v.length > 0);

    for (const key in obj) {
        if (!obj.hasOwnProperty(key)) continue;

        const value = obj[key];

        // Redact by field name
        if ((key === 'bearerToken' || key === 'webhookUrl') && typeof value === 'string' && value.trim()) {
            redacted[key] = '[REDACTED]';
        }
        // Redact if value matches any sensitive value
        else if (typeof value === 'string' && sensitiveValues.some(sensitive => value === sensitive)) {
            redacted[key] = '[REDACTED]';
        }
        // Recursively redact nested objects
        else if (typeof value === 'object' && value !== null) {
            redacted[key] = redactSensitiveFields(value);
        }
        // Keep other values as-is
        else {
            redacted[key] = value;
        }
    }

    return redacted;
}

/**
 * Safely serialize an object for JSON, filtering out non-serializable values
 * and preventing circular references
 */
function safeSerialize(obj: any, seen = new WeakSet()): any {
    // Handle primitives and null
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }

    // Handle arrays
    if (Array.isArray(obj)) {
        return obj.map(item => safeSerialize(item, seen));
    }

    // Detect circular references
    if (seen.has(obj)) {
        return '[Circular]';
    }
    seen.add(obj);

    // Handle objects
    const result: Record<string, any> = {};
    for (const key in obj) {
        if (!obj.hasOwnProperty(key)) continue;

        const value = obj[key];

        // Skip functions, symbols, and undefined
        if (typeof value === 'function' || typeof value === 'symbol' || value === undefined) {
            continue;
        }

        // Skip non-enumerable properties
        const descriptor = Object.getOwnPropertyDescriptor(obj, key);
        if (descriptor && !descriptor.enumerable) {
            continue;
        }

        try {
            result[key] = safeSerialize(value, seen);
        } catch (e) {
            // Skip properties that throw errors when accessed
            result[key] = '[Error accessing property]';
        }
    }

    return result;
}

async function sendHomeAssistantEvent(eventType: string, data: Record<string, any> = {}, rawEvent?: any) {
    const webhookUrl = settings.store.webhookUrl?.trim();
    const eventUrl = settings.store.eventUrl?.trim();
    const bearerToken = settings.store.bearerToken?.trim();

    // Determine which method to use: webhook (preferred) or API endpoint
    const useWebhook = !!webhookUrl;
    const useApi = !!(eventUrl && bearerToken);

    if (!useWebhook && !useApi) {
        if (settings.store.logEvents) {
            logger.debug("Neither Webhook URL nor Event URL credentials configured, skipping event");
        }
        return;
    }

    const currentUser = UserStore.getCurrentUser();

    // Serialize the raw event if provided
    const serializedRawEvent = rawEvent ? safeSerialize(rawEvent) : {};

    // Build event data and apply redaction
    let eventData: HomeAssistantEventData = {
        now: new Date().toISOString(),
        pc: typeof navigator !== "undefined" ? navigator.platform : "unknown",
        user: typeof process !== "undefined" && process.env?.USERNAME ? process.env.USERNAME : "discord-user",
        discord_user: currentUser?.username ?? "unknown",
        discord_user_id: currentUser?.id ?? "unknown",
        event_type: eventType,
        // Include all serialized event data first
        ...serializedRawEvent,
        // Then override with our custom data (so custom fields take precedence)
        ...data,
    };

    // Apply redaction to sensitive fields
    eventData = redactSensitiveFields(eventData);

    if (settings.store.logEvents) {
        const methods: string[] = [];
        if (useWebhook) methods.push('webhook');
        if (useApi) methods.push('API');
        logger.info(`Sending event: ${eventType} via ${methods.join(' and ')}`, eventData);
    }

    const sendPromises: Promise<void>[] = [];

    // Send to webhook if configured
    if (useWebhook) {
        const webhookPromise = (async () => {
            try {
                if (settings.store.logEvents) {
                    logger.debug(`Sending to webhook: ${webhookUrl}`);
                }

                const result = await Native.sendToHomeAssistant(webhookUrl!, null, eventData);

                if (!result.success) {
                    if (settings.store.logEvents) {
                        logger.error(`Failed to send event to HomeAssistant webhook: ${result.status} ${result.error || 'Unknown error'}`);
                    }
                } else if (settings.store.logEvents) {
                    logger.info(`Event sent successfully to webhook: ${eventType}`);
                }
            } catch (error) {
                if (settings.store.logEvents) {
                    logger.error(`Error sending event to HomeAssistant webhook (${webhookUrl}):`, error);
                }
            }
        })();
        sendPromises.push(webhookPromise);
    }

    // Send to API if configured
    if (useApi) {
        const apiPromise = (async () => {
            try {
                if (settings.store.logEvents) {
                    logger.debug(`Sending to API: ${eventUrl}`);
                }

                const result = await Native.sendToHomeAssistant(eventUrl!, bearerToken!, eventData);

                if (!result.success) {
                    if (settings.store.logEvents) {
                        logger.error(`Failed to send event to HomeAssistant API: ${result.status} ${result.error || 'Unknown error'}`);
                    }
                } else if (settings.store.logEvents) {
                    logger.info(`Event sent successfully to API: ${eventType}`);
                }
            } catch (error) {
                if (settings.store.logEvents) {
                    logger.error(`Error sending event to HomeAssistant API (${eventUrl}):`, error);
                }
            }
        })();
        sendPromises.push(apiPromise);
    }

    // Wait for all sends to complete
    await Promise.all(sendPromises);
}

export default definePlugin({
    name: "HomeAssistantEvents",
    description: "Send Discord events to HomeAssistant for automation",
    authors: [{name:"Bluscream",id:467777925790564352n},{name:"Cursor.AI",id:0n}],
    settings,

    flux: {
        // Message events
        async MESSAGE_CREATE(event: any) {
            if (!isConfigured()) return;

            const { message, optimistic } = event;
            if (optimistic) return; // Skip optimistic messages

            const currentUser = UserStore.getCurrentUser();
            const isSelf = message.author.id === currentUser.id;

            // Check if current user is mentioned
            const isMentioned = !isSelf && (
                message.mentions?.some((m: any) => m.id === currentUser.id) ||
                message.mention_everyone ||
                message.mention_roles?.length > 0
            );

            // Check if we should send this event based on toggles
            const shouldSend =
                (isSelf && settings.store.event_MESSAGE_CREATE_self) ||
                (!isSelf && isMentioned && settings.store.event_MESSAGE_CREATE_mention) ||
                (!isSelf && !isMentioned && settings.store.event_MESSAGE_CREATE_others);

            if (!shouldSend) return;

            const channel = ChannelStore.getChannel(message.channel_id);
            const guild = channel?.guild_id ? GuildStore.getGuild(channel.guild_id) : null;

            sendHomeAssistantEvent("message_create", {
                message_id: message.id,
                channel_id: message.channel_id,
                channel_name: channel?.name ?? "Unknown",
                channel_type: channel?.type,
                guild_id: guild?.id,
                guild_name: guild?.name,
                author_id: message.author.id,
                author_name: message.author.username,
                is_self: isSelf,
                is_mentioned: isMentioned,
                mention_everyone: message.mention_everyone ?? false,
                mentions_count: message.mentions?.length ?? 0,
                content_length: message.content?.length ?? 0,
                has_attachments: message.attachments?.length > 0,
                has_embeds: message.embeds?.length > 0,
            }, event);
        },

        async MESSAGE_UPDATE(event: any) {
            if (!isConfigured()) return;

            const { message } = event;
            const currentUser = UserStore.getCurrentUser();
            const isSelf = message.author?.id === currentUser.id;

            // Check if we should send this event based on self/others toggles
            if (isSelf && !settings.store.event_MESSAGE_UPDATE_self) return;
            if (!isSelf && !settings.store.event_MESSAGE_UPDATE_others) return;

            const channel = ChannelStore.getChannel(message.channel_id);

            sendHomeAssistantEvent("message_update", {
                message_id: message.id,
                channel_id: message.channel_id,
                channel_name: channel?.name ?? "Unknown",
                is_self: isSelf,
            }, event);
        },

        async MESSAGE_DELETE(event: any) {
            if (!isConfigured() || !settings.store.event_MESSAGE_DELETE) return;

            const { id, channelId } = event;
            const channel = ChannelStore.getChannel(channelId);

            sendHomeAssistantEvent("message_delete", {
                message_id: id,
                channel_id: channelId,
                channel_name: channel?.name ?? "Unknown",
            }, event);
        },

        // Voice state events
        async VOICE_STATE_UPDATES(event: any) {
            if (!isConfigured()) return;

            const { voiceStates } = event;
            const currentUser = UserStore.getCurrentUser();
            const myVoiceChannelId = SelectedChannelStore.getVoiceChannelId();

            for (const state of voiceStates) {
                const { userId, channelId, oldChannelId, sessionId, selfMute, selfDeaf } = state;
                const isSelf = userId === currentUser.id;

                // Determine if this user is in the same channel as the current user
                const isInMyChannel = !isSelf && myVoiceChannelId && (
                    channelId === myVoiceChannelId ||
                    oldChannelId === myVoiceChannelId
                );

                // Check if we should send this event based on self/sameChannel/others toggles
                if (isSelf && !settings.store.event_VOICE_STATE_UPDATES_self) continue;
                if (!isSelf && isInMyChannel && !settings.store.event_VOICE_STATE_UPDATES_sameChannel) continue;
                if (!isSelf && !isInMyChannel && !settings.store.event_VOICE_STATE_UPDATES_others) continue;

                const user = UserStore.getUser(userId);
                const channel = channelId ? ChannelStore.getChannel(channelId) : null;
                const oldChannel = oldChannelId ? ChannelStore.getChannel(oldChannelId) : null;
                const guild = channel?.guild_id ? GuildStore.getGuild(channel.guild_id) : null;

                let eventType = "voice_state_update";
                if (!oldChannelId && channelId) {
                    eventType = "voice_channel_join";
                } else if (oldChannelId && !channelId) {
                    eventType = "voice_channel_leave";
                } else if (oldChannelId && channelId && oldChannelId !== channelId) {
                    eventType = "voice_channel_move";
                }

                sendHomeAssistantEvent(eventType, {
                    user_id: userId,
                    user_name: user?.username,
                    user_global_name: user?.globalName,
                    is_self: isSelf,
                    is_in_my_channel: isInMyChannel,
                    my_channel_id: myVoiceChannelId,
                    channel_id: channelId,
                    channel_name: channel?.name,
                    old_channel_id: oldChannelId,
                    old_channel_name: oldChannel?.name,
                    guild_id: guild?.id,
                    guild_name: guild?.name,
                    self_mute: selfMute,
                    self_deaf: selfDeaf,
                    session_id: sessionId,
                }, state);
            }
        },

        // Channel selection
        async CHANNEL_SELECT(event: any) {
            if (!isConfigured() || !settings.store.event_CHANNEL_SELECT) return;

            const { channelId, guildId } = event;
            const channel = channelId ? ChannelStore.getChannel(channelId) : null;
            const guild = guildId ? GuildStore.getGuild(guildId) : null;

            sendHomeAssistantEvent("channel_select", {
                channel_id: channelId,
                channel_name: channel?.name,
                channel_type: channel?.type,
                guild_id: guildId,
                guild_name: guild?.name,
            }, event);
        },

        // Guild events
        async GUILD_CREATE(event: any) {
            if (!isConfigured() || !settings.store.event_GUILD_CREATE) return;

            const { guild } = event;

            sendHomeAssistantEvent("guild_join", {
                guild_id: guild.id,
                guild_name: guild.name,
                member_count: guild.memberCount,
                owner_id: guild.ownerId,
            }, event);
        },

        async GUILD_DELETE(event: any) {
            if (!isConfigured() || !settings.store.event_GUILD_DELETE) return;

            const { guild } = event;
            if (guild.unavailable) return; // Server temporarily unavailable, not removed

            sendHomeAssistantEvent("guild_leave", {
                guild_id: guild.id,
            }, event);
        },

        // Relationship events
        async RELATIONSHIP_ADD(event: any) {
            if (!isConfigured() || !settings.store.event_RELATIONSHIP_ADD) return;

            const { relationship } = event;

            sendHomeAssistantEvent("friend_add", {
                user_id: relationship.id,
                type: relationship.type, // 1 = friend, 2 = blocked, 3 = incoming request, 4 = outgoing request
            }, event);
        },

        async RELATIONSHIP_REMOVE(event: any) {
            if (!isConfigured() || !settings.store.event_RELATIONSHIP_REMOVE) return;

            const { relationship } = event;

            sendHomeAssistantEvent("friend_remove", {
                user_id: relationship.id,
                type: relationship.type,
            }, event);
        },

        // Connection events
        async CONNECTION_OPEN(event: any) {
            if (!isConfigured() || !settings.store.event_CONNECTION_OPEN) return;

            const currentUser = UserStore.getCurrentUser();
            const currentGuild = SelectedGuildStore.getGuildId();
            const currentChannel = SelectedChannelStore.getChannelId();

            sendHomeAssistantEvent("discord_connected", {
                guild_id: currentGuild,
                channel_id: currentChannel,
                user_tag: currentUser?.tag,
            }, event);
        },

        async CONNECTION_CLOSED(event: any) {
            if (!isConfigured() || !settings.store.event_CONNECTION_CLOSED) return;

            sendHomeAssistantEvent("discord_disconnected", {
                code: event.code,
                reason: event.reason,
            }, event);
        },

        // Typing events
        async TYPING_START(event: any) {
            if (!isConfigured()) return;

            const { channelId, userId } = event;
            const currentUser = UserStore.getCurrentUser();
            const isSelf = userId === currentUser.id;

            // Check if we should send this event based on self/others toggles
            if (isSelf && !settings.store.event_TYPING_START_self) return;
            if (!isSelf && !settings.store.event_TYPING_START_others) return;

            const user = UserStore.getUser(userId);
            const channel = ChannelStore.getChannel(channelId);

            sendHomeAssistantEvent("typing_start", {
                user_id: userId,
                user_name: user?.username,
                is_self: isSelf,
                channel_id: channelId,
                channel_name: channel?.name,
            }, event);
        },

        // Presence events
        async PRESENCE_UPDATE(event: any) {
            if (!isConfigured()) return;

            const { user, status, activities } = event;
            const currentUser = UserStore.getCurrentUser();
            const isSelf = user.id === currentUser.id;

            // Check if we should send this event based on self/others toggles
            if (isSelf && !settings.store.event_PRESENCE_UPDATE_self) return;
            if (!isSelf && !settings.store.event_PRESENCE_UPDATE_others) return;

            sendHomeAssistantEvent("presence_update", {
                user_id: user.id,
                user_name: user.username,
                user_global_name: user.globalName,
                is_self: isSelf,
                status: status, // online, idle, dnd, offline
                activities: activities?.map((a: any) => ({
                    name: a.name,
                    type: a.type,
                })),
            }, event);
        },

        // Audio toggle events
        async AUDIO_TOGGLE_SELF_MUTE(event: any) {
            if (!isConfigured() || !settings.store.event_AUDIO_TOGGLE_SELF_MUTE) return;

            const channelId = SelectedChannelStore.getVoiceChannelId();
            if (!channelId) return;

            sendHomeAssistantEvent("audio_toggle_mute", {
                channel_id: channelId,
            }, event);
        },

        async AUDIO_TOGGLE_SELF_DEAF(event: any) {
            if (!isConfigured() || !settings.store.event_AUDIO_TOGGLE_SELF_DEAF) return;

            const channelId = SelectedChannelStore.getVoiceChannelId();
            if (!channelId) return;

            sendHomeAssistantEvent("audio_toggle_deaf", {
                channel_id: channelId,
            }, event);
        },

        // Call events
        async CALL_UPDATE(event: any) {
            if (!isConfigured()) return;

            const { call } = event;
            const currentUser = UserStore.getCurrentUser();

            // Check if the current user is being called
            const isSelf = call?.ringing?.includes(currentUser.id);

            // Check if we should send this event based on self/others toggles
            if (isSelf && !settings.store.event_CALL_UPDATE_self) return;
            if (!isSelf && !settings.store.event_CALL_UPDATE_others) return;

            const channel = ChannelStore.getChannel(call.channel_id);
            const guild = channel?.guild_id ? GuildStore.getGuild(channel.guild_id) : null;

            sendHomeAssistantEvent("call_update", {
                call_id: call.call_id,
                channel_id: call.channel_id,
                channel_name: channel?.name,
                guild_id: guild?.id,
                guild_name: guild?.name,
                is_self: isSelf,
                is_ringing: isSelf,
                ringing_users: call.ringing || [],
            }, event);
        },

        // Streaming events
        async STREAM_CREATE(event: any) {
            if (!isConfigured() || !settings.store.event_STREAM_CREATE) return;

            const { streamKey } = event;

            sendHomeAssistantEvent("stream_start", {
                stream_key: streamKey,
            }, event);
        },

        async STREAM_DELETE(event: any) {
            if (!isConfigured() || !settings.store.event_STREAM_DELETE) return;

            const { streamKey } = event;

            sendHomeAssistantEvent("stream_stop", {
                stream_key: streamKey,
            }, event);
        },

        // Guild selection
        async GUILD_SELECT(event: any) {
            if (!isConfigured() || !settings.store.event_GUILD_SELECT) return;

            const { guildId } = event;
            const guild = guildId ? GuildStore.getGuild(guildId) : null;

            sendHomeAssistantEvent("guild_select", {
                guild_id: guildId,
                guild_name: guild?.name,
                is_dm: guildId === null || guildId === "@me",
            }, event);
        },

        // Channel creation/deletion
        async CHANNEL_CREATE(event: any) {
            if (!isConfigured() || !settings.store.event_CHANNEL_CREATE) return;

            const { channel } = event;
            const guild = channel?.guild_id ? GuildStore.getGuild(channel.guild_id) : null;

            sendHomeAssistantEvent("channel_create", {
                channel_id: channel.id,
                channel_name: channel.name,
                channel_type: channel.type,
                guild_id: guild?.id,
                guild_name: guild?.name,
            }, event);
        },

        async CHANNEL_DELETE(event: any) {
            if (!isConfigured() || !settings.store.event_CHANNEL_DELETE) return;

            const { channel } = event;
            const guild = channel?.guild_id ? GuildStore.getGuild(channel.guild_id) : null;

            sendHomeAssistantEvent("channel_delete", {
                channel_id: channel.id,
                channel_name: channel.name,
                channel_type: channel.type,
                guild_id: guild?.id,
                guild_name: guild?.name,
            }, event);
        },

        // Relationship update (friend name changes, etc.)
        async RELATIONSHIP_UPDATE(event: any) {
            if (!isConfigured() || !settings.store.event_RELATIONSHIP_UPDATE) return;

            const { relationship } = event;

            sendHomeAssistantEvent("relationship_update", {
                user_id: relationship.id,
                type: relationship.type,
            }, event);
        },
    },

    // Message action hooks (non-flux events)
    onBeforeMessageSend(channelId: string, message: any) {
        if (!isConfigured() || !settings.store.event_onBeforeMessageSend) return;

        const channel = ChannelStore.getChannel(channelId);
        const guild = channel?.guild_id ? GuildStore.getGuild(channel.guild_id) : null;

        sendHomeAssistantEvent("before_message_send", {
            channel_id: channelId,
            channel_name: channel?.name,
            channel_type: channel?.type,
            guild_id: guild?.id,
            guild_name: guild?.name,
            content_length: message.content?.length ?? 0,
            has_attachments: message.invalidEmojis?.length > 0 || message.tts,
        });
    },

    onBeforeMessageEdit(channelId: string, messageId: string, message: any) {
        if (!isConfigured() || !settings.store.event_onBeforeMessageEdit) return;

        const channel = ChannelStore.getChannel(channelId);
        const guild = channel?.guild_id ? GuildStore.getGuild(channel.guild_id) : null;

        sendHomeAssistantEvent("before_message_edit", {
            message_id: messageId,
            channel_id: channelId,
            channel_name: channel?.name,
            channel_type: channel?.type,
            guild_id: guild?.id,
            guild_name: guild?.name,
            content_length: message.content?.length ?? 0,
        });
    },

    onMessageClick(message: any, channel: any, event: MouseEvent) {
        if (!isConfigured()) return;

        const currentUser = UserStore.getCurrentUser();
        const isSelf = message.author.id === currentUser.id;

        // Check if we should send this event based on self/others toggles
        if (isSelf && !settings.store.event_onMessageClick_self) return;
        if (!isSelf && !settings.store.event_onMessageClick_others) return;

        const guild = channel?.guild_id ? GuildStore.getGuild(channel.guild_id) : null;

        sendHomeAssistantEvent("message_click", {
            message_id: message.id,
            channel_id: channel.id,
            channel_name: channel?.name,
            channel_type: channel?.type,
            guild_id: guild?.id,
            guild_name: guild?.name,
            author_id: message.author.id,
            author_name: message.author.username,
            is_self: isSelf,
            is_double_click: event.detail === 2,
            is_shift_click: event.shiftKey,
            is_ctrl_click: event.ctrlKey || event.metaKey,
        });
    },

    start() {
        if (settings.store.logEvents) {
            logger.info("HomeAssistant Events plugin started");
        }

        // Send plugin start event if configured and enabled
        if (isConfigured() && settings.store.event_PLUGIN_START) {
            const methods: string[] = [];
            if (settings.store.webhookUrl?.trim()) methods.push('webhook');
            if (settings.store.eventUrl?.trim() && settings.store.bearerToken?.trim()) methods.push('API');

            sendHomeAssistantEvent("plugin_started", {
                version: "1.0.0",
                methods: methods,
                using_both: methods.length === 2,
                config: settings.store,  // Includes all settings (will be redacted automatically)
            });
        }
    },

    stop() {
        if (settings.store.logEvents) {
            logger.info("HomeAssistant Events plugin stopped");
        }

        if (isConfigured() && settings.store.event_PLUGIN_STOP) {
            sendHomeAssistantEvent("plugin_stopped", {});
        }
    },
});
