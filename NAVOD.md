# Titulky na Reels – návod

Webová aplikace, která běží **celá ve tvém prohlížeči**. Video se nikam neodesílá, nic se neplatí a nejsou tu žádné kredity.
Z internetu se jen **poprvé** stáhne model na rozpoznávání řeči (Whisper od OpenAI, verze pro prohlížeč). Pak je uložený v prohlížeči a příště se načte hned.

## Co budeš potřebovat

- **Google Chrome** nebo **Microsoft Edge** (aktuální verzi). Ty umí využít grafickou kartu (WebGPU), takže je přepis rychlý, a umí uložit video jako MP4 pro Instagram. Safari a Firefox můžou fungovat jen částečně.
- **Python** (jen jako miniaturní místní server, aby prohlížeč aplikaci povolil):
  - **Mac:** většinou už je. Když ne, systém ti ho při prvním spuštění sám nabídne nainstalovat.
  - **Windows:** stáhni z https://www.python.org/downloads/ a při instalaci **zaškrtni „Add python.exe to PATH“**.

## Spuštění

1. Rozbal složku `titulky` kamkoli (třeba na Plochu).
2. Spusť:
   - **Windows:** dvojklik na `Spustit (Windows).bat`
   - **Mac:** dvojklik na `Spustit (Mac).command` (poprvé: pravé tlačítko → Otevřít → Otevřít, protože Mac nezná autora souboru)
3. Otevře se prohlížeč na adrese `http://localhost:8765`. Pokud se otevře jiný prohlížeč než Chrome/Edge, zkopíruj tu adresu do Chrome.
4. Černé okno (terminál) nech otevřené, dokud aplikaci používáš. Zavřením okna ji vypneš.

> Nefunguje to dvojklikem na `index.html`. Prohlížeč z bezpečnostních důvodů nepovolí přepis řeči ze „souboru“, proto ten malý server.

## Jak se s tím pracuje

1. **Video** – přetáhni video do levého panelu (MP4, MOV z iPhonu…).
2. **Přepis** – vyber model a klikni na **Vytvořit titulky**.
   - *Nejpřesnější (Large v3 Turbo)* – nejlepší čeština. Poprvé stahuje cca 600–800 MB. Doporučuji, pokud máš WebGPU (aplikace to nahoře napíše a model sama předvybere).
   - *Standardní (Small)* – menší, rychlejší, čeština o něco horší. Pro počítače bez WebGPU.
   - *Rychlý test (Base)* – jen na vyzkoušení, čeština je slabá.
   - Minuta videa trvá s WebGPU obvykle desítky sekund. Bez WebGPU i několik minut.
3. **Úprava textu** – vpravo je seznam titulků. Klikni do textu a oprav ho (Enter nebo kliknutí jinam uloží). Tlačítka u řádku:
   - ⏱ ručně upravit čas od–do
   - ✂ rozdělit titulek na dva
   - ⤒ spojit s předchozím
   - ✕ smazat
   - Kliknutí na čas skočí na to místo ve videu.
   - Všechno se automaticky ukládá v prohlížeči. Když stejné video otevřeš znovu, titulky tam budou.
4. **Styl** – v galerii je 47 stylů s náhledem (klikni a hned se použije). Jsou mezi nimi:
   - klasické Reels: žluté zvýraznění, zelený box, po jednom slově, slova naskakují
   - neony a záře: žlutý, růžový, zelený, bílá záře, neonový nápis, modrá se žlutou září, levandulová záře, serif s červenou září, sci-fi záře se světelným pruhem
   - komiksové a 3D: zlatý komiks, fialový 3D, modrý 3D blok, zelenožlutý přechod, komiks s výbuchem, komiks s konfetami, žlutá s modrým obrysem
   - elegantní: serif, jemný serif, zlatý serif, serif mlha, serif + zelená, retro kurzíva, šedá, úzká a broskvová kurzíva, minimalistický
   - štítky a nálepky: modrý štítek, tmavý pruh, čistý s podkladem, zelená a růžová nálepka, magenta box se září, **výstřižky** (každé písmeno jiné, jako z novin)
   - **průhledné**: *inverze* (text mění barvu podle pozadí: na tmavém je světlý, na světlém tmavý), *jemný* a *sklo*
   - Pod galerií doladíš písmo, velikost, barvy a v „Další nastavení“ i obrys, vnější obrys, záři, 3D stín, barevný přechod, náklon, efekty (výstřižky, konfety, světelný pruh), podklad, průhlednost a prolnutí s videem.
   - **Pozice:** titulek v náhledu chytni myší (nebo prstem) a posuň nahoru/dolů. Při tažení se červeně ukážou místa, kde na Reels překáží rozhraní Instagramu. Pozice zůstane, i když přepneš styl.
