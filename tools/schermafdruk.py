#!/usr/bin/env python3
"""Lesbord — maakt van elke pagina van een les een schermafdruk, om de opmaak te controleren.

Gebruik (vanuit de map van de repository, Playwright nodig: pip install playwright):
    python3 tools/schermafdruk.py <les-id> [uitmap]

Schrijft per pagina pNN.png (en pNN-antwoord.png als er een antwoord is) naar de uitmap
(standaard: /tmp/lesbord/<les-id>). Meldt pagina's waar de inhoud niet op het vel past.
Zet LESBORD_CHROMIUM als Playwright geen eigen browser heeft.
"""
import functools
import http.server
import json
import os
import pathlib
import sys
import threading

ROOT = pathlib.Path(__file__).resolve().parent.parent


class Stil(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(2)
    les_id = sys.argv[1]
    uit = pathlib.Path(sys.argv[2] if len(sys.argv) > 2 else f"/tmp/lesbord/{les_id}")
    uit.mkdir(parents=True, exist_ok=True)
    les = json.loads((ROOT / "lessen" / les_id / "les.json").read_text(encoding="utf-8"))

    from playwright.sync_api import sync_playwright

    server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(Stil, directory=str(ROOT)))
    threading.Thread(target=server.serve_forever, daemon=True).start()
    basis = f"http://127.0.0.1:{server.server_address[1]}"
    problemen = []
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(executable_path=os.environ.get("LESBORD_CHROMIUM") or None)
            page = browser.new_page(viewport={"width": 1600, "height": 960})
            fouten = []
            page.on("pageerror", lambda e: fouten.append(str(e)))
            for i in range(1, len(les["paginas"]) + 1):
                for antwoord in (False, True):
                    url = f"{basis}/bord.html?les={les_id}&pagina={i}" + ("&antwoord=1" if antwoord else "")
                    page.goto(url)
                    page.wait_for_selector("body[data-klaar='1']", timeout=10000)
                    page.wait_for_timeout(250)
                    heeft = page.evaluate("!document.getElementById('antwoordknop').hidden")
                    if antwoord and not heeft:
                        continue
                    naam = f"p{i:02d}" + ("-antwoord" if antwoord else "") + ".png"
                    page.screenshot(path=str(uit / naam))
                    if not antwoord:
                        if page.evaluate("document.body.hasAttribute('data-overloop')"):
                            problemen.append(f"pagina {i}: inhoud past niet op het vel")
                        if page.evaluate("!!document.querySelector('#les .lfout')"):
                            t = page.evaluate("[...document.querySelectorAll('#les .lfout')].map(e=>e.textContent).join('; ')")
                            problemen.append(f"pagina {i}: {t}")
            problemen += [f"scriptfout: {f}" for f in fouten]
            browser.close()
    finally:
        server.shutdown()
    print(f"Schermafdrukken in {uit}")
    if problemen:
        print("PROBLEMEN:")
        for t in problemen:
            print("  -", t)
        sys.exit(1)
    print("Alle pagina's passen op het vel.")


if __name__ == "__main__":
    main()
