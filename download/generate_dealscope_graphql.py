#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
DealScope - Specifications API GraphQL - PDF Generator
Version 1.0 - Mars 2026
Generates comprehensive GraphQL API specification document in French.
"""

import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch, cm, mm
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle,
    KeepTogether, HRFlowable
)
from reportlab.platypus.tableofcontents import TableOfContents
from reportlab.platypus.doctemplate import PageTemplate, BaseDocTemplate, Frame
from reportlab.platypus.toc import TocDocTemplate, multiBuild
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily

# ==============================================================================
# FONT REGISTRATION
# ==============================================================================
pdfmetrics.registerFont(TTFont('TimesNewRoman', '/usr/share/fonts/truetype/english/Times-New-Roman.ttf'))
pdfmetrics.registerFont(TTFont('Calibri', '/usr/share/fonts/truetype/english/calibri-regular.ttf'))
pdfmetrics.registerFont(TTFont('CalibriBold', '/usr/share/fonts/truetype/english/calibri-bold.ttf'))
pdfmetrics.registerFont(TTFont('CalibriItalic', '/usr/share/fonts/truetype/english/calibri-italic.ttf'))
pdfmetrics.registerFont(TTFont('CalibriBoldItalic', '/usr/share/fonts/truetype/english/calibri-bold-italic.ttf'))
pdfmetrics.registerFont(TTFont('DejaVuSans', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'))
pdfmetrics.registerFont(TTFont('DejaVuSansBold', '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'))
pdfmetrics.registerFont(TTFont('DejaVuSansMono', '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'))
pdfmetrics.registerFont(TTFont('DejaVuSansMonoBold', '/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf'))

registerFontFamily(
    'TimesNewRoman',
    normal='TimesNewRoman',
    bold='TimesNewRoman',
    italic='CalibriItalic',
    boldItalic='CalibriBoldItalic'
)
registerFontFamily(
    'Calibri',
    normal='Calibri',
    bold='CalibriBold',
    italic='CalibriItalic',
    boldItalic='CalibriBoldItalic'
)
registerFontFamily(
    'DejaVuSans',
    normal='DejaVuSans',
    bold='DejaVuSansBold'
)
registerFontFamily(
    'DejaVuSansMono',
    normal='DejaVuSansMono',
    bold='DejaVuSansMonoBold'
)

# ==============================================================================
# COLORS
# ==============================================================================
PRIMARY_DARK = colors.HexColor('#1F4E79')
PRIMARY_MED = colors.HexColor('#2E75B6')
PRIMARY_LIGHT = colors.HexColor('#D6E4F0')
ACCENT_GOLD = colors.HexColor('#C49A2A')
BG_LIGHT = colors.HexColor('#F2F2F2')
TEXT_DARK = colors.HexColor('#1A1A1A')
TEXT_GRAY = colors.HexColor('#555555')
CODE_BG = colors.HexColor('#F5F5F0')
CODE_BORDER = colors.HexColor('#CCCCCC')
TABLE_HEADER_COLOR = colors.HexColor('#1F4E79')
TABLE_ALT_ROW = colors.HexColor('#EBF1F8')

# ==============================================================================
# OUTPUT PATH
# ==============================================================================
OUTPUT_DIR = '/home/z/my-project/download'
OUTPUT_FILE = os.path.join(OUTPUT_DIR, 'DealScope_Specifications_API_GraphQL.pdf')

# ==============================================================================
# STYLES
# ==============================================================================
styles = getSampleStyleSheet()

# Override heading styles
styles['Heading1'].fontName = 'TimesNewRoman'
styles['Heading1'].fontSize = 20
styles['Heading1'].textColor = PRIMARY_DARK
styles['Heading1'].spaceAfter = 14
styles['Heading1'].spaceBefore = 20
styles['Heading1'].keepWithNext = True

styles['Heading2'].fontName = 'TimesNewRoman'
styles['Heading2'].fontSize = 15
styles['Heading2'].textColor = PRIMARY_MED
styles['Heading2'].spaceAfter = 10
styles['Heading2'].spaceBefore = 16
styles['Heading2'].keepWithNext = True

styles['Heading3'].fontName = 'TimesNewRoman'
styles['Heading3'].fontSize = 12
styles['Heading3'].textColor = PRIMARY_DARK
styles['Heading3'].spaceAfter = 8
styles['Heading3'].spaceBefore = 12
styles['Heading3'].keepWithNext = True

# Body text
style_body = ParagraphStyle(
    'BodyCustom',
    parent=styles['Normal'],
    fontName='TimesNewRoman',
    fontSize=10.5,
    leading=15,
    textColor=TEXT_DARK,
    alignment=TA_JUSTIFY,
    spaceAfter=8,
    spaceBefore=2,
)

# Cover title
style_cover_title = ParagraphStyle(
    'CoverTitle',
    parent=styles['Normal'],
    fontName='TimesNewRoman',
    fontSize=32,
    leading=40,
    textColor=PRIMARY_DARK,
    alignment=TA_CENTER,
    spaceAfter=10,
)

# Cover subtitle
style_cover_subtitle = ParagraphStyle(
    'CoverSubtitle',
    parent=styles['Normal'],
    fontName='TimesNewRoman',
    fontSize=16,
    leading=22,
    textColor=TEXT_GRAY,
    alignment=TA_CENTER,
    spaceAfter=6,
)

# Cover info
style_cover_info = ParagraphStyle(
    'CoverInfo',
    parent=styles['Normal'],
    fontName='TimesNewRoman',
    fontSize=12,
    leading=18,
    textColor=TEXT_DARK,
    alignment=TA_CENTER,
    spaceAfter=4,
)

# TOC styles
style_toc_title = ParagraphStyle(
    'TOCTitle',
    parent=styles['Normal'],
    fontName='TimesNewRoman',
    fontSize=20,
    leading=26,
    textColor=PRIMARY_DARK,
    alignment=TA_LEFT,
    spaceAfter=20,
    spaceBefore=10,
)

style_toc_entry = ParagraphStyle(
    'TOCEntry',
    parent=styles['Normal'],
    fontName='TimesNewRoman',
    fontSize=11,
    leading=20,
    textColor=TEXT_DARK,
    alignment=TA_LEFT,
)

style_toc_dots = ParagraphStyle(
    'TOCDots',
    parent=styles['Normal'],
    fontName='TimesNewRoman',
    fontSize=7,
    leading=20,
    textColor=colors.HexColor('#888888'),
    alignment=TA_LEFT,
)

style_toc_page = ParagraphStyle(
    'TOCPage',
    parent=styles['Normal'],
    fontName='TimesNewRoman',
    fontSize=11,
    leading=20,
    textColor=TEXT_DARK,
    alignment=TA_RIGHT,
)

# Code block style
style_code = ParagraphStyle(
    'CodeBlock',
    parent=styles['Normal'],
    fontName='DejaVuSansMono',
    fontSize=7.5,
    leading=10.5,
    textColor=TEXT_DARK,
    leftIndent=8,
    rightIndent=8,
    spaceAfter=4,
    spaceBefore=4,
    backColor=CODE_BG,
)

style_code_inline = ParagraphStyle(
    'CodeInline',
    parent=styles['Normal'],
    fontName='DejaVuSansMono',
    fontSize=8,
    leading=11,
    textColor=colors.HexColor('#2E4057'),
    backColor=colors.HexColor('#E8E8E3'),
)

# Bullet list
style_bullet = ParagraphStyle(
    'BulletCustom',
    parent=styles['Normal'],
    fontName='TimesNewRoman',
    fontSize=10.5,
    leading=15,
    textColor=TEXT_DARK,
    leftIndent=20,
    bulletIndent=8,
    spaceAfter=4,
    alignment=TA_LEFT,
)

# Table header style
style_table_header = ParagraphStyle(
    'TableHeader',
    parent=styles['Normal'],
    fontName='TimesNewRoman',
    fontSize=10,
    leading=13,
    textColor=colors.white,
    alignment=TA_CENTER,
)

# Table cell style
style_table_cell = ParagraphStyle(
    'TableCell',
    parent=styles['Normal'],
    fontName='TimesNewRoman',
    fontSize=9.5,
    leading=13,
    textColor=TEXT_DARK,
    alignment=TA_LEFT,
)

style_table_cell_center = ParagraphStyle(
    'TableCellCenter',
    parent=styles['Normal'],
    fontName='TimesNewRoman',
    fontSize=9.5,
    leading=13,
    textColor=TEXT_DARK,
    alignment=TA_CENTER,
)

# Section label
style_section_label = ParagraphStyle(
    'SectionLabel',
    parent=styles['Normal'],
    fontName='TimesNewRoman',
    fontSize=10,
    leading=14,
    textColor=PRIMARY_DARK,
    spaceAfter=4,
    spaceBefore=8,
)

style_small = ParagraphStyle(
    'Small',
    parent=styles['Normal'],
    fontName='TimesNewRoman',
    fontSize=9,
    leading=12,
    textColor=TEXT_GRAY,
    spaceAfter=2,
)

style_note = ParagraphStyle(
    'Note',
    parent=styles['Normal'],
    fontName='TimesNewRoman',
    fontSize=9.5,
    leading=13,
    textColor=colors.HexColor('#336699'),
    leftIndent=15,
    borderColor=PRIMARY_MED,
    borderWidth=1,
    borderPadding=6,
    spaceAfter=8,
    backColor=colors.HexColor('#F0F6FF'),
)


# ==============================================================================
# HELPER FUNCTIONS
# ==============================================================================

def make_heading(text, level=1):
    """Create a heading paragraph."""
    key = 'Heading{}'.format(level)
    return Paragraph(text, styles[key])


def make_body(text):
    """Create body text paragraph."""
    return Paragraph(text, style_body)


def make_bullet(text):
    """Create a bullet point."""
    return Paragraph(text, style_bullet, bulletText='\u2022')


def make_code_block(code_text):
    """Create a formatted code block inside a table with background."""
    lines = code_text.strip().split('\n')
    formatted = '<br/>'.join(
        line.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;').replace(' ', '&nbsp;')
        for line in lines
    )
    p = Paragraph(formatted, style_code)
    t = Table([[p]], colWidths=[460])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), CODE_BG),
        ('BOX', (0, 0), (-1, -1), 0.5, CODE_BORDER),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    return t


def make_table(data, col_widths=None):
    """Create a styled table with header."""
    if col_widths is None:
        col_widths = [120] * len(data[0])
    t = Table(data, colWidths=col_widths, repeatRows=1)
    style_cmds = [
        ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_COLOR),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'TimesNewRoman'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#BBBBBB')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]
    for i in range(1, len(data)):
        if i % 2 == 0:
            style_cmds.append(('BACKGROUND', (0, i), (-1, i), TABLE_ALT_ROW))
    t.setStyle(TableStyle(style_cmds))
    return t


def spacer(pts=8):
    return Spacer(1, pts)


def hr():
    return HRFlowable(width="100%", color=PRIMARY_LIGHT, thickness=1, spaceBefore=6, spaceAfter=6)


# ==============================================================================
# TOC DOCUMENT TEMPLATE
# ==============================================================================

class DealScopeDocTemplate(BaseDocTemplate):
    """Custom document template with TOC support and auto-page numbers."""

    def __init__(self, filename, **kwargs):
        BaseDocTemplate.__init__(self, filename, **kwargs)
        page_w, page_h = A4
        frame = Frame(
            1.0 * inch, 0.8 * inch,
            page_w - 2.0 * inch, page_h - 1.6 * inch,
            id='normal'
        )
        template = PageTemplate(id='main', frames=frame, onPage=self._add_page_footer)
        self.addPageTemplates([template])
        self._page_count_offset = 0

    def afterFlowable(self, flowable):
        """Register TOC entries for headings."""
        if isinstance(flowable, Paragraph):
            style = flowable.style.name
            text = flowable.getPlainText()
            if style == 'Heading1':
                key = 'h1_%d' % self.seq.nextf('heading1')
                self.canv.bookmarkPage(key)
                self.notify('TOCEntry', (0, text, self.page, key))
            elif style == 'Heading2':
                key = 'h2_%d' % self.seq.nextf('heading2')
                self.canv.bookmarkPage(key)
                self.notify('TOCEntry', (1, text, self.page, key))
            elif style == 'Heading3':
                key = 'h3_%d' % self.seq.nextf('heading3')
                self.canv.bookmarkPage(key)
                self.notify('TOCEntry', (2, text, self.page, key))

    def _add_page_footer(self, canvas, doc):
        """Add page number footer."""
        canvas.saveState()
        canvas.setFont('TimesNewRoman', 9)
        canvas.setFillColor(TEXT_GRAY)
        page_num = doc.page
        canvas.drawCentredString(A4[0] / 2.0, 0.5 * inch, "DealScope - Specifications API GraphQL  |  Page %d" % page_num)
        # Header line
        canvas.setStrokeColor(PRIMARY_LIGHT)
        canvas.setLineWidth(0.5)
        canvas.line(1.0 * inch, A4[1] - 0.65 * inch, A4[0] - 1.0 * inch, A4[1] - 0.65 * inch)
        canvas.restoreState()


# ==============================================================================
# COVER PAGE BUILDER
# ==============================================================================

def build_cover_page():
    """Build the cover page elements."""
    elements = []
    elements.append(Spacer(1, 100))

    # Decorative line
    elements.append(HRFlowable(width="60%", color=PRIMARY_DARK, thickness=3, spaceBefore=0, spaceAfter=20))

    elements.append(Paragraph("DealScope", ParagraphStyle(
        'CoverBrand', parent=styles['Normal'],
        fontName='TimesNewRoman', fontSize=40, leading=48,
        textColor=ACCENT_GOLD, alignment=TA_CENTER, spaceAfter=6,
    )))
    elements.append(Spacer(1, 15))
    elements.append(Paragraph("Specifications API GraphQL", style_cover_title))
    elements.append(Spacer(1, 12))
    elements.append(HRFlowable(width="40%", color=PRIMARY_MED, thickness=1.5, spaceBefore=10, spaceAfter=20))
    elements.append(Paragraph("Plateforme SaaS M&amp;A Intelligence Multi-Agents IA", style_cover_subtitle))
    elements.append(Spacer(1, 40))
    elements.append(Paragraph("Version 1.0 - Mars 2026", style_cover_info))
    elements.append(Spacer(1, 8))
    elements.append(Paragraph("Z.ai - Equipe Technique", style_cover_info))
    elements.append(Spacer(1, 30))
    elements.append(HRFlowable(width="60%", color=PRIMARY_DARK, thickness=3, spaceBefore=20, spaceAfter=20))

    # Confidentiality notice
    elements.append(Spacer(1, 40))
    elements.append(Paragraph(
        "CONFIDENTIEL - Document interne a usage exclusif de l'equipe technique DealScope.",
        ParagraphStyle('Confidential', parent=styles['Normal'],
                       fontName='TimesNewRoman', fontSize=9, leading=12,
                       textColor=TEXT_GRAY, alignment=TA_CENTER)
    ))
    elements.append(PageBreak())
    return elements


# ==============================================================================
# TABLE OF CONTENTS BUILDER
# ==============================================================================

def build_toc_page():
    """Build the table of contents page."""
    elements = []
    elements.append(Paragraph("Table des matieres", style_toc_title))
    elements.append(HRFlowable(width="100%", color=PRIMARY_DARK, thickness=1.5, spaceBefore=4, spaceAfter=14))

    toc = TableOfContents()
    toc.levelStyles = [
        ParagraphStyle('TOCLevel0', parent=styles['Normal'],
                       fontName='TimesNewRoman', fontSize=12, leading=22,
                       textColor=PRIMARY_DARK, leftIndent=0, spaceBefore=6),
        ParagraphStyle('TOCLevel1', parent=styles['Normal'],
                       fontName='TimesNewRoman', fontSize=10.5, leading=18,
                       textColor=TEXT_DARK, leftIndent=20, spaceBefore=2),
        ParagraphStyle('TOCLevel2', parent=styles['Normal'],
                       fontName='TimesNewRoman', fontSize=9.5, leading=16,
                       textColor=TEXT_GRAY, leftIndent=40, spaceBefore=1),
    ]
    elements.append(toc)
    elements.append(PageBreak())
    return elements


# ==============================================================================
# SECTION 1: INTRODUCTION
# ==============================================================================

def build_introduction():
    elements = []
    elements.append(make_heading("1. Introduction"))
    elements.append(hr())

    elements.append(make_heading("1.1 Objectif du document", level=2))
    elements.append(make_body(
        "Le present document constitue la reference technique complete pour l'API GraphQL de la plateforme DealScope. "
        "Il详细 decrit l'ensemble des types, requetes, mutations et subscriptions disponibles, ainsi que les mecanismes "
        "d'authentification, de gestion des erreurs, de pagination et de limitation de debit. Ce document s'adresse aux "
        "developpeurs front-end et back-end, aux architectes logiciels et aux equipes d'integration chargees de connecter "
        "DealScope aux systemes tiers (CRM, outils d'analytics, plateformes d'emailing). Il servira egalement de base "
        "pour la generation automatique de clients GraphQL types (TypeScript, Python, Go) et la documentation interactive "
        "via GraphQL Playground ou Apollo Explorer."
    ))
    elements.append(spacer(6))

    elements.append(make_heading("1.2 Pourquoi GraphQL", level=2))
    elements.append(make_body(
        "DealScope utilise GraphQL comme protocole d'API principal pour plusieurs raisons fondamentales qui repondent "
        "aux exigences specifiques d'une plateforme M&amp;A multi-agents. Premierement, GraphQL permet aux clients de "
        "requeter exactement les donnees dont ils ont besoin, evitant ainsi le sur-requete (over-fetching) et le sous-requete "
        "(under-fetching) inhrents aux API REST. Pour une application manipulant des profils d'entreprises complexes avec "
        "des dizaines de champs, des relations imbriquees (contacts, signaux, rapports d'analyse, graphes de connaissances), "
        "cette capacite est determinante pour les performances et l'experience utilisateur."
    ))
    elements.append(make_body(
        "Deuxiemement, le systeme de types fort de GraphQL fournit un contrat explicite entre le client et le serveur, "
        "facilitant la validation des donnees, la generation de code et la documentation automatique. Troisiemement, les "
        "subscriptions GraphQL permettent une communication temps reel bidirectionnelle via WebSockets, essentielle pour "
        "les notifications de scan d'agents IA, les alertes de signaux de marche et les mises a jour de pipeline. "
        "Enfin, GraphQL s'integre naturellement avec notre architecture de microservices et notre orchestrateur "
        "d'agents LangGraph, permettant de federer les donnees depuis PostgreSQL, Neo4j, Weaviate et Redis "
        "en une interface unifiee et coherente."
    ))
    elements.append(spacer(6))

    elements.append(make_heading("1.3 Principes de conception", level=2))
    elements.append(make_bullet("<b>Schema-first</b> : Le schema GraphQL est la source de verite. Toute evolution de l'API passe par une modification du schema validee par un processus de revue."))
    elements.append(make_bullet("<b>Cursor-based pagination</b> : Toutes les listes utilisent la pagination basee sur des curseurs pour garantir la coherence et les performances avec des grands jeux de donnees."))
    elements.append(make_bullet("<b>Multi-tenancy par RLS</b> : L'isolation des donnees est assuree par PostgreSQL Row Level Security, chaque requete etant automatiquement scopee au workspace courant."))
    elements.append(make_bullet("<b>Versioning semantique</b> : L'API suit le versionnage semantique (SemVer). Les changements breaking sont versions (v2, v3), les ajouts non-breaking sont integres dans la version courante."))
    elements.append(make_bullet("<b>Performance-oriented</b> : Utilisation de DataLoader pour le N+1, cache Redis pour les requetes frequentes, et analyse de complexite pour prevenir les requetes abusives."))
    elements.append(spacer(6))

    elements.append(make_heading("1.4 Strategie de versionnage", level=2))
    elements.append(make_body(
        "La strategie de versionnage de l'API GraphQL de DealScope repose sur le versionnage semantique (SemVer) "
        "applique au schema. La version actuelle est v1.x.y. Les regles suivantes guident l'evolution du schema : "
        "l'ajout de nouveaux types, champs ou requetes constitue un changement mineur (incrementation de MINOR). "
        "La deprecation d'un champ existant est signalee par la directive @deprecated(reason) sans rupture immediate. "
        "La suppression effective d'un champ ou d'un type, ou toute modification incompatible d'un type existant, "
        "constitue un changement majeur (incrementation de MAJOR) et necessite la creation d'une nouvelle version "
        "du schema accessible via un endpoint dedie (/graphql/v2). Les clients sont informes des deprecations "
        "via les introspection queries et le changelog publie sur le portail developpeur. "
        "Une periode de grace minimale de 6 mois est respectee entre la deprecation et la suppression effective."
    ))
    elements.append(PageBreak())
    return elements


# ==============================================================================
# SECTION 2: AUTHENTICATION & AUTHORIZATION
# ==============================================================================

def build_auth():
    elements = []
    elements.append(make_heading("2. Authentification &amp; Autorisation"))
    elements.append(hr())

    elements.append(make_heading("2.1 Flux d'authentification JWT / Clerk.dev", level=2))
    elements.append(make_body(
        "DealScope s'appuie sur Clerk.dev comme fournisseur d'identite (IdP) pour la gestion complete du cycle de vie "
        "des utilisateurs : inscription, connexion, reinitialisation de mot de passe, authentification multi-facteurs (MFA) "
        "et gestion des sessions. Le flux d'authentification fonctionne comme suit : lors de la connexion, Clerk emet un "
        "JWT (JSON Web Token) signe contenant les claims standards (sub, email, name) ainsi que des claims personnalises "
        "incluant le workspace_id courant et le role de l'utilisateur (admin, member, viewer). Ce JWT est transmis dans "
        "le header Authorization sous la forme 'Bearer {token}' a chaque requete GraphQL."
    ))
    elements.append(make_body(
        "Le backend FastAPI valide le JWT a chaque requete via un middleware dedie. La validation inclut la verification "
        "de la signature (cle publique Clerk), la verification de l'expiration (exp claim), et l'extraction du workspace_id "
        "pour le scope multi-tenant. Le token a une duree de vie courte (15 minutes) pour limiter les risques en cas de "
        "compromission. Le claim 'org_id' est utilise comme identifiant de workspace, permettant a la couche de base de "
        "donnees d'appliquer automatiquement les politiques RLS de PostgreSQL 16."
    ))

    # Auth flow diagram as code
    elements.append(spacer(4))
    elements.append(make_code_block(
        "POST /graphql\n"
        "Headers:\n"
        "  Authorization: Bearer eyJhbGciOiJIUzI1NiIs...\n"
        "  Content-Type: application/json\n\n"
        "Body:\n"
        '{ "query": "{ me { id email workspace { id name plan } } }" }'
    ))
    elements.append(spacer(6))

    elements.append(make_heading("2.2 Strategie de renouvellement des tokens", level=2))
    elements.append(make_body(
        "Pour maintenir une experience utilisateur fluide sans interruption de session, DealScope implemente un mecanisme "
        "de renouvellement automatique des tokens via des refresh tokens. Le refresh token est un JWT longue duree (7 jours) "
        "stocke de maniere securisee en cookie HTTP-only avec les attributs Secure, SameSite=Strict et un prefixe __Host-. "
        "Lorsque le token d'acces expire, le client peut utiliser le refresh token pour obtenir un nouveau token d'acces "
        "sans intervention de l'utilisateur. Ce mecanisme est transparent pour l'utilisateur et gere soit par le SDK Clerk "
        "cote client, soit par une mutation GraphQL dediee 'refreshToken' pour les integrations serveur-a-serveur."
    ))
    elements.append(make_body(
        "En cas de compromission suspectee, l'utilisateur peut reveler tous ses refresh tokens depuis son espace personnel, "
        "ce qui provoque l'invalidation immediate de toutes les sessions actives. Clerk gere cette invalidation via une "
        "liste noire (blacklist) des tokens, consultee a chaque validation. De plus, les tokens sont rotatifs : a chaque "
        "utilisation d'un refresh token, un nouveau refresh token est emis et l'ancien est invalide, prevenant ainsi les "
        "attaques par rejeu (replay attacks)."
    ))
    elements.append(spacer(6))

    elements.append(make_heading("2.3 Isolation multi-tenant par RLS", level=2))
    elements.append(make_body(
        "L'isolation des donnees entre les workspaces est un fondement architectural de DealScope. PostgreSQL 16 Row Level "
        "Security (RLS) est utilise pour garantir que chaque requete SQL ne retourne que les donnees appartenant au "
        "workspace de l'utilisateur authentifie. Le mecanisme fonctionne comme suit : a chaque connexion, le middleware "
        "d'authentification definit le parametre de session PostgreSQL 'app.current_workspace_id' a partir du JWT. "
        "Les politiques RLS sur chaque table filtrent automatiquement les lignes en fonction de ce parametre."
    ))
    elements.append(make_body(
        "Par exemple, la politique RLS sur la table target_companies est : 'USING (workspace_id = current_setting(''app.current_workspace_id'')::uuid)'. "
        "Cette approche garantit l'isolation au niveau de la base de donnees, ce qui signifie que meme un bug dans la "
        "couche applicative ne peut pas entrainer une fuite de donnees entre workspaces. Les administrateurs de workspace "
        "peuvent creer des projets et des ICP profiles, inviter des membres, et configurer les integrations CRM sans "
        "risque d'interference avec d'autres organisations."
    ))
    elements.append(spacer(6))

    elements.append(make_heading("2.4 Limitation de debit par endpoint et par plan", level=2))
    elements.append(make_body(
        "DealScope implemente une politique de limitation de debit (rate limiting) a plusieurs niveaux pour proteger "
        "l'infrastructure et assurer une distribution equitable des ressources entre les clients. La limitation est "
        "appliquee par utilisateur, par workspace et par type d'operation (query, mutation, subscription). "
        "Les limites different selon le plan de souscription du workspace, comme detaille dans le tableau suivant. "
        "Les compteurs sont geres via Redis 7 avec le pattern de fenetre glissante (sliding window) pour une precision "
        "optimale. Les headers de reponse incluent les informations de limitation (X-RateLimit-Limit, X-RateLimit-Remaining, "
        "X-RateLimit-Reset) pour permettre aux clients d'adapter leur comportement."
    ))
    elements.append(spacer(4))

    # Rate limit table
    rate_data = [
        [Paragraph('<b>Plan</b>', style_table_header),
         Paragraph('<b>Requetes / min</b>', style_table_header),
         Paragraph('<b>Mutations / min</b>', style_table_header),
         Paragraph('<b>Subscriptions actives</b>', style_table_header),
         Paragraph('<b>Complexite max</b>', style_table_header)],
        [Paragraph('Starter', style_table_cell_center),
         Paragraph('60', style_table_cell_center),
         Paragraph('20', style_table_cell_center),
         Paragraph('5', style_table_cell_center),
         Paragraph('200', style_table_cell_center)],
        [Paragraph('Professional', style_table_cell_center),
         Paragraph('150', style_table_cell_center),
         Paragraph('50', style_table_cell_center),
         Paragraph('20', style_table_cell_center),
         Paragraph('500', style_table_cell_center)],
        [Paragraph('Business', style_table_cell_center),
         Paragraph('300', style_table_cell_center),
         Paragraph('100', style_table_cell_center),
         Paragraph('50', style_table_cell_center),
         Paragraph('1000', style_table_cell_center)],
        [Paragraph('Enterprise', style_table_cell_center),
         Paragraph('Illimite', style_table_cell_center),
         Paragraph('Illimite', style_table_cell_center),
         Paragraph('200', style_table_cell_center),
         Paragraph('Personnalisee', style_table_cell_center)],
    ]
    elements.append(make_table(rate_data, [90, 90, 90, 100, 90]))
    elements.append(spacer(6))

    elements.append(make_heading("2.5 Gestion des cles API pour Enterprise", level=2))
    elements.append(make_body(
        "Les clients Enterprise disposent d'un mecanisme supplementaire d'authentification via des cles API. "
        "Ces cles sont generees depuis le tableau de bord administrateur et sont associees a un workspace et a un "
        "ensemble de permissions granulaires (read:companies, write:icp, execute:scans, manage:users). Les cles API "
        "suivent le format 'ds_pk_live_xxxxxxxxxxxxx' et sont stockees en base de donnees sous forme de hash SHA-256. "
        "Elles permettent l'authentification serveur-a-serveur sans necessiter un flux utilisateur interactif. "
        "Chaque cle API peut etre revoquee independamment, et un historique d'utilisation est disponible dans le "
        "tableau de bord. Les cles API sont transmises dans le header 'X-API-Key' a la place du header Authorization."
    ))
    elements.append(PageBreak())
    return elements


# ==============================================================================
# SECTION 3: GRAPHQL SCHEMA (CORE)
# ==============================================================================

def build_graphql_schema():
    elements = []

    # --- 3.1 Enums ---
    elements.append(make_heading("3. Schema GraphQL Complet"))
    elements.append(hr())
    elements.append(make_heading("3.1 Enumerations", level=2))
    elements.append(make_body(
        "Les enumerations definissent les ensembles de valeurs autorisees pour les champs specifiques du schema. "
        "Elles garantissent la coherence des donnees et facilitent la validation cote client comme cote serveur."
    ))

    enums_code = """enum CompanyStatus {
  NEW
  IDENTIFIED
  QUALIFIED
  IN_ANALYSIS
  IN_CONTACT
  IN_NEGOTIATION
  COMPLETED
  ARCHIVED
}

