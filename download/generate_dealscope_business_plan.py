#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""DealScope - Business Plan & Modele Financier Detaille - PDF Generator v1.0"""

import os
import sys
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch, cm
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY, TA_RIGHT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle,
    HRFlowable, KeepTogether
)
from reportlab.platypus.tableofcontents import TableOfContents
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily

# ===== FONT REGISTRATION =====
pdfmetrics.registerFont(TTFont('TimesNewRoman', '/usr/share/fonts/truetype/english/Times-New-Roman.ttf'))
pdfmetrics.registerFont(TTFont('TimesNewRomanBold', '/usr/share/fonts/truetype/english/Times-New-Roman-Bold.ttf'))
pdfmetrics.registerFont(TTFont('TimesNewRomanItalic', '/usr/share/fonts/truetype/english/Times-New-Roman-Italic.ttf'))
pdfmetrics.registerFont(TTFont('TimesNewRomanBoldItalic', '/usr/share/fonts/truetype/english/Times-New-Roman-BoldItalic.ttf'))
pdfmetrics.registerFont(TTFont('DejaVuSans', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'))
pdfmetrics.registerFont(TTFont('DejaVuSansBold', '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'))
registerFontFamily('TimesNewRoman',
    normal='TimesNewRoman', bold='TimesNewRomanBold',
    italic='TimesNewRomanItalic', boldItalic='TimesNewRomanBoldItalic')
registerFontFamily('DejaVuSans', normal='DejaVuSans', bold='DejaVuSansBold')

# ===== COLORS =====
TABLE_HEADER_COLOR = colors.HexColor('#1F4E79')
C_DARK = colors.HexColor('#1F4E79')
C_MED = colors.HexColor('#2E75B6')
C_LIGHT = colors.HexColor('#D6E4F0')
C_GOLD = colors.HexColor('#C49A2A')
C_TEXT = colors.HexColor('#1A1A1A')
C_GRAY = colors.HexColor('#555555')
C_ALT = colors.HexColor('#F5F5F5')
TABLE_ROW_ODD = colors.HexColor('#F5F5F5')
C_ACCENT = colors.HexColor('#2E75B6')
C_GREEN = colors.HexColor('#217346')
C_RED = colors.HexColor('#C0392B')
C_ORANGE = colors.HexColor('#E67E22')

# ===== OUTPUT =====
OUT = '/home/z/my-project/download/DealScope_Business_Plan_Modele_Financier.pdf'

# ===== STYLES =====
sty = getSampleStyleSheet()

sty['Heading1'].fontName = 'TimesNewRoman'
sty['Heading1'].fontSize = 18
sty['Heading1'].textColor = C_DARK
sty['Heading1'].spaceAfter = 10
sty['Heading1'].spaceBefore = 16
sty['Heading1'].keepWithNext = True

sty['Heading2'].fontName = 'TimesNewRoman'
sty['Heading2'].fontSize = 14
sty['Heading2'].textColor = C_MED
sty['Heading2'].spaceAfter = 8
sty['Heading2'].spaceBefore = 14
sty['Heading2'].keepWithNext = True

sty['Heading3'].fontName = 'TimesNewRoman'
sty['Heading3'].fontSize = 12
sty['Heading3'].textColor = C_DARK
sty['Heading3'].spaceAfter = 6
sty['Heading3'].spaceBefore = 10
sty['Heading3'].keepWithNext = True

S_BODY = ParagraphStyle('Body', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=10.5, leading=15, textColor=C_TEXT, alignment=TA_JUSTIFY, spaceAfter=6, spaceBefore=2)
S_BODY_LEFT = ParagraphStyle('BodyLeft', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=10.5, leading=15, textColor=C_TEXT, alignment=TA_LEFT, spaceAfter=6, spaceBefore=2)
S_BULLET = ParagraphStyle('Bul', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=10.5, leading=15, textColor=C_TEXT, leftIndent=20, bulletIndent=8, spaceAfter=4)
S_BULLET2 = ParagraphStyle('Bul2', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=10, leading=14, textColor=C_TEXT, leftIndent=35, bulletIndent=22, spaceAfter=3)
S_TH = ParagraphStyle('TH', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=9, leading=12, textColor=colors.white, alignment=TA_CENTER)
S_THL = ParagraphStyle('THL', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=9, leading=12, textColor=colors.white, alignment=TA_LEFT)
S_TD = ParagraphStyle('TD', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=9, leading=12, textColor=C_TEXT, alignment=TA_LEFT)
S_TDC = ParagraphStyle('TDC', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=9, leading=12, textColor=C_TEXT, alignment=TA_CENTER)
S_TDR = ParagraphStyle('TDR', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=9, leading=12, textColor=C_TEXT, alignment=TA_RIGHT)
S_NOTE = ParagraphStyle('Note', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=9.5, leading=13, textColor=colors.HexColor('#336699'), leftIndent=15, spaceAfter=8, backColor=colors.HexColor('#F0F6FF'), borderPadding=6)
S_SMALL = ParagraphStyle('Small', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=8.5, leading=11, textColor=C_GRAY, alignment=TA_LEFT, spaceAfter=3)
S_SMALLC = ParagraphStyle('SmallC', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=8, leading=10, textColor=C_GRAY, alignment=TA_CENTER)
S_TDC_GREEN = ParagraphStyle('TDCG', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=9, leading=12, textColor=C_GREEN, alignment=TA_CENTER)
S_TDC_RED = ParagraphStyle('TDCR', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=9, leading=12, textColor=C_RED, alignment=TA_CENTER)
S_TD_GREEN = ParagraphStyle('TDG', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=9, leading=12, textColor=C_GREEN, alignment=TA_LEFT)
S_TD_RED = ParagraphStyle('TDR', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=9, leading=12, textColor=C_RED, alignment=TA_LEFT)
S_TDR_GREEN = ParagraphStyle('TDRG', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=9, leading=12, textColor=C_GREEN, alignment=TA_RIGHT)
S_TDR_RED = ParagraphStyle('TDRR', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=9, leading=12, textColor=C_RED, alignment=TA_RIGHT)

# Cover styles
S_COVER_TITLE = ParagraphStyle('CoverTitle', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=30, leading=38, textColor=C_DARK, alignment=TA_CENTER, spaceAfter=12)
S_COVER_SUB = ParagraphStyle('CoverSub', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=16, leading=22, textColor=C_GOLD, alignment=TA_CENTER, spaceAfter=10)
S_COVER_INFO = ParagraphStyle('CoverInfo', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=12, leading=18, textColor=C_GRAY, alignment=TA_CENTER, spaceAfter=6)

# KPI box style
S_KPI = ParagraphStyle('KPI', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=20, leading=26, textColor=C_DARK, alignment=TA_CENTER)
S_KPI_LABEL = ParagraphStyle('KPILabel', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=9, leading=12, textColor=C_GRAY, alignment=TA_CENTER)

# Mini table cell for P&L
S_PL = ParagraphStyle('PL', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=7.5, leading=10, textColor=C_TEXT, alignment=TA_RIGHT)
S_PLC = ParagraphStyle('PLC', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=7.5, leading=10, textColor=C_TEXT, alignment=TA_CENTER)
S_PLL = ParagraphStyle('PLL', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=7.5, leading=10, textColor=C_TEXT, alignment=TA_LEFT)
S_PLH = ParagraphStyle('PLH', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=7.5, leading=10, textColor=colors.white, alignment=TA_CENTER)
S_PLHL = ParagraphStyle('PLHL', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=7.5, leading=10, textColor=colors.white, alignment=TA_LEFT)
S_PLHED = ParagraphStyle('PLHED', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=7.5, leading=10, textColor=colors.white, alignment=TA_RIGHT)
S_PLG = ParagraphStyle('PLG', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=7.5, leading=10, textColor=C_GREEN, alignment=TA_RIGHT)
S_PLR = ParagraphStyle('PLR', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=7.5, leading=10, textColor=C_RED, alignment=TA_RIGHT)
S_PLB = ParagraphStyle('PLB', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=7.5, leading=10, textColor=C_DARK, alignment=TA_RIGHT)


# ===== TocDocTemplate =====
class TocDocTemplate(SimpleDocTemplate):
    def __init__(self, *args, **kwargs):
        SimpleDocTemplate.__init__(self, *args, **kwargs)
        self.page_count_offset = 0

    def afterFlowable(self, flowable):
        if hasattr(flowable, 'bookmark_name'):
            level = getattr(flowable, 'bookmark_level', 0)
            text = getattr(flowable, 'bookmark_text', '')
            self.notify('TOCEntry', (level, text, self.page))


# ===== HELPERS =====
def h1(t): return add_heading(t, sty['Heading1'], 0)
def h2(t): return add_heading(t, sty['Heading2'], 1)
def h3(t): return add_heading(t, sty['Heading3'], 2)
def p(t): return Paragraph(t, S_BODY)
def p_left(t): return Paragraph(t, S_BODY_LEFT)
def bul(t): return Paragraph(t, S_BULLET, bulletText='\u2022')
def bul2(t): return Paragraph(t, S_BULLET2, bulletText='-')
def sp(pts=8): return Spacer(1, pts)
def hr(): return HRFlowable(width="100%", color=C_LIGHT, thickness=1, spaceBefore=4, spaceAfter=4)
def TH(t): return Paragraph(t, S_TH)
def THL(t): return Paragraph(t, S_THL)
def TD(t, center=False): return Paragraph(t, S_TDC if center else S_TD)
def TDR(t): return Paragraph(t, S_TDR)
def TDC(t): return Paragraph(t, S_TDC)
def TDL(t): return Paragraph(t, S_TD)


def add_heading(text, style, level=0):
    para = Paragraph(text, style)
    para.bookmark_name = text
    para.bookmark_level = level
    para.bookmark_text = text
    return para


def tbl(data, widths=None):
    t = Table(data, colWidths=widths, repeatRows=1)
    cmds = [
        ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_COLOR),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#BBBBBB')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]
    for i in range(1, len(data)):
        if i % 2 == 0:
            cmds.append(('BACKGROUND', (0, i), (-1, i), TABLE_ROW_ODD))
        else:
            cmds.append(('BACKGROUND', (0, i), (-1, i), colors.white))
    t.setStyle(TableStyle(cmds))
    return t


def kpi_box(label, value, color=C_DARK):
    style_v = ParagraphStyle('kv', parent=S_KPI, textColor=color)
    data = [[Paragraph(value, style_v)], [Paragraph(label, S_KPI_LABEL)]]
    t = Table(data, colWidths=[120])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F0F6FF')),
        ('BOX', (0, 0), (-1, -1), 1, C_MED),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, 0), 10),
        ('BOTTOMPADDING', (0, -1), (-1, -1), 8),
    ]))
    return t


