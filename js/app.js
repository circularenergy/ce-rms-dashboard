/*
====================================================================
 CE RMS Management Dashboard — V1.7 LIVE APPLICATION
====================================================================

Existing V1.6 Battery Usage page is preserved as the working baseline.
V1.7 adds a separate "Uptime & Backup SLA" page in the same shell.

APIs:
  POST /rest/v1/rpc/get_battery_usage_stretches
  POST /rest/v1/rpc/get_rms_uptime_sla

Supabase:
  https://aynbticohhzgktonsxud.supabase.co

The PostgreSQL RPCs remain the calculation layer.
The frontend requests and displays API-authoritative results.

Never place service-role keys or database passwords in the frontend.
====================================================================
*/

import { getBatteryUsageData } from "./services/batteryUsageService.js?v=1.6";
import { render as renderBattery } from "./components/batteryUsagePage.js?v=1.6";
import { getUptimeSlaData } from "./services/uptimeSlaService.js?v=1.7";
import { render as renderUptime } from "./components/uptimeBackupPage.js?v=1.7";

let selectedSite = "ALL";
import {getEnergy,getProfile,getExecutiveUptime} from './services/energyService.js?v=2.0';
import {renderEnergy} from './components/energyAnalysisPage.js?v=2.0';
import {renderExecutive} from './components/executiveSummaryPage.js?v=2.0';
// V2.0: Shared shell only; original Battery Usage and Uptime components/services are unchanged.
const pages={"#uptime-sla":"uptime","#battery-usage":"battery","#energy-analysis":"energy","#overview":"overview"};
let currentPage=pages[location.hash]||'overview';
let requestToken=0;

const site = document.getElementById("site");
const startDate = document.getElementById("startDate");
const endDate = document.getElementById("endDate");
const refresh = document.getElementById("refresh");
const pageSubtitle = document.getElementById("pageSubtitle");
const pageIntro = document.getElementById("pageIntro");
const pageTitle = document.getElementById("pageTitle");
const pageDescription = document.getElementById("pageDescription");

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

function updateShell(page) {
    document.querySelectorAll("nav button[data-page]").forEach(button => {
        button.classList.toggle("active", button.dataset.page === page);
    });

    if (page === 'overview' || page === 'energy' || page === 'warranty' || page === 'temperature') {
        pageSubtitle.textContent=page==='overview'?'Executive Summary':page==='energy'?'Energy Analysis':page==='warranty'?'Battery Warranty Thresholds (BMS)':'Battery Temperature';
        if(pageIntro)pageIntro.hidden=false;
        pageTitle.innerHTML=pageSubtitle.textContent+' <span class="version-badge">V2.0</span>';
        pageDescription.textContent=page==='overview'?'Portfolio health at a glance':page==='energy'?'Power-source runtime, energy and customer load':'Under Development';
    } else if (page === "uptime") {
        pageSubtitle.textContent = "Uptime & Backup SLA";
        if (pageIntro) pageIntro.hidden = false;
        pageTitle.innerHTML = 'Uptime &amp; Backup SLA <span class="version-badge">V1.7</span>';
        pageDescription.textContent = "Site uptime, CE backup SLA performance, battery usage and energy throughput.";
    } else {
        pageSubtitle.textContent = "Battery Usage";
        if (pageIntro) pageIntro.hidden = false;
        pageTitle.innerHTML = 'Battery Usage <span class="version-badge">V1.6</span>';
        pageDescription.textContent = "Battery contribution to customer load, usage duration and measured battery energy throughput.";
    }
}

function setActivePage(page) {
    if (!["battery", "uptime", "overview", "energy", "temperature", "warranty"].includes(page)) return;
    currentPage = page;
    updateShell(page);
    history.replaceState(null, "", ({uptime:"#uptime-sla",battery:"#battery-usage",overview:"#overview",energy:"#energy-analysis",temperature:"#temperature",warranty:"#warranty"})[page]);
    load();
}

async function load() {
    try {
        validateDates();
        const token=++requestToken;
        refresh.disabled = true;
        refresh.textContent = "Refreshing…";

        const error = document.getElementById("error");
        if (error) error.hidden = true;

        const params = {
            siteId: selectedSite === "ALL" ? null : selectedSite,
            startDate: startDate.value,
            endDateExclusive: toExclusiveEnd(endDate.value)
        };

        if (currentPage === 'overview' || currentPage === 'energy') {
            const energy=await getEnergy(startDate.value,endDate.value);
            if(token!==requestToken)return;
            const sites=energy.sites.filter(s=>selectedSite==='ALL'||s.site_id===selectedSite);
            if(currentPage==='overview'){
                const uptime=await getExecutiveUptime(params);
                if(token!==requestToken)return;
                renderExecutive({sites,uptime,period:`${startDate.value} to ${endDate.value}`,navigate:setActivePage});
            } else {
                const profile=[];const anchor=new Date(`${endDate.value}T00:00:00Z`);
                for(let offset=11;offset>=0;offset--){
                    const first=new Date(Date.UTC(anchor.getUTCFullYear(),anchor.getUTCMonth()-offset,1));
                    const last=new Date(Date.UTC(first.getUTCFullYear(),first.getUTCMonth()+1,0));
                    profile.push({label:first.toLocaleString('en-GB',{month:'short',year:'numeric',timeZone:'UTC'}),start:first.toISOString().slice(0,10),end:last.toISOString().slice(0,10)});
                }
                const results=await Promise.all(profile.map(m=>getProfile(m.start,m.end,selectedSite==='ALL'?null:selectedSite)));
                if(token!==requestToken)return;
                renderEnergy({sites,profile:profile.map((m,i)=>({...m,sites:results[i]})),period:`${startDate.value} to ${endDate.value}`});
            }
            toast(`${currentPage==='overview'?'Executive Summary':'Energy Analysis'} refreshed from Supabase`);
        } else if (currentPage==='temperature'||currentPage==='warranty'){
            document.getElementById('app').innerHTML='<section class="section"><div class="sh"><h2>Under Development</h2></div><div class="body">BMS temperature and warranty reporting will be activated when the approved BMS API is available.</div></section>';
        } else if (currentPage === "uptime") {
            const [uptime, battery] = await Promise.all([
                getUptimeSlaData(params),
                getBatteryUsageData(params)
            ]);
            renderUptime({ uptime, battery }, selectedSite);
            toast("Uptime & Backup SLA refreshed from Supabase");
        } else {
            const data = await getBatteryUsageData(params);
            renderBattery(data, selectedSite);
            toast("Battery Usage refreshed from Supabase");
        }
    } catch (errorValue) {
        const message = errorValue instanceof Error
            ? errorValue.message
            : "Unable to retrieve dashboard data.";
        const error = document.getElementById("error");
        if (error) {
            error.textContent = message;
            error.hidden = false;
        }
        console.error("CE RMS Dashboard V1.7:", errorValue);
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

document.querySelectorAll("nav button[data-page]").forEach(button => {
    button.onclick = () => {
        setActivePage(button.dataset.page);
    };
});

document.addEventListener("DOMContentLoaded", () => {
    startDate.value = "2026-07-01";
    endDate.value = "2026-07-31";
    updateShell(currentPage);
    load();
});

function toast(message) {
    const element = document.getElementById("toast");
    element.textContent = message;
    element.style.display = "block";
    setTimeout(() => element.style.display = "none", 1600);
}
