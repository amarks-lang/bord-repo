#!/usr/bin/env python3
"""Lesbord — controleert alle lessen en schrijft het overzicht.

1. Leest elke lessen/<id>/les.json en controleert die tegen LESFORMAAT.md.
2. Schrijft lessen/catalogus.json (het overzicht op de startpagina).

Gebruik (vanuit de map van de repository):
    python3 tools/controleer.py            # alles controleren + catalogus schrijven
    python3 tools/controleer.py <les-id>   # alleen deze les controleren (catalogus wordt wel bijgewerkt)
    python3 tools/controleer.py --alleen-controle   # niets schrijven

Stopt met foutcode 1 als er iets mis is. Waarschuwingen stoppen niet.
"""
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
LESSEN = ROOT / "lessen"

FASES = {"lesdoel", "voorkennis", "instructie", "voordoen", "samen", "check", "zelfstandig", "afsluiting"}
VERPLICHT = ["id", "titel", "groep", "vak", "lesdoel", "paginas"]
LESVELDEN = set(VERPLICHT) | {"onderwerp", "methode", "duur", "edi", "gemaakt", "samenvatting", "trefwoorden",
                              "succescriterium", "lesdoelInHoek"}
PAGINAVELDEN = {"fase", "label", "titel", "opdracht", "blokken", "notitie", "achtergrond"}
CATALOGUSVELDEN = ["id", "titel", "groep", "vak", "methode", "onderwerp", "duur", "edi", "gemaakt",
                   "samenvatting", "trefwoorden"]

# per bloktype: verplichte velden, toegestane velden, en welke velden zelf blokken bevatten
BLOKKEN = {
    "doel":       ({}, {"tekst"}),
    "succes":     ({}, {"tekst"}),
    "tekst":      ({"tekst"}, {"grootte", "midden"}),
    "som":        ({"tekst"}, {"grootte"}),
    "label":      ({"tekst"}, {"soort"}),
    "stappen":    ({"stappen"}, {"titel", "breedte", "hoogte"}),
    "stippen":    ({}, {"rijen", "kolommen", "afwisselen"}),
    "familie":    ({"totaal", "delen"}, set()),
    "breukdelen": ({"teller", "noemer"}, {"tellerTekst", "noemerTekst"}),
    "strook":     ({"delen"}, {"gekleurd", "breedte", "hoogte", "verhoudingen", "onderschrift"}),
    "cirkel":     ({"delen"}, {"gekleurd", "straal", "verhoudingen", "onderschrift"}),
    "rechthoek":  ({"rijen", "kolommen"}, {"gekleurd", "vak", "onderschrift"}),
    "afbeelding": ({"bron"}, {"alt", "hoogte"}),
    "schrijfvak": ({}, {"label", "lijnen", "breedte", "hoogte"}),
    "breukvak":   ({}, {"namen"}),
    "keuzes":     ({"opties"}, {"kolommen"}),
    "antwoord":   ({}, {"tekst", "blokken"}),
    "kolommen":   ({"kolommen"}, {"breedtes"}),
    "naast":      ({"blokken"}, {"vul"}),
    "raster":     ({"blokken"}, {"kolommen"}),
    "html":       ({"html"}, set()),
}
KEUZES = {
    "tekst": {"klein", "groot", "kop"},
    "som": {"klein", "groot"},
    "label": {"goed", "fout", "neutraal"},
    "schrijfvak": {"hokjes", "lijnen", "leeg"},
}


class Verslag:
    def __init__(self):
        self.fouten, self.waarschuwingen = [], []

    def fout(self, waar, t):
        self.fouten.append(f"{waar}: {t}")

    def let_op(self, waar, t):
        self.waarschuwingen.append(f"{waar}: {t}")