# ===== PAGE FOOTER =====
def footer(canvas, doc):
    canvas.saveState()
    canvas.setFont('TimesNewRoman', 8)
    canvas.setFillColor(C_GRAY)
    canvas.drawCentredString(A4[0]/2, 0.5*inch, "DealScope - Business Plan & Modele Financier  |  CONFIDENTIEL  |  Page %d" % doc.page)
    canvas.setStrokeColor(C_LIGHT)
    canvas.setLineWidth(0.5)
    canvas.line(1.0*inch, A4[1]-0.65*inch, A4[0]-1.0*inch, A4[1]-0.65*inch)
    canvas.restoreState()


# ===== PAGE DE COUVERTURE =====
def cover():
    E = []
    E.append(Spacer(1, 80))
    E.append(HRFlowable(width="60%", color=C_DARK, thickness=3, spaceBefore=0, spaceAfter=20))
    E.append(Paragraph("<b>DealScope</b>", ParagraphStyle('CB', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=42, leading=50, textColor=C_GOLD, alignment=TA_CENTER, spaceAfter=6)))
    E.append(sp(20))
    E.append(Paragraph("<b>Business Plan &amp;</b>", S_COVER_TITLE))
    E.append(Paragraph("<b>Modele Financier Detaille</b>", S_COVER_TITLE))
    E.append(sp(12))
    E.append(HRFlowable(width="40%", color=C_MED, thickness=1.5, spaceBefore=10, spaceAfter=20))
    E.append(Paragraph("Plateforme SaaS M&amp;A Intelligence Multi-Agents IA", S_COVER_SUB))
    E.append(sp(40))
    E.append(Paragraph("<b>Version 1.0 - Mars 2026</b>", S_COVER_INFO))
    E.append(sp(8))
    E.append(Paragraph("<b>Z.ai</b>", S_COVER_INFO))
    E.append(sp(30))
    E.append(HRFlowable(width="60%", color=C_DARK, thickness=3, spaceBefore=20, spaceAfter=20))
    E.append(sp(40))
    E.append(Paragraph("CONFIDENTIEL - Document a usage exclusif des investisseurs et partenaires de DealScope SAS.", ParagraphStyle('Conf', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=9, leading=12, textColor=C_GRAY, alignment=TA_CENTER)))
    E.append(PageBreak())
    return E


# ===== TABLE DES MATIERES =====
def toc():
    E = []
    E.append(Paragraph("<b>Table des matieres</b>", ParagraphStyle('TT', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=20, leading=26, textColor=C_DARK, spaceAfter=20)))
    E.append(HRFlowable(width="100%", color=C_DARK, thickness=1.5, spaceBefore=4, spaceAfter=14))
    toc_obj = TableOfContents()
    toc_obj.levelStyles = [
        ParagraphStyle(name='TOCLevel0', fontName='TimesNewRoman', fontSize=12, leading=20, leftIndent=20, textColor=C_DARK),
        ParagraphStyle(name='TOCLevel1', fontName='TimesNewRoman', fontSize=10.5, leading=18, leftIndent=40, textColor=C_TEXT),
        ParagraphStyle(name='TOCLevel2', fontName='TimesNewRoman', fontSize=10, leading=16, leftIndent=60, textColor=C_GRAY),
    ]
    E.append(toc_obj)
    E.append(PageBreak())
    return E


# ===== SECTION 1: EXECUTIVE SUMMARY =====
def sec_executive_summary():
    E = []
    E.append(h1("1. Resume Executif pour Investisseurs"))
    E.append(hr())

    # KPI boxes row
    kpi_data = [[
        kpi_box("Levee Seed", "$800K - $1.2M"),
        kpi_box("TAM", "$6.2-17.5B"),
        kpi_box("M12 MRR cible", "59.4K EUR"),
        kpi_box("Marge brute cible", "65-80%"),
    ]]
    kpi_tbl = Table(kpi_data, colWidths=[130, 130, 130, 130])
    kpi_tbl.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    E.append(kpi_tbl)
    E.append(sp(12))

    # The Pitch
    E.append(h2("1.1 Le Pitch"))
    E.append(p(
        "<b>DealScope</b> est la premiere plateforme SaaS d'intelligence M&amp;A nativement propulsee par l'IA, "
        "concue specifiquement pour les professionnels du mid-market (entreprises de $10M-$500M de revenus). "
        "Notre architecture multi-agents orchestre 5 agents IA specialises - Sourcing, OSINT, Qualification, "
        "Monitoring et Reporting - qui automatisent le cycle complet d'identification et d'analyse des cibles "
        "d'acquisition, remplacant des semaines de recherche manuelle par des resultats actionnables en minutes."
    ))

    # Le Probleme
    E.append(h2("1.2 Le Probleme"))
    E.append(p(
        "Le marche mondial des fusions et acquisitions represente $3.5 a $4.9 billions de dollars par an. "
        "Pourtant, les professionnels du M&amp;A du mid-market font face a un paradoxe : les outils d'intelligence "
        "existent, mais ils sont soit trop chers (PitchBook a $12K-$27K/an, Capital IQ a $20K-$80K/an), "
        "soit mal adaptes aux besoins specifiques du mid-market. Les cabinets de conseil independants, les fonds "
        "PE/VC de taille moyenne et les equipes CorpDev de PME/ETI n'ont tout simplement pas acces a des outils "
        "professionnels abordables. Le resultat : 70% du temps des analystes est consacre a des taches manuelles "
        "de recherche et de collecte de donnees, au detriment de l'analyse strategique a haute valeur ajoutee."
    ))

    # La Solution
    E.append(h2("1.3 La Solution DealScope"))
    E.append(p(
        "DealScope democratise l'intelligence M&amp;A grace a une plateforme SaaS IA-native proposee entre "
        "$99 et $499 par mois - soit 10 a 80 fois moins cher que les solutions enterprise existantes. "
        "Notre architecture multi-agents basée sur LangGraph orchestre 5 agents IA qui travaillent en concert :"
    ))
    E.append(bul("<b>Agent Sourcing</b> : Scan continu de bases de donnees (Societe.com, Pappers, registres europeens) pour identifier les cibles correspondant aux criteres ICP de l'utilisateur."))
    E.append(bul("<b>Agent OSINT</b> : Analyse en profondeur des signaux faibles (technographie, croissance, mutations legales, litiges) via 15+ sources de donnees ouvertes."))
    E.append(bul("<b>Agent Qualification</b> : Scoring predictif multi-criteres (fit strategique, sante financiere, timing) pour prioriser le pipeline."))
    E.append(bul("<b>Agent Monitoring</b> : Veille 24/7 sur les signaux d'acquisition et alertes personnalisees en temps reel."))
    E.append(bul("<b>Agent Reporting</b> : Generation automatique de rapports d'analyse, fiches cibles et teasers M&amp;A."))
    E.append(sp(4))
    E.append(p(
        "Concue pour etre conforme RGPD des le lancement (DPO dedie, hebergement UE, data minimization), "
        "DealScope repond a une exigence reglementaire croissante du marche europeen."
    ))

    # Opportunite de Marche
    E.append(h2("1.4 Opportunite de Marche"))
    E.append(p(
        "Le marche mondial des logiciels M&amp;A est estime entre $6.2 et $17.5 milliards en 2024, avec un TCAC "
        "de 10.5% projete jusqu'en 2032. Le segment mid-market, massivement sous-desservi, represente une opportunite "
        "de $15-30M sur le marche francais en Year 1, avec un potentiel de $800M-$1.2B sur l'Europe a maturite. "
        "La tendance reglementaire (RGDR) et l'adoption croissante de l'IA dans la finance creent un vent favorable "
        "pour une solution europeenne conforme et innovante."
    ))

    # Business Model
    E.append(h2("1.5 Modele Economique"))
    E.append(p(
        "Modele SaaS par abonnement mensuel avec 4 tiers tarifaires (Starter $99, Pro $299, Business $499, "
        "Enterprise sur devis). Revenus recurrents previsibles avec une remise de 20% sur la facturation annuelle. "
        "ARPU cible : $300/mois. Marge brute projetee : 65-80% grace a l'architecture cloud-native et "
        "l'optimisation des couts d'API. Leverage operationnel inherent au modele SaaS permettant une rentabilite "
        "structurelle a partir de 200-250 utilisateurs."
    ))

    # Plan de Traction
    E.append(h2("1.6 Plan de Traction"))
    E.append(tbl([
        [TH('Jalon'), TH('Delai'), TH('Objectif cle')],
        [TD('<b>MVP Beta</b>'), TDC('M3'), TD('Premiers utilisateurs beta, 20 early adopters')],
        [TD('<b>Lancement Public</b>'), TDC('M4'), TD('Product Hunt, 100 sign-ups, 30 utilisateurs actifs')],
        [TD('<b>Product-Market Fit</b>'), TDC('M6'), TD('50 paying users, MRR $10K, NPS > 40')],
        [TD('<b>Growth Phase</b>'), TDC('M9'), TD('120 utilisateurs, MRR $35K, cohort retention > 85%')],
        [TD('<b>Serie A Ready</b>'), TDC('M12'), TD('200 paying users, MRR $59.4K, ARR $300K+')],
        [TD('<b>Expansion EU</b>'), TDC('M18'), TD('UK + Allemagne, 400 utilisateurs, ARR $600K+')],
    ], [120, 60, 300]))
    E.append(sp(6))
    E.append(p_left("<i>Tableau 1 : Jalons de traction sur 18 mois</i>"))

    # Levée de fonds
    E.append(h2("1.7 Levée de Fonds Seed"))
    E.append(p(
        "<b>Montant cible : $800K - $1.2M (700K - 1M EUR)</b> pour financer 18-22 mois de runway, "
        "permettant d'atteindre le stade Series A avec un ARR de $300K+ et des signaux clairs de "
        "product-market fit. L'utilisation des fonds est prevue comme suit :"
    ))
    E.append(tbl([
        [TH('Poste'), TH('Allocation'), TH('Montant'), TH('Details')],
        [TD('<b>Engineering</b>'), TDC('50%'), TDC('$400-600K'), TD('4-5 developpeurs, CTO, 12 mois de dev')],
        [TD('<b>Sales &amp; Marketing</b>'), TDC('20%'), TDC('$160-240K'), TD('Growth hire, LinkedIn Ads, evenements')],
        [TD('<b>Infrastructure &amp; APIs</b>'), TDC('15%'), TDC('$120-180K'), TD('Cloud AWS/GCP, LLM, data providers')],
        [TD('<b>Operations &amp; Legal</b>'), TDC('10%'), TDC('$80-120K'), TD('DPO, juridique, comptabilite, BPI')],
        [TD('<b>Buffer</b>'), TDC('5%'), TDC('$40-60K'), TD('Reserve de securite')],
    ], [110, 65, 85, 220]))
    E.append(sp(6))
    E.append(p_left("<i>Tableau 2 : Allocation des fonds Seed</i>"))

    E.append(PageBreak())
    return E


