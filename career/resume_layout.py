"""Generate a print-friendly, linear A4 resume with embedded text and fonts."""
from pathlib import Path
import html
import re

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph

ROOT = Path(__file__).resolve().parents[1]
INK = "#172C28"
TEAL = "#28594F"
MUTED = "#4D5E59"
LINE = "#CEDAD4"
PEACH = "#E5A180"
PALE = "#F4F7F3"


def esc(value):
    return html.escape(str(value), quote=True)


def register_fonts():
    root = Path("C:/Windows/Fonts")
    for regular, bold in (("segoeui.ttf", "segoeuib.ttf"), ("calibri.ttf", "calibrib.ttf")):
        if all((root / item).exists() for item in (regular, bold)):
            for name, filename in (("ResumeSans", regular), ("ResumeBold", bold)):
                pdfmetrics.registerFont(TTFont(name, str(root / filename)))
            pdfmetrics.registerFontFamily("ResumeSans", normal="ResumeSans", bold="ResumeBold")
            return "ResumeSans", "ResumeBold"
    raise RuntimeError("Embedded TrueType fonts are required. Install Segoe UI or Calibri before generating the resume.")


class Flow:
    """Measure paragraphs and keep PDF content in its visual reading order."""

    def __init__(self, page, x, top, width, fonts):
        self.page, self.x, self.y, self.width = page, x, top, width
        self.font, self.bold = fonts
        self.bounds = []

    def text(self, value, *, size=10.2, leading=13.4, bold=False, color=INK, after=0):
        style = ParagraphStyle("Resume", fontName=self.bold if bold else self.font,
                               fontSize=size, leading=leading,
                               textColor=colors.HexColor(color), splitLongWords=True,
                               allowWidows=False, allowOrphans=False)
        item = Paragraph(value, style)
        _, height = item.wrap(self.width, 1000)
        item.drawOn(self.page, self.x, self.y - height)
        self.bounds.append((self.x, self.y - height, self.width, height))
        self.y -= height + after
        return height

    def section(self, title):
        self.page.setFillColor(colors.HexColor(TEAL))
        self.page.setFont(self.bold, 8.6)
        label = title.upper()
        self.page.drawString(self.x, self.y - 8.6, label)
        line_x = self.x + pdfmetrics.stringWidth(label, self.bold, 8.6) + 12
        self.page.setStrokeColor(colors.HexColor(LINE))
        self.page.setLineWidth(0.55)
        self.page.line(line_x, self.y - 5.7, self.x + self.width, self.y - 5.7)
        self.y -= 22

    def gap(self, amount=12):
        self.y -= amount


def linked(label, url):
    return f'<link href="{esc(url)}" color="{TEAL}">{esc(label)}</link>'


