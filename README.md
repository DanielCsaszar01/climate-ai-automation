# KlímaProfi Kft. - AI Automation & E-commerce Projekt

## 📋 Projekt célja

Egy képzeletbeli klímás cég weboldala + AI chatbot + AI asszisztens létrehozása, hogy gyakoroljunk **AI automatizálást** és **webáruház-integrációt** a **vibe coding** megközelítéssel.

## 🏢 Cég profil

- **Név:** KlímaProfi Kft.
- **Profil:** Klímák értékesítése, telepítése, karbantartása
- **Ubicat:** Budapest, Magyarország
- **Telefon:** +36 1 234 5678
- **Email:** info@klimaprofi.hu

## 📦 Termékek & Szolgáltatások

### Termékek
- **LG Standard Plus** (12000 BTU, 189.000 Ft)
- **Daikin Perfera Plus** (18000 BTU, 349.000 Ft) - Premium
- **Midea Inverter Easy** (9000 BTU, 129.000 Ft) - Gazdaságos
- **Fujitsu Slim Design** (24000 BTU, 449.000 Ft) - Nagy terület
- **Samsung Windfree** (12000 BTU, 219.000 Ft)

### Szolgáltatások
1. **Klíma Telepítés** - 35.000 Ft (egységenként)
2. **Klíma Tisztítás és Karbantartás** - 15.000 Ft
3. **Klíma Javítás és Szervizelés** - Díjmentes diagnózis
4. **Szellőzésrendszer Tervezés** - 10.000 Ft konzultáció
5. **Éves Karbantartási Csomag** - 25.000 Ft/év

## 📁 Projekt Szerkezet

```
climate-ai-automation/
├── data/
│   ├── products.json           # Klímaprodukciók
│   ├── services.json           # Szolgáltatások
│   ├── faq.json               # Gyakran ismételt kérdések
│   └── company_info.json      # Cégadatok
│
├── website/
│   ├── index.html             # Landing page
│   ├── style.css              # Styling
│   └── script.js              # Frontend logika
│
├── chatbot/                   # (Következő fázis)
│   ├── chatbot_system_prompt.txt
│   └── chatbot_integration.py
│
├── assistant/                 # (Következő fázis)
│   ├── assistant_system_prompt.txt
│   └── assistant_logic.py
│
└── README.md
```

## 🚀 Projekt Fázisok

### ✅ Fázis 1: Weboldal alapja
**Státusz:** Kész!
- Termékek és szolgáltatások bemutatása
- Dinamikus adatbetöltés JSON fájlokból
- GYIK szekció
- Csapolható chatbot widget (placeholder)

### 🔜 Fázis 2: AI Chatbot
**Cél:** 
- RAG rendszer (Retrieval-Augmented Generation)
- Válaszol termékek/szolgáltatások alapján
- Beépített chatbot a weboldalon
- Csökkenti az ismétlődő kérdéseket

### 🔜 Fázis 3: AI Asszisztens
**Cél:**
- Igényfelmérés (szobaméretek, típus, etc.)
- Automatikus ajánlatkészítés
- Időpontfoglalás (naptárintegráció)
- Email küldés az ügyfeleknek
- Belső értesítés a technikusoknak

## 💻 Helyi Futtatás

### 1. Repository klónozása
```bash
git clone https://github.com/DanielCsaszar01/climate-ai-automation.git
cd climate-ai-automation
```

### 2. Weboldal megnyitása
Egyszerűen nyisd meg a `website/index.html` fájlt böngészőben:
```bash
open website/index.html
# vagy Windows-on:
start website/index.html
```

**VAGY** futtass egy lokális szerver-t:
```bash
python -m http.server 8000
# majd menj a http://localhost:8000/website/ -re
```

## 🤖 Vibe Coding Megközelítés

A projekt **Claude Code** vagy **GitHub Copilot** segítségével készül:

1. **Természetes nyelvű specifikáció:** Mondjuk el, mit szeretnénk, emberi nyelven
2. **AI asszisztens megírja a kódot:** Az AI előállít egy működő megoldást
3. **Közös fejlesztés:** Tesztelünk, iterálunk, közben megtanuljuk az alapokat
4. **Gyakorlati tanulás:** Nem elmélet, hanem saját kódon keresztül tanuljuk meg az AI-t

## 📚 Tanulási Útvonal

1. **API-k és adatkezelés** - JSON, fetch, integráció
2. **Prompt Engineering** - AI instruálása (system prompt, context)
3. **RAG (Retrieval-Augmented Generation)** - Saját adatokból való válaszadás
4. **Automatizáció** - Üzleti folyamatok AI-val
5. **Integrációk** - E-mail, naptár, CRM

## 🎯 Következő Lépések

- [ ] **Chatbot kód** - Python + n8n/Make.com integrációval
- [ ] **System prompt finomítása** - Jobb AI válaszok
- [ ] **Asszisztens alapja** - Foglalási logika
- [ ] **Email integrációk** - Automata válaszok
- [ ] **Demó videó** - Bemutató az ügyfeleknek

## 📞 Kapcsolat

**KlímaProfi Kft.**
- 📧 Email: info@klimaprofi.hu
- 📞 Telefon: +36 1 234 5678
- 📍 Cím: 1123 Budapest, Klimaprofis utca 12.

---

**Készült:** 2024 | **Tanulási Projekt:** AI Automation + Vibe Coding