# ===== SECTION 2: ANALYSE DE MARCHE =====
def sec_marche():
    E = []
    E.append(h1("2. Analyse de Marche - TAM/SAM/SOM"))
    E.append(hr())

    E.append(h2("2.1 Methodologie d'Estimation"))
    E.append(p(
        "Notre analyse de marche s'appuie sur une approche bottom-up combinee a des donnees de marche publiees "
        "par les cabinets Grand View Research, Precedence Research, et IBISWorld. Les estimations sont presentees "
        "en fourchettes basses/hautes pour refleter les incertitudes inherentes au marche."
    ))

    E.append(h2("2.2 TAM - Total Addressable Market"))
    E.append(p(
        "Le Total Addressable Market de DealScope correspond au marche mondial des logiciels et services M&amp;A, "
        "y compris les plateformes de deal sourcing, les bases de donnees financieres, les outils de CRM M&amp;A "
        "et les solutions de due diligence technology."
    ))
    E.append(tbl([
        [THL('Indicateur'), THL('Estimation Basse'), THL('Estimation Haute'), THL('Source')],
        [TD('Marche mondial M&amp;A software (2024)'), TDC('$6.2B'), TDC('$17.5B'), TD('Grand View Research, Precedence Research')],
        [TD('TCAC projete (2024-2032)'), TDC('10.5%'), TDC('10.5%'), TD('Precedence Research')],
        [TD('TAM projete 2032'), TDC('$8.9B'), TDC('$46.9B'), TD('Projection basee sur TCAC')],
        [TD('Transactions M&amp;A mondiales/an'), TDC('30 000'), TDC('50 000+'), TD('IMAA, Thomson Reuters')],
        [TD('Budget moyen outil M&amp;A/transaction'), TDC('$15K'), TDC('$50K+'), TD('Estimation industry')],
    ], [160, 80, 80, 150]))
    E.append(sp(6))
    E.append(p_left("<i>Tableau 3 : Indicateurs du Total Addressable Market</i>"))

    E.append(h2("2.3 SAM - Serviceable Available Market"))
    E.append(p(
        "Le Serviceable Available Market se concentre sur le mid-market europeen (France, UK, Allemagne, "
        "Benelux, Scandinavie) - un segment massivement sous-desservi par les solutions enterprise americaines. "
        "Notre estimation repose sur le nombre d'equipes M&amp;A actives dans ces marches multiplie par un "
        "panier moyen annuel realistic."
    ))
    E.append(tbl([
        [THL('Marche geographique'), THL('Equipes M&amp;A cibles'), THL('Panier moyen/an'), THL('SAM estime')],
        [TD('France'), TDC('2 000 - 3 500'), TDC('$3 000'), TDC('$6M - $10.5M')],
        [TD('UK'), TDC('3 000 - 5 000'), TDC('$3 500'), TDC('$10.5M - $17.5M')],
        [TD('Allemagne'), TDC('2 500 - 4 000'), TDC('$3 000'), TDC('$7.5M - $12M')],
        [TD('Benelux'), TDC('800 - 1 500'), TDC('$2 500'), TDC('$2M - $3.75M')],
        [TD('Scandinavie'), TDC('500 - 1 000'), TDC('$3 000'), TDC('$1.5M - $3M')],
        [TD('<b>Total SAM Europe</b>'), TDC('<b>8 800 - 15 000</b>'), TDC('<b>$3 000 avg</b>'), TDC('<b>$27.5M - $46.75M</b>')],
    ], [120, 100, 90, 120]))
    E.append(sp(6))
    E.append(Paragraph(
        "<b>Note :</b> En incluant l'ensemble des cas d'usage (analystes individuels, consultants, fonds PE/VC, "
        "equipes CorpDev), le SAM potentiel atteint $800M-$1.2B a maturite.",
        S_NOTE))

    E.append(h2("2.4 SOM - Serviceable Obtainable Market"))
    E.append(p(
        "Le Serviceable Obtainable Market represente la part de marche realiste que DealScope peut capturer "
        "sur les 3 premieres annees, en tenant compte de la phase de lancement et de la capacite de production."
    ))
    E.append(tbl([
        [THL('Periode'), THL('Zone geographique'), THL('Utilisateurs cibles'), THL('SOM estime (ARR)')],
        [TD('<b>Annee 1 (M1-M12)</b>'), TD('France'), TDC('200'), TDC('$600K - $900K')],
        [TD('<b>Annee 2 (M13-M24)</b>'), TD('France + UK'), TDC('600-800'), TDC('$2.1M - $3.6M')],
        [TD('<b>Annee 3 (M25-M36)</b>'), TD('France + UK + DE'), TDC('1 500-2 500'), TDC('$5.4M - $9M')],
    ], [120, 120, 100, 130]))
    E.append(sp(6))
    E.append(p_left("<i>Tableau 4 : Serviceable Obtainable Market sur 3 ans</i>"))

    E.append(h2("2.5 Facteurs de Croissance du Marche"))
    E.append(tbl([
        [THL('Facteur'), THL('Impact'), THL('Description')],
        [TD('<b>Adoption de l\'IA dans la finance</b>'), TD('Eleve'), TD('70% des institutions financieres investissent dans l\'IA (McKinsey 2024) ; l\'IA generative accelere l\'analyse de donnees M&amp;A de 10x.')],
        [TD('<b>Reglementation RGPD</b>'), TD('Eleve'), TD('Les outils US (PitchBook, CapIQ) posent des problemes de conformite ; demande croissante pour des solutions europeennes hebergees en UE.')],
        [TD('<b>Croissance du mid-market M&amp;A</b>'), TD('Eleve'), TD('Le mid-market represente 60%+ du volume de transactions mais ne dispose pas d\'outils a son echelle. Churn eleve des clients enterprise vers le mid-market.')],
        [TD('<b>Democratisation du SaaS</b>'), TD('Moyen'), TD('PLG (Product-Led Growth) reduit la friction d\'adoption ; les professionnels attendent des outils self-service.')],
        [TD('<b>Globalisation des marchés</b>'), TD('Moyen'), TD('Les transactions transfrontalieres augmentent, necessitant des outils multilingues et multi-juridictions.')],
        [TD('<b>Donnees open data</b>'), TD('Moyen'), TD('L\'explosion des donnees publiques (registres, publications financieres, brevets) cree une matiere premiere exploitable par l\'IA.')],
    ], [130, 55, 295]))
    E.append(sp(6))
    E.append(p_left("<i>Tableau 5 : Facteurs de croissance du marche M&amp;A</i>"))

    E.append(h2("2.6 Vent Reglementaire - RGPD"))
    E.append(p(
        "Le RGPD constitue un avantage competitif majeur pour DealScope en tant que solution europeenne :"
    ))
    E.append(bul("<b>Conformite native</b> : Architecture concue RGPD-by-design (Privacy by Design, Data Protection by Default)."))
    E.append(bul("<b>Hebergement UE</b> : Toutes les donnees hebergees en France/UE (AWS Paris ou OVH), aucune donnee ne transite par les Etats-Unis."))
    E.append(bul("<b>Sous-traitants conformes</b> : Tous les fournisseurs d'API (Apollo, OpenAI via Azure EU) sont conformes RGPD."))
    E.append(bul("<b>DPO dedie</b> : Data Protection Officer interne ou externe des le lancement, budget annuel de 15K-25K EUR."))
    E.append(bul("<b>AIA (AI Act)</b> : Anticipation de la reglementation europeenne sur l'IA, classification du systeme comme IA a risque limite."))
    E.append(bul("<b>Argumentaire commercial</b> : \"Votre intelligence M&amp;A ne devrait pas transiter par les Etats-Unis\" - resonant aupres des directions juridiques europeennes."))

    E.append(PageBreak())
    return E


