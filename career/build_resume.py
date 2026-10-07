"""Build the résumé PDF, printable HTML and editable Markdown from confirmed facts."""
from pathlib import Path
import json
import html
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, KeepTogether

ROOT = Path(__file__).resolve().parents[1]
DATA = json.loads((ROOT / "career/resume.json").read_text(encoding="utf-8-sig"))
OUT = ROOT / "downloads"
OUT.mkdir(exist_ok=True)
FONT_ROOT = Path("C:/Windows/Fonts")
if (FONT_ROOT / "arial.ttf").exists():
    pdfmetrics.registerFont(TTFont("ResumeSans", str(FONT_ROOT / "arial.ttf")))
    pdfmetrics.registerFont(TTFont("ResumeSansBold", str(FONT_ROOT / "arialbd.ttf")))
    pdfmetrics.registerFontFamily("ResumeSans", normal="ResumeSans", bold="ResumeSansBold")
    FONT, BOLD = "ResumeSans", "ResumeSansBold"
else:
    FONT, BOLD = "Helvetica", "Helvetica-Bold"

def esc(value):
    return html.escape(str(value), quote=True)

def link(label, url):
    return f'<link href="{esc(url)}" color="#000000">{esc(label)}</link>'

styles = {
    "name": ParagraphStyle("Name", fontName=BOLD, fontSize=24, leading=29, textColor=colors.black, spaceAfter=3),
    "role": ParagraphStyle("Role", fontName=FONT, fontSize=12, leading=17, textColor=colors.black, spaceAfter=8),
    "contact": ParagraphStyle("Contact", fontName=FONT, fontSize=9, leading=13, textColor=colors.black, spaceAfter=2),
    "section": ParagraphStyle("Section", fontName=BOLD, fontSize=11, leading=15, textColor=colors.black, spaceBefore=14, spaceAfter=6, keepWithNext=True),
    "body": ParagraphStyle("Body", fontName=FONT, fontSize=10, leading=14, textColor=colors.black, spaceAfter=4),
    "project": ParagraphStyle("Project", fontName=BOLD, fontSize=10.7, leading=15, textColor=colors.black, spaceAfter=2, keepWithNext=True),
    "meta": ParagraphStyle("Meta", fontName=FONT, fontSize=9, leading=13, textColor=colors.HexColor("#303030"), spaceAfter=4, keepWithNext=True),
    "bullet": ParagraphStyle("Bullet", fontName=FONT, fontSize=10, leading=14, leftIndent=11, firstLineIndent=-9, spaceAfter=3),
    "note": ParagraphStyle("Note", fontName=FONT, fontSize=9.4, leading=13, textColor=colors.HexColor("#303030"), spaceAfter=5),
}

story = []
def p(text, style="body"):
    return Paragraph(text, styles[style])
def heading(text):
    story.append(p(esc(text), "section"))

story.extend([
    p(esc(DATA["name"]), "name"),
    p(f'{esc(DATA["title"])} | {esc(DATA["alias"])}', "role"),
    p(link(DATA["email"], "mailto:" + DATA["email"]) + " | " + link("debotaro.github.io", DATA["portfolio"]), "contact"),
    p(" | ".join(link(item["label"], item["url"]) for item in DATA["profiles"]), "contact"),
])
heading("Profile")
story.append(p(esc(DATA["summary"])))
heading("Technical skills")
for item in DATA["skills"]:
    story.append(p(f'<b>{esc(item["label"])}</b>  {esc(item["text"])}'))

for section, title in [("experience", "Experience"), ("education", "Education"), ("certifications", "Certifications")]:
    if DATA.get(section):
        heading(title)
        for item in DATA[section]:
            story.append(p(esc(item)))

heading("Selected projects")
for project in DATA["projects"]:
    block = [p(esc(project["name"]), "project"), p(esc(project["stack"]) + " | " + link("View demo", project["url"]), "meta")]
    block.extend(p("- " + esc(text), "bullet") for text in project["bullets"])
    block.append(Spacer(1, 7))
    story.append(KeepTogether(block))
story.append(p(esc(DATA["additional"]), "body"))
heading("Development approach and availability")
story.append(p(esc(DATA["process"]), "note"))
story.append(p(esc(DATA["availability"]), "note"))

pdf_path = OUT / "Deboraj-Sarkar-Resume.pdf"
document = SimpleDocTemplate(str(pdf_path), pagesize=A4, leftMargin=43, rightMargin=43, topMargin=38, bottomMargin=38, title="Deboraj Sarkar Frontend Developer Resume", author="Deboraj Sarkar", subject="Frontend developer personal projects and skills")
document.build(story)

