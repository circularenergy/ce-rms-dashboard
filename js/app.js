/*
====================================================================
 CE RMS Battery Usage GUI — V1.6 LIVE APPLICATION
====================================================================

API:
  POST /rest/v1/rpc/get_battery_usage_stretches

Supabase:
  https://aynbticohhzgktonsxud.supabase.co

The PostgreSQL RPC remains the calculation layer.
The frontend requests and displays the API-authoritative results.
The API-to-GUI mapping is isolated in batteryUsageMapper.js.

Never place service-role keys or database passwords in the frontend.
====================================================================
*/

import { getBatteryUsageData } from "./services/batteryUsageService.js?v=1.6";
import { render } from "./components/batteryUsagePage.js?v=1.6";

let selectedSite = "ALL";

const site = document.getElementById("site");
const startDate = document.getElementById("startDate");
const endDate = document.getElementById("endDate");
const refresh = document.getElementById("refresh");

["ABJ-1", "ABJ-2", "LAG-1", "LAG-2"].forEach(id => {
    site.add(new Option(id, id));
});

function toExclusiveEnd(inclusiveDate) {
    const date = new Date(`${inclusiveDate}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() + 1);
    return date.toISOString().slice(0, 10);
}

function validateDates() {
    if (!startDate.value || !endDate.value) {
        throw new Error("Please select both start and end dates.");
    }

    if (startDate.value > endDate.value) {
        throw new Error("Start date must be on or before end date.");
    }
}

async function load() {
    try {
        validateDates();

        refresh.disabled = true;
        refresh.textContent = "Refreshing…";

        const error = document.getElementById("error");
        if (error) error.hidden = true;

        const data = await getBatteryUsageData({
            siteId: selectedSite === "ALL" ? null : selectedSite,
            startDate: startDate.value,
            endDateExclusive: toExclusiveEnd(endDate.value)
        });

        render(data, selectedSite);
        toast("Battery Usage refreshed from Supabase");
    } catch (errorValue) {
        const message = errorValue instanceof Error
            ? errorValue.message
            : "Unable to retrieve Battery Usage data.";

        const error = document.getElementById("error");
        if (error) {
            error.textContent = message;
            error.hidden = false;
        }

        console.error("CE RMS Battery Usage V1.6:", errorValue);
    } finally {
        refresh.disabled = false;
        refresh.textContent = "Refresh";
    }
}

site.onchange = event => {
    selectedSite = event.target.value;
    load();
};

startDate.onchange = load;
endDate.onchange = load;
refresh.onclick = load;

document.addEventListener("DOMContentLoaded", () => {
    startDate.value = "2026-07-01";
    endDate.value = "2026-07-31";
    load();
});

function toast(message) {
    const element = document.getElementById("toast");
    element.textContent = message;
    element.style.display = "block";
    setTimeout(() => element.style.display = "none", 1600);
}