5. **Export**
   - **Stáhnout video s titulky (MP4)** – titulky se „vypálí“ přímo do obrazu (H.264 + AAC, max. 1080×1920). Tohle nahráváš na Instagram.
   - **Stáhnout SRT** – samostatný soubor s titulky (pro YouTube, CapCut, Premiere…).

## Na mobilu

Aplikace funguje i v telefonu (iPhone se Safari, Android s Chrome). Na mobilu má záložky **Video / Styl / Text** dole a náhled nahoře. Titulek posouváš prstem přímo v náhledu.

- Na telefonu nejde spustit `server.py`, proto musí aplikace běžet na internetové adrese (GitHub Pages nebo Netlify). Videa se ani tak nikam neodesílají, všechno se počítá v telefonu.
- Otevři adresu v Safari (iPhone) nebo v Chrome (Android) a dej **Sdílet → Přidat na plochu**. Aplikace se pak otevírá jako normální appka a po prvním spuštění jde i bez internetu (kromě prvního stažení modelu).
- **Model:** na mobilu je předvolený *Standardní* (Small). Ten nejpřesnější je pro paměť telefonu moc velký a stránka by mohla spadnout. Poprvé se stahuje kolem 250–400 MB, ideálně přes Wi-Fi.
- **Během přepisu a exportu nech aplikaci otevřenou** a nezamykej telefon. Když přepneš do jiné aplikace, telefon práci často uspí. Aplikace se snaží nezhasínat displej sama.
- **Rychlost:** minuta videa se v telefonu přepisuje obvykle 1–5 minut (podle telefonu).
- **Uložení videa:** po exportu klikni na **Uložit do Fotek / Sdílet**. Na iPhonu vyber „Uložit video“ a video je ve Fotkách připravené pro Instagram.
- **Požadavky:** iPhone s iOS 17 nebo novějším (nejlépe iOS 26), Android s aktuálním Chrome. Starší telefony nemusí export videa zvládnout.

## Když něco nejde

- **„Nepodařilo se stáhnout model“** – při prvním přepisu musíš být online. Zkus to znovu, stahování pokračuje.
- **Video nejde přehrát / exportovat (iPhone)** – iPhone natáčí v HEVC. Většina počítačů ho umí, ale když ne: iPhone → Nastavení → Fotoaparát → Formáty → **Nejkompatibilnější**. Nebo video nejdřív projeď přes CapCut nebo Instagram koncept.
- **Přepis je pomalý** – použij Chrome/Edge a model Standardní. V Chrome zkontroluj, že máš zapnutou hardwarovou akceleraci (Nastavení → Systém).
- **Port je obsazený** – aplikace už nejspíš běží v jiném okně. Stačí otevřít `http://localhost:8765`.

## Co je uvnitř (pro zvědavé)

| Soubor | Co dělá |
|---|---|
| `index.html`, `style.css` | vzhled aplikace |
| `app.js` | ovládání, editor, náhled |
| `worker.js` | přepis řeči na pozadí (transformers.js + Whisper, čeština, časování po slovech) |
| `captions.js` | dělení slov do titulků, kreslení stylů, export SRT |
| `export.js` | vypálení titulků do videa přes WebCodecs (knihovna Mediabunny) |
| `vendor/`, `fonts/`, `fonts.css` | knihovny a písma uložená lokálně (Montserrat, Poppins, Archivo Black, Rubik, Anton, Bangers, Titan One, Baloo 2, Playfair Display, DM Serif Display, Roboto Condensed, Kaushan Script, Audiowide, Luckiest Guy, Russo One – všechna zdarma a s českou diakritikou) |
| `server.py` | miniaturní místní server |
| `manifest.webmanifest`, `sw.js`, `icons/` | instalace na plochu telefonu a běh bez internetu |

Všechny použité knihovny a modely jsou open-source a zdarma (Apache 2.0 / MIT / OFL).
