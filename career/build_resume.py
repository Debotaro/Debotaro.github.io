"""Build the branded PDF, responsive HTML and editable resume from confirmed facts."""
from pathlib import Path
import argparse
import json
import re

from resume_html import build_html
from resume_layout import build_pdf

ROOT = Path(__file__).resolve().parents[1]


def joined(*values):
    return " | ".join(str(value) for value in values if value)


def md_link(label, url):
    label = str(label).replace("[", "\\[").replace("]", "\\]")
    return f"[{label}]({url})" if url else label


def build_markdown(data):
    """Keep a plain-text, linear reading order alongside the designed document."""
    lines = [f'# {data["name"]}', joined(data["title"], data.get("alias"))]
    contact = []
    if data.get("location"):
        contact.append(data["location"])
    if data.get("phone"):
        contact.append(md_link(data["phone"], "tel:" + re.sub(r"[^+\d]", "", data["phone"])))
    if data.get("email"):
        contact.append(md_link(data["email"], "mailto:" + data["email"]))
    lines.append(" | ".join(contact))
    profiles = [md_link("Portfolio", data["portfolio"])] if data.get("portfolio") else []
    profiles.extend(md_link(profile["label"], profile["url"]) for profile in data.get("profiles", []))
    lines.append(" | ".join(profiles))
    lines.extend(["## Profile", data.get("summary", "")])
    if data.get("skills"):
        lines.append("## " + data.get("skills_heading", "Technologies used in projects"))
        for skill in data["skills"]:
            lines.append(f'**{skill["label"]}:** {skill["text"]}' if isinstance(skill, dict) else str(skill))
    for key, heading in (("experience", "Experience"), ("education", "Education")):
        if not data.get(key):
            continue
        lines.append("## " + heading)
        for item in data[key]:
            if not isinstance(item, dict):
                lines.append(str(item))
                continue
            if key == "experience":
                name = " - ".join(str(item[k]) for k in ("title", "organization") if item.get(k))
                meta = joined(item.get("dates"), item.get("location"))
            else:
                name = item.get("qualification", "")
                meta = joined(item.get("institution"), item.get("dates"))
            lines.extend([f"**{name}**", meta])
            if item.get("detail"):
                lines.append(item["detail"])
            lines.extend("- " + str(text) for text in item.get("bullets", []))
    certificates = [item for item in data.get("certifications", []) if not isinstance(item, dict) or item.get("selected") is not False]
    if certificates:
        lines.append("## " + data.get("certifications_heading", "Coursera credentials"))
        for cert in certificates:
            if isinstance(cert, dict):
                lines.append(md_link(cert.get("name", ""), cert.get("url")) + " - " + joined(cert.get("issuer"), cert.get("date")))
            else:
                lines.append(str(cert))
    if data.get("projects"):
        lines.append("## Selected projects")
        for project in data["projects"]:
            lines.extend(["### " + project["name"], joined(project.get("stack"), md_link("View demo", project["url"]) if project.get("url") else "")])
            lines.extend("- " + str(text) for text in project.get("bullets", []))
        if data.get("additional"):
            lines.append(data["additional"])
    availability = [data[key] for key in ("process", "availability") if data.get(key)]
    if availability:
        lines.extend(["## " + data.get("process_heading", "Availability"), *availability])
    path = ROOT / "career/RESUME.md"
    path.write_text("\n\n".join(str(line) for line in lines if line) + "\n", encoding="utf-8")
    return path


def build(data, output_dir):
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    pdf_path = build_pdf(data, output_dir)
    html_path = build_html(data, output_dir)
    markdown_path = build_markdown(data)
    settings_path = output_dir / "PRINT_SETTINGS.txt"
    settings_path.write_text(
        "DEBOTARO RESUME - PRINT SETTINGS\n\n"
        "Print the PDF directly for consistent embedded fonts and layout.\n"
        "Paper: A4, portrait, one page per sheet.\n"
        "Scale: Actual size / 100%.\n"
        "Printer Properties / Preferences: choose High, Best or the printer's highest document quality.\n"
        "Turn Draft / Economy / Toner Save mode off.\n"
        "Select the paper type that matches the loaded paper; choose color for the branded design.\n"
        "Keep normal PDF/vector printing; rasterize only if resolving a printer compatibility problem.\n\n"
        "The PDF requests no print scaling in compatible readers. It cannot force driver quality,\n"
        "resolution, paper type or ink settings, or override a recipient's Draft mode.\n"
        "Do not print the PNG preview or a screenshot instead of the PDF.\n\n"
        "For HTML/browser printing: A4, 100%, background graphics on, headers and footers off.\n\n"
        "File specifications: exact A4, selectable vector text and line art, embedded TrueType fonts,\n"
        "lossless compression and the original 1254px logo (about 2100 PPI at its 43pt PDF size).\n"
        "This is a general-purpose color PDF; no PDF/X compliance or press-specific CMYK profile is claimed.\n\n"
        "Printer quality guidance: https://support.hp.com/in-en/document/ish_2441805-2331028-16\n"
        "PDF sizing guidance: https://helpx.adobe.com/acrobat/desktop/print-documents/set-up-and-print-pdfs/page-size.html\n",
        encoding="utf-8")
    print(f"Created {pdf_path}, {html_path}, {markdown_path} and {settings_path}")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output-dir", type=Path, default=ROOT / "output/pdf",
                        help="Directory for the generated PDF and HTML (default: output/pdf)")
    args = parser.parse_args()
    data = json.loads((ROOT / "career/resume.json").read_text(encoding="utf-8-sig"))
    build(data, args.output_dir)


if __name__ == "__main__":
    main()