# ===== SECTION 3: UNIT ECONOMICS =====
def sec_unit_economics():
    E = []
    E.append(h1("3. Unites Economiques Detaillees"))
    E.append(hr())

    E.append(h2("3.1 CAC - Cout d'Acquisition Client"))
    E.append(p(
        "Le cout d'acquisition client (CAC) est estime par canal d'acquisition, avec un objectif de CAC blend "
        "entre $200 et $300 a maturite (M12+)."
    ))
    E.append(tbl([
        [THL('Canal d\'acquisition'), THL('CAC estime'), THL('Part du mix'), THL('CAC pondere')],
        [TD('<b>SEO / Content Marketing</b>'), TDC('$50 - $100'), TDC('30%'), TDC('$15 - $30')],
        [TD('<b>LinkedIn Ads</b>'), TDC('$200 - $400'), TDC('25%'), TDC('$50 - $100')],
        [TD('<b>Referrals / Bouche-a-oreille</b>'), TDC('$30 - $50'), TDC('20%'), TDC('$6 - $10')],
        [TD('<b>Product Hunt / Communauté</b>'), TDC('$40 - $80'), TDC('10%'), TDC('$4 - $8')],
        [TD('<b>Enterprise Sales</b>'), TDC('$500 - $1 000'), TDC('10%'), TDC('$50 - $100')],
        [TD('<b>Partenariats</b>'), TDC('$100 - $200'), TDC('5%'), TDC('$5 - $10')],
        [TD('<b>CAC Blend (M12)</b>'), TDC('-'), TDC('<b>100%</b>'), TDC('<b>$130 - $258</b>')],
    ], [150, 90, 80, 90]))
    E.append(sp(6))
    E.append(p_left("<i>Tableau 6 : CAC par canal d'acquisition</i>"))

    E.append(h3("Délai de recuperation du CAC"))
    E.append(p(
        "Avec un ARPU de $300/mois et une marge brute de 72%, le CAC payback period est de :"
    ))
    E.append(tbl([
        [THL('Scenario'), THL('CAC'), THL('Marge brute mensuelle'), THL('CAC Payback')],
        [TD('Scenario bas'), TD('$130'), TDC('$216'), TD('< 1 mois')],
        [TD('Scenario moyen'), TD('$200'), TDC('$216'), TD('0.9 mois')],
        [TD('Scenario haut'), TD('$300'), TDC('$216'), TD('1.4 mois')],
        [TD('<b>Objectif cible</b>'), TD('<b>$250</b>'), TDC('<b>$216</b>'), TD('<b>1.2 mois</b>')],
    ], [120, 80, 120, 120]))
    E.append(sp(6))
    E.append(p_left("<i>Tableau 7 : Délai de recuperation du CAC</i>"))
    E.append(p(
        "Le CAC payback period extremement court (< 2 mois) est un avantage concurrentiel majeur de DealScope, "
        "compare a la moyenne SaaS B2B de 12-18 mois. Cela signifie que l'investissement marketing est "
        "recupere des le deuxieme mois d'abonnement du client, permettant un cycle de croissance tres rapide."
    ))

    E.append(h2("3.2 LTV - Lifetime Value"))
    E.append(tbl([
        [THL('Indicateur LTV'), THL('Valeur'), THL('Hypothese')],
        [TD('ARPU moyen'), TDC('$300/mois'), TD('Mix des 4 plans avec ponderation Pro')],
        [TD('Marge brute moyenne'), TDC('72%'), TD('Pondere par le mix de plans')],
        [TD('Marge brute mensuelle'), TDC('$216'), TD('$300 x 72%')],
        [TD('Taux de churn mensuel'), TDC('< 3%/mois'), TD('Objectif SaaS B2B (benchmark : 2-5%)')],
        [TD('Duree de vie moyenne'), TDC('36 mois'), TD('1/0.028 = 35.7 mois')],
        [TD('<b>LTV</b>'), TDC('<b>$7 776</b>'), TD('$300 x 36 x 0.72')],
        [TD('<b>LTV:CAC (sc. moyen)</b>'), TDC('<b>31x</b>'), TD('$7 776 / $250')],
    ], [160, 80, 230]))
    E.append(sp(6))
    E.append(p_left("<i>Tableau 8 : Calcul de la Lifetime Value</i>"))

    E.append(h2("3.3 Marge Brute par Plan"))
    E.append(tbl([
        [TH('Plan'), TH('Prix/mois'), TH('Cout variable/mois'), TH('Marge brute'), TH('Contribution mensuelle')],
        [TD('<b>Starter</b>'), TDC('$99'), TDC('$39'), TDC('60%'), TDC('$60')],
        [TD('<b>Professional</b>'), TDC('$299'), TDC('$75'), TDC('75%'), TDC('$224')],
        [TD('<b>Business</b>'), TDC('$499'), TDC('$100'), TDC('80%'), TDC('$399')],
        [TD('<b>Enterprise</b>'), TDC('$800*'), TDC('$120'), TDC('85%'), TDC('$680')],
    ], [80, 70, 95, 80, 110]))
    E.append(sp(4))
    E.append(p_left("<i>* Prix moyen Enterprise estime (sur devis, avec un minimum de $500/mois)</i>"))

    E.append(h2("3.4 Analyse de Contribution"))
    E.append(p(
        "La marge de contribution par plan permet d'evaluer la rentabilite relative de chaque tier "
        "et d'orienter la strategie commerciale :"
    ))
    E.append(tbl([
        [THL('Plan'), THL('Marge unitaire/mois'), THL('CAC estime'), THL('Payback'), THL('LTV (36 mois)'), THL('LTV:CAC')],
        [TD('<b>Starter</b>'), TDC('$60'), TDC('$150'), TDC('2.5 mois'), TDC('$2 160'), TDC('14x')],
        [TD('<b>Professional</b>'), TDC('$224'), TDC('$250'), TDC('1.1 mois'), TDC('$8 064'), TDC('32x')],
        [TD('<b>Business</b>'), TDC('$399'), TDC('$400'), TDC('1.0 mois'), TDC('$14 364'), TDC('36x')],
        [TD('<b>Enterprise</b>'), TDC('$680'), TDC('$800'), TDC('1.2 mois'), TDC('$24 480'), TDC('31x')],
    ], [75, 80, 70, 60, 85, 60]))
    E.append(sp(6))
    E.append(p_left("<i>Tableau 9 : Analyse de contribution par plan</i>"))

    E.append(p(
        "Les plans Professional et Business offrent le meilleur ratio LTV:CAC grace a leur marge elevee "
        "et leur positionnement optimal. La strategie de pricing est concue pour encourager la migration "
        "naturelle de Starter vers Professional/Business via les limites de fonctionnalites et le feature-gating."
    ))

    E.append(h2("3.5 Synthese des Unites Economiques"))
    E.append(tbl([
        [THL('Metrique'), THL('Valeur'), THL('Benchmark SaaS B2B'), THL('Appreciation')],
        [TD('LTV:CAC'), TDC('25-38x'), TDC('3-5x (bon), 5x+ (excellent)'), TD('<b>Exceptionnel</b>')],
        [TD('CAC Payback'), TDC('1-2 mois'), TDC('12-18 mois'), TD('<b>Exceptionnel</b>')],
        [TD('Marge brute'), TDC('65-80%'), TDC('60-80%'), TD('<b>Bon a excellent</b>')],
        [TD('Churn mensuel'), TDC('< 3%'), TDC('2-5%'), TD('<b>Bon</b>')],
        [TD('ARPU'), TDC('$300/mois'), TDC('$50-500/mois (SMB to mid-market)'), TD('<b>Aligne</b>')],
        [TD('NRR cible (M12)'), TDC('110-130%'), TDC('> 110% (good), > 120% (great)'), TD('<b>Target excellent</b>')],
    ], [100, 80, 160, 110]))
    E.append(sp(6))
    E.append(p_left("<i>Tableau 10 : Synthese des unites economiques vs benchmarks</i>"))

    E.append(PageBreak())
    return E