sections = [f'<section><h2>Profile</h2><p>{esc(DATA["summary"])}</p></section>', '<section><h2>Technical skills</h2>' + ''.join(f'<p><strong>{esc(item["label"])}</strong> {esc(item["text"])}</p>' for item in DATA["skills"]) + '</section>']
for section, title in [("experience", "Experience"), ("education", "Education"), ("certifications", "Certifications")]:
    if DATA.get(section):
        sections.append(f'<section><h2>{title}</h2>' + ''.join(f'<p>{esc(item)}</p>' for item in DATA[section]) + '</section>')
sections.append('<section><h2>Selected projects</h2>' + ''.join(f'<article><h3>{esc(project["name"])}</h3><p class="meta">{esc(project["stack"])} | <a href="{esc(project["url"])}">View demo</a></p><ul>' + ''.join(f'<li>{esc(text)}</li>' for text in project["bullets"]) + '</ul></article>' for project in DATA["projects"]) + f'<p>{esc(DATA["additional"])}</p></section>')
sections.append(f'<section><h2>Development approach and availability</h2><p>{esc(DATA["process"])}</p><p>{esc(DATA["availability"])}</p></section>')
html_path = OUT / "Deboraj-Sarkar-Resume.html"
html_path.write_text(f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Deboraj Sarkar Frontend Developer Resume</title><style>
*{{box-sizing:border-box}}body{{background:#ecefed;color:#111;margin:0;font:14px/1.5 Arial,sans-serif}}main{{background:#fff;max-width:800px;margin:35px auto;padding:45px 52px}}h1{{font-size:31px;line-height:1.2;margin:0 0 4px}}.role{{font-size:17px;margin:0 0 14px}}.links{{font-size:12px;margin:3px 0;overflow-wrap:anywhere}}h2{{font-size:15px;margin:23px 0 9px}}h3{{font-size:14px;margin:13px 0 3px}}p{{margin:0 0 7px}}a{{color:inherit}}.meta{{font-size:12px}}ul{{padding-left:18px;margin:7px 0 14px}}li{{margin-bottom:5px}}.toolbar{{max-width:800px;margin:20px auto;text-align:right;display:flex;justify-content:end;gap:18px;align-items:center;font-size:13px}}button{{font:inherit;padding:8px 16px;cursor:pointer;border:1px solid #555;background:white;border-radius:5px}}@page{{size:A4;margin:15mm}}@media(max-width:700px){{main{{margin:0;padding:30px 23px}}.toolbar{{padding:0 23px}}}}@media print{{body{{background:white;font-size:10pt}}main{{padding:0;margin:0;max-width:none}}.toolbar{{display:none}}h1{{font-size:24pt}}h2{{font-size:11pt;margin-top:14pt}}h3{{font-size:10.7pt}}.role{{font-size:12pt}}.links,.meta{{font-size:9pt}}article{{break-inside:avoid}}a{{text-decoration:none}}}}
</style></head><body><div class="toolbar"><a href="Deboraj-Sarkar-Resume.pdf" download>Download PDF</a><button onclick="window.print()">Print résumé</button></div><main><header><h1>{esc(DATA["name"])}</h1><p class="role">{esc(DATA["title"])} | {esc(DATA["alias"])}</p><p class="links"><a href="mailto:{esc(DATA["email"])}">{esc(DATA["email"])}</a> | <a href="{esc(DATA["portfolio"])}">debotaro.github.io</a></p><p class="links">{' | '.join(f'<a href="{esc(item["url"])}">{esc(item["label"])}</a>' for item in DATA["profiles"])}</p></header>{''.join(sections)}</main></body></html>''', encoding="utf-8")

markdown = [f'# {DATA["name"]}', f'{DATA["title"]} | {DATA["alias"]}', f'{DATA["email"]} | {DATA["portfolio"]}', ' | '.join(item["url"] for item in DATA["profiles"]), '\n## Profile', DATA["summary"], '\n## Technical skills']
markdown.extend(f'**{item["label"]}:** {item["text"]}' for item in DATA["skills"])
for section, title in [("experience", "Experience"), ("education", "Education"), ("certifications", "Certifications")]:
    if DATA.get(section):
        markdown.extend(['\n## ' + title, *DATA[section]])
markdown.append('\n## Selected projects')
for project in DATA["projects"]:
    markdown.extend([f'\n### {project["name"]}', f'{project["stack"]} | [View demo]({project["url"]})', *['- ' + text for text in project["bullets"]]])
markdown.extend([DATA["additional"], '\n## Development approach and availability', DATA["process"], DATA["availability"]])
(ROOT / 'career/RESUME.md').write_text('\n\n'.join(markdown) + '\n', encoding='utf-8')
print(f'Created {pdf_path.name}, {html_path.name} and career/RESUME.md')
