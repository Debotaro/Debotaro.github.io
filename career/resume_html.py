"""Create the responsive, printable companion to the branded resume PDF."""
from pathlib import Path
import base64
import html
import re


ROOT = Path(__file__).resolve().parents[1]


def esc(value):
    return html.escape(str(value), quote=True)


def link(label, url, class_name=""):
    extra = f' class="{esc(class_name)}"' if class_name else ""
    return f'<a href="{esc(url)}"{extra}>{esc(label)}</a>' if url else esc(label)


def build_html(data, output_dir):
    """Write one self-contained HTML resume using the confirmed source data."""
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    logo_path = ROOT / "assets" / "debotaro-logo.png"
    logo = ""
    if logo_path.exists():
        encoded = base64.b64encode(logo_path.read_bytes()).decode("ascii")
        logo = f'<img class="monogram" src="data:image/png;base64,{encoded}" alt="" width="68" height="68">'

    name = str(data.get("name", ""))
    name_parts = name.split(" ", 1)
    display_name = esc(name_parts[0])
    if len(name_parts) > 1:
        display_name += " <em>" + esc(name_parts[1]) + "</em>"

    contacts = []
    if data.get("email"):
        contacts.append(link(data["email"], "mailto:" + data["email"]))
    if data.get("phone"):
        phone = str(data["phone"])
        contacts.append(link(phone, "tel:" + re.sub(r"[^+\d]", "", phone)))

    profile_links = []
    if data.get("portfolio"):
        visible_url = re.sub(r"^https?://", "", data["portfolio"]).rstrip("/")
        profile_links.append(f'<p>{link(visible_url, data["portfolio"])}</p>')
    profile_links.extend(f'<p>{link(item["label"], item["url"])}</p>' for item in data.get("profiles", []))
    details = '<section aria-labelledby="details-title"><h2 id="details-title">The details</h2>'
    if data.get("location"):
        details += f'<p class="location">{esc(data["location"])}</p>'
    details += '<div class="profile-links">' + "".join(profile_links) + '</div></section>'

    skills = []
    for item in data.get("skills", []):
        if isinstance(item, dict):
            heading = "Technologies used in projects" if item.get("label") == "Frontend" else item.get("label", "Tools")
            skills.append(f'<section><h2>{esc(heading)}</h2><p>{esc(item.get("text", ""))}</p></section>')
        else:
            skills.append(f'<p>{esc(item)}</p>')

    education_items = []
    for item in data.get("education", []):
        if isinstance(item, dict):
            education_items.append('<article class="education-entry">'
                                   f'<h3>{esc(item.get("qualification", ""))}</h3>'
                                   f'<p>{esc(item.get("institution", ""))}</p>'
                                   f'<p class="meta">{esc(item.get("dates", ""))}</p>'
                                   + (f'<p>{esc(item["detail"])}</p>' if item.get("detail") else "")
                                   + '</article>')
        else:
            education_items.append(f'<p>{esc(item)}</p>')
    education = '<section><h2>Education</h2>' + "".join(education_items) + '</section>' if education_items else ""

    certificate_items = []
    for item in data.get("certifications", []):
        if isinstance(item, dict):
            if item.get("selected") is False:
                continue
            certificate_items.append('<article class="certificate">'
                                     f'<h3>{link(item.get("name", ""), item.get("url"))}</h3>'
                                     f'<p class="meta">{esc(item.get("issuer", ""))}<br>{esc(item.get("date", ""))}</p>'
                                     '</article>')
        else:
            certificate_items.append(f'<p>{esc(item)}</p>')
    certificates = '<section><h2>Selected Coursera certificates</h2>' + "".join(certificate_items) + '</section>' if certificate_items else ""

    project_items = []
    for number, item in enumerate(data.get("projects", []), 1):
        demo = link("Live demo", item.get("url"), "demo-link") if item.get("url") else ""
        story = "".join(f'<p>{esc(text)}</p>' for text in item.get("bullets", []))
        project_items.append('<article class="project">'
                             f'<span class="project-number" aria-hidden="true">{number:02d}</span>'
                             '<div class="project-copy">'
                             f'<div class="project-title"><h3>{esc(item.get("name", ""))}</h3>{demo}</div>'
                             f'<p class="stack">{esc(item.get("stack", ""))}</p>{story}'
                             '</div></article>')
    projects = '<section class="selected-projects"><h2>Selected projects</h2>' + "".join(project_items)
    if data.get("additional"):
        projects += f'<p class="additional">{esc(data["additional"])}</p>'
    projects += '</section>'

    experience_items = []
    for item in data.get("experience", []):
        if isinstance(item, dict):
            metadata = " | ".join(str(value) for value in (item.get("dates"), item.get("location")) if value)
            bullets = "".join(f'<li>{esc(text)}</li>' for text in item.get("bullets", []))
            experience_items.append('<article class="experience-entry">'
                                    f'<h3>{esc(item.get("title", ""))} <span class="organization">/ {esc(item.get("organization", ""))}</span></h3>'
                                    f'<p class="meta">{esc(metadata)}</p>'
                                    + ('<ul>' + bullets + '</ul>' if bullets else "") + '</article>')
        else:
            experience_items.append(f'<p>{esc(item)}</p>')
    experience = '<section class="experience"><h2>Experience</h2>' + "".join(experience_items) + '</section>' if experience_items else ""

    availability = " ".join(str(data[key]) for key in ("process", "availability") if data.get(key))
    footer = f'<footer class="availability"><h2>{esc(data.get("process_heading", "Availability"))}</h2><p>{esc(availability)}</p></footer>' if availability else ""
    css = """
:root{--forest:#101f19;--paper:#f7f6ee;--lime:#d8e9b7;--muted:#55655b;--peach:#ff9d77;--rule:#cbd2c5}
*{box-sizing:border-box}body{margin:0;background:#dfe3da;color:var(--forest);font:10pt/1.35 'Segoe UI',Calibri,Arial,sans-serif}
a{color:inherit;text-decoration:none;text-underline-offset:3px}a:hover{text-decoration:underline}a:focus-visible,button:focus-visible{outline:2px solid #a34c2c;outline-offset:4px}
.controls{max-width:210mm;margin:24px auto 18px;display:flex;justify-content:space-between;align-items:center;gap:16px;padding:0 12px;font-size:13px}
.controls p{margin:0;color:#35473b}.control-actions{display:flex;gap:10px;flex-wrap:wrap}.controls a,.controls button{display:inline-block;font:600 13px/1 'Segoe UI',Calibri,sans-serif;padding:12px 16px;border:1px solid #4e6657;background:transparent;color:var(--forest);border-radius:2px;cursor:pointer}.controls button{background:var(--forest);color:var(--paper)}
.print-note{max-width:210mm;margin:0 auto 18px;padding:0 12px;font-size:13px;line-height:1.5;color:#35473b}.print-note strong{font-weight:600}
.sheet{width:210mm;min-height:297mm;margin:0 auto 32px;background:var(--paper);box-shadow:0 14px 48px #10201822;display:flex;flex-direction:column}
.masthead{height:155pt;flex:none;background:var(--forest);color:var(--paper);padding:24pt 44pt 20pt;position:relative}
.identity-label{margin:0 0 12pt;font-size:8pt;letter-spacing:2.2px;text-transform:uppercase;color:var(--lime);font-weight:600}
.monogram{position:absolute;right:43pt;top:24pt;width:48pt;height:48pt;object-fit:contain;opacity:.98}
h1{font-size:34pt;font-weight:700;letter-spacing:-1.6px;line-height:1.04;margin:0 0 8pt;white-space:nowrap;max-width:420pt}
h1 em{font-family:Georgia,'Times New Roman',serif;font-weight:400;letter-spacing:-1.4px}
.role{margin:0 0 14pt;font-size:13pt;font-weight:500;letter-spacing:-.15px}.role small{font-size:8.5pt;color:var(--lime);font-weight:400;margin-left:10pt;white-space:nowrap}
.header-contact{display:flex;gap:18pt;flex-wrap:wrap;font-size:9pt;line-height:1.3;margin:0}.header-contact a{color:var(--paper)}.header-contact a:first-child{position:relative}.header-contact a:first-child:before{content:'';display:inline-block;width:5pt;height:5pt;margin-right:7pt;background:var(--peach);border-radius:50%}
.columns{display:grid;grid-template-columns:31% minmax(0,1fr);gap:25pt;padding:24pt 44pt 0;flex:1;align-items:start}
.rail{font-size:9.5pt;line-height:1.35;color:var(--muted);min-width:0}.main-column{min-width:0}
section{margin:0 0 19pt;break-inside:avoid}h2{margin:0 0 9pt;padding-bottom:6pt;border-bottom:1px solid var(--rule);color:var(--forest);font-size:8.2pt;line-height:1.3;letter-spacing:1.1px;font-weight:700;text-transform:uppercase}
h3{font-size:10.8pt;line-height:1.28;margin:0 0 3pt;font-weight:700;letter-spacing:-.12px}p{margin:0 0 5pt}.rail h2{font-size:7.8pt;letter-spacing:.75px;margin-bottom:8pt}.rail h3{font-size:9.5pt;line-height:1.35;font-weight:600;margin-bottom:3pt;color:var(--forest)}
.location{margin-bottom:9pt;color:var(--forest)}.profile-links p{margin-bottom:5pt;font-size:8.9pt;overflow-wrap:anywhere}.profile-links a{border-bottom:1px solid #b1beaa}
.education-entry p{margin-bottom:2pt}.meta{font-size:8.8pt;line-height:1.35;color:var(--muted)}.certificate{margin-bottom:11pt}.certificate:last-child{margin-bottom:0}.certificate h3 a{background-image:linear-gradient(#aab99a,#aab99a);background-size:100% 1px;background-repeat:no-repeat;background-position:left bottom}.certificate .meta{font-size:8.5pt;margin-top:3pt}
.profile{margin-bottom:20pt}.profile p{font-size:10.2pt;line-height:1.4}.selected-projects{margin-bottom:18pt}.project{display:flex;gap:10pt;margin-bottom:14pt;break-inside:avoid}.project-number{font:400 18pt/1 Georgia,'Times New Roman',serif;color:#7a8a70;width:23pt;flex:0 0 23pt;margin-top:2pt}.project-copy{min-width:0;flex:1}.project-title{display:flex;align-items:baseline;justify-content:space-between;gap:10pt}.project-title h3{font-size:12pt;letter-spacing:-.3px}.demo-link{font-size:8pt;font-weight:600;white-space:nowrap;border-bottom:1px solid #819375}.stack{font-size:8.7pt;line-height:1.35;color:var(--muted);margin:2pt 0 5pt}.project-copy>p:last-child{margin:0;line-height:1.38}
.additional{font-size:9.2pt;line-height:1.4;color:var(--muted);border-top:1px solid var(--rule);padding-top:9pt;margin:2pt 0 0 33pt}.experience h3{font-size:10.7pt}.organization{font-weight:400}.experience-entry .meta{margin:4pt 0 7pt}.experience ul{padding-left:11pt;margin:0}.experience li{padding-left:1pt;margin-bottom:4pt;line-height:1.37}
.availability{margin:4pt 44pt 22pt;padding:11pt 0 0;border-top:2pt solid var(--forest);display:grid;grid-template-columns:31% minmax(0,1fr);gap:25pt;align-items:baseline;break-inside:avoid}.availability h2{border:0;padding:0;margin:0;font-size:8pt;letter-spacing:1px}.availability p{font-size:9pt;line-height:1.4;color:var(--muted);margin:0}
@page{size:A4;margin:0}
@media print{html,body{margin:0;padding:0;background:var(--paper);print-color-adjust:exact;-webkit-print-color-adjust:exact}.controls,.print-note{display:none}.sheet{width:210mm;min-height:297mm;margin:0;box-shadow:none}.masthead{break-inside:avoid}.columns{padding-top:22pt}.rail section{margin-bottom:14pt}.profile{margin-bottom:18pt}.project{margin-bottom:12pt}.selected-projects{margin-bottom:17pt}.availability{margin-bottom:20pt}a{text-decoration:none}}
@media screen and (max-width:850px){.controls{width:calc(100% - 32px);padding:0}.sheet{width:calc(100% - 32px)}.masthead{padding-inline:30pt}.columns{padding-inline:30pt;gap:20pt;grid-template-columns:31% minmax(0,1fr)}.monogram{right:30pt}.availability{margin-inline:30pt;gap:20pt}.role small{display:block;margin-left:0;margin-top:4pt}.role{margin-bottom:10pt}}
@media screen and (max-width:620px){body{font-size:11pt}.controls{align-items:start;flex-direction:column;margin-bottom:14px}.sheet{width:calc(100% - 24px);min-height:0;margin-bottom:20px}.masthead{height:auto;min-height:190px;padding:24px}.identity-label{font-size:8pt;margin-bottom:17px}.monogram{right:24px;top:24px;width:39pt;height:39pt}h1{font-size:29pt;letter-spacing:-1.4px;white-space:normal;max-width:calc(100% - 36px)}h1 em{letter-spacing:-1.2px}.role{font-size:12pt;margin-bottom:14px}.role small{font-size:9pt;margin-top:5px}.header-contact{font-size:9.3pt;gap:8px 20px;flex-direction:column}.columns{display:flex;flex-direction:column;padding:25px 24px 0;gap:0}.main-column{order:0}.rail{order:1;font-size:10.5pt;width:100%;margin-top:7px;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px}.rail section{margin-bottom:7px}.rail h2{font-size:8.5pt}.rail h3{font-size:10.5pt}.rail .meta,.certificate .meta,.profile-links p{font-size:9.5pt}.rail>section:last-child{grid-column:1/-1}.rail .certificate{max-width:360px}.profile p{font-size:11pt}.project-copy>p:last-child{font-size:10.5pt}.stack{font-size:9pt}.additional{font-size:10pt}.experience-entry .meta{font-size:9.5pt}.availability{margin:20px 24px 25px;display:block;padding-top:13px}.availability h2{margin-bottom:7px}.availability p{font-size:10pt}.demo-link{font-size:8.5pt}}
@media screen and (max-width:400px){.rail{display:block}.rail section{margin-bottom:20px}h1{font-size:26pt}.project{gap:8pt}.project-number{width:18pt;flex-basis:18pt;font-size:16pt}.project-title h3{font-size:11.5pt}.header-contact{font-size:8.6pt}}
"""
    document = f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="author" content="{esc(name)}"><title>{esc(name)} - {esc(data.get("title", ""))} Resume</title>
