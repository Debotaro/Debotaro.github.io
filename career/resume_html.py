"""Create a self-contained, responsive companion with the PDF's linear content order."""
from pathlib import Path
import base64
import html
import re

ROOT = Path(__file__).resolve().parents[1]


def esc(value):
    return html.escape(str(value), quote=True)


def link(label, url):
    return f'<a href="{esc(url)}">{esc(label)}</a>' if url else esc(label)


def build_html(data, output_dir):
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    logo_path = ROOT / "assets/debotaro-logo.png"
    logo = ""
    if logo_path.exists():
        encoded = base64.b64encode(logo_path.read_bytes()).decode("ascii")
        logo = f'<img src="data:image/png;base64,{encoded}" alt="" width="48" height="48">'
    contacts = [esc(data["location"])] if data.get("location") else []
    if data.get("phone"):
        contacts.append(link(data["phone"], "tel:" + re.sub(r"[^+\d]", "", data["phone"])))
    if data.get("email"):
        contacts.append(link(data["email"], "mailto:" + data["email"]))
    profiles = [link("Portfolio / debotaro.github.io", data["portfolio"])]
    for profile in data.get("profiles", []):
        label = "GitHub / Debotaro" if "github.com" in profile["url"] else "LinkedIn / deborajsarkar"
        profiles.append(link(label, profile["url"]))

    sections = [f'<section><h2>Profile</h2><p>{esc(data["summary"])}</p></section>']
    projects = '<section><h2>Selected personal projects</h2>'
    for item in data.get("projects", []):
        title = esc(item["name"])
        if item.get("descriptor"):
            title += ' <span>/ ' + esc(item["descriptor"]) + '</span>'
        metadata = esc(item.get("stack", ""))
        if item.get("url"):
            metadata += " | " + link("Live demo", item["url"])
        paragraphs = "".join('<p>' + esc(value) + '</p>' for value in item.get("bullets", []))
        projects += f'<article class="project"><h3>{title}</h3><p class="meta">{metadata}</p>{paragraphs}</article>'
    if data.get("additional"):
        projects += '<p>' + esc(data["additional"]) + '</p>'
    sections.append(projects + '</section>')

    skills = '<section><h2>' + esc(data.get("skills_heading", "Technologies used in projects")) + '</h2>'
    for item in data.get("skills", []):
        value = f'<strong>{esc(item["label"])}:</strong> {esc(item["text"])}' if isinstance(item, dict) else esc(item)
        skills += '<p>' + value + '</p>'
    sections.append(skills + '</section>')

    experience = '<section><h2>Professional experience</h2>'
    for item in data.get("experience", []):
        if not isinstance(item, dict):
            experience += '<p>' + esc(item) + '</p>'
            continue
        metadata = " | ".join(str(item[key]) for key in ("dates", "location") if item.get(key))
        bullets = "".join('<li>' + esc(value) + '</li>' for value in item.get("bullets", []))
        experience += f'<article><h3>{esc(item.get("title", ""))} <span>/ {esc(item.get("organization", ""))}</span></h3><p class="meta">{esc(metadata)}</p><ul>{bullets}</ul></article>'
    sections.append(experience + '</section>')

    education = '<section><h2>Education</h2>'
    for item in data.get("education", []):
        if isinstance(item, dict):
            metadata = " | ".join(str(item[key]) for key in ("institution", "dates") if item.get(key))
            education += f'<article><h3 class="degree">{esc(item.get("qualification", ""))}</h3><p class="meta">{esc(metadata)}</p></article>'
        else:
            education += '<p>' + esc(item) + '</p>'
    sections.append(education + '</section>')

    selected = [item for item in data.get("certifications", []) if not isinstance(item, dict) or item.get("selected") is not False]
    if selected:
        certificates = '<section><h2>' + esc(data.get("certifications_heading", "Selected Coursera certificates")) + '</h2>'
        for item in selected:
            if isinstance(item, dict):
                certificates += '<p class="certificate">' + link(item["name"], item["url"]) + ' <span class="meta">| ' + esc(item.get("date", "")) + '</span></p>'
            else:
                certificates += '<p>' + esc(item) + '</p>'
        sections.append(certificates + '</section>')
    availability = " ".join(str(data[key]) for key in ("process", "availability") if data.get(key))
    footer = '<footer><p><strong>Availability:</strong> ' + esc(availability) + '</p></footer>' if availability else ""
    css = """
:root{--ink:#172c28;--teal:#28594f;--muted:#4d5e59;--line:#cedad4;--peach:#e5a180;--pale:#f4f7f3}
*{box-sizing:border-box}body{margin:0;background:#e8ede9;color:var(--ink);font:10.2pt/1.32 'Segoe UI',Calibri,Arial,sans-serif}a{color:var(--teal);text-decoration:none;text-underline-offset:3px}a:hover{text-decoration:underline}a:focus-visible,button:focus-visible{outline:2px solid var(--teal);outline-offset:4px}
.controls{max-width:210mm;margin:22px auto 14px;padding:0 16px;display:flex;justify-content:space-between;gap:16px;align-items:center;font-size:13px}.controls p{margin:0}.actions{display:flex;gap:10px}.actions a,.actions button{font:600 13px/1 'Segoe UI',sans-serif;border:1px solid var(--teal);padding:12px 15px;background:white;color:var(--teal);border-radius:4px;cursor:pointer}.actions button{background:var(--teal);color:white}
.print-note{max-width:210mm;padding:0 16px;margin:0 auto 18px;font-size:12px;color:var(--muted);line-height:1.5}.sheet{width:210mm;min-height:297mm;margin:0 auto 30px;padding:42pt 44pt 36pt;background:white;box-shadow:0 14px 48px #172c281c}.masthead{position:relative;margin-bottom:16pt;padding-bottom:13pt;border-bottom:.6pt solid var(--line)}.masthead:after{content:'';position:absolute;bottom:-1pt;left:0;width:35pt;height:2.5pt;background:var(--peach)}.mark{position:absolute;right:0;top:0;width:42pt;height:42pt;background:var(--ink);border-radius:6pt;padding:3pt;display:grid;place-items:center}.mark img{display:block;width:36pt;height:36pt;object-fit:contain}h1{font-size:29pt;line-height:1.13;letter-spacing:-.7pt;margin:0 50pt 4pt 0;font-weight:700}.role{font-size:12.5pt;line-height:1.3;font-weight:700;color:var(--teal);margin:0 0 10pt}.role span{font-size:10pt;font-weight:400;color:var(--muted)}.contact,.profiles{font-size:9.5pt;line-height:1.32;margin:0 0 4pt}.profiles{margin-bottom:0}
section{margin:0 0 13pt}h2{font-size:8.6pt;line-height:1.2;text-transform:uppercase;letter-spacing:.1pt;color:var(--teal);margin:0 0 9pt;display:flex;gap:12pt;align-items:center;white-space:nowrap}h2:after{content:'';height:.55pt;background:var(--line);flex:1}h3{font-size:12.1pt;line-height:1.28;margin:0 0 2pt;font-weight:700}h3 span{font-size:10pt;font-weight:400;color:var(--muted)}p{margin:0 0 3pt}.meta{font-size:9.4pt;line-height:1.31;color:var(--muted);margin-bottom:4pt}.project{margin-bottom:11pt;break-inside:avoid}.project:last-child{margin-bottom:0}.degree{font-size:10.5pt;line-height:1.3}.certificate{font-size:9.7pt;line-height:1.32;margin-bottom:3pt}ul{padding-left:12pt;margin:5pt 0 0}li{padding-left:1pt;margin-bottom:2pt}footer{margin:14pt -8pt 0;padding:8pt;border-left:2.5pt solid var(--peach);border-radius:4pt;background:var(--pale);font-size:9.6pt;line-height:1.3;break-inside:avoid}footer p{margin:0}
@page{size:A4;margin:0}@media print{body{background:white;margin:0;print-color-adjust:exact;-webkit-print-color-adjust:exact}.controls,.print-note{display:none}.sheet{margin:0;box-shadow:none;width:210mm;min-height:297mm}section{break-inside:avoid}}
@media screen and (max-width:850px){.sheet{width:calc(100% - 24px);min-height:0;padding:30px;margin-bottom:20px}.controls{margin-inline:12px;padding:0}.print-note{padding-inline:24px}h1{font-size:27pt}.contact,.profiles{line-height:1.6}}
@media screen and (max-width:520px){body{font-size:10.5pt}.controls{align-items:flex-start;flex-direction:column}.sheet{padding:24px}h1{font-size:25pt;margin-right:34pt}.mark{width:32pt;height:32pt}.mark img{width:26pt;height:26pt}.role{margin-bottom:12pt}.contact,.profiles{font-size:9.2pt;overflow-wrap:anywhere}h2{font-size:8.3pt;gap:8pt;white-space:normal}h3{font-size:11.5pt}h3 span{display:block;font-size:10pt;margin-top:2pt}section{margin-bottom:18pt}.project{margin-bottom:14pt}footer{font-size:9.5pt}}
"""
    document = f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="author" content="{esc(data["name"])}"><meta name="description" content="Frontend resume with verified experience, ongoing Computer Science education and selected AI-assisted personal projects."><title>{esc(data["name"])} - Frontend Developer Resume</title><style>{css}</style></head>
<body><div class="controls"><p>Debotaro / Resume</p><div class="actions"><a href="Deboraj-Sarkar-Resume.pdf" download>Download PDF</a><button type="button" onclick="window.print()">Print resume</button></div></div><p class="print-note">For consistent printing, download the PDF and use A4 at Actual size (100%). Choose High/Best quality in the printer settings; the document cannot override Draft mode. For browser printing, disable headers and footers.</p>
<main class="sheet"><header class="masthead"><div class="mark">{logo}</div><h1>{esc(data["name"])}</h1><p class="role">{esc(data["title"])} <span>/ {esc(data.get("alias", ""))}</span></p><p class="contact">{" | ".join(contacts)}</p><p class="profiles">{" | ".join(profiles)}</p></header>{"".join(sections)}{footer}</main></body></html>'''
    path = output_dir / "Deboraj-Sarkar-Resume.html"
    path.write_text(document, encoding="utf-8")
    return path