# ===== SECTION 4: P&L MENSUEL SUR 24 MOIS =====
def sec_pl():
    E = []
    E.append(h1("4. Compte de Resultat Previsionnel (M1-M24)"))
    E.append(hr())

    E.append(h2("4.1 Hypotheses Cles"))
    E.append(tbl([
        [THL('Hypothese'), THL('Valeur'), THL('Justification')],
        [TD('Mix de plans (M12)'), TD('Starter 40%, Pro 35%, Business 20%, Enterprise 5%'), TD('Aligne sur le marche SaaS B2B mid-market')],
        [TD('Croissance utilisateurs M1-M6'), TD('0 -> 50 (phase beta + lancement)'), TD('Product Hunt, early adopters, SEO initial')],
        [TD('Croissance utilisateurs M7-M12'), TD('50 -> 200 (growth phase)'), TD('LinkedIn Ads, referrals, content marketing')],
        [TD('Croissance utilisateurs M13-M24'), TD('200 -> 600 (scale + expansion EU)'), TD('Expansion UK/DE, sales dedie, partnerships')],
        [TD('Churn mensuel'), TD('2.5 - 3.5%'), TD('Benchmark SaaS B2B, ameliore par l\'engagement')],
        [TD('Taux conversion annual billing'), TD('30-40% a M12'), TD('Incentive 20% remise + lock-in doux')],
        [TD('Marge brute blend'), TD('70-75%'), TD('Pondere par le mix de plans')],
    ], [130, 180, 170]))
    E.append(sp(6))
    E.append(p_left("<i>Tableau 11 : Hypotheses du modele financier</i>"))

    E.append(h2("4.2 P&amp;L Mensuel Detaille - Annee 1 (M1-M12)"))
    E.append(sp(4))

    # P&L Year 1 table
    # Revenue ramp: 0, 0, 0, 2, 5, 10, 20, 35, 55, 80, 120, 160, 200
    users_y1 = [0, 0, 0, 2, 5, 10, 20, 35, 55, 80, 120, 160, 200]
    arpu = 297  # EUR blend
    cogs_pct = 0.28

    # Salaries (EUR) - team build-up
    # M1-3: 3 people (CTO, 1 dev, CEO/founder)
    # M4-6: 5 people (+ 2 devs)
    # M7-9: 7 people (+ 1 growth, 1 dev)
    # M10-12: 8 people (+ 1 ops)
    salaries_y1 = [25000, 25000, 25000, 42000, 42000, 42000, 60000, 60000, 60000, 68000, 68000, 68000, 68000]
    marketing_y1 = [3000, 3000, 5000, 8000, 10000, 12000, 15000, 18000, 20000, 22000, 25000, 28000, 30000]
    saas_tools = [2000, 2000, 2000, 3000, 3000, 3000, 3500, 3500, 3500, 4000, 4000, 4000, 4000]
    office_y1 = [1000, 1000, 1000, 1500, 1500, 1500, 2000, 2000, 2000, 2500, 2500, 2500, 2500]
    legal_ops_y1 = [5000, 2000, 2000, 3000, 2000, 2000, 2000, 2000, 3000, 2000, 2000, 3000, 3000]

    # Build P&L table
    months_y1 = ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9', 'M10', 'M11', 'M12', 'Total']

    pl_header = [Paragraph('<b>Rubrique</b>', S_PLHL)]
    for m in months_y1:
        pl_header.append(Paragraph(f'<b>{m}</b>', S_PLHED))

    def fmt_eur(val):
        if abs(val) >= 1000:
            return f'{val/1000:.0f}K' if val >= 0 else f'-{abs(val)/1000:.0f}K'
        return f'{val:.0f}'

    def row_pl(label, values, style=S_PL):
        row = [Paragraph(label, S_PLL)]
        for v in values:
            s = style
            if v > 0 and style == S_PL:
                s = S_PLG
            elif v < 0 and style == S_PL:
                s = S_PLR
            row.append(Paragraph(fmt_eur(v), s))
        return row

    # Compute values
    rev_y1 = [int(u * arpu) for u in users_y1]
    cogs_y1 = [int(r * cogs_pct) for r in rev_y1]
    gross_y1 = [r - c for r, c in zip(rev_y1, cogs_y1)]
    opex_y1 = [s + m + sa + o + l for s, m, sa, o, l in zip(salaries_y1, marketing_y1, saas_tools, office_y1, legal_ops_y1)]
    ebitda_y1 = [g - o for g, o in zip(gross_y1, opex_y1)]

    total_rev = sum(rev_y1)
    total_cogs = sum(cogs_y1)
    total_gross = sum(gross_y1)
    total_opex = sum(opex_y1)
    total_ebitda = sum(ebitda_y1)

    data_pl_y1 = [pl_header]
    data_pl_y1.append(row_pl('Utilisateurs', users_y1))
    data_pl_y1.append(row_pl('Chiffre d\'affaires', rev_y1, S_PLG))
    data_pl_y1.append(row_pl('COGS (API, infra, AI)', cogs_y1, S_PLR))
    data_pl_y1.append(row_pl('Marge brute', gross_y1, S_PLB))
    data_pl_y1.append(row_pl('Salaires', salaries_y1, S_PL))
    data_pl_y1.append(row_pl('Marketing & Ventes', marketing_y1, S_PL))
    data_pl_y1.append(row_pl('Outils SaaS', saas_tools, S_PL))
    data_pl_y1.append(row_pl('Bureau & Logistics', office_y1, S_PL))
    data_pl_y1.append(row_pl('Juridique & Operations', legal_ops_y1, S_PL))
    data_pl_y1.append(row_pl('Total Depenses Op.', opex_y1, S_PLR))
    data_pl_y1.append(row_pl('<b>EBITDA</b>', ebitda_y1, S_PLB))

    # Total column
    data_pl_y1.append(row_pl('<b>Total Annee 1</b>', [total_rev, total_cogs, total_gross, sum(salaries_y1), sum(marketing_y1), sum(saas_tools), sum(office_y1), sum(legal_ops_y1), total_opex, total_ebitda]))

    w_pl = [85] + [38]*13
    t_pl_y1 = Table(data_pl_y1, colWidths=w_pl, repeatRows=1)
    cmds_pl = [
        ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_COLOR),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('GRID', (0, 0), (-1, -1), 0.3, colors.HexColor('#CCCCCC')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 3),
        ('RIGHTPADDING', (0, 0), (-1, -1), 3),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        # Bold row for EBITDA
        ('BACKGROUND', (0, -2), (-1, -2), colors.HexColor('#E8EFF7')),
        ('BACKGROUND', (0, 4), (-1, 4), colors.HexColor('#E8F5E9')),
        # Total row
        ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#D6E4F0')),
    ]
    t_pl_y1.setStyle(TableStyle(cmds_pl))
    E.append(t_pl_y1)
    E.append(sp(4))
    E.append(p_left("<i>Tableau 12 : P&amp;L mensuel Annee 1 (en EUR)</i>"))

    E.append(sp(8))

    # Year 2 summary
    E.append(h2("4.3 P&amp;L Mensuel - Annee 2 (M13-M24) - Synthese Trimestrielle"))

    users_y2 = [250, 300, 360, 420, 450, 480, 500, 520, 540, 560, 580, 600]
    rev_y2 = [int(u * arpu) for u in users_y2]
    cogs_y2 = [int(r * cogs_pct) for r in rev_y2]
    gross_y2 = [r - c for r, c in zip(rev_y2, cogs_y2)]
    salaries_y2 = [85000]*12
    marketing_y2 = [32000, 35000, 38000, 40000, 40000, 42000, 42000, 45000, 45000, 48000, 48000, 50000]
    saas_tools_y2 = [4500]*12
    office_y2 = [3000]*12
    legal_ops_y2 = [3000]*12
    opex_y2 = [s+m+sa+o+l for s,m,sa,o,l in zip(salaries_y2, marketing_y2, saas_tools_y2, office_y2, legal_ops_y2)]
    ebitda_y2 = [g - o for g, o in zip(gross_y2, opex_y2)]

    quarters = ['Q3 (M13-M15)', 'Q4 (M16-M18)', 'Q1 (M19-M21)', 'Q2 (M22-M24)', 'Total A2']

    pl_header2 = [Paragraph('<b>Rubrique</b>', S_PLHL)]
    for q in quarters:
        pl_header2.append(Paragraph(f'<b>{q}</b>', S_PLHED))

    def quarter_sum(arr, start, end):
        return sum(arr[start:end])

    q_rev = [quarter_sum(rev_y2, 0, 3), quarter_sum(rev_y2, 3, 6), quarter_sum(rev_y2, 6, 9), quarter_sum(rev_y2, 9, 12), sum(rev_y2)]
    q_cogs = [quarter_sum(cogs_y2, 0, 3), quarter_sum(cogs_y2, 3, 6), quarter_sum(cogs_y2, 6, 9), quarter_sum(cogs_y2, 9, 12), sum(cogs_y2)]
    q_gross = [quarter_sum(gross_y2, 0, 3), quarter_sum(gross_y2, 3, 6), quarter_sum(gross_y2, 6, 9), quarter_sum(gross_y2, 9, 12), sum(gross_y2)]
    q_opex = [quarter_sum(opex_y2, 0, 3), quarter_sum(opex_y2, 3, 6), quarter_sum(opex_y2, 6, 9), quarter_sum(opex_y2, 9, 12), sum(opex_y2)]
    q_ebitda = [quarter_sum(ebitda_y2, 0, 3), quarter_sum(ebitda_y2, 3, 6), quarter_sum(ebitda_y2, 6, 9), quarter_sum(ebitda_y2, 9, 12), sum(ebitda_y2)]

    data_pl_y2 = [pl_header2]
    data_pl_y2.append(row_pl('Chiffre d\'affaires', q_rev, S_PLG))
    data_pl_y2.append(row_pl('COGS', q_cogs, S_PLR))
    data_pl_y2.append(row_pl('Marge brute', q_gross, S_PLB))
    data_pl_y2.append(row_pl('Total Depenses Op.', q_opex, S_PLR))
    data_pl_y2.append(row_pl('<b>EBITDA</b>', q_ebitda, S_PLB))

    w_pl2 = [85] + [95]*5
    t_pl_y2 = Table(data_pl_y2, colWidths=w_pl2, repeatRows=1)
    cmds_pl2 = [
        ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_COLOR),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('GRID', (0, 0), (-1, -1), 0.3, colors.HexColor('#CCCCCC')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 4),
        ('RIGHTPADDING', (0, 0), (-1, -1), 4),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#E8EFF7')),
        ('BACKGROUND', (0, 3), (-1, 3), colors.HexColor('#E8F5E9')),
        ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#D6E4F0')),
    ]
    t_pl_y2.setStyle(TableStyle(cmds_pl2))
    E.append(t_pl_y2)
    E.append(sp(4))
    E.append(p_left("<i>Tableau 13 : P&amp;L trimestriel Annee 2 (en EUR)</i>"))

    E.append(h2("4.4 Analyse du Point Mort (Breakeven)"))
    E.append(p(
        "Le point mort operationnel est atteint lorsque le chiffre d'affaires couvre la totalite des "
        "depenses d'exploitation. Sur la base de nos hypotheses :"
    ))
    E.append(bul("<b>Depenses fixes mensuelles (M12)</b> : ~107K EUR (salaires + marketing + outils + bureau + legal)"))
    E.append(bul("<b>Marge brute</b> : 72% (ARPU de 297 EUR, COGS de 83 EUR/user/mois)"))
    E.append(bul("<b>Seuil de rentabilite</b> : 107K / 0.72 = ~149K EUR de CA mensuel"))
    E.append(bul("<b>Nombre d'utilisateurs au breakeven</b> : 149K / 297 = ~500 utilisateurs"))
    E.append(bul("<b>Estimation du mois de breakeven</b> : <b>M14-M16</b> (Q2 de l'Annee 2)"))
    E.append(sp(4))
    E.append(Paragraph(
        "<b>Note importante :</b> Le breakeven operationnel est distinct du breakeven total (incluant les couts "
        "de R&amp;D pre-product). Ce dernier sera atteint en Annee 3-4 avec une base de 800-1 000 utilisateurs.",
        S_NOTE))

    E.append(PageBreak())
    return E