<meta name="description" content="Professional experience, education and selected AI-assisted portfolio projects by {esc(name)}."><style>{css}</style></head>
<body><div class="controls"><p>Debotaro / Resume</p><div class="control-actions"><a href="Deboraj-Sarkar-Resume.pdf" download>Download PDF</a><button type="button" onclick="window.print()">Print resume</button></div></div>
<p class="print-note"><strong>For best print results:</strong> download the PDF, use A4 at Actual size (100%), and choose High/Best quality in Printer Properties. A document cannot override Draft/Economy mode. For browser printing, enable background graphics and disable browser headers and footers.</p>
<main class="sheet"><header class="masthead">{logo}<p class="identity-label">{esc(data.get("alias", "Debotaro"))} / Resume</p><h1>{display_name}</h1><p class="role">{esc(data.get("title", ""))}<small>Graphic design background</small></p><p class="header-contact">{"".join(contacts)}</p></header>
<div class="columns"><aside class="rail" aria-label="Contact, technologies and qualifications">{details}{"".join(skills)}{education}{certificates}</aside>
<div class="main-column"><section class="profile"><h2>Profile</h2><p>{esc(data.get("summary", ""))}</p></section>{projects}{experience}</div></div>{footer}</main></body></html>'''
    path = output_dir / "Deboraj-Sarkar-Resume.html"
    path.write_text(document, encoding="utf-8")
    return path