enum SignalType {
  FUNDING_ROUND
  ACQUISITION
  EXECUTIVE_CHANGE
  PRODUCT_LAUNCH
  PARTNERSHIP
  LEGAL_FILING
  FINANCIAL_REPORT
  SOCIAL_MENTION
  JOB_POSTING
  TECHNOLOGY_CHANGE
  MARKET_EXPANSION
  REGULATORY_CHANGE
}

enum PipelineStageEnum {
  PROSPECTING
  INITIAL_OUTREACH
  QUALIFICATION
  DUE_DILIGENCE
  NEGOTIATION
  LETTER_OF_INTENT
  FINAL_REVIEW
  CLOSED_WON
  CLOSED_LOST
}

enum UserRole {
  OWNER
  ADMIN
  MEMBER
  VIEWER
}

enum ScanStatus {
  PENDING
  RUNNING
  COMPLETED
  FAILED
  CANCELLED
}

enum CRMType {
  SALESFORCE
  HUBSPOT
  PIPEDRIVE
  DYNAMICS365
}

enum ExportFormat {
  CSV
  JSON
  XLSX
  PDF
}

enum AgentType {
  CIBLAGE
  OSINT
  ANALYSE
  EMAIL_MATCHING
  DATA_MANAGEMENT
}"""
    elements.append(spacer(4))
    elements.append(make_code_block(enums_code))
    elements.append(spacer(8))

    # --- 3.2 Core Types ---
    elements.append(make_heading("3.2 Types principaux", level=2))

    types_code = """type Workspace {
  id: ID!
  name: String!
  slug: String!
  plan: SubscriptionPlan!
  createdAt: DateTime!
  updatedAt: DateTime!
  owner: User!
  members: [User!]!
  icpProfiles: [ICPProfile!]!
  targetCompanies(count: Int): [TargetCompany!]!
  apiKeys: [APIKey!]!
  settings: WorkspaceSettings!
}