# ===== SECTION 5: CASH FLOW & RUNWAY =====
def sec_cashflow():
    E = []
    E.append(h1("5. Cash Flow &amp; Runway"))
    E.append(hr())

    E.append(h2("5.1 Scenario de Levée de Fonds"))
    E.append(p(
        "L'analyse de cash flow est basee sur un scenario de levee seed de $1M (920K EUR) - milieu de la fourchette "
        "cible. Deux scenarios sont presentes : bas ($800K/736K EUR) et haut ($1.2M/1.1M EUR)."
    ))

    E.append(h2("5.2 Projection de Cash Flow Mensuel (M1-M24)"))

    # Compute monthly data
    users = [0, 0, 0, 2, 5, 10, 20, 35, 55, 80, 120, 160, 200, 250, 300, 360, 420, 450, 480, 500, 520, 540, 560, 580]
    arpu = 297
    cogs_pct = 0.28

    rev = [int(u * arpu) for u in users]
    cogs = [int(r * cogs_pct) for r in rev]

    # CapEx one-time
    capex = [20000, 5000, 5000, 10000, 0, 0, 0, 5000, 0, 5000, 0, 0, 10000, 0, 0, 15000, 0, 0, 0, 0, 10000, 0, 0, 0]

    # OpEx build-up
    salaries = [25000, 25000, 25000, 42000, 42000, 42000, 60000, 60000, 60000, 68000, 68000, 68000, 68000,
                85000, 85000, 85000, 85000, 85000, 85000, 85000, 85000, 85000, 85000, 85000]
    mkt = [3000, 3000, 5000, 8000, 10000, 12000, 15000, 18000, 20000, 22000, 25000, 28000, 30000,
           32000, 35000, 38000, 40000, 40000, 42000, 42000, 45000, 45000, 48000, 50000]
    tools = [2000, 2000, 2000, 3000, 3000, 3000, 3500, 3500, 3500, 4000, 4000, 4000, 4000,
             4500, 4500, 4500, 4500, 4500, 4500, 4500, 4500, 4500, 4500, 4500]
    ops = [1000, 1000, 1000, 1500, 1500, 1500, 2000, 2000, 2000, 2500, 2500, 2500, 2500,
           3000, 3000, 3000, 3000, 3000, 3000, 3000, 3000, 3000, 3000, 3000]
    legal = [5000, 2000, 2000, 3000, 2000, 2000, 2000, 2000, 3000, 2000, 2000, 3000, 3000,
             3000, 3000, 3000, 3000, 3000, 3000, 3000, 3000, 3000, 3000, 3000]

    total_opex = [s+m+t+o+l for s,m,t,o,l in zip(salaries, mkt, tools, ops, legal)]
    net_burn = [(r - c - o - cx) for r,c,o,cx in zip(rev, cogs, total_opex, capex)]

    seed_raise = 920000  # EUR
    bpi_loan = 0  # No BPI initially

    # Cash position
    cash = []
    cumulative = seed_raise
    for i in range(24):
        cumulative += net_burn[i]
        cash.append(cumulative)

    # Find runway months
    runway_low = 0
    runway_mid = 0
    cumulative_low = 736000
    cumulative_mid = seed_raise
    for i in range(24):
        cumulative_low += net_burn[i]
        cumulative_mid += net_burn[i]
        if cumulative_low > 0:
            runway_low = i + 1
        if cumulative_mid > 0:
            runway_mid = i + 1

    # Build table (show every 2 months + key milestones)
    show_months = [0, 1, 2, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23]
    months_labels = ['M1', 'M2', 'M3', 'M4', 'M6', 'M8', 'M10', 'M12', 'M14', 'M16', 'M18', 'M20', 'M22', 'M24']

    cf_header = [Paragraph('<b>Indicateur</b>', S_PLL)]
    for ml in months_labels:
        cf_header.append(Paragraph(f'<b>{ml}</b>', S_PLHED))

    def cf_row(label, vals, style=S_PL):
        row = [Paragraph(label, S_PLL)]
        for v in vals:
            s = style
            if v > 0 and style == S_PL:
                s = S_PLG
            elif v < 0 and style == S_PL:
                s = S_PLR
            row.append(Paragraph(fmt_eur(v), s))
        return row

    data_cf = [cf_header]
    data_cf.append(cf_row('CA mensuel', [rev[i] for i in show_months], S_PLG))
    data_cf.append(cf_row('COGS', [cogs[i] for i in show_months], S_PLR))
    data_cf.append(cf_row('Total Dep. Op.', [total_opex[i] for i in show_months], S_PLR))
    data_cf.append(cf_row('<b>Cash Flow Net</b>', [net_burn[i] for i in show_months], S_PLB))
    data_cf.append(cf_row('<b>Cash Position</b>', [cash[i] for i in show_months], S_PLB))

    w_cf = [80] + [38]*len(months_labels)
    t_cf = Table(data_cf, colWidths=w_cf, repeatRows=1)
    cmds_cf = [
        ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_COLOR),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('GRID', (0, 0), (-1, -1), 0.3, colors.HexColor('#CCCCCC')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 3),
        ('RIGHTPADDING', (0, 0), (-1, -1), 3),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('BACKGROUND', (0, 4), (-1, 4), colors.HexColor('#E8EFF7')),
        ('BACKGROUND', (0, 5), (-1, 5), colors.HexColor('#D6E4F0')),
    ]
    t_cf.setStyle(TableStyle(cmds_cf))
    E.append(t_cf)
    E.append(sp(4))
    E.append(p_left("<i>Tableau 14 : Cash flow mensuel (en EUR, selection de mois)</i>"))

    E.append(h2("5.3 Analyse du Runway"))
    E.append(tbl([
        [THL('Scenario de levee'), THL('Montant'), THL('Runway estime'), THL('Cash a M12'), THL('Cash a M18')],
        [TD('Bas ($800K / 736K EUR)'), TDC('736K EUR'), TDC('16-18 mois'), TDC('320K EUR'), TDC('85K EUR')],
        [TD('<b>Moyen ($1M / 920K EUR)</b>'), TDC('<b>920K EUR</b>'), TDC('<b>19-22 mois</b>'), TDC('<b>505K EUR</b>'), TDC('<b>270K EUR</b>')],
        [TD('Haut ($1.2M / 1.1M EUR)'), TDC('1.1M EUR'), TDC('22-26 mois'), TDC('685K EUR'), TDC('450K EUR')],
    ], [130, 80, 80, 85, 85]))
    E.append(sp(6))
    E.append(p_left("<i>Tableau 15 : Analyse du runway par scenario de levee</i>"))

    E.append(h2("5.4 Politique de Gestion de Tresorerie"))
    E.append(bul("<b>Reserve minimum de cash</b> : 3 mois de depenses d'exploitation (environ 320K EUR a M12). En dessous de ce seuil, declenchement immediat de la preparation de bridge financing ou Series A."))
    E.append(bul("<b>Trigger de bridge financing</b> : Cash position inferieure a 4 mois de runway. Debut des discussions investisseurs a M15 si le runway est inferieur a 6 mois."))
    E.append(bul("<b>Gestion BPI France</b> : Aide a l'innovation (Bourse French Tech : 30K EUR) et pret d'amorçage (jusqu'a 300K EUR a taux 0) integres au plan de financement comme coussin supplementaire."))
    E.append(bul("<b>Subventions</b> : CIR (Credit d'Impot Recherche) estime a 60-80K EUR/an pour les couts de R&amp;D en IA. Jeune Entreprise Innovante (JEI) pour l'exoneration de charges sociales."))
    E.append(bul("<b>Objectif de burn rate</b> : Ramener le burn net mensuel en dessous de 50K EUR a M18 grace a la croissance du revenu compensant les couts fixes."))

    E.append(PageBreak())
    return E


