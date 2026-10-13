# Lesformaat

Elke les is één bestand: `lessen/<les-id>/les.json`. Het bord (`bord.html?les=<les-id>`) tekent de les op een vel van **1600 × 900** onder de inkt. Je schrijft er met de pen overheen.

- **Mapnaam = id**: kleine letters, cijfers en streepjes. Patroon: `g<groep>-<vak>-<onderwerp>`, bijvoorbeeld `g56-rekenen-breuken-betekenis` of `g56-taal-lidwoorden`.
- **Na elke wijziging**: `python3 tools/controleer.py`. Die controleert alle lessen en werkt `lessen/catalogus.json` bij (het overzicht op de startpagina).
- **Opmaak controleren**: `python3 tools/schermafdruk.py <les-id>` maakt een PNG per pagina en meldt pagina's waar de inhoud niet op het vel past.
- **Afbeeldingen** zet je in dezelfde lesmap en roep je aan met alleen de bestandsnaam.

Twee complete voorbeelden: `lessen/g56-rekenen-keersom-deelsom/` en `lessen/g56-rekenen-breuken-betekenis/`.

## De les

```json
{
  "id": "g56-rekenen-breuken-betekenis",
  "titel": "Wat betekent een breuk?",
  "groep": "5/6",
  "vak": "Rekenen",
  "methode": "Getal & Ruimte, blok 4 les 2",
  "onderwerp": "Breuken",
  "duur": 35,
  "edi": true,
  "gemaakt": "2026-10-13",
  "samenvatting": "Eén zin voor het overzicht.",
  "trefwoorden": ["breuken", "teller", "noemer"],
  "lesdoel": "ontdekken wat een breuk betekent",
  "succescriterium": "bij een plaatje de breuk kan opschrijven.",
  "lesdoelInHoek": false,
  "paginas": [ ... ]
}
```

| veld | verplicht | |
|---|---|---|
| `id`, `titel`, `groep`, `vak`, `lesdoel`, `paginas` | ja | `groep` is tekst: `"5"`, `"6"`, `"5/6"` |
| `methode`, `onderwerp`, `duur` (min), `edi`, `gemaakt` (JJJJ-MM-DD), `samenvatting`, `trefwoorden` | nee | staan in het overzicht |
| `succescriterium` | nee | wordt aangevuld achter "Het lukt als ik …" |
| `lesdoelInHoek` | nee | lesdoel klein rechtsboven op elke pagina na de eerste |

`lesdoel` volgt op "We gaan …" (dus: *"bepalen welke keersommen en deelsommen bij elkaar horen"*). `succescriterium` volgt op "Het lukt als ik …" (dus: *"bij een keersom de deelsom kan maken."*).

## Een pagina

```json
{
  "fase": "samen",
  "titel": "Welke breuk is gekleurd?",
  "opdracht": "Schrijf de breuk op je wisbordje.",
  "notitie": "Alleen voor de leerkracht: knop Notitie of toets N.",
  "blokken": [ ... ]
}
```

| veld | |
|---|---|
| `fase` | verplicht, een van de EDI-fases hieronder. Bepaalt het label en de kleur linksboven. |
| `label` | eigen tekst voor het label (anders de standaardtekst) |
| `titel` | grote kop van de pagina |
| `opdracht` | grijze regel onder de titel: wat de leerlingen doen |
| `notitie` | aanwijzing voor de leerkracht, niet zichtbaar tot je op Notitie drukt |
| `achtergrond` | `"hok"` of `"lijn"`: rekenhokjes of schrijflijnen over het hele bord (meestal niet nodig: gebruik schrijfvakken) |
| `blokken` | de inhoud, van boven naar beneden |

### Fases

| fase | label op het bord | |
|---|---|---|
| `lesdoel` | Lesdoel | lesdoel + succescriterium |
| `voorkennis` | Wat weet je al? | voorkennis ophalen |
| `instructie` | Instructie | uitleg van het begrip, waarom het belangrijk is |
| `voordoen` | Ik doe het voor | modelen met stappenplan en hardop denken |
| `samen` | Samen oefenen · 1, · 2 … | begeleide inoefening, wisbordjes. Nummert vanzelf. |
| `check` | Check | controle van begrip: iedereen alleen |
| `zelfstandig` | Zelf aan het werk | zelfstandige verwerking |
| `afsluiting` | Afsluiting | terug naar het lesdoel |

## Opmaak in tekst

Overal waar tekst staat:

| schrijf | wordt |
|---|---|
| `**vet**` | **vet** |
| `==belangrijk==` | oranje (voor het getal of woord waar het om draait, of `==?==`) |
| `__gelijke__` | onderstreept |
| `[[3/5]]` | een echte breuk (teller boven, noemer onder) |
| `==[[3/5]]==` | oranje breuk |
| `\n` | nieuwe regel |

Gebruik `×` en `:` voor keer en delen (niet `x` of `/`).

## Blokken

Blokken staan onder elkaar. Schrijfvakken zonder vaste hoogte vullen de ruimte die over is. Wil je naast elkaar, gebruik dan `kolommen`, `naast` of `raster`.

### Tekst

