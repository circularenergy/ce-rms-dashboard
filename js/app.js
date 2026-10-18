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
import {dashboardDisplayConfig as displayConfig} from '../config/dashboard-display-config.js?v=2.2';
import {dependencies,applyDisplay} from './config/displayController.js?v=2.2';
const NIGERIA_TZ='Africa/Lagos';
function lagosToday(){const parts=new Intl.DateTimeFormat('en-CA',{timeZone:NIGERIA_TZ,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());const v=Object.fromEntries(parts.map(p=>[p.type,p.value]));return `${v.year}-${v.month}-${v.day}`;}
const dateISO=d=>d.toISOString().slice(0,10);
const addDays=(iso,days)=>{const d=new Date(`${iso}T12:00:00Z`);d.setUTCDate(d.getUTCDate()+days);return dateISO(d);};
function isoWeekStart(iso){const d=new Date(`${iso}T12:00:00Z`);const dow=d.getUTCDay()||7;d.setUTCDate(d.getUTCDate()-dow+1);return dateISO(d);}
function isoWeekLabel(start){const d=new Date(`${start}T12:00:00Z`);d.setUTCDate(d.getUTCDate()+3);const year=d.getUTCFullYear();const jan4=new Date(Date.UTC(year,0,4,12));jan4.setUTCDate(jan4.getUTCDate()-(jan4.getUTCDay()||7)+1);return `${year}-W${String(1+Math.round((d-jan4)/604800000)).padStart(2,'0')}`;}
function updateCalendarLabel(){const label=document.getElementById('weekQuick');if(label)label.textContent=`Week ${isoWeekLabel(startDate.value||lagosToday())}`;}
function pickRange(start,end){startDate.value=start;endDate.value=end;updateCalendarLabel();load();}
function initDateShortcuts(){const today=lagosToday();startDate.value=today.slice(0,7)+'-01';endDate.value=today;
 const previous=addDays(today.slice(0,7)+'-01',-1);const lastWeek=addDays(isoWeekStart(today),-7);
 const dropdown=document.getElementById('weekSelect');if(dropdown){let monday=isoWeekStart(today);for(let i=0;i<105;i++){let begin=addDays(monday,-i*7);const opt=document.createElement('option');opt.value=begin;opt.textContent=`${isoWeekLabel(begin)} (${begin} — ${addDays(begin,6)})`;dropdown.add(opt);}dropdown.value=lastWeek;dropdown.onchange=()=>pickRange(dropdown.value,addDays(dropdown.value,6));}
 document.querySelectorAll('[data-date-preset]').forEach(btn=>btn.onclick=()=>{switch(btn.dataset.datePreset){case 'yesterday':{const day=addDays(lagosToday(),-1);pickRange(day,day);break;}case 'mtd':{const d=lagosToday();pickRange(d.slice(0,7)+'-01',d);break;}case 'lastmonth':{const d=addDays(lagosToday().slice(0,7)+'-01',-1);pickRange(d.slice(0,7)+'-01',d);break;}case 'week':{const start=addDays(isoWeekStart(lagosToday()),-7);pickRange(start,addDays(start,6));if(dropdown)dropdown.value=start;break;}}});updateCalendarLabel();}

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
        pageTitle.innerHTML=pageSubtitle.textContent+' <span class="version-badge">V2.2</span>';
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
    const cfg=displayConfig[page];if(cfg){if(cfg.title){pageSubtitle.textContent=cfg.title;pageTitle.textContent=cfg.title;}if(cfg.subtitle)pageDescription.textContent=cfg.subtitle;}
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
                const eligible=uptime.sites.filter(s=>sites.some(e=>e.site_id===s.siteId));const avg=k=>eligible.length?eligible.reduce((s,x)=>s+(Number(x[k])||0),0)/eligible.length:null;const context={energy:{sites},uptime:{ce_sla_uptime_pct:avg('ceSlaUptimePct'),site_uptime_pct:avg('siteUptimePct')}};
                if(dependencies('overview').includes('battery')){const bd=await getBatteryUsageData(params);context.battery=batteryContext(bd);}
                if(token!==requestToken)return;applyDisplay('overview',context);
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
                const context={energy:{sites}};
                if(dependencies('energy').includes('uptime')){const ud=await getUptimeSlaData(params);context.uptime=uptimeContext(ud);}
                if(dependencies('energy').includes('battery')){const bd=await getBatteryUsageData(params);context.battery=batteryContext(bd);}
                if(token!==requestToken)return;applyDisplay('energy',context);
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
            const context={uptime:uptimeContext(uptime),battery:batteryContext(battery)};
            if(dependencies('uptime').includes('energy')){const ed=await getEnergy(startDate.value,endDate.value);context.energy={sites:ed.sites.filter(s=>selectedSite==='ALL'||s.site_id===selectedSite)};}
            if(token!==requestToken)return;applyDisplay('uptime',context);
            toast("Uptime & Backup SLA refreshed from Supabase");
        } else {
            const data = await getBatteryUsageData(params);
            renderBattery(data, selectedSite);
            const context={battery:batteryContext(data)};
            if(dependencies('battery').includes('energy')){const ed=await getEnergy(startDate.value,endDate.value);context.energy={sites:ed.sites.filter(s=>selectedSite==='ALL'||s.site_id===selectedSite)};}
            if(dependencies('battery').includes('uptime')){const ud=await getUptimeSlaData(params);context.uptime=uptimeContext(ud);}
            if(token!==requestToken)return;applyDisplay('battery',context);
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
startDate.onchange = () => {updateCalendarLabel();load();};
endDate.onchange = () => {updateCalendarLabel();load();};
refresh.onclick = load;

document.querySelectorAll("nav button[data-page]").forEach(button => {
    button.onclick = () => {
        setActivePage(button.dataset.page);
    };
});

document.addEventListener("DOMContentLoaded", () => {
    initDateShortcuts();
    updateShell(currentPage);
    load();
});

function toast(message) {
    const element = document.getElementById("toast");
    element.textContent = message;
    element.style.display = "block";
    setTimeout(() => element.style.display = "none", 1600);
}

/* CE RMS V2.2: direct mapped-source metrics; never modify backend calculations. */
function batteryContext(data){const sites=(selectedSite==='ALL'?data.sites:data.sites.filter(x=>x.id===selectedSite))||[];
 const sum=k=>sites.reduce((acc,x)=>acc+(Number(x[k])||0),0);
 const days=Number(data.period?.days)||1,count=sites.length||1;
 return {totalHours:sum('totalHours'),totalEnergy:sum('totalEnergy'),totalRuns:sum('fr')+sum('pr'),fullHours:sum('fh'),partialHours:sum('ph'),fullRuns:sum('fr'),partialRuns:sum('pr'),fullEnergy:sum('fe'),partialEnergy:sum('pe'),energyPerSiteDay:sum('totalEnergy')/days/count,hoursPerSiteDay:sum('totalHours')/days/count};}
function uptimeContext(data){const sites=(selectedSite==='ALL'?data.sites:data.sites.filter(x=>x.siteId===selectedSite))||[];
 const gt=selectedSite==='ALL'?data.grandTotal:null;
 const mean=k=>{const vals=sites.map(x=>x[k]).filter(x=>x!=null&&Number.isFinite(Number(x)));return vals.length?vals.reduce((s,x)=>s+Number(x),0)/vals.length:null;};
 const temps=data.bms?.temperatureSummary?.filter(x=>sites.some(s=>s.siteId===x.siteId)).map(x=>x.avg).filter(x=>x!=null&&Number.isFinite(Number(x)))||[];
 return {ce_sla_uptime_pct:gt?.ce_sla_uptime_pct??mean('ceSlaUptimePct'),site_uptime_pct:gt?.site_uptime_pct??mean('siteUptimePct'),missing_data_rows:gt?.missing_data_rows??sites.reduce((s,x)=>s+(Number(x.missingDataRows)||0),0),site_downtime_hours:gt?.site_downtime_hours??sites.reduce((s,x)=>s+(Number(x.siteDowntimeHours)||0),0),ce_attributable_downtime_hours:gt?.ce_attributable_downtime_hours??sites.reduce((s,x)=>s+(Number(x.ceAttributableDowntimeHours)||0),0),averageTemp:temps.length?temps.reduce((s,x)=>s+Number(x),0)/temps.length:null};}
