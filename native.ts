// Created at 2025-10-09 11:12:22
import { IpcMainInvokeEvent } from "electron";

/**
 * Send event to HomeAssistant using native HTTP request (bypasses CORS)
 */
export async function sendToHomeAssistant(
    _event: IpcMainInvokeEvent,
    endpoint: string,
    bearerToken: string | null,
    eventData: any
): Promise<{ success: boolean; status: number; error?: string; }> {
    try {
        const headers: Record<string, string> = {
            "Content-Type": "application/json",
        };

        // Add authorization header if bearer token is provided
        if (bearerToken) {
            headers["Authorization"] = `Bearer ${bearerToken}`;
            headers["Accept"] = "application/json";
        }

        const response = await fetch(endpoint, {
            method: "POST",
            headers,
            body: JSON.stringify(eventData),
        });

        const responseText = await response.text().catch(() => "");

        return {
            success: response.ok,
            status: response.status,
            error: response.ok ? undefined : responseText || response.statusText
        };
    } catch (error) {
        return {
            success: false,
            status: -1,
            error: String(error)
        };
    }
}
