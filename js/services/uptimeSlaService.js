/*
====================================================================
 CE RMS Uptime & Backup SLA — V1.7 SERVICE
====================================================================

API:
  POST /rest/v1/rpc/get_rms_uptime_sla

Supabase:
  https://aynbticohhzgktonsxud.supabase.co

Request body:
  {
    "p_site_id": "ABJ-1" | null,
    "p_start_utc": "2026-07-01T00:00:00Z",
    "p_end_utc": "2026-08-01T00:00:00Z"
  }

The PostgreSQL RPC remains the calculation layer.
This service only requests the API and passes the response to the
dedicated uptimeSlaMapper.js module.

Never place service-role keys or database passwords in the frontend.
====================================================================
*/

import { mapUptimeSlaApi } from "./uptimeSlaMapper.js?v=1.7";

const SUPABASE_URL = "https://aynbticohhzgktonsxud.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5bmJ0aWNvaGh6Z2t0b25zeHVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA0NDk4ODAsImV4cCI6MjEwNjAyNTg4MH0.OQVz8xQl5rg5IRfxo35_JN3xBceBOTVLdqCQazbYJko";

function unwrapRpc(body) {
    if (Array.isArray(body)) {
        if (!body.length) return {};
        const first = body[0];
        if (first && typeof first === "object" && first.get_rms_uptime_sla) return first.get_rms_uptime_sla;
        return first || {};
    }
    if (body && typeof body === "object" && body.get_rms_uptime_sla) return body.get_rms_uptime_sla;
    return body || {};
}

export async function getUptimeSlaData({ siteId = null, startDate, endDateExclusive }) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_rms_uptime_sla`, {
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
    });
    const text = await response.text();
    if (!response.ok) throw new Error(`Supabase Uptime/SLA request failed (${response.status}): ${text || response.statusText}`);
    let body;
    try { body = JSON.parse(text); } catch { throw new Error("Supabase returned invalid Uptime/SLA JSON."); }
    const api = unwrapRpc(body);
    const start = new Date(`${startDate}T00:00:00Z`);
    const end = new Date(`${endDateExclusive}T00:00:00Z`);
    const days = Math.max(1, Math.round((end - start) / 86400000));
    return { period: { days, startDate, endDateExclusive }, ...mapUptimeSlaApi(api) };
}