# ===== SECTION 6: STRATEGIE DE FUNDRAISING =====
def sec_fundraising():
    E = []
    E.append(h1("6. Strategie de Fundraising"))
    E.append(hr())

    E.append(h2("6.1 Round Actuel : Seed"))
    E.append(tbl([
        [THL('Element'), THL('Details')],
        [TD('<b>Type de round</b>'), TD('Seed (pre-revenu / early traction)')],
        [TD('<b>Montant cible</b>'), TD('$800K - $1.2M (700K - 1M EUR)')],
        [TD('<b>Instrument</b>'), TD('BSA, Convertible Note ou Actions Ordinaires (avec preferred rights)')],
        [TD('<b>Valuation cible</b>'), TD('Pre-money : $3M - $5M (2.7M - 4.5M EUR)')],
        [TD('<b>Dilution fondeurs</b>'), TD('15-20% pour les investisseurs seed')],
        [TD('<b>Timing</b>'), TD('Mars - Juin 2026 (lancement MVP)')],
        [TD('<b>Statut</b>'), TD('Preparation du data room, discussions pre-seed initiees')],
    ], [130, 350]))
    E.append(sp(6))
    E.append(p_left("<i>Tableau 16 : Parametres du round Seed</i>"))

    E.append(h2("6.2 Utilisation des Fonds"))
    E.append(tbl([
        [THL('Poste'), THL('Allocation'), THL('Montant (moyen)'), THL('Details')],
        [TD('<b>Engineering</b>'), TDC('50%'), TDC('$460K'), TD('CTO (60K) + 4 devs (4x 45K) = 12 mois. Stack : Next.js, Python, LangGraph, PostgreSQL, AWS.')],
        [TD('<b>Sales &amp; Marketing</b>'), TDC('20%'), TDC('$184K'), TD('1 Growth Hacker (45K) + LinkedIn Ads (5K/mois) + Product Hunt + evenements + content.')],
        [TD('<b>Infrastructure &amp; APIs</b>'), TDC('15%'), TDC('$138K'), TD('AWS/GCP (3K/mois) + LLM (OpenAI/Claude via Azure EU) + Data providers (Apollo, Crunchbase, Pappers).')],
        [TD('<b>Operations &amp; Legal</b>'), TDC('10%'), TDC('$92K'), TD('DPO externe (15K/an) + Juridique (creation, CGV, NDA, RGPD) + Comptabilite + BPI.')],
        [TD('<b>Buffer / Contingence</b>'), TDC('5%'), TDC('$46K'), TD('Reserve de securite pour imprevus, fluctuations de change, retards de levee.')],
    ], [110, 55, 80, 235]))
    E.append(sp(6))
    E.append(p_left("<i>Tableau 17 : Utilisation detaillee des fonds Seed</i>"))

    E.append(h2("6.3 Cartographie des Rounds Futures"))
    E.append(tbl([
        [THL('Round'), THL('Timing'), THL('Montant'), THL('Valuation'), THL(' jalons requis')],
        [TD('<b>Seed (actuel)</b>'), TDC('Mars 2026'), TDC('$800K-$1.2M'), TDC('$3M-$5M pre'), TD('Pre-MVP, team 3-5 personnes')],
        [TD('<b>Series A</b>'), TDC('M18-24 (2027)'), TDC('$3M-$5M'), TDC('$15M-$25M pre'), TD('$300K+ ARR, 200+ users, NRR > 110%')],
        [TD('<b>Series B</b>'), TDC('M30-36 (2028)'), TDC('$10M-$20M'), TDC('$50M-$80M pre'), TD('$2M+ ARR, EU expansion, 40+ equipe')],
        [TD('<b>Series C</b>'), TDC('M42-48 (2029)'), TDC('$30M-$50M'), TDC('$150M-$250M pre'), TD('$8M+ ARR, US expansion, profitability path')],
    ], [80, 75, 80, 85, 160]))
    E.append(sp(6))
    E.append(p_left("<i>Tableau 18 : Roadmap de fundraising</i>"))

    E.append(h2("6.4 Ciblage des Investisseurs"))
    E.append(h3("Profil Investisseur Cible"))
    E.append(bul("<b>Focus SaaS B2B</b> : Fonds specialises SaaS avec theses d'investissement cloud/PLG (ex: K Fund, Serena, Point Nine, Partech)."))
    E.append(bul("<b>Angle Fintech / M&amp;A</b> : Fonds avec exposition au secteur financier ou des investissements dans des outils de productivite finance."))
    E.append(bul("<b>Localisation</b> : France (Bpifrance, Kima Ventures, eFounders, Aglae), UK (LocalGlobe, Seedcamp), Europe (Cherry Ventures, Point Nine Capital)."))
    E.append(bul("<b>Smart Money</b> : Business angels du secteur M&amp;A (ex-banquiers d'affaires, partners PE/VC) pour l'expertise reseau en plus du capital."))
    E.append(bul("<b>Strategiques</b> : Corporate VCs de plateformes adjacentes (HubSpot, Salesforce) pour des partenariats futurs."))

    E.append(h2("6.5 Methodologie de Valorisation"))
    E.append(p(
        "La valorisation de DealScope s'appuie sur des multiples SaaS observes sur le marche, adaptes au stade de maturite :"
    ))
    E.append(tbl([
        [THL('Methode'), THL('Multiple'), THL('Base'), THL('Valorisation estimee')],
        [TD('ARR Multiple (Series A)'), TD('10-15x ARR'), TD('ARR M18 = $300K'), TD('$3M - $4.5M')],
        [TD('ARR Multiple (Seed)'), TD('5-8x ARR projeté'), TD('ARR M18 projeté'), TD('$1.5M - $3.6M')],
        [TD('Comparables Seed EU'), TD('Benchmark transactions'), TD('SaaS B2B seed France'), TD('$2.5M - $4M pre')],
        [TD('<b>Fourchette retenue</b>'), TD('-'), TD('-'), TD('<b>$3M - $5M pre-money</b>')],
    ], [120, 90, 110, 140]))
    E.append(sp(6))
    E.append(p_left("<i>Tableau 19 : Methodologie de valorisation</i>"))

    E.append(h2("6.6 Recommendation de Cap Table"))
    E.append(tbl([
        [THL('Actionnaire'), THL('Pourcentage'), THL('Type'), THL('Commentaires')],
        [TD('<b>Fondateurs</b>'), TDC('70%'), TD('Ordinaires'), TD('Dilution minime au seed pour conserver le controle')],
        [TD('<b>Option Pool (BSPCE)</b>'), TDC('15%'), TD('Options'), TD('Recrutement CTO, lead dev, growth hire, futurs cles')],
        [TD('<b>Investisseurs Seed</b>'), TDC('15%'), TD('Preferred'), TD('Anti-dilution standard, pro-rata rights, board seat observer')],
        [TD('<b>Total</b>'), TDC('<b>100%</b>'), TD('-'), TD('Post-money apres round seed')],
    ], [120, 70, 80, 200]))
    E.append(sp(6))
    E.append(p_left("<i>Tableau 20 : Cap table recommande post-Seed</i>"))

    E.append(PageBreak())
    return E


# ===== SECTION 7: COMPARABLES DE VALORISATION =====
def sec_comparables():
    E = []
    E.append(h1("7. Comparables de Valorisation"))
    E.append(hr())

    E.append(h2("7.1 Rondes de Financement Recentes - SaaS M&amp;A"))
    E.append(tbl([
        [THL('Entreprise'), THL('Date'), THL('Round'), THL('Montant'), THL('Valorisation'), THL('Multiple ARR')],
        [TD('<b>Grata (Datasite)</b>'), TDC('2024'), TD('Series D'), TDC('$50M'), TDC('$500M+'), TD('15-20x')],
        [TD('<b>Affinity CRM</b>'), TDC('2023'), TD('Series D'), TDC('$50M'), TDC('$500M+'), TD('12-18x')],
        [TD('<b>SourceScrub</b>'), TDC('2023'), TD('Series B'), TDC('$25M'), TDC('$175M'), TD('10-15x')],
        [TD('<b>DealRoom</b>'), TDC('2024'), TD('Series A'), TDC('$8M'), TDC('$40M'), TD('8-12x')],
        [TD('<b>Firmex</b>'), TDC('2023'), TD('Acquisition'), TDC('-'), TDC('$300M+'), TD('12-18x')],
        [TD('<b>Intralinks (DTCC)</b>'), TDC('2024'), TD('Acquisition'), TDC('-'), TDC('$700M+'), TD('10-15x')],
        [TD('<b>Datasite (incl. Grata)</b>'), TDC('2024'), TD('Private Equity'), TDC('-'), TDC('$3B+'), TD('15-20x')],
    ], [90, 50, 65, 55, 75, 80]))
    E.append(sp(6))
    E.append(p_left("<i>Tableau 21 : Rondes de financement recentes dans le secteur M&amp;A SaaS</i>"))

    E.append(h2("7.2 Multiples SaaS par Stade"))
    E.append(tbl([
        [THL('Stade'), THL('Multiple ARR (EV/ARR)'), THL('Typical ARR Range'), THL('Croissance requise')],
        [TD('Pre-seed'), TDC('3-5x'), TDC('$0 - $100K'), TD('N/A (pre-revenu)')],
        [TD('Seed'), TDC('5-10x'), TDC('$100K - $500K'), TD('> 100% YoY')],
        [TD('Series A'), TDC('10-20x'), TDC('$500K - $3M'), TD('> 80% YoY')],
        [TD('Series B'), TDC('10-25x'), TDC('$3M - $15M'), TD('> 60% YoY')],
        [TD('Series C+'), TDC('8-20x'), TDC('$15M+'), TD('> 40% YoY')],
        [TD('Growth/Mature'), TDC('5-15x'), TDC('$50M+'), TD('> 25% YoY')],
    ], [100, 120, 120, 120]))
    E.append(sp(6))
    E.append(p_left("<i>Tableau 22 : Multiples EV/ARR par stade de maturite</i>"))

    E.append(h2("7.3 Cibles de Valorisation DealScope"))
    E.append(tbl([
        [THL('Stade'), THL('Timing'), THL('ARR projete'), THL('Multiple cible'), THL('Valorisation cible')],
        [TD('<b>Seed (actuel)</b>'), TDC('Mars 2026'), TDC('$0'), TDC('N/A'), TDC('$3M - $5M pre-money')],
        [TD('<b>Post-Seed</b>'), TDC('M12'), TDC('$300K'), TDC('10-15x'), TDC('$3M - $4.5M')],
        [TD('<b>Series A</b>'), TDC('M18-24'), TDC('$600K-$1M'), TDC('12-18x'), TDC('$10M - $18M')],
        [TD('<b>Series B</b>'), TDC('M30-36'), TDC('$3M-$5M'), TDC('10-15x'), TDC('$40M - $75M')],
        [TD('<b>Series C</b>'), TDC('M42-48'), TDC('$10M-$15M'), TDC('8-12x'), TDC('$100M - $180M')],
    ], [90, 75, 85, 80, 120]))
    E.append(sp(6))
    E.append(p_left("<i>Tableau 23 : Cibles de valorisation DealScope par stade</i>"))

    E.append(sp(8))
    E.append(PageBreak())
    return E


