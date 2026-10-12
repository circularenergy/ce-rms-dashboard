/* CE RMS V2.0 (2026-10-12) — Energy V1.22 RPC transport; date bounds inclusive. Reuses existing public anon credentials, no new secrets. */
import {mapEnergy} from './energyMapper.js?v=2.0';
import {getUptimeSlaData} from './uptimeSlaService.js?v=1.7';
const URL='https://aynbticohhzgktonsxud.supabase.co';
// Existing anon/public key is intentionally read from the unchanged legacy service configuration.
// A public key is required by Supabase REST.
const KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5bmJ0aWNvaGh6Z2t0b25zeHVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA0NDk4ODAsImV4cCI6MjEwNjAyNTg4MH0.OQVz8xQl5rg5IRfxo35_JN3xBceBOTVLdqCQazbYJko';
async function rpc(name,body){const res=await fetch(`${URL}/rest/v1/rpc/${name}`,{method:'POST',headers:{apikey:KEY,Authorization:`Bearer ${KEY}`,'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(body)});const txt=await res.text();if(!res.ok)throw new Error(`${name} HTTP ${res.status}: ${txt}`);let obj;try{obj=JSON.parse(txt)}catch{throw new Error(`${name}: invalid JSON`)}if(Array.isArray(obj))obj=obj[0]||{};return obj?.[name]??obj;}
export async function getEnergy(startDate,endDate){return mapEnergy(await rpc('get_rms_energy_output',{p_start_date:startDate,p_end_date:endDate}));}
export async function getProfile(startDate,endDate,siteId=null){const a=await rpc('get_rms_load_profile',{p_start_date:startDate,p_end_date:endDate,p_site_id:siteId});return Array.isArray(a.site_summary)?a.site_summary:[];}
export async function getExecutiveUptime(params){return getUptimeSlaData(params);}
