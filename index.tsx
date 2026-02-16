//// Plugin originally written for Equicord at 2026-02-16 by https://github.com/Bluscream, https://antigravity.google
// region Imports
import definePlugin, { PluginNative } from "@utils/types";
import {
    ChannelStore,
    GuildStore,
    SelectedChannelStore,
    SelectedGuildStore,
    UserStore
} from "@webpack/common";
import { Logger } from "@utils/Logger";

import { settings } from "./settings";
// endregion Imports

// region PluginInfo
import { pluginInfo } from "./info";
export { pluginInfo };

// region Variables
const logger = new Logger(pluginInfo.id, pluginInfo.color);
const Native = VencordNative.pluginHelpers.HomeAssistantEvents as PluginNative<typeof import("./native")>;
// endregion Variables

// region Types
interface HomeAssistantEventData {
    now: string;
    pc: string;
    user: string;
    event_type: string;
    discord_user?: string;
    discord_user_id?: string;
    [key: string]: any;
}
// endregion Types

// region Utils
function isConfigured(): boolean {
    const hasWebhook = !!settings.store.webhookUrl?.trim();
    const hasApiAuth = !!(settings.store.eventUrl?.trim() && settings.store.bearerToken?.trim());
    return hasWebhook || hasApiAuth;
}

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

        if ((key === 'bearerToken' || key === 'webhookUrl') && typeof value === 'string' && value.trim()) {
            redacted[key] = '[REDACTED]';
        }
        else if (typeof value === 'string' && sensitiveValues.some(sensitive => value === sensitive)) {
            redacted[key] = '[REDACTED]';
        }
        else if (typeof value === 'object' && value !== null) {
            redacted[key] = redactSensitiveFields(value);
        }
        else {
            redacted[key] = value;
        }
    }

    return redacted;
}

function safeSerialize(obj: any, seen = new WeakSet()): any {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map(item => safeSerialize(item, seen));
    }

    if (seen.has(obj)) {
        return '[Circular]';
    }
    seen.add(obj);

    const result: Record<string, any> = {};
    for (const key in obj) {
        if (!obj.hasOwnProperty(key)) continue;

        const value = obj[key];

        if (typeof value === 'function' || typeof value === 'symbol' || value === undefined) {
            continue;
        }

        const descriptor = Object.getOwnPropertyDescriptor(obj, key);
        if (descriptor && !descriptor.enumerable) {
            continue;
        }

        try {
            result[key] = safeSerialize(value, seen);
        } catch (e) {
            result[key] = '[Error accessing property]';
        }
    }

    return result;
}

async function sendHomeAssistantEvent(eventType: string, data: Record<string, any> = {}, rawEvent?: any) {
    const webhookUrl = settings.store.webhookUrl?.trim();
    const eventUrl = settings.store.eventUrl?.trim();
    const bearerToken = settings.store.bearerToken?.trim();

    const useWebhook = !!webhookUrl;
    const useApi = !!(eventUrl && bearerToken);

    if (!useWebhook && !useApi) return;

    const currentUser = UserStore.getCurrentUser();
    const serializedRawEvent = rawEvent ? safeSerialize(rawEvent) : {};

    let eventData: HomeAssistantEventData = {
        now: new Date().toISOString(),
        pc: typeof navigator !== "undefined" ? navigator.platform : "unknown",
        user: typeof process !== "undefined" && process.env?.USERNAME ? process.env.USERNAME : "discord-user",
        discord_user: currentUser?.username ?? "unknown",
        discord_user_id: currentUser?.id ?? "unknown",
        event_type: eventType,
        ...serializedRawEvent,
        ...data,
    };

    eventData = redactSensitiveFields(eventData);

    if (settings.store.logEvents) {
        logger.info(`Sending event: ${eventType}`, eventData);
    }

    const sendPromises: Promise<void>[] = [];

    if (useWebhook) {
        sendPromises.push((async () => {
            try {
                const result = await Native.sendToHomeAssistant(webhookUrl!, null, eventData);
                if (!result.success && settings.store.logEvents) {
                    logger.error(`Failed to send event to HomeAssistant webhook: ${result.status} ${result.error || 'Unknown error'}`);
                }
            } catch (error) {
                if (settings.store.logEvents) logger.error(`Error sending event to HomeAssistant webhook:`, error);
            }
        })());
    }

    if (useApi) {
        sendPromises.push((async () => {
            try {
                const result = await Native.sendToHomeAssistant(eventUrl!, bearerToken!, eventData);
                if (!result.success && settings.store.logEvents) {
                    logger.error(`Failed to send event to HomeAssistant API: ${result.status} ${result.error || 'Unknown error'}`);
                }
            } catch (error) {
                if (settings.store.logEvents) logger.error(`Error sending event to HomeAssistant API:`, error);
            }
        })());
    }

    await Promise.all(sendPromises);
}
// endregion Utils