type User {
  id: ID!
  email: String!
  firstName: String!
  lastName: String!
  avatarUrl: String
  role: UserRole!
  workspace: Workspace!
  lastLoginAt: DateTime
  createdAt: DateTime!
}

type ICPProfile {
  id: ID!
  workspaceId: ID!
  name: String!
  description: String
  criteria: ICP_criteria!
  isActive: Boolean!
  targetCount: Int!
  createdAt: DateTime!
  updatedAt: DateTime!
  lastScanAt: DateTime
  scans: [Scan!]!
}

type ICP_criteria {
  industries: [String!]
  revenueRange: RevenueRangeInput
  employeeRange: EmployeeRangeInput
  geographies: [String!]
  technologies: [String!]
  keywords: [String!]
  exclusionKeywords: [String!]
  maturityStage: CompanyMaturityStage
}

type RevenueRangeInput {
  min: Float
  max: Float
  currency: String = "EUR"
}

type EmployeeRangeInput {
  min: Int
  max: Int
}

enum CompanyMaturityStage {
  STARTUP
  GROWTH
  MATURE
  DECLINING
}

type TargetCompany {
  id: ID!
  workspaceId: ID!
  name: String!
  legalName: String
  domain: String!
  description: String
  status: CompanyStatus!
  industry: String
  revenue: Float
  revenueCurrency: String
  employeeCount: Int
  headquarters: String
  foundedYear: Int
  website: String
  logoUrl: String
  tags: [String!]
  signals: [CompanySignal!]!
  contacts: [Contact!]!
  analysisReport: AnalysisReport
  pipelineStage: PipelineStage
  icpProfile: ICPProfile!
  matchedAt: DateTime!
  updatedAt: DateTime!
  osintProfile: OSINTProfile
  knowledgeGraphConnections(depth: Int = 1): [KGEntity!]
}

type CompanySignal {
  id: ID!
  companyId: ID!
  type: SignalType!
  title: String!
  description: String!
  source: String!
  sourceUrl: String
  detectedAt: DateTime!
  relevanceScore: Float!
  isRead: Boolean!
}

type Contact {
  id: ID!
  companyId: ID!
  firstName: String!
  lastName: String!
  email: String
  jobTitle: String
  department: String
  seniority: ContactSeniority
  linkedInUrl: String
  phone: String
  isValidated: Boolean!
  emailConfidence: Float
  lastContactedAt: DateTime
}

enum ContactSeniority {
  C_LEVEL
  VP
  DIRECTOR
  MANAGER
  SENIOR
  JUNIOR
}

type OSINTProfile {
  id: ID!
  companyId: ID!
  company: TargetCompany!
  newsArticles: [OSINTArticle!]!
  socialMediaPresence: SocialMediaPresence!
  technologyStack: [String!]
  competitorIds: [ID!]
  partnershipIds: [ID!]
  lastUpdated: DateTime!
}

type OSINTArticle {
  id: ID!
  title: String!
  summary: String!
  source: String!
  url: String!
  publishedAt: DateTime!
  sentiment: Sentiment!
}

enum Sentiment {
  POSITIVE
  NEUTRAL
  NEGATIVE
  MIXED
}

type SocialMediaPresence {
  linkedIn: SocialProfile
  twitter: SocialProfile
  facebook: SocialProfile
  crunchbase: SocialProfile
}

type SocialProfile {
  url: String
  followers: Int
  postFrequency: String
  lastPostAt: DateTime
}

type AnalysisReport {
  id: ID!
  companyId: ID!
  company: TargetCompany!
  executiveSummary: String!
  financialAnalysis: FinancialAnalysis
  strategicFit: StrategicFitAnalysis
  riskAssessment: RiskAssessment
  generatedAt: DateTime!
  generatedBy: AgentType!
  version: Int!
  sections: [ReportSection!]!
}

type FinancialAnalysis {
  revenueTrend: [DataPoint!]!
  profitability: Float
  debtToEquity: Float
  growthRate: Float
  valuationEstimate: ValuationRange
}

type ValuationRange {
  low: Float!
  high: Float!
  currency: String!
  methodology: String!
}

type DataPoint {
  period: String!
  value: Float!
}

type StrategicFitAnalysis {
  overallScore: Float!
  marketAlignment: Float!
  technologySynergy: Float!
  culturalFit: Float!
  geographicFit: Float!
  recommendation: String!
}

type RiskAssessment {
  overallRisk: RiskLevel!
  financialRisk: RiskLevel!
  operationalRisk: RiskLevel!
  marketRisk: RiskLevel!
  regulatoryRisk: RiskLevel!
  keyRisks: [RiskItem!]!
}