def build_pdf(data, output_dir):
    fonts = register_fonts()
    normal, bold = fonts
    width, height = A4
    margin = 44
    body_width = width - margin * 2
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    path = output_dir / "Deboraj-Sarkar-Resume.pdf"
    page = canvas.Canvas(str(path), pagesize=A4, pageCompression=1,
                         pdfVersion=(1, 7), initialFontName=normal, lang="en-IN",
                         cropBox=(0, 0, width, height), trimBox=(0, 0, width, height))
    page.setViewerPreference("PrintScaling", "None")
    page.setViewerPreference("PrintArea", "TrimBox")
    page.setViewerPreference("PrintClip", "TrimBox")
    page.setTitle(f'{data["name"]} - {data["title"]} - Resume')
    page.setAuthor(data["name"])
    page.setSubject("Junior frontend and React opportunities; verified work, education and selected personal projects")

    # A compact mark leaves the page predominantly white for office printing.
    logo = ROOT / "assets/debotaro-logo.png"
    if not logo.exists():
        raise FileNotFoundError("The original high-resolution Debotaro logo is missing.")
    logo_x, logo_y, logo_size = width - margin - 42, height - margin - 42, 42
    page.setFillColor(colors.HexColor(INK))
    page.roundRect(logo_x, logo_y, logo_size, logo_size, 6, fill=1, stroke=0)
    page.drawImage(str(logo), logo_x + 3, logo_y + 3, width=36, height=36, mask="auto")

    flow = Flow(page, margin, height - margin + 2, body_width, fonts)
    flow.text(esc(data["name"]), size=29, leading=33, bold=True, after=4)
    flow.text(esc(data["title"]) + f' <font size="10" color="{MUTED}">/ {esc(data.get("alias", ""))}</font>',
              size=12.5, leading=16.2, bold=True, color=TEAL, after=10)
    contact = [esc(data["location"])] if data.get("location") else []
    if data.get("phone"):
        contact.append(linked(data["phone"], "tel:" + re.sub(r"[^+\d]", "", data["phone"])))
    if data.get("email"):
        contact.append(linked(data["email"], "mailto:" + data["email"]))
    flow.text(" | ".join(contact), size=9.5, leading=12.5, after=4)
    profiles = [linked("Portfolio / debotaro.github.io", data["portfolio"])]
    for profile in data.get("profiles", []):
        short = "GitHub / Debotaro" if "github.com" in profile["url"] else "LinkedIn / deborajsarkar"
        profiles.append(linked(short, profile["url"]))
    flow.text(" | ".join(profiles), size=9.5, leading=12.5, after=12)
    page.setStrokeColor(colors.HexColor(LINE))
    page.setLineWidth(0.6)
    page.line(margin, flow.y, width - margin, flow.y)
    page.setStrokeColor(colors.HexColor(PEACH))
    page.setLineWidth(2.5)
    page.line(margin, flow.y, margin + 35, flow.y)
    flow.gap(16)

    flow.section("Profile")
    flow.text(esc(data["summary"]), after=13)

    flow.section("Selected personal projects")
    for project in data.get("projects", []):
        title = f'<b>{esc(project["name"])}</b>'
        if project.get("descriptor"):
            title += f' <font size="10" color="{MUTED}">/ {esc(project["descriptor"])}</font>'
        flow.text(title, size=12.1, leading=15.5, after=2)
        metadata = esc(project.get("stack", ""))
        if project.get("url"):
            metadata += " | " + linked("Live demo", project["url"])
        flow.text(metadata, color=MUTED, size=9.4, leading=12.3, after=4)
        for bullet in project.get("bullets", []):
            flow.text(esc(bullet))
        flow.gap(11)
    if data.get("additional"):
        flow.text(esc(data["additional"]), color=MUTED, after=10)

    flow.section(data.get("skills_heading", "Technologies used in projects"))
    for skill in data.get("skills", []):
        text = f'<b>{esc(skill["label"])}:</b> {esc(skill["text"])}' if isinstance(skill, dict) else esc(skill)
        flow.text(text, after=3)
    flow.gap(10)

    flow.section("Professional experience")
    for role in data.get("experience", []):
        if not isinstance(role, dict):
            flow.text(esc(role), after=6)
            continue
        title = f'<b>{esc(role.get("title", ""))}</b>'
        if role.get("organization"):
            title += f' / {esc(role["organization"])}'
        flow.text(title, size=11.5, leading=15, after=2)
        metadata = " | ".join(str(role[key]) for key in ("dates", "location") if role.get(key))
        flow.text(esc(metadata), color=MUTED, size=9.4, leading=12.3, after=5)
        for bullet in role.get("bullets", []):
            flow.text("- " + esc(bullet), after=2)
        flow.gap(10)

    flow.section("Education")
    for education in data.get("education", []):
        if not isinstance(education, dict):
            flow.text(esc(education), after=5)
            continue
        flow.text(esc(education.get("qualification", "")), bold=True, size=10.5, leading=13.7, after=2)
        metadata = " | ".join(str(education[key]) for key in ("institution", "dates") if education.get(key))
        flow.text(esc(metadata), color=MUTED, size=9.7, leading=12.8, after=11)

    selected = [cert for cert in data.get("certifications", []) if not isinstance(cert, dict) or cert.get("selected") is not False]
    if selected:
        flow.section(data.get("certifications_heading", "Selected Coursera certificates"))
        for cert in selected:
            if not isinstance(cert, dict):
                flow.text(esc(cert), after=4)
                continue
            text = linked(cert["name"], cert["url"])
            text += f' <font color="{MUTED}">| {esc(cert.get("date", ""))}</font>'
            flow.text(text, size=9.7, leading=12.8, after=3)
        flow.gap(10)

    availability = " ".join(str(data[key]) for key in ("process", "availability") if data.get(key))
    if availability:
        flow.gap(1)
        top = flow.y
        page.setFillColor(colors.HexColor(PALE))
        page.roundRect(margin - 8, top - 35, body_width + 16, 35, 4, fill=1, stroke=0)
        page.setFillColor(colors.HexColor(PEACH))
        page.rect(margin - 8, top - 35, 2.5, 35, fill=1, stroke=0)
        flow.y -= 8
        flow.text('<b>Availability:</b> ' + esc(availability), size=9.6, leading=12.5)
        flow.y = top - 35

    if flow.y < 36 or any(bound[1] < 36 for bound in flow.bounds):
        raise ValueError(f"Resume exceeds its one-page A4 boundary: body ends at {flow.y:.1f}pt.")
    page.showPage()
    page.save()
    print(f"Designed PDF: one A4 page; linear content order; body ends at {flow.y:.1f}pt")
    return path
