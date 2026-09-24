# walkthrough-demo — v0.1.0 (standalone evaluation build)

Ye ek **alag, self-contained demo page** hai. Iska maqsad: tumhare faisle ke liye evidence
dena — production site par kuch bhi change karne se pehle.

**Kya nahi chhua gaya:** `index.html`, `script.js`, `style.css` — teeno v2.8.0 par jaisa hai
waisa hai. Is folder ko delete karne se site par kuch nahi tootega.

---

## Kaise kholo

Double-click: `walkthrough-demo/index.html` (file:// par bhi chalta hai — koi fetch/CDN JS nahi).
Ya local server:

```powershell
cd c:\Users\pc-1\Desktop\BIM-Portfolio
python -m http.server 8000
# phir browser me: http://127.0.0.1:8000/walkthrough-demo/
```

---

## Page par kya-kya hai

| Section | Kya dikhata hai |
|---|---|
| **01 · Autoplay timing** | 5.0 s vs 3.5 s — same 4 images, same start, same 600 ms transition. "advances" counter se farq saaf dikhta hai. |
| **02 · Cinematic preview** | Asli player: camera move (dolly + tilt + vertical sweep), progress bar, `01 / 05` counter, play/pause, prev/next, thumbnail strip, keyboard (`←` `→` `Space` `Home`), mobile swipe. |
| **02 · Camera move intensity** | Off / Subtle / Medium / Strong — ek hi render par chaar amplitude, tum decide karo kitna zyada hai. |
| **02 · Force camera move on drawings** | Jaan-bujhkar wahi move flat plan par lagata hai — dekh lo ki kyun wo galti lagti hai. |
| **02 · Simulate prefers-reduced-motion** | Motion sensitivity switch — animation + autoplay dono band. |
| **03 · Limits & costs** | Route A / B / C ka honest comparison + tumhare assets ka measured weight problem. |

Keyboard note: keys sirf player focused hone par kaam karti hain, isliye page scroll hijack nahi hota.

---

## QA (headless, asli browser me)

```powershell
python walkthrough-demo/qa_demo.py
```

Chrome DevTools Protocol se headless Chrome chalata hai (same pattern jo `audit-v2.8.0/cdp_qa.py`
me already use hota hai) aur **15 assertions** check karta hai. Latest run: **15/15 PASS**
(`qa_demo.py` me 15 `check()` calls hain, aur log me 15 `PASS` lines — rows ki ginti se match karta hai).

| Check | Measured result |
|---|---|
| player data se mount hota hai | 5 slides / 5 thumbs / `01` of `05` |
| stage ratio render se aata hai | `--ar` = 0.75 (GENESIS 1756×2473, clamp ke baad) |
| camera move sirf render par | `[true, false, false, false, false]` |
| camera move asli animation hai | `cineDolly`, duration `3.5s` |
| **autoplay interval** | `3490, 3500 ms` (target 3500) |
| pause sach me rokta hai | 4.5 s me index + advanceLog dono unchanged |
| keyboard | ArrowRight +1, Home → 0 |
| drawing par move nahi | `animationName: none` |
| force toggle | drawing par `cineDolly` |
| **dolly sach me hilta hai** | transform matrix do samay par different |
| reduced-motion sim | animation `none` + autoplay paused |
| A/B race (9 s) | 5.0 s card = 1 advance, 3.5 s card = 2 advances |
| project switch | SB PARADISE → 10 slides, ratio 0.866 |
| 390 px overflow | `scrollWidth 390 ≤ innerWidth 390` (koi horizontal scroll nahi) |
| JS errors | `[]` (zero) |

Screenshots `walkthrough-demo/` me likhta hai (`.gitignore` inhe ignore karta hai):

| File | Kya dikhata hai |
|---|---|
| `01-desktop-player.png` | 1440 px — page top, hero + banner |
| `02-desktop-race.png` | 5.0 s vs 3.5 s race ka asli farq |
| `03-desktop-player.png` | 1440 px — player + controls |
| `04-mobile-player.png` | 390 px — player single-column |
| `05-desktop-limits.png` | 1440 px — §3 route table + weight findings |
| `06-mobile-limits.png` | 390 px — table mobile par kaise dikhti hai |

Raw measured values (log se, guess nahi):

```text
autoplay deltas (ms): 3490, 3500            <- target 3500
race after 9 s: {"slow_5s": 1, "fast_3s5": 2, "elapsed": ["9.0s", "9.0s"]}
after switching to SB PARADISE: {"slides": 10, "thumbs": 10, "total": "10", "ar": 0.866}
390 px layout: {'inner': 390, 'scroll': 390, 'table': [616]}
```

**390 px note:** `table: [616]` ka matlab §3 ki route table 616 px chaudi hai, to 390 px phone par
aakhri 2 columns (repo weight, verdict) side me swipe karne par dikhte hain. Ye galti nahi — ye
tumhari production site ka hi pattern hai (`style.css:476-477`: `.bbs-scroll{overflow-x:auto}` +
`.bbs-ref{min-width:640px}`), aur document-level horizontal scroll nahi banta (`scroll 390 = inner 390`).

---

## Tumhare assets ka measured weight (ye sabse pehle fix karne wali cheez hai)

Maine `assets/` ke asli JPEG headers padhkar measure kiya (System.Drawing), guess nahi kiya.
Sizes Windows/MiB me hain (1 MiB = 1,048,576 bytes):

| Project (index.html ka naam) | Slides | Total | Sabse bada | Resolution |
|---|---|---|---|---|
| GENESIS (slide-04-*) | 5 | **0.72 MiB** | 0.55 MiB | 1756×2473 |
| SB PARADISE (slide-05-*) | 10 | **1.54 MiB** | 0.46 MiB | 2141×2473 |
| ANANTA CARNATION (slide-21-*) | 4 | **17.39 MiB** | 5.47 MiB | **15000×7406** |
| **MES (slide-22-*)** | 7 | **48.47 MiB** | 9.39 MiB | **15000×15000 tak** |
| Poora `assets/` | 88 JPGs | **77.6 MiB** (81,353,306 bytes) | — | — |

**Problem:** ek 15000×10633 JPEG browser me decode hone par kam se kam **~638 MB RAM** leta hai
(15000 × 10633 × 4 bytes). MES ka modal 4 aisi images laya karta hai → ~2.5 GB, aur ANANTA ki
chaaron images 15000×7406 (= ~444 MB each) hain. Mobile par tab crash ho sakta hai, aur waise bhi
~48 MB download. Ye abhi live site me hai — demo se alag, asli issue hai.

**Fix (ek baar ka kaam):** web derivatives — max **2000 px** long edge, JPEG quality 80.
MES 48.47 MiB → **~2 MB** (≈96% cut), ANANTA 17.39 MiB → ~0.8 MB. Originals ek alag folder me
rakh lo, on-screen 2000 px kaafi hai.

**Isiliye mera order:** (1) weights fix → (2) autoplay 3.5 s / BBS 4.2 s → (3) modal ko player
banao → (4) phir video ya 3D add karo.

---

## Route reality check

| Route | Kya milega | Kya chahiye | Verdict |
|---|---|---|---|
| **A** · 2.5D cinematic preview *(yahi demo hai)* | Render par dolly-in + tilt + sweep. Video jaisa feel, par still image hi hai — koi occlusion/parallax nahi. | Kuch nahi. Existing JPGs. | Aaj ship ho sakta hai. UI me ise **"cinematic preview"** kehna, "walkthrough" nahi. |
| **B** · Sachi 3D walkthrough | Browser me model navigate/orbit/fly-through. | Revit se GLB export (Revit me native glTF nahi: Revit→IFC→Blender/BlenderBIM→GLB, ya Revit→FBX→Blender→GLB). Materials/UVs manually fix. | 1 flagship ke liye theek. 14 ke liye bekaar: 4–12 MB per model + ~165 KB three.js, mobile par stutter, 1–2 din per model. |
| **C** · Recorded walkthrough *(recommended)* | Asli 3D camera move. | Enscape/Lumion/Twinmotion/Navisim se 15–25 s clip, MP4 H.264 720p ≤3 MB, muted. | Best value. YouTube-unlisted facade (poster = existing render) se repo weight 0. |

**Ek honest baat:** Route A ko "3D walkthrough" bolna tumhare professional credibility ke against
hai — BIM clients aur HR turant pakad lenge ki ye still image par camera move hai. Isliye demo me
poora UI "cinematic preview" kehta hai.

---

## Decide karne wali cheezein

1. **Autoplay:** 3.5 s theek lagta hai? (BBS 4.2 s — wo reel demo me nahi hai.) 3 s se neeche nahi jaana chahiye.
2. **Camera move ON/OFF per slide:** abhi sirf `-01` render par ON hai. MES ke baaki 6 slides renders hain ya drawings — wo main visually verify nahi kar sakta, tum batao.
3. **Intensity:** Subtle / Medium / Strong — konsa default?
4. **Route:** A aaj, phir C jab videos mil jaayen? Ya B sirf ek flagship (GENESIS ya MES) ke liye?

---

## ⚠️ Deploy note (important)

`.github/workflows/static.yml` poore repo ko upload karta hai (`path: '.'`), matlab push karne par
ye demo publicly `.../walkthrough-demo/` par live ho jaayega. Chaaho to usse pehle decide karo:

- demo rakhna hai → kuch na karo (page par `noindex,nofollow` laga hua hai)
- nahi rakhna → `.gitignore` me `walkthrough-demo/` add kar do (isse pehle bhi main tumhari permission ke bina wahan touch nahi kar raha)

Delete karna ho to sirf ye folder delete karo: `Remove-Item -Recurse walkthrough-demo`.
`reel_analysis/` ki tarah ye tracked nahi hai jab tak tum commit na karo.

---

## Files

| File | Kya hai |
|---|---|
| `index.html` | Poora demo — inline CSS + inline JS, ES5, zero dependency, zero naya asset |
| `qa_demo.py` | Headless CDP QA — 15 assertions + 6 screenshots |
| `README.md` | Yahi file |
| `0*-*.png` | QA ke screenshots |

Version: **v0.1.0** (semantic versioning — `[major].[minor].[patch]`; ye abhi pre-production
evaluation build hai, isliye major 0). Production me ye kaam `v2.9.0` banega (naya player feature),
timing-only change `v2.8.1` hota.