def controleer_blok(b, waar, v, map_):
    if not isinstance(b, dict):
        v.fout(waar, "een blok moet een object zijn ({...})")
        return
    t = b.get("type")
    if t not in BLOKKEN:
        v.fout(waar, f"onbekend bloktype {t!r} (zie LESFORMAAT.md)")
        return
    nodig, mag = BLOKKEN[t]
    for k in nodig:
        if k not in b or b[k] in ("", None, []):
            v.fout(waar, f"{t}: veld '{k}' ontbreekt")
    for k in b:
        if k != "type" and k not in nodig and k not in mag:
            v.let_op(waar, f"{t}: onbekend veld '{k}' wordt genegeerd")
    if t in KEUZES:
        veld = {"tekst": "grootte", "som": "grootte", "label": "soort", "schrijfvak": "lijnen"}[t]
        if veld in b and b[veld] not in KEUZES[t]:
            v.fout(waar, f"{t}: '{veld}' moet een van {sorted(KEUZES[t])} zijn")
    if t in ("strook", "cirkel", "rechthoek"):
        n = b.get("delen") if t != "rechthoek" else (b.get("rijen", 0) * b.get("kolommen", 0))
        for g in b.get("gekleurd", []):
            if not isinstance(g, int) or g < 1 or (isinstance(n, int) and g > n):
                v.fout(waar, f"{t}: gekleurd stukje {g!r} bestaat niet (tel vanaf 1 tot {n})")
        if "verhoudingen" in b and len(b["verhoudingen"]) != b.get("delen"):
            v.fout(waar, f"{t}: 'verhoudingen' moet {b.get('delen')} getallen hebben")
    if t == "afbeelding":
        bron = str(b.get("bron", ""))
        if "/" in bron or ".." in bron or ":" in bron:
            v.fout(waar, "afbeelding: 'bron' is alleen een bestandsnaam in de lesmap")
        elif not (map_ / bron).exists():
            v.fout(waar, f"afbeelding: bestand '{bron}' staat niet in de lesmap")
    if t == "keuzes":
        opties = b.get("opties", [])
        if not isinstance(opties, list) or not 2 <= len(opties) <= 6:
            v.fout(waar, "keuzes: 2 tot 6 opties")
        else:
            for i, o in enumerate(opties):
                if not isinstance(o, dict) or not o.get("tekst"):
                    v.fout(waar, f"keuzes: optie {i + 1} heeft geen 'tekst'")
            if sum(1 for o in opties if isinstance(o, dict) and o.get("goed")) == 0:
                v.let_op(waar, "keuzes: geen optie met \"goed\": true")
    if t == "familie" and (not isinstance(b.get("delen"), list) or len(b["delen"]) != 2):
        v.fout(waar, "familie: 'delen' moet twee getallen zijn")
    if t == "stappen" and not isinstance(b.get("stappen"), list):
        v.fout(waar, "stappen: 'stappen' moet een lijst zijn")
    if t == "html":
        v.let_op(waar, "html-blok gebruikt; liever een gewoon bloktype als dat kan")
        if re.search(r"<script|on\w+\s*=", str(b.get("html", "")), re.I):
            v.fout(waar, "html: geen scripts of on...-attributen")
    # geneste blokken
    if t in ("naast", "raster"):
        for i, x in enumerate(b.get("blokken", [])):
            controleer_blok(x, f"{waar} > {t}[{i + 1}]", v, map_)
    if t == "antwoord":
        if not b.get("tekst") and not b.get("blokken"):
            v.fout(waar, "antwoord: 'tekst' of 'blokken' nodig")
        for i, x in enumerate(b.get("blokken", [])):
            if isinstance(x, dict) and x.get("type") in ("antwoord", "kolommen", "schrijfvak", "keuzes"):
                v.fout(waar, f"antwoord: geen {x.get('type')} binnen een antwoord")
            controleer_blok(x, f"{waar} > antwoord[{i + 1}]", v, map_)
    if t == "kolommen":
        k = b.get("kolommen", [])
        if not isinstance(k, list) or not 2 <= len(k) <= 3:
            v.fout(waar, "kolommen: 2 of 3 kolommen")
            return
        if "breedtes" in b and len(b["breedtes"]) != len(k):
            v.fout(waar, "kolommen: evenveel 'breedtes' als kolommen")
        for i, kol in enumerate(k):
            if not isinstance(kol, list):
                v.fout(waar, f"kolommen: kolom {i + 1} moet een lijst met blokken zijn")
                continue
            for j, x in enumerate(kol):
                if isinstance(x, dict) and x.get("type") == "kolommen":
                    v.fout(waar, "kolommen: geen kolommen binnen kolommen")
                controleer_blok(x, f"{waar} > kolom {i + 1}[{j + 1}]", v, map_)


