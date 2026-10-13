"""Draw a branded editorial A4 resume with embedded fonts and selectable text."""
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
INK, FOREST, TEAL, MUTED = '#172C28', '#142F28', '#28594F', '#52615A'
LINE, PEACH, LIME, CREAM, PALE = '#D7DED6', '#F0AE8D', '#DDEBBB', '#FBF8EF', '#F4F6EF'


def esc(value):
    return html.escape(str(value), quote=True)


def register_fonts():
    root = Path('C:/Windows/Fonts')
    for regular, bold in (('segoeui.ttf', 'segoeuib.ttf'), ('calibri.ttf', 'calibrib.ttf')):
        if all((root / item).exists() for item in (regular, bold)):
            for name, filename in (('ResumeSans', regular), ('ResumeBold', bold)):
                pdfmetrics.registerFont(TTFont(name, str(root / filename)))
            pdfmetrics.registerFontFamily('ResumeSans', normal='ResumeSans', bold='ResumeBold')
            display = 'ResumeBold'
            if (root / 'georgiab.ttf').exists():
                pdfmetrics.registerFont(TTFont('ResumeDisplay', str(root / 'georgiab.ttf')))
                display = 'ResumeDisplay'
            return 'ResumeSans', 'ResumeBold', display
    raise RuntimeError('Embedded TrueType fonts are required before generating the resume.')


class Flow:
    """Measure paragraphs and preserve their main content order in the PDF."""
    def __init__(self, page, x, top, width, fonts):
        self.page, self.x, self.y, self.width = page, x, top, width
        self.font, self.bold, self.display = fonts
        self.bounds = []

    def paragraph(self, value, *, size=10.1, leading=13.1, bold=False, color=INK, font=None):
        style = ParagraphStyle('Resume', fontName=font or (self.bold if bold else self.font),
                               fontSize=size, leading=leading, textColor=colors.HexColor(color),
                               splitLongWords=True, allowWidows=False, allowOrphans=False)
        item = Paragraph(value, style)
        _, height = item.wrap(self.width, 1000)
        return item, height

    def text(self, value, *, after=0, **style):
        item, height = self.paragraph(value, **style)
        item.drawOn(self.page, self.x, self.y - height)
        self.bounds.append((self.x, self.y - height, self.width, height))
        self.y -= height + after
        return height

    def section(self, title):
        self.page.setFillColor(colors.HexColor(TEAL))
        label = title.upper()
        self.page.setFont(self.bold, 8.4)
        self.page.drawString(self.x, self.y - 8.4, label)
        line_x = self.x + pdfmetrics.stringWidth(label, self.bold, 8.4) + 13
        self.page.setStrokeColor(colors.HexColor(LINE))
        self.page.setLineWidth(.5)
        self.page.line(line_x, self.y - 5.4, self.x + self.width, self.y - 5.4)
        self.page.setFillColor(colors.HexColor(PEACH))
        self.page.circle(self.x + self.width - 1, self.y - 5.4, 1.8, fill=1, stroke=0)
        self.y -= 19

    def gap(self, amount=12):
        self.y -= amount


def linked(label, url, color=TEAL):
    return f'<link href="{esc(url)}" color="{color}">{esc(label)}</link>'


def draw_mark(page, x, y, size):
    """Use the established monogram's clean vector path with even-odd holes."""
    vector = ROOT / 'assets/debotaro-logo.svg'
    if vector.exists():
        from xml.etree import ElementTree
        from reportlab.graphics.svgpath import SvgPath
        svg = ElementTree.parse(vector).getroot()
        viewbox = [float(n) for n in svg.attrib.get('viewBox', '0 0 1000 1000').split()]
        path_element = svg.find('.//{http://www.w3.org/2000/svg}path')
        if path_element is not None:
            shape = SvgPath(path_element.attrib['d'])
            scale = min(size / viewbox[2], size / viewbox[3])
            page.saveState()
            page.translate(x - viewbox[0] * scale, y + (viewbox[1] + viewbox[3]) * scale)
            page.scale(scale, -scale)
            page.setFillColor(colors.HexColor(LIME))
            path = page.beginPath()
            # ReportLab's SVG parser exposes operations and their point sequences.
            from reportlab.graphics.shapes import _PATH_OP_ARG_COUNT
            point_index = 0
            for operator in shape.operators:
                count = _PATH_OP_ARG_COUNT[operator]
                points = shape.points[point_index:point_index + count]
                if operator == 0:
                    path.moveTo(*points)
                elif operator == 1:
                    path.lineTo(*points)
                elif operator == 2:
                    path.curveTo(*points)
                elif operator == 3:
                    path.close()
                point_index += count
            page.drawPath(path, fill=1, stroke=0, fillMode=0)
            page.restoreState()
            return
    logo = ROOT / 'assets/debotaro-logo.png'
    if not logo.exists():
        raise FileNotFoundError('The approved Debotaro logo is missing.')
    page.drawImage(str(logo), x, y, width=size, height=size, mask='auto')


