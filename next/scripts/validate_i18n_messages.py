from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MESSAGES_DIR = ROOT / "apps" / "web" / "messages"
LOCALES_TS = ROOT / "apps" / "web" / "i18n" / "locales.ts"
BASE_LOCALE = "en"

PLACEHOLDER_RE = re.compile(r"\{[^{}]+\}")


def fail(message: str) -> None:
    print(f"[i18n:validate] ERROR: {message}")
    sys.exit(1)


def parse_supported_locales() -> list[str]:
    content = LOCALES_TS.read_text(encoding="utf-8")
    match = re.search(r"SUPPORTED_LOCALES\s*=\s*\[(.*?)\]\s*as\s*const", content, re.S)
    if not match:
        fail("Impossibile trovare SUPPORTED_LOCALES in i18n/locales.ts")
    chunk = match.group(1)
    return re.findall(r'"([A-Za-z_]+)"', chunk)


def flatten(node: object, prefix: str = "") -> dict[str, str]:
    out: dict[str, str] = {}
    if isinstance(node, dict):
        for key, value in node.items():
            child_prefix = f"{prefix}.{key}" if prefix else key
            out.update(flatten(value, child_prefix))
    elif isinstance(node, str):
        out[prefix] = node
    else:
        # In questo progetto i messaggi sono stringhe; altri tipi non sono ammessi.
        fail(f"Valore non-stringa trovato in chiave '{prefix}': {type(node).__name__}")
    return out


def placeholders(text: str) -> tuple[str, ...]:
    return tuple(sorted(PLACEHOLDER_RE.findall(text)))


def main() -> None:
    locales = parse_supported_locales()

    missing_files = [loc for loc in locales if not (MESSAGES_DIR / f"{loc}.json").exists()]
    if missing_files:
        fail(f"File lingua mancanti: {', '.join(missing_files)}")

    extra_files = sorted(
        p.stem
        for p in MESSAGES_DIR.glob("*.json")
        if p.stem not in locales
    )
    if extra_files:
        fail(f"File lingua non dichiarati in SUPPORTED_LOCALES: {', '.join(extra_files)}")

    base_path = MESSAGES_DIR / f"{BASE_LOCALE}.json"
    if not base_path.exists():
        fail("File base en.json non trovato")

    base_obj = json.loads(base_path.read_text(encoding="utf-8"))
    base_flat = flatten(base_obj)
    base_keys = set(base_flat)

    errors: list[str] = []

    for locale in locales:
        path = MESSAGES_DIR / f"{locale}.json"
        try:
            obj = json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError as exc:
            errors.append(f"{locale}: JSON non valido ({exc})")
            continue

        flat = flatten(obj)
        keys = set(flat)

        missing = sorted(base_keys - keys)
        extra = sorted(keys - base_keys)
        if missing:
            errors.append(f"{locale}: chiavi mancanti ({len(missing)}), esempio: {', '.join(missing[:5])}")
        if extra:
            errors.append(f"{locale}: chiavi extra ({len(extra)}), esempio: {', '.join(extra[:5])}")

        # Confronto placeholder per tutte le chiavi comuni
        for key in sorted(base_keys & keys):
            base_ph = placeholders(base_flat[key])
            loc_ph = placeholders(flat[key])
            if base_ph != loc_ph:
                errors.append(
                    f"{locale}: placeholder diversi in '{key}' (base={base_ph}, locale={loc_ph})"
                )

    if errors:
        print("[i18n:validate] ERRORI trovati:")
        for err in errors:
            print(f"- {err}")
        sys.exit(1)

    print(f"[i18n:validate] OK: {len(locales)} locale validati, schema e placeholder coerenti con {BASE_LOCALE}.json")


if __name__ == "__main__":
    main()