| type | velden | |
|---|---|---|
| `doel` | `tekst`? | "We gaan" + groot lesdoel. Zonder `tekst` het `lesdoel` van de les. |
| `succes` | `tekst`? | "✓ Het lukt als ik …". Zonder `tekst` het `succescriterium`. |
| `tekst` | `tekst`, `grootte`?, `midden`? | `grootte`: `klein` (grijs), `groot`, `kop`; standaard normaal |
| `som` | `tekst`, `grootte`? | grote som, één regel. `grootte`: `klein`, `groot` |
| `label` | `tekst`, `soort`? | pil over de hele breedte; `soort`: `goed` (✓ groen), `fout` (✗ rood), `neutraal` |
| `stappen` | `stappen`, `titel`? | genummerd stappenplan. Een stap is tekst, of `{"kop", "tekst", "klein"}` |

### Plaatjes

Gekleurde stukjes tel je **vanaf 1** (links naar rechts, of met de klok mee vanaf boven).

| type | velden | |
|---|---|---|
| `strook` | `delen`, `gekleurd`?, `breedte`? (600), `hoogte`? (110), `verhoudingen`?, `onderschrift`? | strook in stukjes. `verhoudingen` maakt ongelijke stukjes: `[0.1, 0.3, …]` |
| `cirkel` | `delen`, `gekleurd`?, `straal`? (130), `verhoudingen`?, `onderschrift`? | taart in stukjes |
| `rechthoek` | `rijen`, `kolommen`, `gekleurd`?, `vak`? (110), `onderschrift`? | rooster van vakjes, genummerd per rij |
| `stippen` | `rijen`, `kolommen`, `afwisselen`? (true) | stippenrooster, rijen om en om licht/donker |
| `familie` | `totaal`, `delen: [a, b]` | getallenfamilie: 56 boven, 7 en 8 eronder |
| `breukdelen` | `teller`, `noemer`, `tellerTekst`?, `noemerTekst`? | grote breuk met pijltjes naar teller, streep, noemer |
| `afbeelding` | `bron`, `alt`?, `hoogte`? | plaatje uit de lesmap |

### Schrijven op het bord

| type | velden | |
|---|---|---|
| `schrijfvak` | `label`?, `lijnen`?, `breedte`?, `hoogte`? | gestippeld vak om in te modelleren. `lijnen`: `hokjes` (standaard), `lijnen` (schrijflijnen), `leeg`. Hokjes en lijnen hebben de maat van de schriften (instellingen ⚙ op het bord). Zonder `hoogte` vult het de ruimte. |
| `breukvak` | `namen`? | twee vakjes met een breukstreep; `namen: true` zet er "teller" en "noemer" bij |

### Vragen en antwoorden

Het antwoord is verborgen tot je op **Antwoord** drukt (of toets A).

| type | velden | |
|---|---|---|
| `antwoord` | `tekst` en/of `blokken` | groen antwoordvak. In `blokken` mag: `som`, `tekst`, `strook`, `cirkel`, `rechthoek`. |
| `keuzes` | `opties`, `kolommen`? | 2 tot 6 keuzes A, B, C …; een optie is `{"tekst", "goed"?, "uitleg"?}`. Bij Antwoord licht de goede op en verschijnt de uitleg. Zet bij foute opties in de uitleg welke denkfout het is. |

### Indeling

| type | velden | |
|---|---|---|
| `kolommen` | `kolommen: [[blokken], [blokken]]`, `breedtes`? | 2 of 3 kolommen naast elkaar die de hoogte vullen. `breedtes: [2, 1]` = linker twee keer zo breed. Geen kolommen in kolommen. |
| `naast` | `blokken`, `vul`? | blokken naast elkaar, verdeeld over de breedte (bijv. strook + cirkel) |
| `raster` | `blokken`, `kolommen`? (2) | rooster dat de hoogte vult (bijv. 4 schrijfvakken) |
| `html` | `html` | noodgreep voor iets wat er niet in past. Geen scripts. Liever niet. |

## Vuistregels voor een goede pagina

- **Eén ding per pagina.** Liever een pagina meer dan een volle pagina.
- **Ruimte om te schrijven**: bij `voordoen`, `samen` en `check` hoort minstens één schrijfvak. Je modelleert zelf, dus het bord geeft geen uitwerking.
- **Groot**: de achterste rij moet het kunnen lezen. Gebruik `som` voor sommen, niet `tekst`.
- **Samen oefenen** met antwoord, **check** met antwoord en leerlingen alleen ("Iedereen werkt alleen").
- **Past het niet?** Het bord zet een rode rand om het vel en `schermafdruk.py` meldt het. Haal dan iets weg of splits de pagina.

## Mini-voorbeeld

```json
{
  "fase": "samen",
  "titel": "Welke deelsom hoort erbij?",
  "blokken": [
    {"type": "kolommen", "breedtes": [2, 1], "kolommen": [
      [{"type": "som", "tekst": "5 × 6 = 30", "grootte": "groot"},
       {"type": "tekst", "tekst": "Schrijf de deelsom op je wisbordje.", "grootte": "klein"},
       {"type": "schrijfvak"}],
      [{"type": "antwoord", "blokken": [
        {"type": "som", "tekst": "30 : 6 = 5"},
        {"type": "tekst", "tekst": "of 30 : 5 = 6"}]}]
    ]}
  ]
}
```

## Het bord tijdens de les

- `bord.html?les=<id>` opent de les, `&pagina=3` op pagina 3.
- Pijltjes, PageUp/PageDown (presenter) of spatie: volgende pagina. **+** voegt een lege kladpagina in.
- **A**: antwoord tonen/verbergen. **N**: notitie voor de leerkracht.
- Inkt wordt per les in de browser bewaard. Verandert de les zelf, dan begint het bord met een schone versie van de les.
- **⚙ → Les opnieuw beginnen** wist alle inkt van de les.
