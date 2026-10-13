# Bord

Een digibord om op te schrijven, met lessen eronder. Werkt in de browser, zonder installatie.

- **Overzicht van alle lessen**: `index.html`
- **Leeg bord**: `bord.html`
- **Een les**: `bord.html?les=<les-id>`

## Hoe het werkt

```
bord-repo (deze, openbaar)          lessen-bron (privé)
├─ index.html     overzicht          ├─ CLAUDE.md     werkinstructie voor Claude
├─ bord.html      het bord           ├─ didactiek/    EDI, klas, schriften
├─ assets/        leslaag            ├─ bronnen/      methodes, EDI-boek (pdf)
├─ lessen/<id>/les.json              └─ voorbeelden/  oude lessen als html
├─ LESFORMAAT.md  het contract
└─ tools/         controleren, schermafdrukken
```

Lessen worden gemaakt in **lessen-bron** (met Claude Code), volgens **LESFORMAAT.md**, en als `les.json` in deze repo gezet. Bij elke push controleert GitHub alle lessen (`tools/controleer.py`) en zet de site online. Klopt er iets niet, dan blijft de vorige versie staan.

## Zelf testen op je computer

Lessen laden werkt niet vanaf een los bestand (`file://`). Start in deze map:

```
python3 tools/controleer.py
python3 -m http.server
```

en open http://localhost:8000.

## Eenmalig instellen

Settings → Pages → Build and deployment → Source: **GitHub Actions**.