// region Definition
export default definePlugin({
    name: pluginInfo.name,
    description: pluginInfo.description,
    authors: pluginInfo.authors,
    settings,

    flux: {
        async MESSAGE_CREATE(event: any) {
            if (!isConfigured()) return;
            const { message, optimistic } = event;
            if (optimistic) return;

            const currentUser = UserStore.getCurrentUser();
            const isSelf = message.author.id === currentUser.id;

            const isMentioned = !isSelf && (
                message.mentions?.some((m: any) => m.id === currentUser.id) ||
                message.mention_everyone ||
                message.mention_roles?.length > 0
            );

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

        async VOICE_STATE_UPDATES(event: any) {
            if (!isConfigured()) return;
            const { voiceStates } = event;
            const currentUser = UserStore.getCurrentUser();
            const myVoiceChannelId = SelectedChannelStore.getVoiceChannelId();

            for (const state of voiceStates) {
                const { userId, channelId, oldChannelId, sessionId, selfMute, selfDeaf } = state;
                const isSelf = userId === currentUser.id;

                const isInMyChannel = !isSelf && myVoiceChannelId && (
                    channelId === myVoiceChannelId ||
                    oldChannelId === myVoiceChannelId
                );

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
            if (guild.unavailable) return;
            sendHomeAssistantEvent("guild_leave", { guild_id: guild.id }, event);
        },

        async RELATIONSHIP_ADD(event: any) {
            if (!isConfigured() || !settings.store.event_RELATIONSHIP_ADD) return;
            const { relationship } = event;
            sendHomeAssistantEvent("friend_add", {
                user_id: relationship.id,
                type: relationship.type,
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

        async TYPING_START(event: any) {
            if (!isConfigured()) return;
            const { channelId, userId } = event;
            const currentUser = UserStore.getCurrentUser();
            const isSelf = userId === currentUser.id;

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

        async PRESENCE_UPDATE(event: any) {
            if (!isConfigured()) return;
            const { user, status, activities } = event;
            const currentUser = UserStore.getCurrentUser();
            const isSelf = user.id === currentUser.id;

            if (isSelf && !settings.store.event_PRESENCE_UPDATE_self) return;
            if (!isSelf && !settings.store.event_PRESENCE_UPDATE_others) return;

            sendHomeAssistantEvent("presence_update", {
                user_id: user.id,
                user_name: user.username,
                user_global_name: user.globalName,
                is_self: isSelf,
                status: status,
                activities: activities?.map((a: any) => ({
                    name: a.name,
                    type: a.type,
                })),
            }, event);
        },

        async AUDIO_TOGGLE_SELF_MUTE(event: any) {
            if (!isConfigured() || !settings.store.event_AUDIO_TOGGLE_SELF_MUTE) return;
            const channelId = SelectedChannelStore.getVoiceChannelId();
            if (!channelId) return;
            sendHomeAssistantEvent("audio_toggle_mute", { channel_id: channelId }, event);
        },

        async AUDIO_TOGGLE_SELF_DEAF(event: any) {
            if (!isConfigured() || !settings.store.event_AUDIO_TOGGLE_SELF_DEAF) return;
            const channelId = SelectedChannelStore.getVoiceChannelId();
            if (!channelId) return;
            sendHomeAssistantEvent("audio_toggle_deaf", { channel_id: channelId }, event);
        },

        async CALL_UPDATE(event: any) {
            if (!isConfigured()) return;
            const { call } = event;
            const currentUser = UserStore.getCurrentUser();
            const isSelf = call?.ringing?.includes(currentUser.id);

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

        async STREAM_CREATE(event: any) {
            if (!isConfigured() || !settings.store.event_STREAM_CREATE) return;
            sendHomeAssistantEvent("stream_start", { stream_key: event.streamKey }, event);
        },

        async STREAM_DELETE(event: any) {
            if (!isConfigured() || !settings.store.event_STREAM_DELETE) return;
            sendHomeAssistantEvent("stream_stop", { stream_key: event.streamKey }, event);
        },

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

        async RELATIONSHIP_UPDATE(event: any) {
            if (!isConfigured() || !settings.store.event_RELATIONSHIP_UPDATE) return;
            sendHomeAssistantEvent("relationship_update", {
                user_id: event.relationship.id,
                type: event.relationship.type,
            }, event);
        },
    },

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
        if (isConfigured() && settings.store.event_PLUGIN_START) {
            const methods: string[] = [];
            if (settings.store.webhookUrl?.trim()) methods.push('webhook');
            if (settings.store.eventUrl?.trim() && settings.store.bearerToken?.trim()) methods.push('API');
            sendHomeAssistantEvent("plugin_started", {
                version: "1.0.0",
                methods: methods,
                using_both: methods.length === 2,
                config: settings.store,
            });
        }
    },

    stop() {
        if (isConfigured() && settings.store.event_PLUGIN_STOP) {
            sendHomeAssistantEvent("plugin_stopped", {});
        }
    },
});
// endregion Definition