def controleer_les(f, v):
    map_ = f.parent
    try:
        les = json.loads(f.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        v.fout(str(f.relative_to(ROOT)), f"geen geldige JSON ({e})")
        return None
    w = map_.name
    if not re.fullmatch(r"[a-z0-9]+(-[a-z0-9]+)*", w):
        v.fout(w, "mapnaam alleen kleine letters, cijfers en streepjes")
    if les.get("id") != w:
        v.fout(w, f"id '{les.get('id')}' moet gelijk zijn aan de mapnaam")
    for k in VERPLICHT:
        if not les.get(k):
            v.fout(w, f"veld '{k}' ontbreekt")
    for k in les:
        if k not in LESVELDEN:
            v.let_op(w, f"onbekend veld '{k}'")
    if "gemaakt" in les and not re.fullmatch(r"\d{4}-\d{2}-\d{2}", str(les["gemaakt"])):
        v.fout(w, "'gemaakt' als JJJJ-MM-DD")
    paginas = les.get("paginas", [])
    if not isinstance(paginas, list):
        v.fout(w, "'paginas' moet een lijst zijn")
        return les
    fases = []
    for i, p in enumerate(paginas):
        waar = f"{w} p{i + 1}"
        if not isinstance(p, dict):
            v.fout(waar, "pagina moet een object zijn")
            continue
        if p.get("fase") not in FASES:
            v.fout(waar, f"fase {p.get('fase')!r} moet een van {sorted(FASES)} zijn")
        fases.append(p.get("fase"))
        for k in p:
            if k not in PAGINAVELDEN:
                v.let_op(waar, f"onbekend paginaveld '{k}'")
        if p.get("achtergrond") not in (None, "", "hok", "lijn"):
            v.fout(waar, "achtergrond: '', 'hok' of 'lijn'")
        if not p.get("blokken") and not p.get("titel"):
            v.let_op(waar, "lege pagina (geen titel, geen blokken)")
        for j, b in enumerate(p.get("blokken", [])):
            controleer_blok(b, f"{waar} blok {j + 1}", v, map_)
    if les.get("edi"):
        if "lesdoel" not in fases:
            v.let_op(w, "EDI-les zonder lesdoel-pagina")
        if "check" not in fases:
            v.let_op(w, "EDI-les zonder check-pagina")
        volgorde = ["lesdoel", "voorkennis", "instructie", "voordoen", "samen", "check", "zelfstandig", "afsluiting"]
        rang = [volgorde.index(x) for x in fases if x in volgorde]
        if rang != sorted(rang):
            v.let_op(w, "fases staan niet in de EDI-volgorde (mag, maar klopt het?)")
    return les


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    schrijven = "--alleen-controle" not in sys.argv
    v = Verslag()
    lessen = []
    for f in sorted(LESSEN.glob("*/les.json")):
        if args and f.parent.name not in args:
            # andere lessen alleen lezen voor de catalogus
            try:
                lessen.append(json.loads(f.read_text(encoding="utf-8")))
            except json.JSONDecodeError:
                v.fout(f.parent.name, "geen geldige JSON")
            continue
        les = controleer_les(f, v)
        if les:
            lessen.append(les)
    for a in args:
        if not (LESSEN / a / "les.json").exists():
            v.fout(a, "lessen/<id>/les.json bestaat niet")

    for t in v.waarschuwingen:
        print("  let op:", t)
    if v.fouten:
        print("FOUTEN:")
        for t in v.fouten:
            print("  -", t)
        sys.exit(1)
    if schrijven:
        cat = {"lessen": sorted(
            [{k: l[k] for k in CATALOGUSVELDEN if k in l} for l in lessen],
            key=lambda l: (l.get("vak", ""), l.get("titel", "")))}
        (LESSEN / "catalogus.json").write_text(json.dumps(cat, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"In orde: {len(lessen)} les(sen)" + (", catalogus bijgewerkt" if schrijven else ""))


if __name__ == "__main__":
    main()