enum RiskLevel {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

type RiskItem {
  category: String!
  description: String!
  severity: RiskLevel!
  mitigation: String!
}

type ReportSection {
  id: ID!
  title: String!
  content: String!
  order: Int!
}

type EmailSequence {
  id: ID!
  workspaceId: ID!
  name: String!
  subjectTemplate: String!
  bodyTemplate: String!
  variables: [String!]
  isActive: Boolean!
  sentCount: Int!
  replyRate: Float
  positiveReplyRate: Float
  createdAt: DateTime!
  updatedAt: DateTime!
}

type PipelineStage {
  id: ID!
  name: String!
  order: Int!
  companies: [TargetCompany!]!
  value: Float!
  expectedCloseDate: DateTime
}

type Scan {
  id: ID!
  icpProfileId: ID!
  status: ScanStatus!
  progress: Float!
  startedAt: DateTime!
  completedAt: DateTime
  error: String
  companiesFound: Int!
  agents: [ScanAgentStatus!]!
}

type ScanAgentStatus {
  agentType: AgentType!
  status: ScanStatus!
  progress: Float!
  startedAt: DateTime
  completedAt: DateTime
  resultSummary: String
}

type KnowledgeGraph {
  entities: [KGEntity!]!
  relations: [KGRelation!]!
  totalEntities: Int!
  totalRelations: Int!
}

type KGEntity {
  id: ID!
  name: String!
  type: KGEntityType!
  properties: JSON!
  relations: [KGRelation!]!
  connectedEntities(depth: Int = 1): [KGEntity!]!
}

enum KGEntityType {
  COMPANY
  PERSON
  TECHNOLOGY
  INDUSTRY
  EVENT
  LOCATION
  PRODUCT
  INVESTOR
}

type KGRelation {
  id: ID!
  sourceId: ID!
  targetId: ID!
  type: String!
  properties: JSON!
  source: KGEntity
  target: KGEntity
  weight: Float
}

scalar DateTime
scalar JSON

type SubscriptionPlan {
  name: String!
  limits: PlanLimits!
  features: [String!]!
  currentUsage: PlanUsage!
}

type PlanLimits {
  maxUsers: Int!
  maxICPProfiles: Int!
  maxTargetCompanies: Int!
  maxScansPerMonth: Int!
  maxEmailsPerMonth: Int!
}

type PlanUsage {
  users: Int!
  icpProfiles: Int!
  targetCompanies: Int!
  scansThisMonth: Int!
  emailsThisMonth: Int!
}

type WorkspaceSettings {
  defaultCurrency: String!
  defaultLanguage: String!
  notifications: NotificationSettings!
  integrations: IntegrationSettings!
}

type NotificationSettings {
  emailAlerts: Boolean!
  signalAlerts: Boolean!
  scanCompletionAlerts: Boolean!
  pipelineChangeAlerts: Boolean!
}

type IntegrationSettings {
  crmType: CRMType
  crmConfig: JSON
  webhookUrl: String
  webhookSecret: String
}

type APIKey {
  id: ID!
  name: String!
  prefix: String!
  permissions: [String!]!
  lastUsedAt: DateTime
  createdAt: DateTime!
  expiresAt: DateTime
}

type AnalyticsDashboard {
  companiesByStatus: [StatusCount!]!
  pipelineValue: [StageValue!]!
  signalsByType: [TypeCount!]!
  scanHistory: [ScanSummary!]!
  topPerformingICPs: [ICPPerformance!]!
  activityTimeline: [ActivityEvent!]!
}

type StatusCount {
  status: CompanyStatus!
  count: Int!
}

type StageValue {
  stage: PipelineStageEnum!
  count: Int!
  totalValue: Float!
}

type TypeCount {
  type: SignalType!
  count: Int!
}

type ScanSummary {
  id: ID!
  icpProfileName: String!
  status: ScanStatus!
  companiesFound: Int!
  startedAt: DateTime!
  duration: Int
}

type ICPPerformance {
  icpProfileId: ID!
  name: String!
  targetCount: Int!
  qualifiedCount: Int!
  conversionRate: Float!
}

type ActivityEvent {
  id: ID!
  type: String!
  description: String!
  timestamp: DateTime!
  userId: ID!
}"""
    elements.append(make_code_block(types_code))
    elements.append(spacer(8))

    # --- 3.3 Input Types ---
    elements.append(make_heading("3.3 Types d'entree (Input)", level=2))
    elements.append(make_body(
        "Les types d'entree definissent la structure des donnees transmises aux mutations GraphQL. "
        "Ils assurent la validation des donnees cote serveur et facilitent la documentation de l'API."
    ))

    input_code = """input CreateWorkspaceInput {
  name: String!
  slug: String!
}

input UpdateWorkspaceInput {
  name: String
  settings: WorkspaceSettingsInput
}

input WorkspaceSettingsInput {
  defaultCurrency: String
  defaultLanguage: String
  notifications: NotificationSettingsInput
}

input NotificationSettingsInput {
  emailAlerts: Boolean
  signalAlerts: Boolean
  scanCompletionAlerts: Boolean
  pipelineChangeAlerts: Boolean
}

input CreateICPProfileInput {
  name: String!
  description: String
  criteria: ICP_criteriaInput!
}

input ICP_criteriaInput {
  industries: [String!]
  revenueMin: Float
  revenueMax: Float
  revenueCurrency: String = "EUR"
  employeeMin: Int
  employeeMax: Int
  geographies: [String!]
  technologies: [String!]
  keywords: [String!]
  exclusionKeywords: [String!]
  maturityStage: CompanyMaturityStage
}

input UpdateICPProfileInput {
  name: String
  description: String
  criteria: ICP_criteriaInput
  isActive: Boolean
}

input TargetCompanyFilterInput {
  status: CompanyStatus
  industry: [String!]
  revenueMin: Float
  revenueMax: Float
  employeeMin: Int
  employeeMax: Int
  geography: [String!]
  hasSignal: Boolean
  signalType: SignalType
  inPipeline: Boolean
  pipelineStage: PipelineStageEnum
  search: String
  tags: [String!]
  icpProfileId: ID
  createdAtAfter: DateTime
  createdAtBefore: DateTime
}

input UpdateTargetCompanyStatusInput {
  companyId: ID!
  status: CompanyStatus!
  pipelineStageId: ID
}

input CreateEmailSequenceInput {
  name: String!
  subjectTemplate: String!
  bodyTemplate: String!
  isActive: Boolean = true
}

input UpdateEmailSequenceInput {
  id: ID!
  name: String
  subjectTemplate: String
  bodyTemplate: String
  isActive: Boolean
}

input InviteUserInput {
  email: String!
  role: UserRole!
}

input UpdateUserRoleInput {
  userId: ID!
  role: UserRole!
}

input ExportConfigInput {
  workspaceId: ID!
  crmType: CRMType!
  config: JSON!
  exportFormat: ExportFormat = CSV
}

input SearchCompaniesInput {
  query: String!
  industries: [String!]
  geographies: [String!]
  revenueMin: Float
  revenueMax: Float
  employeeMin: Int
  employeeMax: Int
  limit: Int = 20
}

input ContactFilterInput {
  department: [String!]
  seniority: [ContactSeniority!]
  isValidated: Boolean
  hasEmail: Boolean
  search: String
}"""
    elements.append(make_code_block(input_code))
    elements.append(spacer(8))

    # --- 3.4 Pagination Types ---
    elements.append(make_heading("3.4 Types de pagination", level=2))
    elements.append(make_body(
        "DealScope utilise une pagination basee sur des curseurs (cursor-based pagination) pour toutes les requetes "
        "retournant des listes. Cette approche offre plusieurs avantages par rapport a la pagination offset : "
        "elle est performante meme avec de grandes tables car elle utilise des index B-tree sur les colonnes de tri, "
        "elle reste coherente lorsque des elements sont ajoutes ou supprimes entre les pages, et elle evite "
        "le probleme de doublons lorsque des donnees sont modifiees concurremment."
    ))

    pagination_code = """type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String
  totalCount: Int!
}

type TargetCompanyConnection {
  edges: [TargetCompanyEdge!]!
  pageInfo: PageInfo!
}

type TargetCompanyEdge {
  cursor: String!
  node: TargetCompany!
}

type ContactConnection {
  edges: [ContactEdge!]!
  pageInfo: PageInfo!
}

type ContactEdge {
  cursor: String!
  node: Contact!
}

type SignalConnection {
  edges: [SignalEdge!]!
  pageInfo: PageInfo!
}

type SignalEdge {
  cursor: String!
  node: CompanySignal!
}

type WorkspaceConnection {
  edges: [WorkspaceEdge!]!
  pageInfo: PageInfo!
}

type WorkspaceEdge {
  cursor: String!
  node: Workspace!
}

type ICPProfileConnection {
  edges: [ICPProfileEdge!]!
  pageInfo: PageInfo!
}

type ICPProfileEdge {
  cursor: String!
  node: ICPProfile!
}"""
    elements.append(make_code_block(pagination_code))
    elements.append(spacer(8))

    # --- 3.5 Queries ---
    elements.append(make_heading("3.5 Requetes (Queries)", level=2))
    elements.append(make_body(
        "Les requetes GraphQL permettent de lire et filtrer les donnees de la plateforme. Chaque requete est scopee "
        "au workspace de l'utilisateur authentifie grace aux politiques RLS. Les requetes de liste supportent le filtrage, "
        "le tri et la pagination basee sur les curseurs."
    ))

    queries_code = """type Query {
  # --- Authentification ---
  me: User!

  # --- Workspaces ---
  workspace(id: ID!): Workspace
  workspaces(
    first: Int = 20
    after: String
    orderBy: WorkspaceOrderBy = CREATED_AT_DESC
  ): WorkspaceConnection!

  # --- Profils ICP ---
  icpProfile(id: ID!): ICPProfile
  icpProfiles(
    first: Int = 20
    after: String
    isActive: Boolean
    orderBy: ICPProfileOrderBy = CREATED_AT_DESC
  ): ICPProfileConnection!

  # --- Entreprises cibles ---
  targetCompany(id: ID!): TargetCompany
  targetCompanies(
    first: Int = 20
    after: String
    filter: TargetCompanyFilterInput
    orderBy: TargetCompanyOrderBy = MATCHED_AT_DESC
  ): TargetCompanyConnection!

  # --- Signaux ---
  companySignals(
    companyId: ID!
    first: Int = 20
    after: String
    type: SignalType
  ): SignalConnection!

  # --- Contacts ---
  contacts(
    companyId: ID!
    first: Int = 20
    after: String
    filter: ContactFilterInput
  ): ContactConnection!

  # --- Analyse ---
  analysisReport(companyId: ID!): AnalysisReport
  analysisReports(
    companyId: ID!
    versions: Boolean = false
  ): [AnalysisReport!]!

  # --- Graphes de connaissances ---
  knowledgeGraph(
    entityId: ID
    entityType: KGEntityType
    depth: Int = 2
    relationTypes: [String!]
  ): KnowledgeGraph!
  kgEntity(id: ID!): KGEntity
  kgSearch(
    query: String!
    types: [KGEntityType!]
    first: Int = 20
  ): [KGEntity!]!

  # --- Pipeline ---
  pipeline(workspaceId: ID): [PipelineStage!]!
  pipelineStage(id: ID!): PipelineStage

  # --- Sequences email ---
  emailSequence(id: ID!): EmailSequence
  emailSequences(
    isActive: Boolean
    orderBy: EmailSequenceOrderBy = CREATED_AT_DESC
  ): [EmailSequence!]!

  # --- Scans ---
  scan(id: ID!): Scan
  scans(
    icpProfileId: ID
    status: ScanStatus
    first: Int = 20
    after: String
  ): [Scan!]!

  # --- Analytics ---
  analytics(
    workspaceId: ID
    period: AnalyticsPeriod = LAST_30_DAYS
  ): AnalyticsDashboard!

  # --- Recherche globale ---
  searchCompanies(
    input: SearchCompaniesInput!
  ): [SearchCompanyResult!]!

  # --- Utilisateurs ---
  users(
    first: Int = 50
    after: String
  ): [User!]!
}

enum WorkspaceOrderBy {
  CREATED_AT_DESC
  CREATED_AT_ASC
  NAME_ASC
  NAME_DESC
}

enum ICPProfileOrderBy {
  CREATED_AT_DESC
  CREATED_AT_ASC
  NAME_ASC
  NAME_DESC
}

enum TargetCompanyOrderBy {
  MATCHED_AT_DESC
  MATCHED_AT_ASC
  NAME_ASC
  NAME_DESC
  REVENUE_DESC
  REVENUE_ASC
  UPDATED_AT_DESC
}

enum EmailSequenceOrderBy {
  CREATED_AT_DESC
  CREATED_AT_ASC
  NAME_ASC
}