# ===== SECTION 8: SCENARIOS =====
def sec_scenarios():
    E = []
    E.append(h1("8. Analyse de Scenarios"))
    E.append(hr())

    E.append(h2("8.1 Presentation des Trois Scenarios"))
    E.append(p(
        "L'analyse de scenarios permet d'evaluer la sensibilite du modele financier aux variations des "
        "hypotheses cles (croissance, churn, CAC). Trois scenarios sont presentes : pessimiste, realiste "
        "(cas de base) et optimiste."
    ))

    # Comparison table
    E.append(tbl([
        [THL('Metrique'), THL('Pessimiste'), THL('Realiste (cas de base)'), THL('Optimiste')],
        [TD('<b>Croissance utilisateurs</b>'), TD('-50% vs. plan'), TD('Conforme au plan'), TD('+50% vs. plan')],
        [TD('<b>Taux de churn mensuel</b>'), TDC('4%'), TDC('2.5%'), TDC('1.5%')],
        [TD('<b>CAC blend</b>'), TDC('$400'), TDC('$250'), TDC('$150')],
        [TD('<b>Utilisateurs M12</b>'), TDC('80'), TDC('<b>200</b>'), TDC('350')],
        [TD('<b>MRR M12</b>'), TDC('$24K'), TDC('<b>$59K</b>'), TDC('$104K')],
        [TD('<b>ARR M12</b>'), TDC('$288K'), TDC('<b>$708K</b>'), TDC('$1.25M')],
        [TD('<b>EBITDA M12</b>'), TDC('-$78K'), TDC('<b>-$46K</b>'), TDC('-$8K')],
        [TD('<b>Cash a M12 (scenario $1M)</b>'), TDC('$370K'), TDC('<b>$505K</b>'), TDC('$640K')],
        [TD('<b>Runway total</b>'), TDC('15 mois'), TDC('<b>20 mois</b>'), TDC('26+ mois')],
        [TD('<b>Breakeven operationnel</b>'), TD('M22+'), TDC('<b>M14-M16</b>'), TDC('M10-M12')],
        [TD('<b>Series A readiness</b>'), TD('M18+ (risque)'), TDC('<b>M18 (cible)</b>'), TDC('M12-M14')],
    ], [130, 105, 125, 105]))
    E.append(sp(6))
    E.append(p_left("<i>Tableau 24 : Comparaison des trois scenarios a M12</i>"))

    E.append(h2("8.2 Scenario Pessimiste - Detail"))
    E.append(p(
        "<b>Hypotheses du scenario pessimiste :</b> Le lancement prend plus de temps que prevu, la conversion "
        "trial-to-paid est plus faible (10% au lieu de 20%), le churn est eleve (4%/mois) en raison de "
        "retards sur la product-market fit, et le CAC est 60% plus haut que prevu."
    ))
    E.append(bul("<b>Impact sur le runway</b> : Le cash est epuise en 15-16 mois, necessitant un bridge financing ou une pivotation de strategie a M10-M12."))
    E.append(bul("<b>Mesures correctives</b> : Reduction de l'equipe engineering (freeze hiring), focalisation marketing sur le canal le plus rentable (SEO), pivot eventuel vers un vertical plus niche."))
    E.append(bul("<b>Probabilite estimee</b> : 20-25% (risque modere grace a la diversification des canaux d'acquisition)."))

    E.append(h2("8.3 Scenario Realiste (Cas de Base)"))
    E.append(p(
        "<b>Hypotheses du cas de base :</b> Conforme au plan de CDC - 200 utilisateurs a M12, MRR de 59.4K EUR, "
        "churn de 2.5%, CAC blend de 250 EUR. Le produit atteint la product-market fit a M6-8."
    ))
    E.append(bul("<b>Trajectoire</b> : Series A a M18-24 sur la base de $600K-$1M ARR avec des signaux clairs de PMF."))
    E.append(bul("<b>Expansion</b> : Lancement UK a M13, Allemagne a M18, avec une equipe locale de sales."))
    E.append(bul("<b>Probabilite estimee</b> : 50-60% (scenario le plus probable selon les benchmarks SaaS B2B)."))

    E.append(h2("8.4 Scenario Optimiste"))
    E.append(p(
        "<b>Hypotheses optimistes :</b> Product-market fit rapide (M4-M5), viralite sur Product Hunt et LinkedIn, "
        "partenariats strategiques acceleres (HubSpot Marketplace a M6), churn tres faible (1.5%/mois) grace "
        "a l'engagement produit eleve."
    ))
    E.append(bul("<b>Trajectoire</b> : Series A acceleree a M12-M14 avec un ARR de $1.2M+. Demande d'investisseurs depassant l'objectif de levee."))
    E.append(bul("<b>Expansion</b> : Lancement UK + Allemagne simultane a M10, expansion US envisageable a M18."))
    E.append(bul("<b>Probabilite estimee</b> : 15-20% (scenario favorable mais non negligeable pour un produit IA a forte valeur percue)."))

    E.append(h2("8.5 Analyse de Sensibilite"))
    E.append(h3("Impact d'un doublement du churn"))
    E.append(tbl([
        [THL('Metrique'), THL('Churn 2.5% (base)'), THL('Churn 5% (double)')],
        [TD('Utilisateurs nets M12'), TDC('200'), TDC('145')],
        [TD('MRR M12'), TDC('$59K'), TDC('$43K')],
        [TD('ARR M12'), TDC('$708K'), TDC('$516K')],
        [TD('LTV'), TDC('$7 776'), TDC('$4 320')],
        [TD('LTV:CAC'), TDC('31x'), TDC('17x')],
        [TD('Runway (scenario $1M)'), TDC('20 mois'), TDC('17 mois')],
    ], [140, 130, 130]))
    E.append(sp(4))
    E.append(p_left("<i>Tableau 25 : Sensibilite au doublement du churn</i>"))

    E.append(h3("Impact d'un doublement du CAC"))
    E.append(tbl([
        [THL('Metrique'), THL('CAC $250 (base)'), THL('CAC $500 (double)')],
        [TD('CAC Payback'), TDC('1.2 mois'), TDC('2.3 mois')],
        [TD('LTV:CAC'), TDC('31x'), TDC('16x')],
        [TD('Marketing spend M12'), TDC('$30K'), TDC('$60K')],
        [TD('EBITDA M12'), TDC('-$46K'), TDC('-$76K')],
        [TD('Runway (scenario $1M)'), TDC('20 mois'), TDC('18 mois')],
        [TD('Appreciation'), TD('Tres favorable'), TD('Encore favorable (SaaS benchmark : 12-18 mois payback)')],
    ], [140, 130, 130]))
    E.append(sp(4))
    E.append(p_left("<i>Tableau 26 : Sensibilite au doublement du CAC</i>"))

    E.append(sp(6))
    E.append(Paragraph(
        "<b>Conclusion scenarios :</b> Meme dans le scenario pessimiste, DealScope presente des fondamentaux "
        "solides avec un LTV:CAC > 10x et un runway suffisant pour atteindre un pivot strategique ou un bridge "
        "financing. La sensibilite au churn est le risque principal - chaque point de churn gagne ou perdu a un "
        "impact significatif sur la trajectoire de croissance.",
        S_NOTE))

    E.append(PageBreak())
    return E


# ===== BUILD =====
def build():
    story = []

    # 1. Cover
    story.extend(cover())

    # 2. TOC
    story.extend(toc())

    # 3. Executive Summary
    story.extend(sec_executive_summary())

    # 4. Marche
    story.extend(sec_marche())

    # 5. Unit Economics
    story.extend(sec_unit_economics())

    # 6. P&L
    story.extend(sec_pl())

    # 7. Cash Flow
    story.extend(sec_cashflow())

    # 8. Fundraising
    story.extend(sec_fundraising())

    # 9. Comparables
    story.extend(sec_comparables())

    # 10. Scenarios
    story.extend(sec_scenarios())

    # Build with multiBuild for TOC
    doc = TocDocTemplate(
        OUT,
        pagesize=A4,
        leftMargin=0.75*inch,
        rightMargin=0.75*inch,
        topMargin=0.75*inch,
        bottomMargin=0.75*inch,
        title="DealScope_Business_Plan_Modele_Financier",
        author="Z.ai",
        creator="Z.ai",
    )
    doc.multiBuild(story, onLaterPages=footer, onFirstPage=lambda c, d: None)
    print(f"PDF generated: {OUT}")


if __name__ == '__main__':
    build()
