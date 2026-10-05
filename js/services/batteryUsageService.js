/*
====================================================================
 CE RMS Battery Usage GUI — V1.6 LIVE SERVICE
====================================================================

API:
  POST /rest/v1/rpc/get_battery_usage_stretches

Supabase:
  https://aynbticohhzgktonsxud.supabase.co

Request body:
  {
    "p_site_id": "ABJ-1" | null,
    "p_start_utc": "2026-07-01T00:00:00Z",
    "p_end_utc": "2026-08-01T00:00:00Z"
  }

The PostgreSQL function remains the calculation layer.
This service requests the API and passes its JSON through the dedicated
API-to-GUI mapper in batteryUsageMapper.js.

The frontend uses the Supabase anon/public key only.
Never place service-role keys or database passwords in the frontend.
====================================================================
*/

import { mapBatteryUsageApi } from "./batteryUsageMapper.js?v=1.6";

const SUPABASE_URL = "https://aynbticohhzgktonsxud.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5bmJ0aWNvaGh6Z2t0b25zeHVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA0NDk4ODAsImV4cCI6MjEwNjAyNTg4MH0.OQVz8xQl5rg5IRfxo35_JN3xBceBOTVLdqCQazbYJko";

function unwrapRpc(body) {
    if (Array.isArray(body)) {
        if (!body.length) return {};
        const first = body[0];
        if (first && typeof first === "object" && first.get_battery_usage_stretches) {
            return first.get_battery_usage_stretches;
        }
        return first || {};
    }

    if (body && typeof body === "object" && body.get_battery_usage_stretches) {
        return body.get_battery_usage_stretches;
    }

    return body || {};
}

export async function getBatteryUsageData({
    siteId = null,
    startDate,
    endDateExclusive
}) {
    const response = await fetch(
        `${SUPABASE_URL}/rest/v1/rpc/get_battery_usage_stretches`,
        {
            method: "POST",
            headers: {
                "apikey": SUPABASE_ANON_KEY,
                "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({
                p_site_id: siteId,
                p_start_utc: `${startDate}T00:00:00Z`,
                p_end_utc: `${endDateExclusive}T00:00:00Z`
            })
        }
    );

    const text = await response.text();

    if (!response.ok) {
        throw new Error(
            `Supabase request failed (${response.status}): ${text || response.statusText}`
        );
    }

    let body;
    try {
        body = JSON.parse(text);
    } catch {
        throw new Error("Supabase returned invalid JSON.");
    }

    const api = unwrapRpc(body);
    const start = new Date(`${startDate}T00:00:00Z`);
    const end = new Date(`${endDateExclusive}T00:00:00Z`);
    const days = Math.max(1, Math.round((end - start) / 86400000));

    const mapped = mapBatteryUsageApi(api, {
        days,
        slaKwh: 32,
        slaPerDay: 1.6
    });

    return {
        period: {
            days,
            label: `${startDate} to ${new Date(end.getTime() - 86400000).toISOString().slice(0, 10)}`,
            startDate,
            endDateExclusive
        },
        ...mapped
    };
}