def project_card(flow, project, index):
    page, top = flow.page, flow.y
    inner = Flow(page, flow.x + 34, top - 10, flow.width - 48,
                 (flow.font, flow.bold, flow.display))
    title = f'<b>{esc(project["name"])}</b>'
    if project.get('descriptor'):
        title += f' <font size="9.7" color="{MUTED}">/ {esc(project["descriptor"])}</font>'
    metadata = esc(project.get('stack', ''))
    if project.get('url'):
        metadata += '  |  ' + linked('Live demo', project['url'])
    items = [(title, dict(size=12.5, leading=16, after=2)),
             (metadata, dict(size=9.2, leading=12, color=MUTED, after=4))]
    items.extend((esc(bullet), dict(size=10, leading=13, after=0)) for bullet in project.get('bullets', []))
    measured = sum(inner.paragraph(value, **{key: val for key, val in style.items() if key != 'after'})[1]
                   + style.get('after', 0) for value, style in items)
    card_height = measured + 19
    page.setFillColor(colors.HexColor(PALE))
    page.roundRect(flow.x, top - card_height, flow.width, card_height, 4, fill=1, stroke=0)
    page.setFillColor(colors.HexColor(LIME if index % 2 else PEACH))
    page.roundRect(flow.x + 8, top - 29, 19, 19, 3, fill=1, stroke=0)
    page.setFont(flow.bold, 8.4)
    page.setFillColor(colors.HexColor(FOREST))
    page.drawCentredString(flow.x + 17.5, top - 23, f'{index:02d}')
    for value, style in items:
        inner.text(value, **style)
    flow.bounds.extend(inner.bounds)
    flow.y = top - card_height - 7


