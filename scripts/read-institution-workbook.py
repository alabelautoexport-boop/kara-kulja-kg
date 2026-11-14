"""Read-only XLSX extraction using Python's standard library. Never executes workbook content."""
import json
import sys
import zipfile
import xml.etree.ElementTree as ET

sys.stdout.reconfigure(encoding="utf-8")
ns = {"s": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
with zipfile.ZipFile(sys.argv[1]) as archive:
    strings = []
    if "xl/sharedStrings.xml" in archive.namelist():
        strings = ["".join(node.itertext()) for node in ET.fromstring(
            archive.read("xl/sharedStrings.xml")).findall("s:si", ns)]
    relationships = {node.attrib["Id"]: node.attrib["Target"] for node in ET.fromstring(
        archive.read("xl/_rels/workbook.xml.rels"))}
    result = []
    for sheet in ET.fromstring(archive.read("xl/workbook.xml")).findall("s:sheets/s:sheet", ns):
        target = relationships[sheet.attrib["{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id"]]
        target = target.lstrip("/") if target.startswith("/") else "xl/" + target
        rows = []
        for row in ET.fromstring(archive.read(target)).findall("s:sheetData/s:row", ns):
            cells = {}
            for cell in row.findall("s:c", ns):
                value = cell.find("s:v", ns)
                value = value.text if value is not None else ""
                if cell.attrib.get("t") == "s":
                    value = strings[int(value)] if value else ""
                elif cell.attrib.get("t") == "inlineStr":
                    value = "".join(cell.find("s:is", ns).itertext())
                cells[cell.attrib["r"]] = value
            rows.append({"row": int(row.attrib["r"]), "cells": cells})
        result.append({"name": sheet.attrib["name"], "rows": rows})
print(json.dumps(result, ensure_ascii=False))