enum AnalyticsPeriod {
  LAST_7_DAYS
  LAST_30_DAYS
  LAST_90_DAYS
  LAST_12_MONTHS
  YEAR_TO_DATE
}

type SearchCompanyResult {
  company: TargetCompany!
  matchScore: Float!
  matchReasons: [String!]!
}"""
    elements.append(make_code_block(queries_code))
    elements.append(spacer(8))

    # --- 3.6 Mutations ---
    elements.append(make_heading("3.6 Mutations", level=2))
    elements.append(make_body(
        "Les mutations GraphQL permettent de modifier les donnees de la plateforme. Elles sont validees cote serveur "
        "et retournent les objets modifies. Les mutations sensibles (suppression, changement de role) requierent "
        "des permissions specifiques verifiees par les policies RLS et la couche d'autorisation."
    ))

    mutations_code = """type Mutation {
  # --- Workspaces ---
  createWorkspace(input: CreateWorkspaceInput!): Workspace!
  updateWorkspace(input: UpdateWorkspaceInput!): Workspace!
  deleteWorkspace(id: ID!): Boolean!

  # --- Profils ICP ---
  createICPProfile(input: CreateICPProfileInput!): ICPProfile!
  updateICPProfile(input: UpdateICPProfileInput!): ICPProfile!
  deleteICPProfile(id: ID!): Boolean!

  # --- Scans d'agents IA ---
  launchScan(icpProfileId: ID!): Scan!
  cancelScan(scanId: ID!): Boolean!
  retryScan(scanId: ID!): Scan!

  # --- Entreprises cibles ---
  updateTargetCompanyStatus(
    input: UpdateTargetCompanyStatusInput!
  ): TargetCompany!
  addToPipeline(
    companyId: ID!
    stageId: ID!
  ): TargetCompany!
  removeFromPipeline(companyId: ID!): TargetCompany!
  bulkUpdateStatus(
    companyIds: [ID!]!
    status: CompanyStatus!
  ): [TargetCompany!]!

  # --- Sequences email ---
  createEmailSequence(
    input: CreateEmailSequenceInput!
  ): EmailSequence!
  updateEmailSequence(
    input: UpdateEmailSequenceInput!
  ): EmailSequence!
  deleteEmailSequence(id: ID!): Boolean!
  sendEmail(
    sequenceId: ID!
    contactId: ID!
  ): EmailSendResult!

  # --- Export CRM ---
  exportToCRM(input: ExportConfigInput!): ExportResult!

  # --- Utilisateurs ---
  inviteUser(input: InviteUserInput!): User!
  updateUserRole(input: UpdateUserRoleInput!): User!
  removeUser(userId: ID!): Boolean!

  # --- Graphes de connaissances ---
  refreshKnowledgeGraph(
    companyId: ID!
    depth: Int = 2
  ): KnowledgeGraph!

  # --- Signaux ---
  markSignalAsRead(signalId: ID!): CompanySignal!
  markAllSignalsAsRead(companyId: ID!): [CompanySignal!]!

  # --- Re-analyse ---
  triggerAnalysis(companyId: ID!): AnalysisReport!

  # --- Cles API ---
  createAPIKey(name: String!, permissions: [String!]!): APIKey!
  revokeAPIKey(keyId: ID!): Boolean!
}

type EmailSendResult {
  success: Boolean!
  messageId: String
  error: String
}

type ExportResult {
  success: Boolean!
  exportedCount: Int!
  downloadUrl: String
  error: String
}"""
    elements.append(make_code_block(mutations_code))
    elements.append(spacer(8))

    # --- 3.7 Subscriptions ---
    elements.append(make_heading("3.7 Subscriptions (Temps reel)", level=2))
    elements.append(make_body(
        "Les subscriptions GraphQL permettent aux clients de recevoir des mises a jour en temps reel via WebSockets. "
        "DealScope utilise les subscriptions pour les notifications de progression des scans d'agents IA, les alertes "
        "de nouveaux signaux de marche et les mises a jour du pipeline. Les subscriptions sont implementees via "
        "le protocol WebSocket avec le format de message GraphQL standard (graphql-transport-ws). Les clients "
        "doivent s'authentifier en envoyant un message 'connection_init' contenant le token JWT."
    ))

    subs_code = """type Subscription {
  # Progression d'un scan d'agents IA
  scanProgress(scanId: ID!): ScanProgressEvent!

  # Nouveaux signaux pour une entreprise
  newSignal(companyId: ID!): CompanySignal!

  # Mises a jour du pipeline
  pipelineUpdates(
    workspaceId: ID
  ): PipelineUpdateEvent!

  # Notifications globales
  notification(workspaceId: ID): NotificationEvent!

  # Progression d'analyse
  analysisProgress(companyId: ID!): AnalysisProgressEvent!
}

type ScanProgressEvent {
  scanId: ID!
  status: ScanStatus!
  progress: Float!
  currentAgent: AgentType
  agentProgress: Float
  companiesFound: Int!
  message: String
  completedAt: DateTime
  error: String
}

type PipelineUpdateEvent {
  type: PipelineChangeType!
  companyId: ID!
  companyName: String!
  fromStage: PipelineStageEnum
  toStage: PipelineStageEnum
  userId: ID!
  timestamp: DateTime!
}

enum PipelineChangeType {
  ADDED
  MOVED
  REMOVED
  STATUS_CHANGED
}

type NotificationEvent {
  id: ID!
  type: String!
  title: String!
  message: String!
  severity: NotificationSeverity
  link: String
  timestamp: DateTime!
}

enum NotificationSeverity {
  INFO
  SUCCESS
  WARNING
  ERROR
}

type AnalysisProgressEvent {
  companyId: ID!
  status: AnalysisStatus!
  progress: Float!
  currentSection: String
  message: String
  completedAt: DateTime
}

