// Stuurt de captain 72 uur voor een wedstrijd een melding (ntfy-pushmelding en/of WhatsApp) als er minder dan 3 spelers
// zich hebben aangemeld. Draait elk uur via GitHub Actions. Elke wedstrijd wordt maar één keer gecontroleerd.
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const MIN = 3;
const WINDOW_H = 72;
const PLAYERS = { "1162921": "Kenneth", "1185404": "Vincent", "18284026": "Roel", "48336892": "Patrick",
  "62677414": "Laura", "62678155": "Marco", "65125873": "Stefan", "78493855": "Ross" };

const cfg = readFileSync("config.js", "utf8");
const url = (cfg.match(/supabaseUrl:\s*"([^"]*)"/) || [])[1];
const key = (cfg.match(/supabaseKey:\s*"([^"]*)"/) || [])[1];
const phone = process.env.CAPTAIN_PHONE, apikey = process.env.CALLMEBOT_APIKEY, topic = process.env.NTFY_TOPIC;
if (!url || !key) { console.log("Supabase nog niet ingesteld in config.js, overslaan."); process.exit(0); }
if (!topic && !(phone && apikey)) { console.log("Geen meldkanaal ingesteld (NTFY_TOPIC of CAPTAIN_PHONE + CALLMEBOT_APIKEY), overslaan."); process.exit(0); }

const data = JSON.parse(readFileSync("data/cuescore.json", "utf8"));
const logPath = "data/meldingen.json";
const log = existsSync(logPath) ? JSON.parse(readFileSync(logPath, "utf8")) : {};
const now = Date.now();

const due = data.matches.filter(m => {
  const t = Date.parse(m.start);
  return m.status !== "finished" && t > now && t - now <= WINDOW_H * 3600e3 && !log[m.no];
});
if (!due.length) { console.log("Geen wedstrijd binnen 72 uur die nog gecontroleerd moet worden."); process.exit(0); }

const fmt = new Intl.DateTimeFormat("nl-NL", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Amsterdam" });
for (const m of due) {
  const res = await fetch(`${url}/rest/v1/opgaves?match=eq.${m.no}&select=player,status`, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
  if (!res.ok) throw new Error(`Supabase gaf ${res.status}`);
  const rows = await res.json();
  const ja = rows.filter(r => r.status === "ja").map(r => PLAYERS[r.player] || r.player);
  const mis = rows.filter(r => r.status === "misschien").map(r => PLAYERS[r.player] || r.player);
  const opp = m.home === "Ball of Duty" ? m.away : m.home;
  const entry = { checkedAt: new Date().toISOString(), aangemeld: ja.length, melding: false };
  if (ja.length < MIN) {
    const text = `Ball of Duty: de wedstrijd tegen ${opp} (${fmt.format(new Date(m.start))}) heeft pas ${ja.length} aanmelding${ja.length === 1 ? "" : "en"}` +
      `${ja.length ? ` (${ja.join(", ")})` : ""}. Minimaal ${MIN} nodig.` + (mis.length ? ` Misschien: ${mis.join(", ")}.` : "") +
      ` Bekijk de app: https://rijkenk.github.io/ball-of-duty/`;
    if (topic) {
      const r = await fetch(`https://ntfy.sh/${encodeURIComponent(topic)}`, { method: "POST", body: text,
        headers: { Title: `Te weinig spelers tegen ${opp}`, Priority: "high", Tags: "warning", Click: "https://rijkenk.github.io/ball-of-duty/" } });
      if (!r.ok) throw new Error(`Pushmelding mislukt: ${r.status}`);
    }
    if (phone && apikey) {
      const r = await fetch(`https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(phone)}&text=${encodeURIComponent(text)}&apikey=${encodeURIComponent(apikey)}`);
      if (!r.ok) throw new Error(`WhatsApp-melding mislukt: ${r.status}`);
    }
    entry.melding = true;
    console.log(`Melding gestuurd voor wedstrijd ${m.no}.`);
  } else {
    console.log(`Wedstrijd ${m.no}: ${ja.length} aanmeldingen, geen melding nodig.`);
  }
  log[m.no] = entry;
}
writeFileSync(logPath, JSON.stringify(log, null, 2) + "\n");
