# Ball of Duty – ledenapp (PWA)

Installeerbare webapp voor de spelers van Ball of Duty: volgende wedstrijd, aanwezigheid, speelvoorkeur volgens het wedstrijdformulier, stand en uitslagen.

## Bestanden
- `index.html` – de app
- `config.js` – Supabase-URL en anon key (invullen)
- `supabase.sql` – database-opzet, één keer uitvoeren in Supabase
- `.github/workflows/cuescore.yml` – haalt elk uur schema, uitslagen en stand op van de CueScore-API naar `data/cuescore.json`
- `manifest.webmanifest`, `sw.js`, `icons/`, `logo.jpg` – nodig om de app te kunnen installeren

## Online zetten
1. Maak een gratis project op supabase.com.
2. Open daar **SQL Editor**, draai `supabase.sql` en daarna `supabase-spelerscodes.sql`. Die laatste maakt voor elke speler een eigen code en laat ze onderaan zien.
3. Kopieer bij **Project Settings > API** de Project URL en de anon/public key naar `config.js`.
4. Zet alle bestanden in een GitHub-repository en zet **Settings > Pages** aan (branch `main`, map `/`).
5. Deel de link `https://rijkenk.github.io/ball-of-duty/` in de teamapp en geef iedereen persoonlijk zijn eigen code.

Code van een speler wijzigen: `update spelers set code = 'NIEUW1' where naam = 'Vincent Bos';` in de SQL Editor.

## Installeren op je telefoon
- **iPhone/iPad:** open de link in Safari > deelknop > *Zet op beginscherm* > *Voeg toe*.
- **Android:** open de link in Chrome > *Installeer de app* (in de app zelf) of menu > *App installeren*.
- **Computer:** Chrome of Edge > installatie-icoon rechts in de adresbalk.

## CueScore-gegevens
De app probeert eerst rechtstreeks de CueScore-API (`api.cuescore.com/tournament/?id=83574433`). Lukt dat niet, dan leest hij `data/cuescore.json`, dat de GitHub Action elk uur bijwerkt. Draai de Action na het online zetten één keer met de hand (tabblad **Actions** > *CueScore bijwerken* > *Run workflow*).
In `index.html` staat het schema van 10 november als reserve voor als beide niet lukken.

## Melding bij te weinig spelers
Een wedstrijd gaat alleen door met minimaal 3 aanmeldingen. Elk uur controleert de GitHub Action of er een wedstrijd binnen 72 uur begint. Zijn er dan minder dan 3 spelers aangemeld ("Ik ben erbij"), dan krijgt de captain één melding.

Pushmelding via ntfy (aanbevolen):
1. De captain installeert de gratis app **ntfy** (App Store / Play Store) en abonneert zich op een zelfbedacht, moeilijk te raden kanaal, bijv. `bod-captain-x7k29q`.
2. In de repo: **Settings > Secrets and variables > Actions > New repository secret**: `NTFY_TOPIC` = die kanaalnaam.

Of WhatsApp via CallMeBot (als daar plek is): secrets `CAPTAIN_PHONE` (+316...) en `CALLMEBOT_APIKEY`.
