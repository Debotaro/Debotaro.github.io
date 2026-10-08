"""A text-based, branded A4 resume layout with measured column boundaries."""
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
INK = "#101F19"
PAPER = "#F7F6EE"
LIME = "#D8E9B7"
MUTED = "#526458"
LINE = "#CBD3C5"
PEACH = "#FF9D77"


def esc(value):
    return html.escape(str(value), quote=True)


def register_fonts():
    root = Path("C:/Windows/Fonts")
    candidates = [
        ("segoeui.ttf", "segoeuib.ttf", "georgiai.ttf"),
        ("calibri.ttf", "calibrib.ttf", "georgiai.ttf"),
    ]
    for regular, bold, serif in candidates:
        if all((root / item).exists() for item in (regular, bold, serif)):
            for name, filename in (("ResumeSans", regular), ("ResumeBold", bold), ("ResumeSerif", serif)):
                pdfmetrics.registerFont(TTFont(name, str(root / filename)))
            pdfmetrics.registerFontFamily("ResumeSans", normal="ResumeSans", bold="ResumeBold")
            return "ResumeSans", "ResumeBold", "ResumeSerif"
    raise RuntimeError("The print master requires embedded TrueType fonts. Install Segoe UI or Calibri plus Georgia before generating it.")


class Column:
    def __init__(self, page, x, top, width, fonts, rail=False):
        self.page, self.x, self.y, self.width = page, x, top, width
        self.font, self.bold, self.serif = fonts
        self.size = 9.8 if rail else 10.2
        self.leading = 13.15 if rail else 13.8
        self.bounds = []

    def text(self, value, *, size=None, leading=None, bold=False, color=INK, after=0, indent=0):
        style = ParagraphStyle("Resume", fontName=self.bold if bold else self.font,
                               fontSize=size or self.size, leading=leading or self.leading,
                               textColor=colors.HexColor(color), splitLongWords=True,
                               allowWidows=False, allowOrphans=False)
        item = Paragraph(value, style)
        _, height = item.wrap(self.width - indent, 1000)
        item.drawOn(self.page, self.x + indent, self.y - height)
        self.bounds.append((self.x + indent, self.y - height, self.width - indent, height))
        self.y -= height + after
        return height

    def section(self, title):
        self.page.saveState()
        self.page.setFillColor(colors.HexColor(INK))
        self.page.setFont(self.bold, 8.1)
        text = self.page.beginText(self.x, self.y - 8)
        text.setCharSpace(1.15)
        text.textOut(title.upper())
        self.page.drawText(text)
        self.page.restoreState()
        self.y -= 16
        self.page.setStrokeColor(colors.HexColor(LINE))
        self.page.setLineWidth(0.55)
        self.page.line(self.x, self.y, self.x + self.width, self.y)
        self.y -= 9

    def gap(self, amount=13):
        self.y -= amount

    def link(self, label, url, **kwargs):
        self.text(f'<link href="{esc(url)}" color="{INK}">{esc(label)}</link>', **kwargs)