enum AnalysisStatus {
  QUEUED
  GENERATING
  COMPLETED
  FAILED
}"""
    elements.append(make_code_block(subs_code))
    elements.append(PageBreak())
    return elements


# ==============================================================================
# SECTION 4: ERROR HANDLING
# ==============================================================================

def build_error_handling():
    elements = []
    elements.append(make_heading("4. Gestion des erreurs &amp; Format de reponse"))
    elements.append(hr())

    elements.append(make_heading("4.1 Format de reponse standard", level=2))
    elements.append(make_body(
        "DealScope retourne les erreurs GraphQL en suivant la specification officielle, enrichie avec des extensions "
        "personnalisees pour fournir des informations contextuelles supplementaires. Chaque erreur inclut un code "
        "d'erreur machine-readable, un message humain-readable en francais et en anglais, et des metadonnees de debug "
        "en mode developpement. Le format standard d'une reponse d'erreur GraphQL est le suivant : la reponse contient "
        "le champ 'errors' avec un tableau d'objets erreur, chacun comprenant 'message', 'path' (chemin GraphQL de l'erreur), "
        "'extensions' contenant le 'code', 'timestamp', 'requestId' et eventuellement 'details'."
    ))
    elements.append(make_body(
        "En mode production, les champs 'details' et 'stack' sont omis pour des raisons de securite. En mode developpement, "
        "ils sont inclus pour faciliter le debug. Le 'requestId' permet de tracer une requete a travers les logs distribues "
        "et facilite le support technique. Les erreurs de validation (champs manquants, types incorrects) sont retournees "
        "avec le code VALIDATION_ERROR et incluent la liste des champs invalides dans 'details'."
    ))
    elements.append(spacer(4))

    # Error response example
    elements.append(make_code_block(
        '// Exemple de reponse d\'erreur GraphQL\n'
        '{\n'
        '  "errors": [\n'
        '    {\n'
        '      "message": "Ressource non trouvee",\n'
        '      "path": ["targetCompany"],\n'
        '      "extensions": {\n'
        '        "code": "NOT_FOUND",\n'
        '        "timestamp": "2026-03-15T10:30:00Z",\n'
        '        "requestId": "req_abc123",\n'
        '        "details": {\n'
        '          "resource": "TargetCompany",\n'
        '          "id": "non_existent_id"\n'
        '        }\n'
        '      }\n'
        '    }\n'
        '  ],\n'
        '  "data": {\n'
        '    "targetCompany": null\n'
        '  }\n'
        '}'
    ))
    elements.append(spacer(6))

    elements.append(make_heading("4.2 Codes d'erreur", level=2))
    elements.append(make_body(
        "La liste complete des codes d'erreur utilises par l'API GraphQL de DealScope est presentee dans le tableau "
        "ci-dessous. Chaque code est associe a un HTTP status code equivalent pour les cas de transport REST "
        "(bien que GraphQL utilise systematiquement le status HTTP 200 pour les erreurs applicatives)."
    ))
    elements.append(spacer(4))

    error_data = [
        [Paragraph('<b>Code</b>', style_table_header),
         Paragraph('<b>Description</b>', style_table_header),
         Paragraph('<b>HTTP equiv.</b>', style_table_header),
         Paragraph('<b>Categorie</b>', style_table_header)],
        [Paragraph('AUTHENTICATION_REQUIRED', style_table_cell), Paragraph('Token JWT manquant ou invalide', style_table_cell), Paragraph('401', style_table_cell_center), Paragraph('Auth', style_table_cell)],
        [Paragraph('AUTHORIZATION_DENIED', style_table_cell), Paragraph('Permissions insuffisantes', style_table_cell), Paragraph('403', style_table_cell_center), Paragraph('Auth', style_table_cell)],
        [Paragraph('NOT_FOUND', style_table_cell), Paragraph('Ressource introuvable', style_table_cell), Paragraph('404', style_table_cell_center), Paragraph('Client', style_table_cell)],
        [Paragraph('VALIDATION_ERROR', style_table_cell), Paragraph('Donnees de requete invalides', style_table_cell), Paragraph('422', style_table_cell_center), Paragraph('Client', style_table_cell)],
        [Paragraph('RATE_LIMIT_EXCEEDED', style_table_cell), Paragraph('Limite de debit atteinte', style_table_cell), Paragraph('429', style_table_cell_center), Paragraph('Rate', style_table_cell)],
        [Paragraph('PLAN_LIMIT_REACHED', style_table_cell), Paragraph('Limite du plan atteinte', style_table_cell), Paragraph('403', style_table_cell_center), Paragraph('Billing', style_table_cell)],
        [Paragraph('QUERY_TOO_COMPLEX', style_table_cell), Paragraph('Complexite de requete excessive', style_table_cell), Paragraph('400', style_table_cell_center), Paragraph('Rate', style_table_cell)],
        [Paragraph('QUERY_DEPTH_EXCEEDED', style_table_cell), Paragraph('Profondeur de requete excessive', style_table_cell), Paragraph('400', style_table_cell_center), Paragraph('Rate', style_table_cell)],
        [Paragraph('INTERNAL_ERROR', style_table_cell), Paragraph('Erreur interne du serveur', style_table_cell), Paragraph('500', style_table_cell_center), Paragraph('Serveur', style_table_cell)],
        [Paragraph('SERVICE_UNAVAILABLE', style_table_cell), Paragraph('Service temporairement indisponible', style_table_cell), Paragraph('503', style_table_cell_center), Paragraph('Serveur', style_table_cell)],
        [Paragraph('SCAN_ALREADY_RUNNING', style_table_cell), Paragraph('Un scan est deja en cours', style_table_cell), Paragraph('409', style_table_cell_center), Paragraph('Client', style_table_cell)],
        [Paragraph('CRM_SYNC_FAILED', style_table_cell), Paragraph('Echec de synchronisation CRM', style_table_cell), Paragraph('502', style_table_cell_center), Paragraph('Integration', style_table_cell)],
    ]
    elements.append(make_table(error_data, [120, 160, 70, 70]))
    elements.append(spacer(6))

    elements.append(make_heading("4.3 Extensions d'erreur GraphQL", level=2))
    elements.append(make_body(
        "Les extensions d'erreur suivantes sont incluses dans chaque objet erreur GraphQL. Elles fournissent des "
        "informations contextuelles pour faciliter le debug et le support. L'objet 'extensions' est toujours present "
        "et contient au minimum les champs 'code' et 'timestamp'. En mode developpement, les champs supplementaires "
        "'details', 'stack' et 'suggestion' sont inclus."
    ))
    elements.append(spacer(4))

    ext_data = [
        [Paragraph('<b>Champ</b>', style_table_header),
         Paragraph('<b>Type</b>', style_table_header),
         Paragraph('<b>Description</b>', style_table_header)],
        [Paragraph('code', style_table_cell), Paragraph('String', style_table_cell_center), Paragraph('Code d\'erreur machine-readable', style_table_cell)],
        [Paragraph('timestamp', style_table_cell), Paragraph('DateTime', style_table_cell_center), Paragraph('Horodatage de l\'erreur (ISO 8601)', style_table_cell)],
        [Paragraph('requestId', style_table_cell), Paragraph('String', style_table_cell_center), Paragraph('Identifiant unique de la requete pour tracing', style_table_cell)],
        [Paragraph('details', style_table_cell), Paragraph('JSON', style_table_cell_center), Paragraph('Details specifiques (champs invalides, etc.)', style_table_cell)],
        [Paragraph('retryAfter', style_table_cell), Paragraph('Int', style_table_cell_center), Paragraph('Secondes d\'attente avant retry (rate limit)', style_table_cell)],
    ]
    elements.append(make_table(ext_data, [90, 70, 260]))
    elements.append(spacer(6))

    elements.append(make_heading("4.4 Strategies de reprise (Retry)", level=2))
    elements.append(make_body(
        "En cas d'erreur, les clients doivent implementer une strategie de reprise adaptee au type d'erreur. "
        "Pour les erreurs RATE_LIMIT_EXCEEDED, le client doit respecter le header 'Retry-After' et utiliser un "
        "backoff exponentiel avec jitter. Pour les erreurs INTERNAL_ERROR et SERVICE_UNAVAILABLE, un retry avec "
        "backoff exponentiel (base 2s, max 30s, 3 tentatives) est recommande. Les erreurs de validation (VALIDATION_ERROR) "
        "et d'autorisation (AUTHENTICATION_REQUIRED, AUTHORIZATION_DENIED) ne doivent pas etre relancees automatiquement "
        "car elles necessitent une correction de la requete. Les erreurs NOT_FOUND sont definitives et ne doivent "
        "pas etre relancees. L'utilisation d'un SDK client avec retry automatique est recommandee."
    ))
    elements.append(PageBreak())
    return elements


# ==============================================================================
# SECTION 5: PAGINATION STRATEGY
# ==============================================================================

def build_pagination():
    elements = []
    elements.append(make_heading("5. Strategie de pagination"))
    elements.append(hr())

    elements.append(make_body(
        "DealScope utilise une pagination basee sur des curseurs (cursor-based) pour toutes les requetes retournant "
        "des listes. Cette strategie est preferee a la pagination offset pour plusieurs raisons techniques et "
        "fonctionnelles qui sont particulierement pertinentes pour une plateforme manipulant des volumes importants "
        "de donnees d'entreprises et de signaux de marche."
    ))
    elements.append(make_body(
        "Le principe est simple : chaque element d'une liste est associe a un curseur opaque (encodage Base64 du "
        "timestamp ou de l'ID trie). Le client demande la premiere page avec le parametre 'first' et recoit les "
        "curseurs 'startCursor' et 'endCursor' dans l'objet 'pageInfo'. Pour la page suivante, il transmet "
        "'after: endCursor'. L'objet 'pageInfo' contient les booleens 'hasNextPage' et 'hasPreviousPage' pour "
        "indiquer la presence de pages supplementaires, ainsi que 'totalCount' pour le nombre total d'elements."
    ))

    # Pagination query example
    elements.append(make_code_block(
        'query GetTargetCompanies($first: Int, $after: String, $filter: TargetCompanyFilterInput) {\n'
        '  targetCompanies(\n'
        '    first: $first\n'
        '    after: $after\n'
        '    filter: $filter\n'
        '    orderBy: MATCHED_AT_DESC\n'
        '  ) {\n'
        '    pageInfo {\n'
        '      hasNextPage\n'
        '      hasPreviousPage\n'
        '      startCursor\n'
        '      endCursor\n'
        '      totalCount\n'
        '    }\n'
        '    edges {\n'
        '      cursor\n'
        '      node {\n'
        '        id\n'
        '        name\n'
        '        domain\n'
        '        status\n'
        '        revenue\n'
        '      }\n'
        '    }\n'
        '  }\n'
        '}'
    ))
    elements.append(spacer(4))

    # Pagination type detail table
    pag_data = [
        [Paragraph('<b>Champ</b>', style_table_header),
         Paragraph('<b>Type</b>', style_table_header),
         Paragraph('<b>Description</b>', style_table_header)],
        [Paragraph('hasNextPage', style_table_cell), Paragraph('Boolean!', style_table_cell_center), Paragraph('Indique s\'il existe une page suivante', style_table_cell)],
        [Paragraph('hasPreviousPage', style_table_cell), Paragraph('Boolean!', style_table_cell_center), Paragraph('Indique s\'il existe une page precedente', style_table_cell)],
        [Paragraph('startCursor', style_table_cell), Paragraph('String', style_table_cell_center), Paragraph('Curseur du premier element de la page', style_table_cell)],
        [Paragraph('endCursor', style_table_cell), Paragraph('String', style_table_cell_center), Paragraph('Curseur du dernier element de la page', style_table_cell)],
        [Paragraph('totalCount', style_table_cell), Paragraph('Int!', style_table_cell_center), Paragraph('Nombre total d\'elements (toutes pages confondues)', style_table_cell)],
    ]
    elements.append(make_table(pag_data, [100, 80, 240]))
    elements.append(spacer(6))

    elements.append(make_body(
        "Les curseurs sont des chaines opaques encodees en Base64. Leur format interne est sujet a changement et "
        "ne doit pas etre parse par les clients. La valeur maximale du parametre 'first' est de 100 elements par "
        "requete. Les requetes demandant plus de 100 elements seront rejetees avec une erreur VALIDATION_ERROR. "
        "Pour parcourir de grands ensembles de donnees, les clients doivent utiliser une boucle de pagination "
        "avec verification de 'hasNextPage'. Le compteur 'totalCount' est calcule via une requete COUNT optimisee "
        "et peut etre legerement imprecis en cas de modifications concurrentes."
    ))
    elements.append(PageBreak())
    return elements


# ==============================================================================
# SECTION 6: RATE LIMITING POLICY
# ==============================================================================

def build_rate_limiting():
    elements = []
    elements.append(make_heading("6. Politique de limitation de debit"))
    elements.append(hr())

    elements.append(make_heading("6.1 Limites par plan de souscription", level=2))
    elements.append(make_body(
        "La politique de limitation de debit de DealScope est concu pour proteger l'infrastructure tout en offrant "
        "une experience fluide a tous les utilisateurs. Les limites sont definies par plan de souscription et appliquees "
        "par utilisateur et par workspace. Le mecanisme utilise Redis 7 avec une fenetre glissante (sliding window) "
        "d'une duree de 60 secondes pour les limites par minute, et d'une duree de 3600 secondes pour les limites "
        "horaire. Chaque requete GraphQL est comptabilisee en fonction de sa complexite calculee, et non pas de "
        "maniere unitaire, afin de prevenir les requetes couteuses abusives."
    ))
    elements.append(spacer(4))

    rate_data2 = [
        [Paragraph('<b>Plan</b>', style_table_header),
         Paragraph('<b>Points / min</b>', style_table_header),
         Paragraph('<b>Points / heure</b>', style_table_header),
         Paragraph('<b>Batch max</b>', style_table_header),
         Paragraph('<b>Concurrent req.</b>', style_table_header)],
        [Paragraph('Starter', style_table_cell_center),
         Paragraph('300', style_table_cell_center),
         Paragraph('3 000', style_table_cell_center),
         Paragraph('10', style_table_cell_center),
         Paragraph('3', style_table_cell_center)],
        [Paragraph('Professional', style_table_cell_center),
         Paragraph('1 000', style_table_cell_center),
         Paragraph('10 000', style_table_cell_center),
         Paragraph('25', style_table_cell_center),
         Paragraph('5', style_table_cell_center)],
        [Paragraph('Business', style_table_cell_center),
         Paragraph('3 000', style_table_cell_center),
         Paragraph('30 000', style_table_cell_center),
         Paragraph('50', style_table_cell_center),
         Paragraph('10', style_table_cell_center)],
        [Paragraph('Enterprise', style_table_cell_center),
         Paragraph('10 000', style_table_cell_center),
         Paragraph('100 000', style_table_cell_center),
         Paragraph('100', style_table_cell_center),
         Paragraph('25', style_table_cell_center)],
    ]
    elements.append(make_table(rate_data2, [80, 80, 90, 80, 90]))
    elements.append(spacer(6))

    elements.append(make_heading("6.2 Headers de limitation de debit", level=2))
    elements.append(make_body(
        "Chaque reponse HTTP de l'API GraphQL inclut les headers suivants pour informer le client de son "
        "quota de limitation de debit. Ces headers permettent aux clients d'implementer un comportement adaptatif "
        "(backoff, mise en cache) pour optimiser leur utilisation de l'API."
    ))
    elements.append(spacer(4))

    headers_data = [
        [Paragraph('<b>Header</b>', style_table_header),
         Paragraph('<b>Exemple</b>', style_table_header),
         Paragraph('<b>Description</b>', style_table_header)],
        [Paragraph('X-RateLimit-Limit', style_table_cell), Paragraph('300', style_table_cell_center), Paragraph('Nombre maximum de points autorises dans la fenetre courante', style_table_cell)],
        [Paragraph('X-RateLimit-Remaining', style_table_cell), Paragraph('247', style_table_cell_center), Paragraph('Nombre de points restants dans la fenetre courante', style_table_cell)],
        [Paragraph('X-RateLimit-Reset', style_table_cell), Paragraph('1678890120', style_table_cell_center), Paragraph('Timestamp Unix de la fin de la fenetre courante', style_table_cell)],
        [Paragraph('X-RateLimit-Policy', style_table_cell), Paragraph('sliding_window', style_table_cell_center), Paragraph('Algorithme de limitation utilise', style_table_cell)],
        [Paragraph('Retry-After', style_table_cell), Paragraph('30', style_table_cell_center), Paragraph('Secondes d\'attente (present uniquement si quota depasse)', style_table_cell)],
    ]
    elements.append(make_table(headers_data, [120, 80, 220]))
    elements.append(spacer(6))

    elements.append(make_heading("6.3 Analyse de complexite GraphQL", level=2))
    elements.append(make_body(
        "DealScope implemente une analyse de complexite des requetes GraphQL pour prevenir les requetes abusives "
        "qui pourraient surcharger les serveurs. Le systeme attribue un cout a chaque champ et type du schema, "
        "et calcule le cout total d'une requete en tenant compte de la multiplicite des relations. Les regles "
        "de calcul sont les suivantes : un champ scalaire coute 1 point, un champ de type objet coute 1 point "
        "plus le cout de ses sous-champs, et une liste (connection) multiplie le cout par la taille demandee "
        "(parametre 'first'). Les limites de complexite sont : profondeur maximale de 7 niveaux d'imbrication, "
        "cout maximal de 500 points par requete pour le plan Starter, 1000 pour Professional, 2000 pour Business "
        "et personnalise pour Enterprise."
    ))
    elements.append(make_body(
        "Exemple de calcul : une requete demandant 20 entreprises cibles avec leurs 10 premiers contacts et les "
        "signaux de chaque entreprise (max 20) aura un cout de : 20 (entreprises) + 20 x 10 (contacts) + 20 x 20 "
        "(signaux) = 620 points. Cette requete serait rejetee pour un plan Starter mais acceptee pour Professional. "
        "L'analyse de complexite est effectuee avant l'execution de la requete, permettant de rejeter les requetes "
        "trop couteuses sans consommer de ressources de base de donnees. Le client recoit une erreur QUERY_TOO_COMPLEX "
        "avec le detail du cout calcule et la limite applicable."
    ))
    elements.append(PageBreak())
    return elements


# ==============================================================================
# SECTION 7: API EXAMPLES
# ==============================================================================

def build_api_examples():
    elements = []
    elements.append(make_heading("7. Exemples d'utilisation de l'API"))
    elements.append(hr())

    elements.append(make_heading("7.1 Requete complete avec filtrage et pagination", level=2))
    elements.append(make_body(
        "L'exemple suivant illustre une requete typique pour recuperer la liste des entreprises cibles d'un workspace, "
        "avec filtrage multi-criteres et pagination. La requete utilise des fragments GraphQL pour structurer "
        "la reponse de maniere modulaire."
    ))
    elements.append(spacer(4))
    elements.append(make_code_block(
        'query GetQualifiedTargets($cursor: String) {\n'
        '  targetCompanies(\n'
        '    first: 15\n'
        '    after: $cursor\n'
        '    filter: {\n'
        '      status: QUALIFIED\n'
        '      industries: ["SaaS", "FinTech"]\n'
        '      revenueMin: 5000000\n'
        '      geographies: ["France", "Germany"]\n'
        '      hasSignal: true\n'
        '    }\n'
        '    orderBy: REVENUE_DESC\n'
        '  ) {\n'
        '    pageInfo {\n'
        '      hasNextPage\n'
        '      endCursor\n'
        '      totalCount\n'
        '    }\n'
        '    edges {\n'
        '      cursor\n'
        '      node {\n'
        '        id\n'
        '        name\n'
        '        domain\n'
        '        revenue\n'
        '        employeeCount\n'
        '        industry\n'
        '        headquarters\n'
        '        analysisReport {\n'
        '          strategicFit {\n'
        '            overallScore\n'
        '            recommendation\n'
        '          }\n'
        '        }\n'
        '        signals(first: 3) {\n'
        '          edges {\n'
        '            node {\n'
        '              type\n'
        '              title\n'
        '              detectedAt\n'
        '            }\n'
        '          }\n'
        '        }\n'
        '      }\n'
        '    }\n'
        '  }\n'
        '}'
    ))
    elements.append(spacer(6))

    elements.append(make_heading("7.2 Mutation : lancement d'un scan d'agents IA", level=2))
    elements.append(make_body(
        "L'exemple suivant montre le lancement d'un scan multi-agents IA pour un profil ICP donne. "
        "Le scan declenche sequentiellement les agents Ciblage, OSINT, Analyse et Email Matching via "
        "l'orchestrateur LangGraph."
    ))
    elements.append(spacer(4))
    elements.append(make_code_block(
        'mutation LaunchICPScan {\n'
        '  launchScan(icpProfileId: "icp_prof_abc123") {\n'
        '    id\n'
        '    status\n'
        '    progress\n'
        '    startedAt\n'
        '    companiesFound\n'
        '    agents {\n'
        '      agentType\n'
        '      status\n'
        '      progress\n'
        '    }\n'
        '  }\n'
        '}'
    ))
    elements.append(spacer(4))

    elements.append(make_body(
        "Reponse attendue :"
    ))
    elements.append(make_code_block(
        '{\n'
        '  "data": {\n'
        '    "launchScan": {\n'
        '      "id": "scan_xyz789",\n'
        '      "status": "RUNNING",\n'
        '      "progress": 0.0,\n'
        '      "startedAt": "2026-03-15T14:30:00Z",\n'
        '      "companiesFound": 0,\n'
        '      "agents": [\n'
        '        {"agentType": "CIBLAGE", "status": "RUNNING", "progress": 0.0},\n'
        '        {"agentType": "OSINT", "status": "PENDING", "progress": 0.0},\n'
        '        {"agentType": "ANALYSE", "status": "PENDING", "progress": 0.0},\n'
        '        {"agentType": "EMAIL_MATCHING", "status": "PENDING", "progress": 0.0}\n'
        '      ]\n'
        '    }\n'
        '  }\n'
        '}'
    ))
    elements.append(spacer(6))

    elements.append(make_heading("7.3 Subscription WebSocket : suivi de scan", level=2))
    elements.append(make_body(
        "Les subscriptions permettent de suivre en temps reel la progression d'un scan d'agents IA. "
        "La connexion s'etablit via le protocole WebSocket (graphql-transport-ws). Voici l'exemple "
        "de connexion et d'abonnement."
    ))
    elements.append(spacer(4))
    elements.append(make_code_block(
        '// Etablissement de la connexion WebSocket\n'
        'const ws = new WebSocket(\n'
        '  "wss://api.dealscope.io/graphql"\n'
        ');\n\n'
        '// Message d\'initialisation avec le JWT\n'
        'ws.send(JSON.stringify({\n'
        '  type: "connection_init",\n'
        '  payload: {\n'
        '    authorization: "Bearer eyJhbGci..."\n'
        '  }\n'
        '}));\n\n'
        '// Abonnement a la progression du scan\n'
        'ws.send(JSON.stringify({\n'
        '  id: "sub_scan_1",\n'
        '  type: "subscribe",\n'
        '  payload: {\n'
        '    query: `\n'
        '      subscription {\n'
        '        scanProgress(scanId: "scan_xyz789") {\n'
        '          scanId\n'
        '          status\n'
        '          progress\n'
        '          currentAgent\n'
        '          agentProgress\n'
        '          companiesFound\n'
        '          message\n'
        '        }\n'
        '      }\n'
        '    `\n'
        '  }\n'
        '}));'
    ))
    elements.append(spacer(6))

    elements.append(make_heading("7.4 Requete graphe de connaissances", level=2))
    elements.append(make_body(
        "L'exemple suivant illustre l'exploration du graphe de connaissances Neo4j via l'API GraphQL. "
        "La requete retourne les entites connectees a une entreprise donnee, avec une profondeur "
        "de 2 niveaux, filtree par type de relation."
    ))
    elements.append(spacer(4))
    elements.append(make_code_block(
        'query ExploreKnowledgeGraph {\n'
        '  knowledgeGraph(\n'
        '    entityId: "kg_company_abc"\n'
        '    depth: 2\n'
        '    relationTypes: ["INVESTED_IN", "ACQUIRED", "PARTNERED_WITH"]\n'
        '  ) {\n'
        '    totalEntities\n'
        '    totalRelations\n'
        '    entities {\n'
        '      id\n'
        '      name\n'
        '      type\n'
        '      properties\n'
        '    }\n'
        '    relations {\n'
        '      type\n'
        '      sourceId\n'
        '      targetId\n'
        '      weight\n'
        '    }\n'
        '  }\n'
        '}'
    ))
    elements.append(spacer(6))

    elements.append(make_heading("7.5 Exemple de reponse d'erreur", level=2))
    elements.append(make_body(
        "L'exemple suivant montre une reponse d'erreur complete pour une requete GraphQL invalidée par "
        "la limitation de debit."
    ))
    elements.append(spacer(4))
    elements.append(make_code_block(
        '{\n'
        '  "errors": [{\n'
        '    "message": "Limite de debit depassee. Reessayez apres 45 secondes.",\n'
        '    "path": ["targetCompanies"],\n'
        '    "extensions": {\n'
        '      "code": "RATE_LIMIT_EXCEEDED",\n'
        '      "timestamp": "2026-03-15T14:32:00Z",\n'
        '      "requestId": "req_rl_9f8e7d",\n'
        '      "retryAfter": 45,\n'
        '      "details": {\n'
        '        "limit": 300,\n'
        '        "remaining": 0,\n'
        '        "resetAt": "2026-03-15T14:32:45Z"\n'
        '      }\n'
        '    }\n'
        '  }],\n'
        '  "data": null\n'
        '}'
    ))
    elements.append(PageBreak())
    return elements


# ==============================================================================
# SECTION 8: WEBHOOKS & INTEGRATIONS
# ==============================================================================

def build_webhooks():
    elements = []
    elements.append(make_heading("8. Webhooks &amp; Integrations"))
    elements.append(hr())

    elements.append(make_heading("8.1 Webhooks de synchronisation CRM", level=2))
    elements.append(make_body(
        "DealScope supporte la synchronisation bidirectionnelle avec les principaux CRM du marche : Salesforce, "
        "HubSpot, Pipedrive et Microsoft Dynamics 365. Les webhooks permettent a DealScope de notifier le CRM "
        "lorsqu'un evenement important se produit (creation d'entreprise cible, changement de statut, mise a jour "
        "de pipeline). Inversement, les webhooks entrants permettent au CRM de mettre a jour les donnees dans "
        "DealScope. La configuration des webhooks se fait via les parametres du workspace (IntegrationSettings) "
        "ou par la mutation exportToCRM. Chaque webhook entrant est valide par un secret partage (HMAC-SHA256) "
        "pour garantir l'authenticite de l'emetteur."
    ))
    elements.append(make_body(
        "Les evenements suivants declenchent l'envoi d'un webhook sortant : 'target.created' (nouvelle entreprise "
        "cible identifiee), 'target.status_changed' (changement de statut), 'signal.detected' (nouveau signal "
        "de marche), 'pipeline.moved' (deplacement dans le pipeline), 'analysis.completed' (rapport d'analyse "
        "genere), 'contact.validated' (email de contact valide). Le payload de chaque webhook suit un schema "
        "standard incluant 'event', 'timestamp', 'workspaceId', 'data' et 'signature'. Les echecs de livraison "
        "sont retires avec un backoff exponentiel (3 tentatives maximum sur 24 heures)."
    ))
    elements.append(spacer(6))

    elements.append(make_heading("8.2 Webhooks de notification d'alertes", level=2))
    elements.append(make_body(
        "En complement des subscriptions GraphQL temps reel, DealScope propose des webhooks HTTP pour les "
        "integrations avec des systemes de notification externes (Slack, Microsoft Teams, email, SMS). "
        "Ces webhooks sont configures au niveau du workspace et peuvent etre filtrer par type d'evenement "
        "et par niveau de severite. Les configurations de webhook incluent l'URL de destination, le secret "
        "de signature, les types d'evenement souscrits et un seuil de severite minimum. Les webhooks de "
        "notification sont differents des webhooks CRM car ils sont concus pour etre legers et orientes "
        "action humaine, tandis que les webhooks CRM sont concus pour la synchronisation system-to-system."
    ))
    elements.append(spacer(4))

    # Webhook events table
    webhook_data = [
        [Paragraph('<b>Evenement</b>', style_table_header),
         Paragraph('<b>Description</b>', style_table_header),
         Paragraph('<b>Severite par defaut</b>', style_table_header)],
        [Paragraph('signal.detected', style_table_cell), Paragraph('Nouveau signal de marche detecte pour une entreprise suivie', style_table_cell), Paragraph('INFO', style_table_cell_center)],
        [Paragraph('scan.completed', style_table_cell), Paragraph('Un scan d\'agents IA s\'est termine avec succes', style_table_cell), Paragraph('SUCCESS', style_table_cell_center)],
        [Paragraph('scan.failed', style_table_cell), Paragraph('Un scan d\'agents IA a echoue', style_table_cell), Paragraph('ERROR', style_table_cell_center)],
        [Paragraph('pipeline.stage_change', style_table_cell), Paragraph('Une entreprise a change d\'etape de pipeline', style_table_cell), Paragraph('INFO', style_table_cell_center)],
        [Paragraph('analysis.ready', style_table_cell), Paragraph('Un rapport d\'analyse est pret', style_table_cell), Paragraph('SUCCESS', style_table_cell_center)],
        [Paragraph('rate_limit.warning', style_table_cell), Paragraph('Alerte de consommation proche de la limite', style_table_cell), Paragraph('WARNING', style_table_cell_center)],
        [Paragraph('api.key.expiring', style_table_cell), Paragraph('Une cle API expire dans 7 jours', style_table_cell), Paragraph('WARNING', style_table_cell_center)],
    ]
    elements.append(make_table(webhook_data, [110, 230, 90]))
    elements.append(PageBreak())
    return elements


# ==============================================================================
# SECTION 9: SECURITY CONSIDERATIONS
# ==============================================================================

def build_security():
    elements = []
    elements.append(make_heading("9. Considerations de securite"))
    elements.append(hr())

    elements.append(make_heading("9.1 Limitation de la profondeur de requete", level=2))
    elements.append(make_body(
        "Pour prevenir les attaques par requetes profondement imbriquees (query depth attacks), DealScope limite "
        "la profondeur maximale des requetes GraphQL a 7 niveaux. Cette limite est appliquee avant l'analyse "
        "AST de la requete et rejette immediatement toute requete la depassant avec une erreur QUERY_DEPTH_EXCEEDED. "
        "La profondeur est calculee en comptant le nombre de niveaux d'imbrication de champs de type objet. Les "
        "fragments GraphQL sont resolus et leur profondeur est incluse dans le calcul. Cette protection est "
        "complementaire a l'analyse de complexite et cible specifiquement les requetes dont la structure "
        "arborescente est excessive, meme si le nombre total de champs reste modere."
    ))
    elements.append(make_body(
        "Par exemple, une requete demandant entreprise > contacts > societes > contacts > societes avec une "
        "profondeur de 5 niveaux serait acceptee, mais en ajoutant deux niveaux supplementaires, elle serait "
        "rejetee. Cette approche protege contre les requetes qui tentent d'exploiter les relations circulaires "
        "presentes dans le graphe de connaissances (par exemple, les relations entre entreprises via les "
        "investisseurs communs). Les clients doivent concevoir leurs requetes en utilisant des requetes "
        "multiples plus plates plutot que des requetes profondes et imbriquees."
    ))
    elements.append(spacer(6))

    elements.append(make_heading("9.2 Analyse de complexite des requetes", level=2))
    elements.append(make_body(
        "L'analyse de complexite est la premiere ligne de defense contre les requetes abusives. Chaque champ "
        "du schema GraphQL est annote avec un cout de base (par defaut 1 pour les scalaires, 5 pour les types "
        "objet, et multiplicateur par la taille de la liste). Le cout total d'une requete est la somme des couts "
        "de tous les champs demandes, en tenant compte des multiplicateurs de liste. Les limites de complexite "
        "sont configurees par plan de souscription et appliquees globalement ainsi que par operation individuelle. "
        "Les requetes depassant la limite sont rejetees avant execution avec une erreur QUERY_TOO_COMPLEX "
        "incluant le cout calcule et la limite applicable."
    ))
    elements.append(make_body(
        "En complement de l'analyse statique, DealScope implemente un timeout d'execution de 30 secondes par "
        "requete. Si une requete depasse ce timeout, elle est annulee et le client recoit une erreur "
        "INTERNAL_ERROR. Ce timeout protege contre les requetes qui passent l'analyse de complexite statique "
        "mais qui s'averent couteuses en execution (par exemple, des requetes sur des donnees tres imbriquees "
        "dans Neo4j). Les subscriptions ont un timeout separe de 5 minutes d'inactivite, apres lequel la "
        "connexion WebSocket est fermee avec un code de statut 1000 (normal closure)."
    ))
    elements.append(spacer(6))

    elements.append(make_heading("9.3 Protection anti-DDoS", level=2))
    elements.append(make_body(
        "DealScope deploye une defense multi-couches contre les attaques par deni de service distribue (DDoS). "
        "Au niveau reseau, Cloudflare ou un equivalent fournit une protection contre les attaques volumetriques "
        "(SYN flood, UDP flood) et les attaques de couche 7 (HTTP flood). Au niveau applicatif, la limitation "
        "de debit par utilisateur et par IP previent les abus individuels. Au niveau GraphQL, l'analyse de "
        "complexite et la limitation de profondeur bloquent les requetes couteuses. Un systeme d'anomalie "
        "detection surveille les patterns de requete en temps reel et peut declencher un mode degrade "
        "(challenge CAPTCHA, augmentation temporaire des limites) en cas de suspicion d'attaque. "
        "Les adresses IP malveillantes confirmees sont bannies temporairement via une liste noire Redis "
        "avec une expiration automatique."
    ))
    elements.append(make_body(
        "Pour les requetes de type introspection (utilisées par les outils de développement comme GraphQL Playground), "
        "un cache statique est deploye pour eviter les re-calculs couteux. Les requetes d'introspection ne sont "
        "pas comptabilisees dans les limites de debit mais sont rate-limitees independamment a 10 requetes par "
        "minute par IP. En production, l'introspection peut etre desactivee via la variable d'environnement "
        "GRAPHQL_ENABLE_INTROSPECTION=false pour renforcer la securite en environnement sensible."
    ))
    elements.append(spacer(6))

    elements.append(make_heading("9.4 Protection des donnees sensibles", level=2))
    elements.append(make_body(
        "DealScope implemente plusieurs mesures pour proteger les donnees sensibles transmises via l'API. "
        "Les adresses email et numeros de telephone des contacts sont masques dans les reponses par defaut "
        "(ex: j***@example.com) sauf pour les utilisateurs disposant de la permission 'contacts:read_full'. "
        "Les cles API sont stockees sous forme de hash SHA-256 en base de donnees et ne sont jamais renvoyees "
        "en clair apres creation. Le logging des requetes GraphQL exclut les valeurs des variables d'entree "
        "pour les champs sensibles (tokens, mots de passe, cles API). Les connexions sont chiffrees en TLS 1.3 "
        "minimum, avec HSTS active. Les headers de securite (CSP, X-Frame-Options, X-Content-Type-Options) "
        "sont configures sur toutes les reponses HTTP."
    ))
    elements.append(PageBreak())
    return elements


# ==============================================================================
# SECTION 10: APPENDIX - ENDPOINTS
# ==============================================================================

def build_appendix():
    elements = []
    elements.append(make_heading("10. Annexe : Endpoints &amp; Configuration"))
    elements.append(hr())

    elements.append(make_heading("10.1 Endpoints de l'API", level=2))
    elements.append(spacer(4))

    endpoint_data = [
        [Paragraph('<b>Environnement</b>', style_table_header),
         Paragraph('<b>URL GraphQL</b>', style_table_header),
         Paragraph('<b>WebSocket</b>', style_table_header)],
        [Paragraph('Production', style_table_cell),
         Paragraph('https://api.dealscope.io/graphql', style_table_cell),
         Paragraph('wss://api.dealscope.io/graphql', style_table_cell)],
        [Paragraph('Staging', style_table_cell),
         Paragraph('https://api.staging.dealscope.io/graphql', style_table_cell),
         Paragraph('wss://api.staging.dealscope.io/graphql', style_table_cell)],
        [Paragraph('Developpement', style_table_cell),
         Paragraph('http://localhost:8000/graphql', style_table_cell),
         Paragraph('ws://localhost:8000/graphql', style_table_cell)],
    ]
    elements.append(make_table(endpoint_data, [100, 180, 150]))
    elements.append(spacer(8))

    elements.append(make_heading("10.2 Stack technologique", level=2))
    elements.append(spacer(4))

    stack_data = [
        [Paragraph('<b>Composant</b>', style_table_header),
         Paragraph('<b>Technologie</b>', style_table_header),
         Paragraph('<b>Version</b>', style_table_header)],
        [Paragraph('Backend API', style_table_cell), Paragraph('FastAPI + Strawberry GraphQL', style_table_cell), Paragraph('0.109+ / 0.230+', style_table_cell_center)],
        [Paragraph('Orchestrateur IA', style_table_cell), Paragraph('LangGraph', style_table_cell), Paragraph('0.2+', style_table_cell_center)],
        [Paragraph('Base de donnees', style_table_cell), Paragraph('PostgreSQL', style_table_cell), Paragraph('16', style_table_cell_center)],
        [Paragraph('Cache', style_table_cell), Paragraph('Redis', style_table_cell), Paragraph('7', style_table_cell_center)],
        [Paragraph('Graphe de connaissances', style_table_cell), Paragraph('Neo4j', style_table_cell), Paragraph('5', style_table_cell_center)],
        [Paragraph('Base vectorielle', style_table_cell), Paragraph('Weaviate', style_table_cell), Paragraph('1.24+', style_table_cell_center)],
        [Paragraph('Authentification', style_table_cell), Paragraph('Clerk.dev', style_table_cell), Paragraph('SaaS', style_table_cell_center)],
        [Paragraph('Frontend', style_table_cell), Paragraph('Next.js + React + shadcn/ui', style_table_cell), Paragraph('14 / 18 / latest', style_table_cell_center)],
    ]
    elements.append(make_table(stack_data, [120, 180, 100]))
    elements.append(spacer(8))

    elements.append(make_heading("10.3 Variables d'environnement", level=2))
    elements.append(make_body(
        "Les variables d'environnement suivantes sont requises pour le fonctionnement de l'API GraphQL. "
        "Elles doivent etre configurees dans le fichier .env du projet ou via les secrets de l'infrastructure."
    ))
    elements.append(spacer(4))

    env_data = [
        [Paragraph('<b>Variable</b>', style_table_header),
         Paragraph('<b>Description</b>', style_table_header),
         Paragraph('<b>Obligatoire</b>', style_table_header)],
        [Paragraph('DATABASE_URL', style_table_cell), Paragraph('URL de connexion PostgreSQL', style_table_cell), Paragraph('Oui', style_table_cell_center)],
        [Paragraph('REDIS_URL', style_table_cell), Paragraph('URL de connexion Redis', style_table_cell), Paragraph('Oui', style_table_cell_center)],
        [Paragraph('NEO4J_URI', style_table_cell), Paragraph('URI de connexion Neo4j', style_table_cell), Paragraph('Oui', style_table_cell_center)],
        [Paragraph('WEAVIATE_URL', style_table_cell), Paragraph('URL du cluster Weaviate', style_table_cell), Paragraph('Oui', style_table_cell_center)],
        [Paragraph('CLERK_SECRET_KEY', style_table_cell), Paragraph('Cle secrete Clerk pour validation JWT', style_table_cell), Paragraph('Oui', style_table_cell_center)],
        [Paragraph('CLERK_JWKS_URL', style_table_cell), Paragraph('URL des clefs publiques Clerk', style_table_cell), Paragraph('Oui', style_table_cell_center)],
        [Paragraph('GRAPHQL_ENABLE_INTROSPECTION', style_table_cell), Paragraph('Activer l\'introspection GraphQL', style_table_cell), Paragraph('Non', style_table_cell_center)],
        [Paragraph('GRAPHQL_MAX_DEPTH', style_table_cell), Paragraph('Profondeur max des requetes', style_table_cell), Paragraph('Non', style_table_cell_center)],
        [Paragraph('GRAPHQL_MAX_COMPLEXITY', style_table_cell), Paragraph('Complexite max par requete', style_table_cell), Paragraph('Non', style_table_cell_center)],
        [Paragraph('WEBHOOK_SECRET', style_table_cell), Paragraph('Secret pour signature HMAC des webhooks', style_table_cell), Paragraph('Oui', style_table_cell_center)],
    ]
    elements.append(make_table(env_data, [160, 210, 60]))
    elements.append(spacer(20))

    # End note
    elements.append(hr())
    elements.append(spacer(6))
    elements.append(Paragraph(
        "<b>Fin du document</b> - DealScope Specifications API GraphQL v1.0 - Mars 2026",
        ParagraphStyle('EndNote', parent=styles['Normal'],
                       fontName='TimesNewRoman', fontSize=10, leading=14,
                       textColor=TEXT_GRAY, alignment=TA_CENTER)
    ))
    elements.append(spacer(6))
    elements.append(Paragraph(
        "Document confidentiel - Z.ai Equipe Technique - Tous droits reserves",
        ParagraphStyle('Copyright', parent=styles['Normal'],
                       fontName='TimesNewRoman', fontSize=9, leading=12,
                       textColor=TEXT_GRAY, alignment=TA_CENTER)
    ))
    return elements


# ==============================================================================
# MAIN BUILD
# ==============================================================================

def main():
    print("Generating DealScope GraphQL API Specifications PDF...")

    # Create output directory if needed
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # Create document
    doc = DealScopeDocTemplate(
        OUTPUT_FILE,
        pagesize=A4,
        leftMargin=1.0 * inch,
        rightMargin=1.0 * inch,
        topMargin=1.0 * inch,
        bottomMargin=1.0 * inch,
        title='DealScope_Specifications_API_GraphQL',
        author='Z.ai',
        creator='Z.ai',
        subject='Specifications API GraphQL - DealScope M&A Intelligence Platform',
    )

    # Build all sections
    elements = []
    elements.extend(build_cover_page())
    elements.extend(build_toc_page())
    elements.extend(build_introduction())
    elements.extend(build_auth())
    elements.extend(build_graphql_schema())
    elements.extend(build_error_handling())
    elements.extend(build_pagination())
    elements.extend(build_rate_limiting())
    elements.extend(build_api_examples())
    elements.extend(build_webhooks())
    elements.extend(build_security())
    elements.extend(build_appendix())

    # Build with TOC support (multiBuild)
    multiBuild(doc, elements)
    print(f"PDF generated successfully: {OUTPUT_FILE}")


if __name__ == '__main__':
    main()
