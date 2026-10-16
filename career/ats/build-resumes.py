"""Validate reviewed ATS resumes or rebuild into ignored output/ats.

All inputs live in this repository. --check is read-only; --draft writes only a
content preview. Rebuilding never overwrites the reviewed downloads or QA record.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
from pathlib import Path
from xml.sax.saxutils import escape

import pdfplumber
import reportlab
from pypdf import PdfReader
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import HRFlowable, Paragraph, SimpleDocTemplate

ROOT = Path(__file__).resolve().parent
REPOSITORY = ROOT.parent.parent
EVIDENCE = ROOT / 'evidence'
OUTPUT = REPOSITORY / 'output' / 'ats'
TEMP = OUTPUT / 'extracted'


def ascii_text(text: str) -> str:
    for item in ('\u2010', '\u2011', '\u2012', '\u2013', '\u2014', '\u2212'):
        text = text.replace(item, '-')
    return text


def blocks(data: dict, variant: dict) -> list[tuple[str, str]]:
    candidate = data['candidate']
    result = [
        ('name', candidate['name']),
        ('target', variant['target']),
        ('contact', candidate['email'] + ' | ' + candidate['location']),
        ('links', ' | '.join(link['label'] for link in candidate['links'])),
        ('section', 'SUMMARY'),
        ('body', variant['summary']),
        ('section', 'PERSONAL PROJECTS'),
        ('disclosure', data['ownership_disclosure']),
    ]
    for project_id in variant['project_order']:
        project = data['projects'][project_id]
        result.append(('project', project['name'] + ' | ' + project['descriptor']))
        bullet_key = 'automation_bullets' if variant['id'] == 'python-automation' else 'bullets'
        result.extend(('bullet', item) for item in project[bullet_key])
    result.append(('section', 'PROJECT TECHNOLOGIES'))
    result.extend(('skill', skill['label'] + ': ' + skill['text']) for skill in variant['skills'])
    experience = data['experience']
    result += [
        ('section', 'EXPERIENCE'),
        ('role', experience['title'] + ' | ' + experience['organization']),
        ('meta', experience['dates'] + ' | ' + experience['location']),
        *[('bullet', item) for item in experience['bullets']],
        ('section', 'EDUCATION'),
        ('role', data['education']['qualification']),
        ('body', data['education']['institution'] + ' | ' + data['education']['dates']),
        ('section', 'COURSE CREDENTIALS'),
        *[('credential', item['name'] + ' | ' + item['issuer'] + ' | ' + item['date']) for item in data['course_credentials']],
    ]
    return [(kind, ascii_text(text)) for kind, text in result]


def validate_final(data: dict) -> None:
    if data['finalization_status'] != 'ready':
        raise ValueError('Finalization is waiting for FlowLedger execution evidence.')
    if data['projects']['flowledger']['status'] != 'verified_local':
        raise ValueError('FlowLedger has no verified local behavior yet.')
    source_text = json.dumps(data)
    if any(token in source_text.lower() for token in ['internal draft:', 'details pending', 'pending verification']):
        raise ValueError('An internal placeholder remains in the resume source.')
    report = json.loads((EVIDENCE / 'evidence-desk-evaluation.json').read_text(encoding='utf-8-sig'))
    modes = {item['mode']: item for item in report['modes']}
    if report['status'] != 'complete' or modes['hybrid']['answerable_cases'] != 18:
        raise ValueError('EvidenceDesk evaluation does not match the resume claim.')
    if abs(modes['hybrid']['recall_at_3'] - 14 / 18) > 1e-10:
        raise ValueError('EvidenceDesk hybrid retrieval metric changed. Review source text.')
    if abs(modes['bm25']['recall_at_3'] - 11 / 18) > 1e-10:
        raise ValueError('EvidenceDesk baseline retrieval metric changed. Review source text.')
    if modes['hybrid']['unanswerable_cases'] != 8 or modes['hybrid']['abstention_accuracy'] != 1:
        raise ValueError('EvidenceDesk refusal metric changed. Review source text.')
    workflow = json.loads((EVIDENCE / 'flow-ledger-verification.json').read_text(encoding='utf-8-sig'))
    if workflow['status'] != 'complete' or workflow['passed'] != 9 or workflow['total'] != 9:
        raise ValueError('FlowLedger experiment result changed. Review source text.')
    scenarios = {item['name']: item for item in workflow['scenarios']}
    required_details = {
        'Concurrent idempotent intake': {'concurrent_submissions': 12, 'created_jobs': 1},
        'Concurrent worker claims': {'worker_threads': 8, 'processed_jobs': 16, 'local_cases': 16, 'duplicate_effects': 0},
        'Independent polling worker process': {'submitted_jobs': 5, 'succeeded_jobs': 5},
        'Process crash after effect on first attempt': {'exit_code': 86, 'attempts': 1, 'local_cases': 1, 'duplicate_effects': 0, 'status_after_restart': 'succeeded'},
        'Process crash after effect on final attempt': {'exit_code': 86, 'attempts': 3, 'local_cases': 1, 'duplicate_effects': 0, 'status_after_restart': 'succeeded'},
    }
    for scenario_name, expected in required_details.items():
        scenario = scenarios[scenario_name]
        if scenario['passed'] is not True or any(scenario['details'].get(key) != value for key, value in expected.items()):
            raise ValueError(f'FlowLedger evidence changed: {scenario_name}. Review source text.')


def font_files(font_dir: Path | None = None) -> tuple[Path, Path, Path]:
    roots = [font_dir] if font_dir else [Path('C:/Windows/Fonts'), Path(reportlab.__file__).parent / 'fonts']
    for directory in roots:
        for names in [('arial.ttf', 'arialbd.ttf', 'ariali.ttf'), ('Vera.ttf', 'VeraBd.ttf', 'VeraIt.ttf')]:
            paths = tuple(directory / name for name in names)
            if all(path.is_file() for path in paths):
                return paths
    raise ValueError('Font directory requires Arial normal/bold/italic or Vera normal/bold/italic TTFs.')


def styles(font_dir: Path | None = None) -> dict:
    normal, bold, italic = font_files(font_dir)
    pdfmetrics.registerFont(TTFont('ResumeArial', str(normal)))
    pdfmetrics.registerFont(TTFont('ResumeArialBold', str(bold)))
    pdfmetrics.registerFont(TTFont('ResumeArialItalic', str(italic)))
    pdfmetrics.registerFontFamily('ResumeArial', normal='ResumeArial', bold='ResumeArialBold', italic='ResumeArialItalic', boldItalic='ResumeArialBold')
    base = ParagraphStyle('Body', fontName='ResumeArial', fontSize=9.6, leading=12.6, textColor=colors.HexColor('#182638'), alignment=TA_LEFT, spaceAfter=3)
    return {
        'name': ParagraphStyle('Name', parent=base, fontName='ResumeArialBold', fontSize=21, leading=25, spaceAfter=3),
        'target': ParagraphStyle('Target', parent=base, fontName='ResumeArialBold', fontSize=10, leading=13, textColor=colors.HexColor('#244E6A'), spaceAfter=5),
        'contact': ParagraphStyle('Contact', parent=base, fontSize=9.2, leading=12, spaceAfter=2),
        'links': ParagraphStyle('Links', parent=base, fontSize=9, leading=12, spaceAfter=8),
        'section': ParagraphStyle('Section', parent=base, fontName='ResumeArialBold', fontSize=10, leading=13, spaceBefore=9, spaceAfter=4, textColor=colors.HexColor('#244E6A'), keepWithNext=True),
        'project': ParagraphStyle('Project', parent=base, fontName='ResumeArialBold', fontSize=9.7, leading=13, spaceBefore=4, spaceAfter=3, keepWithNext=True),
        'role': ParagraphStyle('Role', parent=base, fontName='ResumeArialBold', keepWithNext=True),
        'body': base,
        'bullet': ParagraphStyle('Bullet', parent=base, leftIndent=10, firstLineIndent=-8, spaceAfter=3),
        'disclosure': ParagraphStyle('Disclosure', parent=base, fontName='ResumeArialItalic', fontSize=9.1, leading=12, spaceAfter=4),
        'meta': ParagraphStyle('Meta', parent=base, fontSize=9.1, leading=12, textColor=colors.HexColor('#445463'), spaceAfter=4),
        'skill': ParagraphStyle('Skill', parent=base, fontSize=9.3, leading=12.3, spaceAfter=3),
        'credential': ParagraphStyle('Credential', parent=base, fontSize=9, leading=12, spaceAfter=3),
    }


def build_pdf(data: dict, variant: dict, content: list[tuple[str, str]], font_dir: Path | None = None) -> dict:
    path = OUTPUT / (variant['filename'] + '.pdf')
    doc = SimpleDocTemplate(str(path), pagesize=A4, leftMargin=42, rightMargin=42, topMargin=34, bottomMargin=32, title=data['candidate']['name'] + ' - ' + variant['target'], author=data['candidate']['name'], subject='Entry-level resume; personal projects developed with Codex assistance', pageCompression=1)
    style = styles(font_dir)
    story = []
    for kind, text in content:
        if kind == 'links':
            text = ' | '.join(f'<link href="{escape(link["url"])}" color="#244E6A">{escape(link["label"])}</link>' for link in data['candidate']['links'])
        elif kind == 'contact':
            candidate = data['candidate']
            text = f'<link href="mailto:{escape(candidate["email"])}">{escape(candidate["email"])}</link> | {escape(candidate["location"])}'
        elif kind == 'credential':
            credential = next(item for item in data['course_credentials'] if text.startswith(item['name'] + ' | '))
            text = f'<link href="{escape(credential["url"])}">{escape(text)}</link>'
        else:
            text = escape(text)
            if kind == 'bullet':
                text = '- ' + text
            if kind == 'skill':
                label, tail = text.split(': ', 1)
                text = f'<b>{label}:</b> {tail}'
        story.append(Paragraph(text, style[kind]))
        if kind == 'links':
            story.append(HRFlowable(width='100%', thickness=0.6, color=colors.HexColor('#CAD5DE'), spaceAfter=0))
    doc.build(story)
    reader = PdfReader(str(path))
    extracted = '\n'.join(page.extract_text() or '' for page in reader.pages)
    if len(reader.pages) != 1:
        raise ValueError(f'{path.name} has {len(reader.pages)} pages; one page required.')
    for required in [data['candidate']['email'], 'PERSONAL PROJECTS', 'PROJECT TECHNOLOGIES', 'EXPERIENCE', 'EDUCATION', 'COURSE CREDENTIALS', 'Codex assistance', 'EvidenceDesk', 'FlowLedger', 'in progress']:
        if required not in extracted:
            raise ValueError(f'{path.name}: missing extracted text {required!r}')
    if '\ufffd' in extracted or '\u25a0' in extracted:
        raise ValueError('Invalid glyph or replacement character in extracted text.')
    section_order = ['SUMMARY', 'PERSONAL PROJECTS', 'PROJECT TECHNOLOGIES', 'EXPERIENCE', 'EDUCATION', 'COURSE CREDENTIALS']
    positions = [extracted.index(section) for section in section_order]
    if positions != sorted(positions):
        raise ValueError('Extracted resume sections are not in reading order.')
    expected_links = [f'mailto:{data["candidate"]["email"]}'] + [item['url'] for item in data['candidate']['links']] + [item['url'] for item in data['course_credentials']]
    actual_links = [annotation.get_object().get('/A', {}).get('/URI') for annotation in reader.pages[0].get('/Annots', [])]
    if sorted(actual_links) != sorted(expected_links):
        raise ValueError('PDF hyperlink targets differ from verified contact/profile/course URLs.')
    for forbidden in ['pending verification', 'INTERNAL DRAFT', 'AWS Certified', 'available within']:
        if forbidden.lower() in extracted.lower():
            raise ValueError('Unverified claim or internal placeholder in PDF.')
    plain = '\n\n'.join(('- ' if kind == 'bullet' else '') + text for kind, text in content)
    (OUTPUT / (variant['filename'] + '.txt')).write_text(plain + '\n', encoding='utf-8')
    TEMP.mkdir(parents=True, exist_ok=True)
    (TEMP / (variant['filename'] + '-extracted.txt')).write_text(extracted, encoding='utf-8')
    return {'pdf': str(path.relative_to(REPOSITORY)), 'plaintext': str((OUTPUT / (variant['filename'] + '.txt')).relative_to(REPOSITORY)), 'pages': len(reader.pages), 'extracted_words': len(extracted.split()), 'hyperlink_targets': actual_links, 'text_checks': 'passed', 'section_order': section_order, 'fonts': [font.name for font in font_files(font_dir)], 'visual_review': 'required_after_rendering'}


def check_reviewed(data: dict) -> dict:
    """Check existing reviewed artifacts without authoring or mutating any file."""
    review = json.loads((ROOT / 'verification.json').read_text(encoding='utf-8-sig'))
    if review['status'] != 'passed' or len(review['results']) != len(data['variants']):
        raise ValueError('Reviewed QA record is incomplete.')
    normalize = lambda value: re.sub(r'\s+', ' ', value).strip()
    expected_links = [f'mailto:{data["candidate"]["email"]}'] + [item['url'] for item in data['candidate']['links']] + [item['url'] for item in data['course_credentials']]
    outputs = []
    for variant, result in zip(data['variants'], review['results'], strict=True):
        pdf = (REPOSITORY / result['pdf']).resolve()
        plaintext = (REPOSITORY / result['plaintext']).resolve()
        rendered = (REPOSITORY / result['rendered_pages'][0]).resolve()
        for path, hash_key in [(pdf, 'pdf_sha256'), (plaintext, 'plaintext_sha256'), (rendered, 'render_sha256')]:
            if not path.is_relative_to(REPOSITORY) or hashlib.sha256(path.read_bytes()).hexdigest() != result[hash_key]:
                raise ValueError(f'Reviewed artifact path or bytes changed: {path.name}.')
        reader = PdfReader(str(pdf))
        if len(reader.pages) != 1:
            raise ValueError('Reviewed PDF no longer has exactly one page.')
        pypdf_text = reader.pages[0].extract_text() or ''
        actual_links = [annotation.get_object().get('/A', {}).get('/URI') for annotation in reader.pages[0].get('/Annots', [])]
        if sorted(actual_links) != sorted(expected_links):
            raise ValueError('Reviewed PDF hyperlink targets differ from source.')
        with pdfplumber.open(pdf) as document:
            page = document.pages[0]
            plumber_text = page.extract_text() or ''
            if not page.chars or any(char['x0'] < 0 or char['x1'] > page.width or char['top'] < 0 or char['bottom'] > page.height for char in page.chars):
                raise ValueError('Reviewed PDF text extends outside its page.')
        plain_text = plaintext.read_text(encoding='utf-8')
        for method, extracted in [('pypdf', pypdf_text), ('pdfplumber', plumber_text), ('plaintext', plain_text)]:
            for _, text in blocks(data, variant):
                if normalize(text) not in normalize(extracted):
                    raise ValueError(f'{variant["id"]}: source block missing from {method}.')
            positions = [extracted.index(section) for section in result['section_order']]
            if positions != sorted(positions):
                raise ValueError(f'{variant["id"]}: {method} section order changed.')
        if result['visual_review'].split(' - ', 1)[0] != 'passed':
            raise ValueError('Reviewed visual QA is not complete.')
        outputs.append({'variant': variant['id'], 'pages': 1, 'reviewed_bytes': 'unchanged', 'full_source_text': 'passed in pypdf/pdfplumber/plaintext', 'hyperlinks': len(actual_links), 'historical_render': 'reviewed PNG hash unchanged'})
    default_pdf = REPOSITORY / 'downloads/Deboraj-Sarkar-Resume.pdf'
    default_txt = REPOSITORY / 'downloads/Deboraj-Sarkar-Resume.txt'
    if hashlib.sha256(default_pdf.read_bytes()).hexdigest() != review['results'][0]['pdf_sha256'] or hashlib.sha256(default_txt.read_bytes()).hexdigest() != review['results'][0]['plaintext_sha256']:
        raise ValueError('Default resume aliases differ from the reviewed AI software variant.')
    return {'status': 'passed', 'mode': 'read_only_check', 'source_and_evidence': 'passed', 'outputs': outputs, 'default_aliases': 'match reviewed AI software PDF/TXT', 'writes': 0}


def main() -> None:
    parser = argparse.ArgumentParser()
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument('--draft', action='store_true', help='Write only output/ats/resume-content-preview.md; never final PDFs.')
    mode.add_argument('--check', action='store_true', help='Read-only check of bundled evidence, reviewed downloads, hashes, text and links.')
    parser.add_argument('--font-dir', type=Path, help='Optional Arial or Vera TTF directory for rebuilds. Defaults to Windows Arial, then bundled ReportLab Vera.')
    args = parser.parse_args()
    data = json.loads((ROOT / 'resume-source.json').read_text(encoding='utf-8-sig'))
    validate_final(data)
    if args.check:
        print(json.dumps(check_reviewed(data), indent=2))
        return
    OUTPUT.mkdir(parents=True, exist_ok=True)
    if args.draft:
        status = 'Source is finalized against local project reports. See verification.json for generated PDF QA.' if data['finalization_status'] == 'ready' else 'Project claims are pending measured verification. Final PDFs have not been produced.'
        text = '# Internal resume content preview\n\n' + status + '\n\n'
        for variant in data['variants']:
            text += '## ' + variant['target'] + '\n\n'
            text += '\n\n'.join(('- ' if kind == 'bullet' else '') + item for kind, item in blocks(data, variant)) + '\n\n'
        (OUTPUT / 'resume-content-preview.md').write_text(text, encoding='utf-8')
        print(json.dumps({'status': 'draft_only', 'final_pdfs_created': False, 'layout': 'single-column A4; 9.6pt body; 21pt name; 42pt side margins', 'fonts_on_rebuild': 'Windows Arial when available; otherwise bundled ReportLab Vera'}))
        return
    results = [build_pdf(data, variant, blocks(data, variant), args.font_dir) for variant in data['variants']]
    (OUTPUT / 'verification.json').write_text(json.dumps({'prepared_on': data['prepared_on'], 'results': results}, indent=2), encoding='utf-8')
    print(json.dumps(results, indent=2))


if __name__ == '__main__':
    main()