def build_pdf(data, output_dir):
    fonts = register_fonts()
    normal, bold, serif = fonts
    width, height = A4
    path = output_dir / "Deboraj-Sarkar-Resume.pdf"
    # Compression is lossless. Text and line art stay vector-based, not a page image.
    page = canvas.Canvas(str(path), pagesize=A4, pageCompression=1,
                         pdfVersion=(1, 7), initialFontName=normal, lang="en-IN",
                         cropBox=(0, 0, width, height), trimBox=(0, 0, width, height))
    # These are reader hints, not a way to control a physical printer's quality mode.
    page.setViewerPreference("PrintScaling", "None")
    page.setViewerPreference("PrintArea", "TrimBox")
    page.setViewerPreference("PrintClip", "TrimBox")
    page.setTitle(f'{data["name"]} - {data["title"]} - Resume')
    page.setAuthor(data["name"])
    page.setSubject("Professional experience, education and personal portfolio projects")
    page.setFillColor(colors.HexColor(PAPER))
    page.rect(0, 0, width, height, fill=1, stroke=0)

    # Masthead: brand identity is graphical, while all meaningful text remains text.
    masthead_bottom = height - 181
    page.setFillColor(colors.HexColor(INK))
    page.rect(24, masthead_bottom, width - 48, 157, fill=1, stroke=0)
    page.saveState()
    page.setFillColor(colors.HexColor(LIME))
    label = page.beginText(44, height - 53)
    label.setFont(bold, 8)
    label.setCharSpace(1.7)
    label.textOut(str(data.get("alias", "")).upper() + " / PERSONAL PORTFOLIO")
    page.drawText(label)
    page.restoreState()
    # Use the original 1254px transparent master, about 2100 PPI at this size.
    # Do not downsample or recompress the mark as JPEG.
    logo = ROOT / "assets/debotaro-logo.png"
    if not logo.exists():
        raise FileNotFoundError("The high-resolution Debotaro logo master is missing.")
    page.drawImage(str(logo), width - 92, height - 91, width=43, height=43, mask="auto")
    page.setFillColor(colors.HexColor(PAPER))
    first, _, rest = data["name"].partition(" ")
    page.setFont(bold, 35)
    page.drawString(43, height - 105, first)
    name_x = 43 + pdfmetrics.stringWidth(first, bold, 35) + 11
    page.setFont(serif, 37)
    page.drawString(name_x, height - 105, rest)
    page.setFont(normal, 11.7)
    role_line = data["title"] + (" / Graphic design" if data.get("experience") else "")
    page.drawString(44, height - 128, role_line)
    if data.get("location"):
        page.setFillColor(colors.HexColor(LIME))
        page.setFont(normal, 9.7)
        page.drawRightString(width - 44, height - 128, data["location"])
    page.setStrokeColor(colors.HexColor("#4A5D4A"))
    page.setLineWidth(0.6)
    page.line(44, height - 141, width - 44, height - 141)
    page.setStrokeColor(colors.HexColor(PEACH))
    page.setLineWidth(1.7)
    page.line(44, height - 141, 72, height - 141)
    contact_y = height - 160
    page.setFont(normal, 9.6)
    page.setFillColor(colors.HexColor(PAPER))
    if data.get("email"):
        page.drawString(44, contact_y, data["email"])
        email_width = pdfmetrics.stringWidth(data["email"], normal, 9.6)
        page.linkURL("mailto:" + data["email"], (44, contact_y - 2, 44 + email_width, contact_y + 10))
    if data.get("phone"):
        page.drawRightString(width - 44, contact_y, data["phone"])
        phone_width = pdfmetrics.stringWidth(data["phone"], normal, 9.6)
        page.linkURL("tel:" + re.sub(r"[^+\d]", "", data["phone"]),
                     (width - 44 - phone_width, contact_y - 2, width - 44, contact_y + 10))

    rail = Column(page, 44, height - 200, 158, fonts, rail=True)
    main = Column(page, 230, height - 200, width - 274, fonts)

    # The side rail contains factual reference information rather than decorative metrics.
    rail.section("Connect")
    rail.link("debotaro.github.io", data["portfolio"], bold=True, after=5)
    short_labels = {"github.com": "GitHub / @Debotaro", "linkedin.com": "LinkedIn / deborajsarkar",
                    "dribbble.com": "Dribbble / @Debotaro"}
    for profile in data.get("profiles", []):
        label = next((value for domain, value in short_labels.items() if domain in profile["url"]), profile["label"])
        rail.link(label, profile["url"], after=3)
    rail.gap(8)

    rail.section("Tools & technologies")
    for index, skill in enumerate(data.get("skills", [])):
        if isinstance(skill, dict):
            rail.text(esc(skill["label"]), bold=True, size=9.7, after=3)
            rail.text(esc(skill["text"]), color=MUTED, after=9 if index == 0 else 0)
        else:
            rail.text(esc(skill))
    rail.gap(12)

    rail.section("Education")
    for education in data.get("education", []):
        if not isinstance(education, dict):
            rail.text(esc(education), after=5)
            continue
        rail.text(esc(education.get("qualification", "")), bold=True, after=4)
        rail.text(esc(education.get("institution", "")), color=MUTED, after=3)
        rail.text(esc(education.get("dates", "")), size=9.3, color=MUTED, after=4)
    rail.gap(8)

    rail.section("Coursera credentials")
    for cert in data.get("certifications", []):
        if isinstance(cert, dict):
            if cert.get("selected") is False:
                continue
            rail.link(cert["name"], cert["url"], size=9.6, leading=12.6, bold=True, after=3)
            rail.text(esc(cert.get("issuer", "")), size=9.1, leading=12.1, color=MUTED)
            rail.text(esc(cert.get("date", "")), size=9.1, leading=12.1, color=MUTED, after=7)
        else:
            rail.text(esc(cert), after=6)

    main.section("Profile")
    main.text(esc(data["summary"]), after=12)
    main.section("Selected projects")
    for index, project in enumerate(data.get("projects", []), 1):
        top = main.y
        page.setFillColor(colors.HexColor("#667D65"))
        page.setFont(serif, 17)
        page.drawString(main.x, top - 15, f"{index:02d}")
        original_x, original_width = main.x, main.width
        main.x += 30
        main.width -= 30
        main.text(esc(project["name"]), bold=True, size=13.1, leading=16.5, after=3)
        metadata = esc(project.get("stack", ""))
        if project.get("url"):
            metadata += f' | <link href="{esc(project["url"])}" color="{INK}"><b>Demo</b></link>'
        main.text(metadata, color=MUTED, size=9.3, leading=12.2, after=5)
        main.x, main.width = original_x, original_width
        for bullet in project.get("bullets", []):
            main.text(esc(bullet))
        main.gap(12)
    if data.get("additional"):
        main.text(esc(data["additional"]), color=MUTED, size=9.7, leading=13, after=10)

    main.section("Experience")
    for role in data.get("experience", []):
        if not isinstance(role, dict):
            main.text(esc(role), after=6)
            continue
        role_title = esc(role.get("title", ""))
        if role.get("organization"):
            role_title += f' <font size="10">/ {esc(role["organization"])}</font>'
        main.text(role_title, bold=True, size=12, leading=15, after=3)
        meta = " | ".join(str(role[key]) for key in ("dates", "location") if role.get(key))
        main.text(esc(meta), color=MUTED, size=9.1, leading=12.1, after=7)
        for bullet in role.get("bullets", []):
            main.text(esc(bullet), after=4)

    # Fail rather than clipping if later edits require a second page or a copy revision.
    minimum_body_y = 88
    if min(rail.y, main.y) < minimum_body_y:
        raise ValueError(f"Resume body overflows the footer: rail={rail.y:.1f}, main={main.y:.1f}; minimum={minimum_body_y}.")
    page.setStrokeColor(colors.HexColor(LINE))
    page.setLineWidth(0.55)
    page.line(216, height - 200, 216, min(rail.y, main.y) + 8)

    page.setFillColor(colors.HexColor(LIME))
    page.rect(24, 25, width - 48, 57, fill=1, stroke=0)
    page.setFillColor(colors.HexColor(INK))
    page.setFont(bold, 8)
    page.drawString(44, 62, "OPEN TO OPPORTUNITIES")
    footer = Column(page, 44, 54, width - 88, fonts)
    availability = " ".join(str(data[key]) for key in ("process", "availability") if data.get(key))
    footer.text(esc(availability), size=9.4, leading=12.2)
    if footer.y < 27:
        raise ValueError("Availability footer needs a shorter factual statement or a taller area.")
    page.showPage()
    page.save()
    print(f"Designed PDF: one A4 page; body end rail={rail.y:.1f}pt, main={main.y:.1f}pt")
    return path
