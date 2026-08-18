"""provenance tool. reads the official rgesn evaluation spreadsheet and writes
rgesn-2024-v2.source.json, the input the pack module is generated from.

    curl -O https://ecoresponsable.numerique.gouv.fr/docs/2024/rgesn-mai2024/rgesn_2024_outil_declaration_ecoconception.ods
    python3 extract-from-ods.py rgesn_2024_outil_declaration_ecoconception.ods

the spreadsheet is the machine-readable form the publishers ship alongside the
pdf. statements are taken from its "libellé du critère" column verbatim: this
tool never rewrites them.
"""

import json
import re
import sys
import zipfile
from xml.etree import ElementTree as ET

NS = {
    "table": "urn:oasis:names:tc:opendocument:xmlns:table:1.0",
    "text": "urn:oasis:names:tc:opendocument:xmlns:text:1.0",
}
CRITERION_ID = re.compile(r"^\d{1,2}\.\d{1,2}$")
FAMILY_HEADING = re.compile(r"^(\d)\s*[-–]\s*(.+?)(?:\s*\(\d/\d\))?$")
PRIORITIES = ("Prioritaire", "Recommandé", "Modéré")


def cell_text(cell):
    return "\n".join(
        "".join(p.itertext()) for p in cell.iter(f"{{{NS['text']}}}p")
    ).strip()


def main(path):
    root = ET.fromstring(zipfile.ZipFile(path).read("content.xml"))
    families, criteria = {}, {}

    for sheet in root.iter(f"{{{NS['table']}}}table"):
        if not re.match(r"^\d ", sheet.get(f"{{{NS['table']}}}name") or ""):
            continue
        for row in sheet.iter(f"{{{NS['table']}}}table-row"):
            cells = []
            for cell in row.findall(f"{{{NS['table']}}}table-cell"):
                repeated = int(cell.get(f"{{{NS['table']}}}number-columns-repeated", "1"))
                cells.extend([cell_text(cell)] * min(repeated, 4))
            cells = [value for value in cells if value]
            if not cells:
                continue

            heading = FAMILY_HEADING.match(cells[0])
            if heading:
                families[heading.group(1)] = heading.group(2).strip()
                cells = cells[1:]

            if len(cells) >= 2 and CRITERION_ID.match(cells[0]):
                statement = re.sub(r"\s+", " ", cells[1].replace(" ", " ").replace(" ", " ")).strip()
                if cells[0] not in criteria and statement.endswith("?"):
                    criteria[cells[0]] = {
                        "statement": statement,
                        "priority": cells[2] if len(cells) > 2 and cells[2] in PRIORITIES else None,
                    }

    assert len(criteria) == 78, f"expected 78 criteria, found {len(criteria)}"
    assert len(families) == 9, f"expected 9 families, found {len(families)}"
    json.dump(
        {"families": families, "criteria": criteria},
        open("rgesn-2024-v2.source.json", "w", encoding="utf-8"),
        ensure_ascii=False,
        indent=1,
    )
    print(f"{len(criteria)} criteria, {len(families)} families")


if __name__ == "__main__":
    main(sys.argv[1])