def build_pdf(data, output_dir):
    fonts = register_fonts()
    normal, bold, display = fonts
    width, height = A4
    margin, body_width = 38, width - 76
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    path = output_dir / 'Deboraj-Sarkar-Resume.pdf'
    page = canvas.Canvas(str(path), pagesize=A4, pageCompression=1, pdfVersion=(1, 7),
                         initialFontName=normal, lang='en-IN',
                         cropBox=(0, 0, width, height), trimBox=(0, 0, width, height))
    page.setViewerPreference('PrintScaling', 'None')
    page.setViewerPreference('PrintArea', 'TrimBox')
    page.setViewerPreference('PrintClip', 'TrimBox')
    page.setTitle(f'{data["name"]} - {data["title"]} - Resume')
    page.setAuthor(data['name'])
    page.setSubject('Junior frontend and React roles; verified work, education and selected personal projects')
    header_bottom = height - 154
    page.setFillColor(colors.HexColor(FOREST))
    page.roundRect(24, header_bottom, width - 48, 130, 7, fill=1, stroke=0)
    page.setFillColor(colors.HexColor(PEACH))
    page.roundRect(24, header_bottom, 4, 130, 2, fill=1, stroke=0)
    draw_mark(page, width - 91, height - 103, 41)
    header = Flow(page, margin + 2, height - 39, body_width - 4, fonts)
    header.text(esc(data.get('alias', 'Debotaro').upper()) + ' / FRONTEND &amp; DESIGN',
                size=8.3, leading=11, bold=True, color=PEACH, after=6)
    header.text(esc(data['name']), size=30, leading=36, font=display, color=CREAM, after=2)
    header.text(esc(data['title']), size=12.3, leading=16, bold=True, color=LIME, after=10)
    contact = [esc(data['location'])] if data.get('location') else []
    if data.get('phone'):
        contact.append(linked(data['phone'], 'tel:' + re.sub(r'[^+\d]', '', data['phone']), CREAM))
    if data.get('email'):
        contact.append(linked(data['email'], 'mailto:' + data['email'], CREAM))
    header.text('  |  '.join(contact), size=9.1, leading=12, color=CREAM, after=3)
    profiles = [linked('Portfolio / debotaro.github.io', data['portfolio'], CREAM)]
    for profile in data.get('profiles', []):
        short = 'GitHub / Debotaro' if 'github.com' in profile['url'] else 'LinkedIn / deborajsarkar'
        profiles.append(linked(short, profile['url'], CREAM))
    header.text('  |  '.join(profiles), size=9.1, leading=12, color=CREAM)
    flow = Flow(page, margin, header_bottom - 17, body_width, fonts)
    flow.section('Profile')
    flow.text(esc(data['summary']), after=13)
    flow.section('Selected personal projects')
    for index, project in enumerate(data.get('projects', []), 1):
        project_card(flow, project, index)
    if data.get('additional'):
        flow.text(esc(data['additional']), color=MUTED, after=6)
    flow.gap(5)
    flow.section(data.get('skills_heading', 'Technologies used in projects'))
    for skill in data.get('skills', []):
        value = f'<b>{esc(skill["label"])}:</b> {esc(skill["text"])}' if isinstance(skill, dict) else esc(skill)
        flow.text(value, size=9.8, leading=12.7, after=3)
    flow.gap(10)
    flow.section('Professional experience')
    for role in data.get('experience', []):
        if not isinstance(role, dict):
            flow.text(esc(role), after=6)
            continue
        title = f'<b>{esc(role.get("title", ""))}</b>'
        if role.get('organization'):
            title += f' / {esc(role["organization"])}'
        flow.text(title, size=11.4, leading=15, after=2)
        metadata = ' | '.join(str(role[key]) for key in ('dates', 'location') if role.get(key))
        flow.text(esc(metadata), color=MUTED, size=9.2, leading=12, after=5)
        for bullet in role.get('bullets', []):
            flow.text('- ' + esc(bullet), size=9.9, leading=12.8, after=2)
    flow.gap(12)
    lower_top, col_gap = flow.y, 22
    col_width = (body_width - col_gap) / 2
    education = Flow(page, margin, lower_top, col_width, fonts)
    education.section('Education')
    for item in data.get('education', []):
        if not isinstance(item, dict):
            education.text(esc(item), size=9.8, leading=12.8, after=5)
            continue
        education.text(esc(item.get('qualification', '')), bold=True, size=10.1, leading=13.2, after=3)
        education.text(esc(item.get('institution', '')), size=9.6, leading=12.5, color=MUTED, after=1)
        education.text(esc(item.get('dates', '')), size=9.6, leading=12.5, color=MUTED, after=4)
    selected = [cert for cert in data.get('certifications', []) if not isinstance(cert, dict) or cert.get('selected') is not False]
    certificates = Flow(page, margin + col_width + col_gap, lower_top, col_width, fonts)
    if selected:
        certificates.section(data.get('certifications_heading', 'Selected Coursera certificates'))
        for cert in selected:
            if not isinstance(cert, dict):
                certificates.text(esc(cert), size=9.5, leading=12.2, after=4)
                continue
            text = linked(cert['name'], cert['url']) + f' <font color="{MUTED}">| {esc(cert.get("date", ""))}</font>'
            certificates.text(text, size=9.5, leading=12.2, after=6)
    flow.bounds.extend(education.bounds + certificates.bounds)
    flow.y = min(education.y, certificates.y) - 10
    availability = ' '.join(str(data[key]) for key in ('process', 'availability') if data.get(key))
    if availability:
        footer = Flow(page, margin + 10, flow.y - 8, body_width - 20, fonts)
        text = '<b>Availability:</b> ' + esc(availability)
        _, text_height = footer.paragraph(text, size=9.5, leading=12.4)
        footer_height = text_height + 16
        page.setFillColor(colors.HexColor(LIME))
        page.roundRect(margin, flow.y - footer_height, body_width, footer_height, 4, fill=1, stroke=0)
        footer.text(text, size=9.5, leading=12.4)
        flow.bounds.extend(footer.bounds)
        flow.y -= footer_height
    if flow.y < 32 or any(bound[1] < 32 for bound in flow.bounds):
        raise ValueError(f'Resume exceeds its one-page A4 boundary: body ends at {flow.y:.1f}pt.')
    page.showPage()
    page.save()
    print(f'Designed PDF: one A4 page; editorial identity; body ends at {flow.y:.1f}pt')
    return path
