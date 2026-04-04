#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""DealScope - Go-to-Market & Strategie de Lancement - PDF Generator v1.0"""

import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch, cm
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY, TA_RIGHT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle, HRFlowable, KeepTogether
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

# ===== OUTPUT =====
OUT = '/home/z/my-project/download/DealScope_Go_To_Market_Strategie_Lancement.pdf'

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
S_NOTE = ParagraphStyle('Note', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=9.5, leading=13, textColor=colors.HexColor('#336699'), leftIndent=15, spaceAfter=8, backColor=colors.HexColor('#F0F6FF'), borderPadding=6)
S_SMALL = ParagraphStyle('Small', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=8.5, leading=11, textColor=C_GRAY, alignment=TA_LEFT, spaceAfter=3)

# Cover styles
S_COVER_TITLE = ParagraphStyle('CoverTitle', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=32, leading=40, textColor=C_DARK, alignment=TA_CENTER, spaceAfter=12)
S_COVER_SUB = ParagraphStyle('CoverSub', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=16, leading=22, textColor=C_GOLD, alignment=TA_CENTER, spaceAfter=10)
S_COVER_INFO = ParagraphStyle('CoverInfo', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=12, leading=18, textColor=C_GRAY, alignment=TA_CENTER, spaceAfter=6)

# KPI box style
S_KPI = ParagraphStyle('KPI', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=20, leading=26, textColor=C_DARK, alignment=TA_CENTER)
S_KPI_LABEL = ParagraphStyle('KPILabel', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=9, leading=12, textColor=C_GRAY, alignment=TA_CENTER)


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


# ===== PAGE FOOTER =====
def footer(canvas, doc):
    canvas.saveState()
    canvas.setFont('TimesNewRoman', 8)
    canvas.setFillColor(C_GRAY)
    canvas.drawCentredString(A4[0]/2, 0.5*inch, "DealScope - Go-to-Market & Strategie de Lancement  |  Page %d" % doc.page)
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
    E.append(Paragraph("<b>Go-to-Market &amp;</b>", S_COVER_TITLE))
    E.append(Paragraph("<b>Strategie de Lancement</b>", S_COVER_TITLE))
    E.append(sp(12))
    E.append(HRFlowable(width="40%", color=C_MED, thickness=1.5, spaceBefore=10, spaceAfter=20))
    E.append(Paragraph("Plateforme SaaS M&amp;A Intelligence", S_COVER_SUB))
    E.append(sp(40))
    E.append(Paragraph("<b>Version 1.0 - Mars 2026</b>", S_COVER_INFO))
    E.append(sp(8))
    E.append(Paragraph("<b>Z.ai</b>", S_COVER_INFO))
    E.append(sp(30))
    E.append(HRFlowable(width="60%", color=C_DARK, thickness=3, spaceBefore=20, spaceAfter=20))
    E.append(sp(40))
    E.append(Paragraph("CONFIDENTIEL - Document strategique a usage interne de DealScope SAS.", ParagraphStyle('Conf', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=9, leading=12, textColor=C_GRAY, alignment=TA_CENTER)))
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


# ===== SECTION 3: POSITIONNEMENT & MESSAGE CLE =====
def sec_positionnement():
    E = []
    E.append(h1("3. Positionnement & Message Cle"))
    E.append(hr())

    # 3.1 Elevator Pitch
    E.append(h2("3.1 Elevator Pitch"))
    E.append(h3("Version Francaise"))
    E.append(p(
        "<b>DealScope</b> est la premiere plateforme d'intelligence M&amp;A propulsee par l'IA, concue specifiquement "
        "pour les equipes mid-market. Nos 5 agents IA orchestrent en continu le sourcing de deals, l'analyse OSINT "
        "et la qualification automatique des cibles - remplacant des semaines de recherche manuelle par des resultats "
        "actionnables en quelques minutes, a une fraction du cout des solutions enterprise."
    ))
    E.append(h3("Version Anglaise"))
    E.append(p(
        "<b>DealScope</b> is the first AI-native M&amp;A intelligence platform purpose-built for mid-market teams. "
        "Our 5 orchestrated AI agents continuously source deals, run OSINT analysis, and auto-qualify targets - "
        "replacing weeks of manual research with actionable results in minutes, at a fraction of enterprise pricing."
    ))

    # 3.2 Value Proposition par Persona
    E.append(h2("3.2 Proposition de Valeur par Persona"))
    E.append(tbl([
        [THL('Persona'), THL('Probleme cle (Pain Point)'), THL('Reponse DealScope')],
        [TD('<b>Analyste M&amp;A</b>'),
         TD('Passe 70% de son temps sur la recherche manuelle de cibles, la collecte de donnees eparses et la creation de rapports repetitifs. Frustration face aux outils trop chers ou mal adaptes.'),
         TD('Agents IA qui automatisent la recherche OSINT, enrichissent les donnees en temps reel et generent des rapports d\'analyse pre-formats. Gain de temps de 60-80% sur les taches de sourcing.')],
        [TD('<b>Directeur CorpDev</b>'),
         TD('Visibilite limitee sur le pipeline de cibles, dependance aux mandats bancaires exclusifs, difficulte a identifier les cibles off-market avant les concurrents.'),
         TD('Veille continue 24/7 sur les signaux d\'acquisition, alertes personnalisees sur les entreprises correspondant au profil strategique, dashboard unifie du pipeline.')],
        [TD('<b>Partner PE/VC</b>'),
         TD('Volume insuffisant de deals qualifies, processus de screening trop lent, manque de donnees sur le mid-market non couvert par PitchBook/CapIQ.'),
         TD('Scanning automatique de milliers d\'entreprises selon des criteres ICP multi-dimensionnels, scoring predictif des targets, identification de deals off-market.')],
        [TD('<b>Consultant independant</b>'),
         TD('Budget limite ne permettant pas d\'acceder aux outils enterprise ($12K-$80K/an), outils gratuits trop basiques, besoin de credibilite face aux clients.'),
         TD('Acces abordable ($99/mo) avec fonctionnalites professionnelles, rapports exportables avec branding, donnees de qualite comparables aux solutions enterprise.')],
    ], [90, 180, 210]))
    E.append(sp(6))
    E.append(p_left("<i>Tableau 1 : Proposition de valeur par persona cible</i>"))

    # 3.3 Positioning Statement
    E.append(h2("3.3 Positioning Statement"))
    E.append(sp(4))
    E.append(Paragraph(
        "\"<b>Pour</b> les equipes M&amp;A, CorpDev et PE/VC du mid-market ($10M-$500M CA) <b>qui</b> cherchent a identifier, "
        "analyser et qualifier des cibles d\'acquisition rapidement et a cout maitrise, <b>DealScope est une</b> plateforme "
        "SaaS d\'intelligence M&amp;A propulsee par l\'IA <b>qui</b> automatise le sourcing de deals via 5 agents IA orchestres, "
        "enrichit les donnees en temps reel et delivre des insights actionnables. <b>Contrairement a</b> PitchBook, "
        "Capital IQ ou Grata, <b>nous</b> offrons un acces abordable ($99-$499/mo), une specialisation mid-market "
        "et une architecture AI-native qui elimine les taches manuelles de recherche.\"",
        ParagraphStyle('Pos', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=10.5, leading=16,
                       textColor=C_DARK, alignment=TA_JUSTIFY, spaceAfter=6, spaceBefore=2,
                       leftIndent=20, rightIndent=20, backColor=colors.HexColor('#F0F6FF'), borderPadding=10)
    ))

    # 3.4 Anti-Positioning
    E.append(h2("3.4 Anti-Positionnement : Ce que DealScope n'est PAS"))
    E.append(p("Pour eviter toute confusion dans le marche, il est essentiel de definir clairement ce que DealScope ne propose pas :"))
    E.append(bul("<b>Pas une VDR (Virtual Data Room)</b> : DealScope ne remplace pas les outils comme Datasite ou Intralinks pour la gestion de la due diligence documentaire. Nous intervenons en amont, dans la phase de sourcing et d'analyse."))
    E.append(bul("<b>Pas un outil de modelisation financiere</b> : DealScope ne concurrence pas des outils comme AlphaSights, Visible Alpha ou les modeles Excel de valuation. Notre focus est l'intelligence de marche et le sourcing."))
    E.append(bul("<b>Pas destine aux mega-deals enterprise</b> : DealScope cible specifiquement le mid-market ($10M-$500M CA). Les transactions de plus de $1Md restent mieux servies par des solutions comme PitchBook/CapIQ avec leurs bases de donnees historiques."))
    E.append(bul("<b>Pas un CRM generique</b> : DealScope intègre un pipeline M&amp;A specialise, mais ne remplace pas Salesforce ou HubSpot pour la gestion de la relation client globale."))
    E.append(bul("<b>Pas une plateforme de trading ou de brokerage</b> : DealScope fournit de l'intelligence et des outils d'analyse, mais n'execute aucune transaction ni ne prend de mandats de vente."))

    # 3.5 Brand Voice Guidelines
    E.append(h2("3.5 Directives de Ton de Marque (Brand Voice)"))
    E.append(tbl([
        [THL('Attribut'), THL('Description'), THL('Exemple')],
        [TD('<b>Expert & Credible</b>'), TD('Tone professionnel, donnees a l\'appui, langage technique maitrise mais accessible'), TD('"Nos agents IA analysent 15+ sources de donnees en temps reel pour une qualification en 48h."')],
        [TD('<b>Innovant & Audacieux</b>'), TD('Positionnement de leader technologique, vocabulaire moderne, metaphores de performance'), TD('"L\'IA-native revolutionne le sourcing M&amp;A - des semaines de recherche condensees en minutes."')],
        [TD('<b>Accessible & Humain</b>'), TD('Eviter le jargon excessif, demonstrations par l\'exemple, empathie pour les frustrations'), TD('"On sait que le sourcing manuel, c\'est des nuits blanches. On a automatise ca."')],
        [TD('<b>Orient&eacute; Resultat</b>'), TD('Chaque message doit repondre a : quel gain concret pour l\'utilisateur ?'), TD('"+60% de deals qualifies, -80% de temps de recherche, 10x ROI sur votre abonnement."')],
        [TD('<b>Franc & Transparent</b>'), TD('Pas de surpromesses, limites clairement communiquees, pricing transparent'), TD('"Pas de frais caches, pas d\'engagement annuel obligatoire. Testez 14 jours gratuitement."')],
    ], [95, 195, 190]))
    E.append(sp(6))
    E.append(p_left("<i>Tableau 2 : Directives de ton de marque DealScope</i>"))
    E.append(PageBreak())
    return E


# ===== SECTION 4: STRATEGIE DE PRICING DETAILLEE =====
def sec_pricing():
    E = []
    E.append(h1("4. Strategie de Pricing Detaillee"))
    E.append(hr())

    # 4.1 Analyse des Tiers
    E.append(h2("4.1 Analyse des Tiers Tarifaires"))
    E.append(tbl([
        [TH('Plan'), TH('Prix/mois'), TH('Utilisateurs'), TH('Profils ICP'), TH('Entreprises'), TH('Scans/mois'), TH('API Calls/mois')],
        [TD('<b>Starter</b>'), TD('$99', True), TD('3', True), TD('3', True), TD('500', True), TD('10', True), TD('1 000', True)],
        [TD('<b>Pro</b>'), TD('$299', True), TD('10', True), TD('10', True), TD('2 500', True), TD('50', True), TD('5 000', True)],
        [TD('<b>Business</b>'), TD('$499', True), TD('25', True), TD('25', True), TD('10 000', True), TD('Illimite', True), TD('15 000', True)],
        [TD('<b>Enterprise</b>'), TD('Sur devis', True), TD('Illimite', True), TD('Illimite', True), TD('Illimite', True), TD('Illimite', True), TD('Sur devis', True)],
    ], [65, 60, 65, 60, 70, 70, 70]))
    E.append(sp(6))
    E.append(p_left("<i>Tableau 3 : Tiers tarifaires DealScope</i>"))

    # 4.2 Analyse Cout-Plus
    E.append(h2("4.2 Analyse Cout-Plus par Tier"))
    E.append(p("L'analyse cout-plus permet de verifier la marge brute par tier en tenant compte des couts d'infrastructure, d'API et de support :"))
    E.append(tbl([
        [THL('Element de cout'), THL('Starter ($99)'), THL('Pro ($299)'), THL('Business ($499)'), THL('Enterprise')],
        [TD('Cout API (Apollo, Crunchbase, etc.)'), TD('$8-12'), TD('$25-40'), TD('$50-80'), TD('Variable')],
        [TD('Cout infrastructure (AWS/Compute)'), TD('$5'), TD('$12'), TD('$25'), TD('Dedie')],
        [TD('Cout AI (LLM, embedding)'), TD('$3-5'), TD('$10-15'), TD('$20-30'), TD('Volume')],
        [TD('Cout support (estime)'), TD('$2'), TD('$8'), TD('$15'), TD('Dedie')],
        [TD('<b>Cout total estime</b>'), TD('<b>$18-24</b>'), TD('<b>$55-75</b>'), TD('<b>$110-150</b>'), TD('Variable')],
        [TD('<b>Marge brute</b>'), TD('<b>76-82%</b>'), TD('<b>75-82%</b>'), TD('<b>70-78%</b>'), TD('70-80%')],
    ], [145, 80, 80, 80, 80]))
    E.append(sp(6))
    E.append(p_left("<i>Tableau 4 : Analyse cout-plus par tier</i>"))

    # 4.3 Comparaison Concurrentielle
    E.append(h2("4.3 Comparaison Concurrentielle des Prix"))
    E.append(tbl([
        [THL('Solution'), THL('Prix annuel'), THL('Segment'), THL('Fonctionnalites IA'), THL('Avantage DealScope')],
        [TD('<b>DealScope Starter</b>'), TD('$1 188/an'), TD('Mid-market'), TD('IA-native (5 agents)'), TD('80x moins cher, IA-native')],
        [TD('<b>DealScope Pro</b>'), TD('$3 588/an'), TD('Mid-market'), TD('IA-native (5 agents)'), TD('30x moins cher, fonctionnalites avancees')],
        [TD('<b>PitchBook</b>'), TD('$12 000-$27 000/an'), TD('Enterprise'), TD('Limitee'), TD('Prix 10-20x, pas IA-native')],
        [TD('<b>Capital IQ</b>'), TD('$20 000-$80 000/an'), TD('Enterprise'), TD('Limitee'), TD('Prix 40-70x, complexe')],
        [TD('<b>Grata (Datasite)</b>'), TD('$15 000-$40 000/an'), TD('Upper mid'), TD('En integration'), TD('Prix 10-30x, integration en cours')],
        [TD('<b>Affinity</b>'), TD('$18 000-$60 000/an'), TD('Enterprise'), TD('CRM+IA basique'), TD('Prix 15-50x, CRM pas M&amp;A-specifique')],
        [TD('<b>SourceScrub</b>'), TD('$8 000-$15 000/an'), TD('Mid/Upper'), TD('Aucune'), TD('Prix 8-15x, aucune IA')],
        [TD('<b>Conceptor.ai</b>'), TD('$500-$2 000/an'), TD('Startup'), TD('IA generative'), TD('Meme prix, mais plus specialise')],
    ], [90, 90, 70, 80, 130]))
    E.append(sp(6))
    E.append(p_left("<i>Tableau 5 : Comparaison des prix avec les concurrents</i>"))

    # 4.4 Strategie de Facturation Annuelle
    E.append(h2("4.4 Strategie de Facturation Annuelle"))
    E.append(bul("<b>Remise de 20% sur la facturation annuelle</b> : Starter a $79/mo (au lieu de $99), Pro a $239/mo, Business a $399/mo."))
    E.append(bul("<b>Equivalent 2 mois gratuits</b> : Communication marketing orientee sur \"2 mois offerts\" plutot que \"20% de remise\" - plus impactant psychologiquement."))
    E.append(bul("<b>Objectif de conversion annual billing</b> : 40% des utilisateurs sur facturation annuelle a M12 (mesure par metric ARR/Annualized MRR)."))
    E.append(bul("<b>Lock-in doux</b> : Engagement annuel reduit le churn, ameliore la predictibilite du revenu et augmente la LTV de 1.6x en moyenne."))

    # 4.5 Ramp Strategy
    E.append(h2("4.5 Strategie de Montee en Gamme (Ramp)"))
    E.append(p("La strategie de ramp vise a faire evoluer naturellement les utilisateurs vers les tiers superieurs :"))
    E.append(bul("<b>Trigger de montee Starter vers Pro</b> : When un utilisateur atteint 80% de ses limites de profils ICP ou d'entreprises sur 2 mois consecutifs. Email automatique + in-app notification."))
    E.append(bul("<b>Trigger Pro vers Business</b> : Quand le nombre d'utilisateurs dans le workspace depasse 7 ou que les scans mensuels approchent la limite. Demo personnalisee proposee."))
    E.append(bul("<b>Trigger vers Enterprise</b> : Quand un workspace Business depasse 20 utilisateurs ou demande des integrations sur mesure. Transition vers un Account Executive dedie."))
    E.append(bul("<b>Feature-gating intelligent</b> : Montrer les fonctionnalites des tiers superieurs dans le produit (greyed-out) pour creer le desir d'upgrade."))

    # 4.6 Expansion Revenue
    E.append(h2("4.6 Objectifs de Revenu d'Expansion"))
    E.append(p("L'expansion revenue est le moteur de croissance le plus rentable pour un SaaS B2B. Les objectifs sont :"))
    E.append(bul("<b>Net Revenue Retention (NRR)</b> : Objectif 110-130% a M12. Cela signifie que l'entreprise gagne 10-30% de revenu supplementaire aupres de sa base existante (expansion - churn)."))
    E.append(bul("<b>Gross Revenue Retention (GRR)</b> : Objectif > 92%. Mesure le pourcentage de revenu retenu sans compter l'expansion."))
    E.append(bul("<b>Upsell rate</b> : Objectif 15-20% des comptes actifs effectuent un upgrade de tier par an."))
    E.append(bul("<b>Expansion path</b> : Upgrade de tier + ajout de licences + credits API supplementaires + modules premium futurs (integration CRM avancee, rapports personnalises)."))

    # 4.7 Credit System
    E.append(h2("4.7 Systeme de Credits pour Utilisateurs Intensifs"))
    E.append(p("Pour les utilisateurs avec des besoins en API depassant les limites de leur tier, un systeme de credits est mis en place :"))
    E.append(bul("<b>1 credit = 1 appel API standard</b> (enrichissement de donnees, verification email, etc.)"))
    E.append(bul("<b>Packs de credits</b> : 5 000 credits pour $25, 25 000 credits pour $100, 100 000 credits pour $350."))
    E.append(bul("<b>Volume discount</b> : Les packs de credits offrent jusqu'a 30% de reduction par rapport au pay-per-use."))
    E.append(bul("<b>Enterprise</b> : Forfait API illimite inclus dans le contrat Enterprise sur devis."))

    # 4.8 Free Trial
    E.append(h2("4.8 Essai Gratuit et Vente par Demo"))
    E.append(tbl([
        [THL('Element'), THL('Details')],
        [TD('<b>Duree de l\'essai</b>'), TD('14 jours complets (pas de week-end exclus)')],
        [TD('<b>Carte bancaire requise</b>'), TD('Non - reduction de la friction a l\'inscription, conversion plus qualitative')],
        [TD('<b>Fonctionnalites incluses</b>'), TD('Acces complet au plan Pro pendant 14 jours (5 profils ICP, 1 000 entreprises)')],
        [TD('<b>Onboarding guide</b>'), TD('Emails sequentielles (J1, J3, J7, J12) + check-list in-app + template ICP pre-rempli')],
        [TD('<b>Objectif d\'activation</b>'), TD('Utilisateur cree au moins 1 profil ICP + lance 1 scan dans les 48h')],
        [TD('<b>Sale demo (Enterprise)</b>'), TD('Demo personnalisee par un Account Executive, POC de 30 jours, contrat sur mesure')],
    ], [145, 335]))
    E.append(sp(6))
    E.append(p_left("<i>Tableau 6 : Parametres de l'essai gratuit et vente par demo</i>"))
    E.append(PageBreak())
    return E


# ===== SECTION 5: CANAUX D'ACQUISITION =====
def sec_canaux():
    E = []
    E.append(h1("5. Canaux d'Acquisition"))
    E.append(hr())

    # 5.1 SEO Strategy
    E.append(h2("5.1 Strategie SEO"))

    E.append(h3("5.1.1 Mots-cles Cibles"))
    E.append(p("La strategie SEO repose sur le ciblage de 3 categories de mots-cles. Le tableau ci-dessous presente les 55+ mots-cles principaux :"))
    E.append(tbl([
        [THL('Mot-cle'), THL('Volume/mois (estime)'), THL('Difficulte'), THL('Priorite')],
        [TD('M&A software'), TD('2 400', True), TD('Moyenne', True), TD('Haute')],
        [TD('M&A intelligence platform'), TD('880', True), TD('Elevee', True), TD('Haute')],
        [TD('deal sourcing software'), TD('1 300', True), TD('Moyenne', True), TD('Haute')],
        [TD('M&A deal sourcing tools'), TD('720', True), TD('Moyenne', True), TD('Haute')],
        [TD('private equity deal sourcing'), TD('1 600', True), TD('Moyenne', True), TD('Haute')],
        [TD('M&A target identification'), TD('480', True), TD('Faible', True), TD('Haute')],
        [TD('company acquisition search'), TD('590', True), TD('Faible', True), TD('Haute')],
        [TD('M&A CRM software'), TD('390', True), TD('Moyenne', True), TD('Moyenne')],
        [TD('deal pipeline management'), TD('1 000', True), TD('Moyenne', True), TD('Moyenne')],
        [TD('M&A due diligence tools'), TD('1 100', True), TD('Elevee', True), TD('Moyenne')],
        [TD('PitchBook alternative'), TD('720', True), TD('Faible', True), TD('Moyenne')],
        [TD('Capital IQ alternative'), TD('480', True), TD('Faible', True), TD('Moyenne')],
        [TD('Grata alternative'), TD('210', True), TD('Faible', True), TD('Moyenne')],
        [TD('SourceScrub alternative'), TD('170', True), TD('Faible', True), TD('Moyenne')],
        [TD('M&A data providers'), TD('590', True), TD('Elevee', True), TD('Moyenne')],
        [TD('OSINT for M&A'), TD('140', True), TD('Faible', True), TD('Haute')],
        [TD('AI for mergers and acquisitions'), TD('720', True), TD('Moyenne', True), TD('Haute')],
        [TD('AI deal sourcing'), TD('310', True), TD('Faible', True), TD('Haute')],
        [TD('automated deal screening'), TD('210', True), TD('Faible', True), TD('Haute')],
        [TD('company research automation'), TD('480', True), TD('Moyenne', True), TD('Moyenne')],
        [TD('ideal customer profile M&A'), TD('260', True), TD('Faible', True), TD('Haute')],
        [TD('mid-market M&A software'), TD('170', True), TD('Faible', True), TD('Haute')],
        [TD('startup acquisition intelligence'), TD('140', True), TD('Faible', True), TD('Moyenne')],
        [TD('SaaS company valuation tool'), TD('1 000', True), TD('Elevee', True), TD('Moyenne')],
        [TD('business acquisition finder'), TD('880', True), TD('Moyenne', True), TD('Haute')],
        [TD('M&A workflow automation'), TD('170', True), TD('Faible', True), TD('Haute')],
        [TD('corporate development tools'), TD('590', True), TD('Moyenne', True), TD('Moyenne')],
        [TD('PE deal flow management'), TD('210', True), TD('Faible', True), TD('Haute')],
        [TD('M&A analytics dashboard'), TD('140', True), TD('Faible', True), TD('Moyenne')],
        [TD('buy and build strategy tool'), TD('110', True), TD('Faible', True), TD('Moyenne')],
        [TD('sell-side M&A preparation'), TD('260', True), TD('Moyenne', True), TD('Moyenne')],
        [TD('how to source M&A deals'), TD('720', True), TD('Faible', True), TD('Haute')],
        [TD('best M&A databases'), TD('480', True), TD('Moyenne', True), TD('Moyenne')],
        [TD('M&A software comparison'), TD('310', True), TD('Moyenne', True), TD('Haute')],
        [TD('cheap PitchBook alternative'), TD('140', True), TD('Faible', True), TD('Haute')],
        [TD('M&A software for small firms'), TD('170', True), TD('Faible', True), TD('Haute')],
        [TD('AI business intelligence M&A'), TD('210', True), TD('Faible', True), TD('Haute')],
        [TD('deal origination platform'), TD('170', True), TD('Moyenne', True), TD('Moyenne')],
        [TD('M&A signal detection'), TD('90', True), TD('Faible', True), TD('Haute')],
        [TD('company growth signals M&A'), TD('110', True), TD('Faible', True), TD('Haute')],
        [TD('tech stack analysis M&A'), TD('70', True), TD('Faible', True), TD('Moyenne')],
        [TD('M&A contact finder'), TD('140', True), TD('Faible', True), TD('Haute')],
        [TD('business owner email finder'), TD('2 400', True), TD('Elevee', True), TD('Moyenne')],
        [TD('B2B contact enrichment'), TD('1 300', True), TD('Elevee', True), TD('Moyenne')],
        [TD('company financial data API'), TD('480', True), TD('Moyenne', True), TD('Moyenne')],
        [TD('M&A market trends 2026'), TD('590', True), TD('Faible', True), TD('Haute')],
        [TD('mid-market M&A trends'), TD('260', True), TD('Faible', True), TD('Haute')],
        [TD('fintech M&A landscape'), TD('480', True), TD('Moyenne', True), TD('Moyenne')],
        [TD('SaaS acquisition multiples'), TD('720', True), TD('Moyenne', True), TD('Haute')],
        [TD('tech company valuation methods'), TD('1 100', True), TD('Elevee', True), TD('Moyenne')],
        [TD('M&A process step by step'), TD('1 600', True), TD('Moyenne', True), TD('Moyenne')],
    ], [175, 100, 75, 60]))
    E.append(sp(6))
    E.append(p_left("<i>Tableau 7 : Mots-cles SEO cibles (55+ termes)</i>"))

    # 5.1.2 Content Clusters
    E.append(h3("5.1.2 Clusters de Contenu SEO"))
    E.append(tbl([
        [THL('Cluster'), THL('Pillar Content'), THL('Sous-contenus (5-8 par cluster)')],
        [TD('<b>M&amp;A Intelligence</b>'),
         TD('Guide complet du sourcing M&amp;A (3 000+ mots)'),
         TD('OSINT pour M&amp;A / Signaux d\'acquisition / Analyse technographique / Veille concurrentielle / Profilage ICP / M&A data enrichment / Screening automatique / Benchmarking tools')],
        [TD('<b>Deal Sourcing</b>'),
         TD('Comment trouver des cibles M&amp;A (2 500+ mots)'),
         TD('Deal sourcing PE / Origination corporate / Off-market deals / Sourcing inbound / Networking M&A / Deal flow CRM / Sourcing automation / Build vs buy analysis')],
        [TD('<b>Outils M&amp;A</b>'),
         TD('Comparatif M&amp;A Software 2026 (2 000+ mots)'),
         TD('PitchBook vs DealScope / Grata alternative / CapIQ pricing / SourceScrub review / Affinity CRM / M&A databases comparison / Free M&A tools / Budget-friendly solutions')],
        [TD('<b>IA &amp; M&amp;A</b>'),
         TD('L\'IA dans les fusions et acquisitions (2 500+ mots)'),
         TD('AI deal screening / NLP for M&A / Predictive acquisition / AI company analysis / LangGraph orchestration / AI market intelligence / Generative AI reports / Future of M&A tech')],
        [TD('<b>Valuation SaaS</b>'),
         TD('Guide valuation entreprises SaaS (3 000+ mots)'),
         TD('SaaS multiples 2026 / ARR valuation / Revenue multiples / Tech company valuation / M&A due diligence checklist / Financial modeling basics / Valuation by sector / Term sheet essentials')],
    ], [90, 140, 250]))
    E.append(sp(6))
    E.append(p_left("<i>Tableau 8 : Clusters de contenu SEO</i>"))

    # 5.1.3 Calendrier Mensuel
    E.append(h3("5.1.3 Calendrier de Contenu Mensuel (Template)"))
    E.append(tbl([
        [THL('Semaine'), THL('Type de contenu'), THL('Canal'), THL('Objectif')],
        [TD('Semaine 1'), TD('Article blog long (pillar ou sous-contenu)'), TD('Blog + SEO'), TD('Traffic organique, autorite')],
        [TD('Semaine 2'), TD('Guide pratique / Template telechargeable'), TD('Blog + Lead magnet'), TD('Generation de leads')],
        [TD('Semaine 3'), TD('Post LinkedIn / Thread X'), TD('Social media'), TD('Engagement, brand awareness')],
        [TD('Semaine 4'), TD('Etude de cas / Webinaire / Newsletter'), TD('Email + Webinaire'), TD('Conversion, nurturing')],
    ], [70, 190, 100, 120]))
    E.append(sp(6))

    # 5.2 Content Marketing
    E.append(h2("5.2 Content Marketing"))

    E.append(h3("5.2.1 Types de Contenu"))
    E.append(tbl([
        [THL('Format'), THL('Frequence'), THL('Objectif'), THL('KPI')],
        [TD('<b>Articles de blog</b>'), TD('4-8/mois'), TD('SEO, thought leadership'), TD('Sessions organiques, backlinks')],
        [TD('<b>Livres blancs / Ebooks</b>'), TD('1/trimestre'), TD('Lead generation (gate)'), TD('Downloads, MQLs')],
        [TD('<b>Etudes de cas</b>'), TD('1-2/mois (apres M6)'), TD('Social proof, conversion'), TD('Influence sur trial-to-paid')],
        [TD('<b>Webinaires</b>'), TD('1/mois (apres M4)'), TD('Nurturing, demo'), TD('Inscriptions, SQLs')],
        [TD('<b>YouTube / Video</b>'), TD('2-4/mois'), TD('Top of funnel, brand'), TD('Vues, abonnes, watch time')],
        [TD('<b>Newsletter</b>'), TD('Hebdomadaire'), TD('Retention, engagement'), TD('Open rate, CTR')],
        [TD('<b>Templates / Outils</b>'), TD('1/mois'), TD('Lead magnet, virality'), TD('Downloads, shares')],
    ], [110, 70, 130, 160]))
    E.append(sp(6))

    E.append(h3("5.2.2 Strategie de Distribution"))
    E.append(bul("<b>Owned media</b> : Blog, newsletter, site web, app. Priorite maximale - tout contenu y est publie en premier."))
    E.append(bul("<b>Social media</b> : LinkedIn (principal), X/Twitter (communaute tech/VC), YouTube (demo videos)."))
    E.append(bul("<b>Earned media</b> : Guest posting, PR, citations dans la presse M&amp;A/fintech, podcasts."))
    E.append(bul("<b>Community</b> : Reddit, Slack communities, Discord, Product Hunt."))
    E.append(bul("<b>Paid amplification</b> : Boost des meilleurs articles performants ($500-1000/mois)."))

    E.append(h3("5.2.3 Cibles Guest Posting"))
    E.append(bul("<b>M&amp;A / Finance</b> : Mergermarket, PitchBook News, Axios Pro Rata, PE Hub, M&amp;A Science, Midas Letter."))
    E.append(bul("<b>Fintech / SaaS</b> : TechCrunch, SaaStr, First Round Review, Andreessen Horowitz blog, Bessemer Cloud Index."))
    E.append(bul("<b>VC / PE</b> : VC Cafe, Above the Crowd (Bill Gurley), Morgan Creek Capital, Harvard Business Review."))
    E.append(bul("<b>IA / Tech</b> : Towards Data Science, The Gradient, AI News, LangChain blog."))
    E.append(bul("<b>Francophones</b> : Maddyness, FrenchWeb, Les Echos, Sia Partners, Station F blog."))

    # 5.3 LinkedIn Strategy
    E.append(h2("5.3 Strategie LinkedIn"))

    E.append(h3("5.3.1 Personal Branding des Fondateurs"))
    E.append(bul("<b>CEO</b> : 3-5 posts/semaine sur la vision AI + M&amp;A, tendances du marche, lecons de construction startup. Objectif : 5 000 followers a M12."))
    E.append(bul("<b>CTO</b> : 2-3 posts/semaine sur la tech (LangGraph, AI agents), architecture, engineering. Objectif : 3 000 followers a M12."))
    E.append(bul("<b>Content mix</b> : 40% valeur (insights M&amp;A), 30% product (demos, features), 20% building in public, 10% culture/team."))

    E.append(h3("5.3.2 LinkedIn Ads"))
    E.append(tbl([
        [THL('Cible'), THL('Criteria'), THL('Budget/mois'), THL('Creative'), THL('CPA cible')],
        [TD('Analyste M&amp;A'), TD('Titre + secteur + taille entreprise'), TD('$500-1 000'), TD('Carrousel probleme/solution'), TD('$25-50')],
        [TD('Director CorpDev'), TD('VP/SVP/Director CorpDev +entreprise 200-5 000'), TD('$800-1 500'), TD('Case study video'), TD('$50-100')],
        [TD('Partner PE/VC'), TD('Partner/Principal + PE/VC + gestion assets $50M-2B'), TD('$500-1 000'), TD('ROI calculator'), TD('$75-150')],
        [TD('Consultant'), TD('Independent + M&amp;A/finance advisor'), TD('$200-500'), TD('Testimonial + pricing'), TD('$15-30')],
    ], [80, 130, 70, 100, 70]))
    E.append(sp(6))
    E.append(p_left("<i>Budget total LinkedIn Ads : $2 000-5 000/mois a partir de M4</i>"))

    E.append(h3("5.3.3 Engagement LinkedIn Groups"))
    E.append(bul("M&amp;A Science, M&amp;A Community, Private Equity Professionals, Corporate Development Network, Mergers &amp; Acquisitions Professionals."))
    E.append(bul("Objectif : 2-3 contributions substantielles par semaine (pas de spam - valeur d'abord)."))

    # 5.4 Community Marketing
    E.append(h2("5.4 Community Marketing"))

    E.append(h3("5.4.1 Reddit (Approche Valeur d'Abord)"))
    E.append(bul("<b>r/M&amp;A</b> : Partager des insights originaux sur le sourcing, repondre aux questions techniques. Ne jamais promouvoir directement."))
    E.append(bul("<b>r/private_equity</b> : Contenu educatif sur les tendances PE, outils, best practices."))
    E.append(bul("<b>r/FinancialCareers</b> : Conseils de carriere pour analystes M&amp;A, templates gratuits, guides."))
    E.append(bul("<b>Regles</b> : Ratio 10:1 (10 contributions utiles pour 1 mention subtile de DealScope). Toujours declarer l'affiliation."))
    E.append(bul("<b>AMAs</b> : Organiser des sessions Ask Me Anything sur le sourcing M&amp;A a l'IA (M6+)."))

    E.append(h3("5.4.2 Product Hunt Launch"))
    E.append(bul("<b>Timing</b> : Lancement M4 (Public Beta). Coordination avec la communaute pour maximiser les upvotes."))
    E.append(bul("<b>Preparation</b> : Teaser page 2 semaines avant, liste de supporters, assets visuels, video demo 60s."))
    E.append(bul("<b>Objectif</b> : Top 5 Product of the Day, 500+ upvotes, 200+ visiteurs redirection vers le site."))

    E.append(h3("5.4.3 Communautes M&amp;A (Slack/Discord)"))
    E.append(bul("<b>Communautes cibles</b> : M&amp;A Science Slack, Operator's Guild, SaaStr community, Indie Hackers (pour consultants)."))
    E.append(bul("<b>Approche</b> : Participer aux discussions, offrir des templates gratuits, organiser des micro-webinaires."))

    # 5.5 Partnership Strategy
    E.append(h2("5.5 Strategie de Partenariats"))

    E.append(h3("5.5.1 Partenariats d'Integration"))
    E.append(bul("<b>HubSpot</b> : App Marketplace integration pour synchroniser les donnees M&amp;A dans le CRM. Audience potentielle : 200K+ entreprises."))
    E.append(bul("<b>Salesforce</b> : AppExchange listing pour les equipes CorpDev utilisant Salesforce. Cible enterprise."))
    E.append(bul("<b>Pipedrive</b> : Marketplace pour les petites equipes M&amp;A. Alignement segment mid-market."))
    E.append(bul("<b>Notion / Airtable</b> : Integrations pour les utilisateurs qui gerent leur pipeline dans ces outils."))

    E.append(h3("5.5.2 Programme de Referral"))
    E.append(tbl([
        [THL('Element'), THL('Details')],
        [TD('<b>Referral link personnalise</b>'), TD('Chaque utilisateur dispose d\'un lien unique dans son dashboard')],
        [TD('<b>Avantage pour le referral</b>'), TD('1 mois gratuit sur le prochain cycle de facturation (max 2 mois/annee)')],
        [TD('<b>Avantage pour le referee</b>'), TD('20% de remise sur les 3 premiers mois de tout plan payant')],
        [TD('<b>Tracking</b>'), TD('Cookie de 90 jours, dashboard de suivi des referrals en temps reel')],
        [TD('<b>Communication</b>'), TD('Email automatique a J30 et J60 pour les utilisateurs actifs non-referrers')],
    ], [145, 335]))
    E.append(sp(6))

    E.append(h3("5.5.3 Programme Reseller/Affilie pour Consultants M&amp;A"))
    E.append(bul("<b>Commission</b> : 20% du revenu recurrent (MRR) pendant 12 mois pour chaque client reference."))
    E.append(bul("<b>Eligibilite</b> : Consultants M&amp;A, family offices, boutique advisory avec audience qualifiee."))
    E.append(bul("<b>Support</b> : Kit partenaire complet (decks, demos co-brandees, co-marketing, formation produit)."))
    E.append(bul("<b>Tiers partenaires</b> : Silver (1-5 refs), Gold (6-20 refs), Platinum (20+ refs) avec commissions croissantes."))

    # 5.6 Paid Acquisition
    E.append(h2("5.6 Acquisition Payante"))

    E.append(h3("5.6.1 Google Ads (Mots-cles Haute Intention)"))
    E.append(tbl([
        [THL('Mot-cle'), THL('Volume/mois'), THL('CPC estime'), THL('Intent')],
        [TD('M&A software'), TD('2 400'), TD('$8-12'), TD('Haute')],
        [TD('deal sourcing software'), TD('1 300'), TD('$7-10'), TD('Haute')],
        [TD('M&A intelligence platform'), TD('880'), TD('$6-9'), TD('Haute')],
        [TD('PitchBook alternative'), TD('720'), TD('$4-6'), TD('Moyenne')],
        [TD('private equity deal flow'), TD('1 000'), TD('$5-8'), TD('Moyenne')],
        [TD('M&A CRM'), TD('390'), TD('$6-9'), TD('Haute')],
        [TD('company acquisition search'), TD('590'), TD('$4-7'), TD('Haute')],
        [TD('business acquisition finder'), TD('880'), TD('$3-5'), TD('Moyenne')],
    ], [140, 80, 70, 70]))
    E.append(sp(6))
    E.append(p_left("<i>Budget Google Ads : $2 000-3 000/mois a partir de M4. CPA cible : $30-60.</i>"))

    E.append(h3("5.6.2 LinkedIn Ads"))
    E.append(p("Voir section 5.3.2 ci-dessus. Budget total : $2 000-5 000/mois."))

    E.append(h3("5.6.3 Strategie de Retargeting"))
    E.append(bul("<b>Audience</b> : Visiteurs du site n'ayant pas signe up (80%+ du trafic). Taille audience : 10K-50K."))
    E.append(bul("<b>Creative</b> : Social proof (etudes de cas), ROI calculator, demo video. Rotation toutes les 2 semaines."))
    E.append(bul("<b>Offre retargeting</b> : Essai gratuit etendu a 21 jours ou consultation strategique M&amp;A gratuite."))
    E.append(bul("<b>Budget retargeting</b> : 30% du budget paid total ($1 500-2 500/mois)."))
    E.append(bul("<b>Pixel + CAPI</b> : LinkedIn Insight Tag + Google Ads Pixel + Conversions API pour un tracking multi-touch."))
    E.append(PageBreak())
    return E


# ===== SECTION 6: PLAN DE LANCEMENT PHASE =====
def sec_lancement():
    E = []
    E.append(h1("6. Plan de Lancement par Phase"))
    E.append(hr())

    # Phase 1
    E.append(h2("6.1 Phase 1 : Beta Privee (Mois 1-3)"))
    E.append(h3("Objectif : Valider le produit-market fit avec un groupe restreint d'utilisateurs"))
    E.append(tbl([
        [THL('Element'), THL('Details')],
        [TD('<b>Design Partners</b>'), TD('20 partenaires design selectionnes sur le reseau LinkedIn des fondateurs. Criteres : profil M&amp;A/CorpDev/PE, actif dans le mid-market, prete a donner du feedback regulier.')],
        [TD('<b>Feedback Sessions</b>'), TD('Sessions hebdomadaires de 45 min (1-on-1) + questionnaire NPS bi-mensuel. Recording optionnel pour analyse UX.')],
        [TD('<b>Cible NPS</b>'), TD('NPS > 40 (seuil produit-market fit selon Benchmark Sean Ellis : > 40 = PMF probable)')],
        [TD('<b>Utilisation active</b>'), TD('Objectif : 80%+ des design partners utilisent la plateforme chaque semaine. Mesure : WAU/W (Weekly Active Users / Week)')],
        [TD('<b>Exit Criteria</b>'), TD('NPS > 40, WAU > 80%, 0 bug critique, 3+ personas representees dans le beta, les design partners acceptent de devenir references')],
        [TD('<b>Communication</b>'), TD('Updates produit hebdomadaires via Slack channel dedie. Roadmap transparente. Acces prioritaire aux nouvelles fonctionnalites.')],
        [TD('<b>Legal</b>'), TD('NDA signe par chaque design partner. Droit d\'utilisation des feedbacks anonymises pour le marketing futur.')],
    ], [110, 370]))
    E.append(sp(6))

    # Phase 2
    E.append(h2("6.2 Phase 2 : Beta Publique (Mois 4-6)"))
    E.append(h3("Objectif : Ouvrir l'acces, valider la conversion et generer les premiers revenus"))
    E.append(tbl([
        [THL('Element'), THL('Details')],
        [TD('<b>Strategie Waitlist</b>'), TD('Inscription ouverte avec waitlist. Position dans la file affichee pour creer l\'urgence. Premier 100 = acces immediat.')],
        [TD('<b>Product Hunt Launch</b>'), TD('Lancement coordonne M4. Objectif : Top 5, 500+ upvotes, 200+ visiteurs. Preparation : teaser 2 semaines avant.')],
        [TD('<b>Cible Utilisateurs</b>'), TD('50 premiers utilisateurs payants a la fin de M6. Focus : conversion des design partners + waitlist.')],
        [TD('<b>Taux de Conversion</b>'), TD('Trial-to-paid > 10%. Benchmark SaaS B2B : 5-15%. Si &lt; 5%, pivot sur l\'onboarding.')],
        [TD('<b>Pricing</b>'), TD('Plans Starter ($99) et Pro ($299) disponibles. Plan Business ($499) en mode request-only.')],
        [TD('<b>Support</b>'), TD('Support email sous 24h. Chat live (intercom) aux heures ouvrables. Base de connaissances (50+ articles).')],
        [TD('<b>Mesures</b>'), TD('MRR cible : $5 000-$8 000. CAC (cout d\'acquisition client) sous $150. Activation rate > 50%.')],
    ], [110, 370]))
    E.append(sp(6))

    # Phase 3
    E.append(h2("6.3 Phase 3 : Disponibilite Generale (Mois 7-9)"))
    E.append(h3("Objectif : Activer la machine marketing et atteindre la traction commerciale"))
    E.append(tbl([
        [THL('Element'), THL('Details')],
        [TD('<b>Activation Marketing</b>'), TD('Lancement complet des canaux : SEO, LinkedIn Ads ($2K/mois), Google Ads ($2K/mois), content marketing (8 articles/mois), newsletter.')],
        [TD('<b>SaaS Review Platforms</b>'), TD('Inscription sur G2, Capterra, Trustpilot, Software Advice. Objectif : 15+ reviews 5 etoiles a M9. Campagne email aux utilisateurs actifs.')],
        [TD('<b>Etudes de Cas</b>'), TD('Publication de 3-5 case studies avec les premiers clients payants. Format : probleme - solution - resultats quantifies.')],
        [TD('<b>Cible Utilisateurs</b>'), TD('200 utilisateurs payants a M9.')],
        [TD('<b>MRR Cible</b>'), TD('$30 000 MRR ($360K ARR annualise). Repartition estimee : 60% Starter, 30% Pro, 10% Business.')],
        [TD('<b>Partenariats</b>'), TD('Integration HubSpot live sur marketplace. Debut du programme de referral.')],
        [TD('<b>Equipe</b>'), TD('Premier SDR (Sales Development Rep) recrute. Support tier 1 outsource ou en interne.')],
    ], [110, 370]))
    E.append(sp(6))

    # Phase 4
    E.append(h2("6.4 Phase 4 : Scale (Mois 10-12)"))
    E.append(h3("Objectif : Activer la vente enterprise et accelerer la croissance"))
    E.append(tbl([
        [THL('Element'), THL('Details')],
        [TD('<b>Enterprise Sales Motion</b>'), TD('Activation du cycle de vente enterprise : Account Executive dedie, demo personnalisee, POC 30 jours, contrat sur mesure, SLA.')],
        [TD('<b>Cible Enterprise</b>'), TD('5 clients enterprise signes a M12. ACV (Annual Contract Value) cible : $15 000-$50 000.')],
        [TD('<b>Partner Program</b>'), TD('Lancement officiel du programme de partenaires (resellers, affiliates, integration partners). 10 partenaires actifs.')],
        [TD('<b>ARR Cible</b>'), TD('$100 000 ARR a M12. Mix : 70% self-serve (SMB/mid), 20% sales-assisted, 10% enterprise.')],
        [TD('<b>Paid Acquisition</b>'), TD('Scale a $5 000-$8 000/mois (Google + LinkedIn + retargeting). Optimisation continue des CPA.')],
        [TD('<b>Content</b>'), TD('Premier ebook/whitepaper gate. Premier webinaire mensuel. YouTube : 2 videos/mois.')],
        [TD('<b>International</b>'), TD('Version anglaise complete. Test march europeen (UK, Allemagne). Eventuellement FrenchTech missions.')],
        [TD('<b>Series A Readiness</b>'), TD('Prepare les metriques de fundraising : ARR, NRR, CAC, LTV, churn, gross margin, growth rate.')],
    ], [110, 370]))
    E.append(sp(6))

    # Timeline Resume
    E.append(h2("6.5 Resume du Timeline"))
    E.append(tbl([
        [TH('Phase'), TH('Periode'), TH('Utilisateurs payants'), TH('MRR'), TH('Evenements cles')],
        [TD('<b>Beta Privee</b>', True), TD('M1-M3', True), TD('-', True), TD('$0', True), TD('20 design partners, NPS > 40')],
        [TD('<b>Beta Publique</b>', True), TD('M4-M6', True), TD('50', True), TD('$5-8K', True), TD('Product Hunt, premier revenus')],
        [TD('<b>GA</b>', True), TD('M7-M9', True), TD('200', True), TD('$30K', True), TD('Full marketing, G2/Capterra')],
        [TD('<b>Scale</b>', True), TD('M10-M12', True), TD('350+', True), TD('$50-100K', True), TD('Enterprise, $100K ARR')],
    ], [75, 60, 85, 70, 180]))
    E.append(sp(6))
    E.append(p_left("<i>Tableau 9 : Timeline de lancement resume</i>"))
    E.append(PageBreak())
    return E


# ===== SECTION 7: FUNNEL DE CONVERSION =====
def sec_funnel():
    E = []
    E.append(h1("7. Funnel de Conversion"))
    E.append(hr())

    E.append(h2("7.1 Visualisation du Funnel Complet"))
    E.append(sp(4))

    # Funnel as table
    E.append(tbl([
        [THL('Etape'), THL('Metrique Cible M12'), THL('Taux de Conversion'), THL('Actions Cles')],
        [TD('<b>AWARENESS</b>'),
         TD('50 000 visiteurs uniques/mois'),
         TD('-'),
         TD('SEO (40%), LinkedIn (25%), Paid Ads (20%), Reddit/Community (10%), PR (5%)')],
        [TD('<b>ACQUISITION</b>'),
         TD('5 000 signups/mois'),
         TD('10% visiteurs -> signups'),
         TD('Landing page optimisee, social proof, CTA clair, offer irresistible (14j free)')],
        [TD('<b>ACTIVATION</b>'),
         TD('60% completent 1er ICP + scan (48h)'),
         TD('60% signups -> actives'),
         TD('Onboarding guide, template ICP pre-rempli, email J1/J3, in-app check-list')],
        [TD('<b>REVENUE</b>'),
         TD('500 payants/mois'),
         TD('10% trial -> paid'),
         TD('Upgrade triggers, feature-gating, demo request, annual billing incentive')],
        [TD('<b>RETENTION</b>'),
         TD('Churn &lt; 3%/mois, NRR > 110%'),
         TD('-'),
         TD('Product-led growth, CS touchpoints, feedback loop, expansion revenue')],
        [TD('<b>REFERRAL</b>'),
         TD('20% new users from referrals'),
         TD('20% des acquisitions'),
         TD('Programme referral 2-sided, in-app prompts, ambassador program')],
    ], [85, 105, 90, 200]))
    E.append(sp(6))
    E.append(p_left("<i>Tableau 10 : Funnel de conversion complet avec metriques cibles</i>"))

    # 7.2 Taux de Conversion par Etape
    E.append(h2("7.2 Benchmarks et Taux de Conversion"))
    E.append(p("Les taux de conversion cibles sont calibres sur les benchmarks SaaS B2B (sources : OpenView Partners, Tomasz Tunguz, ProfitWell) :"))
    E.append(tbl([
        [THL('Etape du Funnel'), THL('Benchmark SaaS B2B'), THL('Cible DealScope M6'), THL('Cible DealScope M12')],
        [TD('Visiteur -> Signup'), TD('2-5%'), TD('5%'), TD('10%')],
        [TD('Signup -> Activation (48h)'), TD('40-60%'), TD('40%'), TD('60%')],
        [TD('Trial -> Paid (14 jours)'), TD('5-15%'), TD('8%'), TD('10-12%')],
        [TD('Mois 1 -> Mois 2 (retention)'), TD('70-85%'), TD('75%'), TD('85%')],
        [TD('Upgrade de Tier (annual)'), TD('15-25%'), TD('10%'), TD('20%')],
        [TD('CAC Payback (mois)'), TD('12-18 mois'), TD('18 mois'), TD('12 mois')],
    ], [130, 100, 100, 100]))
    E.append(sp(6))

    # 7.3 Metriques Cles
    E.append(h2("7.3 Metriques Cles et KPIs"))
    E.append(tbl([
        [THL('Metrique'), THL('Definition'), THL('Cible M6'), THL('Cible M12')],
        [TD('<b>MRR</b>'), TD('Monthly Recurring Revenue'), TD('$5-8K'), TD('$50-100K')],
        [TD('<b>ARR</b>'), TD('Annual Run Rate'), TD('$60-96K'), TD('$600K-1.2M')],
        [TD('<b>ARR Growth</b>'), TD('Croissance ARR MoM'), TD('30-40%'), TD('15-25%')],
        [TD('<b>CAC</b>'), TD('Cout d\'Acquisition Client'), TD('$150'), TD('$100')],
        [TD('<b>LTV</b>'), TD('Lifetime Value'), TD('$1 500'), TD('$2 500')],
        [TD('<b>LTV/CAC</b>'), TD('Ratio LTV/CAC'), TD('10x'), TD('25x')],
        [TD('<b>NRR</b>'), TD('Net Revenue Retention'), TD('105%'), TD('110-130%')],
        [TD('<b>GRR</b>'), TD('Gross Revenue Retention'), TD('90%'), TD('95%')],
        [TD('<b>Churn mensuel</b>'), TD('Taux de desabonnement'), TD('5%'), TD('&lt; 3%')],
        [TD('<b>ARPU</b>'), TD('Average Revenue Per User'), TD('$150'), TD('$200')],
        [TD('<b>Trial-to-Paid</b>'), TD('Conversion essai -> payant'), TD('8%'), TD('10-12%')],
        [TD('<b>WAU/W</b>'), TD('Weekly Active Users / Week'), TD('60%'), TD('70%')],
    ], [90, 140, 80, 80]))
    E.append(sp(6))
    E.append(p_left("<i>Tableau 11 : Metriques cles et KPIs de croissance</i>"))
    E.append(PageBreak())
    return E


# ===== SECTION 8: CONTENT MARKETING PLAN =====
def sec_content_plan():
    E = []
    E.append(h1("8. Content Marketing Plan"))
    E.append(hr())

    # 8.1 Calendrier 12 mois
    E.append(h2("8.1 Calendrier de Contenu sur 12 Mois"))
    E.append(tbl([
        [THL('Mois'), THL('Theme Principal'), THL('Contenu Pillar'), THL('Formats'), THL('Mots-cles Cibles')],
        [TD('M1'), TD('Lancement Beta Privee'), TD('Introduction DealScope'), TD('Blog, LinkedIn'), TD('M&A AI platform, deal sourcing AI')],
        [TD('M2'), TD('Sourcing M&A Manuel vs IA'), TD('Deal Sourcing'), TD('Blog, Template'), TD('automated deal sourcing, M&A automation')],
        [TD('M3'), TD('OSINT pour M&A'), TD('OSINT'), TD('Guide, Webinaire'), TD('OSINT M&A, company intelligence')],
        [TD('M4'), TD('Beta Publique + PH Launch'), TD('Product'), TD('Blog, PR, PH'), TD('M&A software, PitchBook alternative')],
        [TD('M5'), TD('Guide ICP pour M&A'), TD('ICP'), TD('Ebook, Blog x2'), TD('ideal customer profile M&A, target identification')],
        [TD('M6'), TD('Comparatifs Outils'), TD('Outils'), TD('Blog x3, Comparison'), TD('M&A software comparison, best M&A tools')],
        [TD('M7'), TD('Valuation SaaS'), TD('Valuation'), TD('Guide, Calculator'), TD('SaaS valuation, acquisition multiples')],
        [TD('M8'), TD('Tendances M&A 2026'), TD('Tendances'), TD('Rapport, PR'), TD('M&A trends 2026, mid-market M&A')],
        [TD('M9'), TD('Case Studies Clients'), TD('Social Proof'), TD('Case Study x3'), TD('M&A deal success story, CorpDev tools')],
        [TD('M10'), TD('AI Agents Orchestration'), TD('IA'), TD('Blog, Video'), TD('AI deal agents, LangGraph M&A')],
        [TD('M11'), TD('Scale & Enterprise'), TD('Scale'), TD('Whitepaper, Webinaire'), TD('enterprise M&A software, CorpDev platform')],
        [TD('M12'), TD('Bilan & Vision 2027'), TD('Thought Leadership'), TD('Blog, Keynote, PR'), TD('future of M&A, AI intelligence platform')],
    ], [35, 110, 70, 95, 160]))
    E.append(sp(6))
    E.append(p_left("<i>Tableau 12 : Calendrier editorial 12 mois</i>"))

    # 8.2 SEO Keyword Strategy
    E.append(h2("8.2 Strategie SEO - Mots-cles Prioritaires"))
    E.append(tbl([
        [THL('Mot-cle Primaire'), THL('Volume/mois'), THL('Difficulte'), THL('Priorite'), THL('Cluster')],
        [TD('M&A software'), TD('2 400'), TD('Moyenne'), TD('P0'), TD('Outils')],
        [TD('deal sourcing software'), TD('1 300'), TD('Moyenne'), TD('P0'), TD('Sourcing')],
        [TD('private equity deal sourcing'), TD('1 600'), TD('Moyenne'), TD('P0'), TD('Sourcing')],
        [TD('M&A intelligence platform'), TD('880'), TD('Elevee'), TD('P0'), TD('Intelligence')],
        [TD('business acquisition finder'), TD('880'), TD('Moyenne'), TD('P0'), TD('Sourcing')],
        [TD('AI deal sourcing'), TD('310'), TD('Faible'), TD('P0'), TD('IA')],
        [TD('M&A target identification'), TD('480'), TD('Faible'), TD('P1'), TD('Intelligence')],
        [TD('PitchBook alternative'), TD('720'), TD('Faible'), TD('P1'), TD('Outils')],
        [TD('OSINT for M&A'), TD('140'), TD('Faible'), TD('P1'), TD('OSINT')],
        [TD('SaaS acquisition multiples'), TD('720'), TD('Moyenne'), TD('P1'), TD('Valuation')],
        [TD('M&A signal detection'), TD('90'), TD('Faible'), TD('P1'), TD('Intelligence')],
        [TD('mid-market M&A software'), TD('170'), TD('Faible'), TD('P1'), TD('Outils')],
        [TD('M&A workflow automation'), TD('170'), TD('Faible'), TD('P2'), TD('IA')],
        [TD('corporate development tools'), TD('590'), TD('Moyenne'), TD('P2'), TD('Outils')],
        [TD('how to source M&A deals'), TD('720'), TD('Faible'), TD('P2'), TD('Sourcing')],
    ], [130, 65, 65, 50, 70]))
    E.append(sp(6))

    # 8.3 Distribution
    E.append(h2("8.3 Canaux de Distribution de Contenu"))
    E.append(tbl([
        [THL('Canal'), THL('Type de contenu'), THL('Frequence'), THL('Portee estimee M12')],
        [TD('Blog (dealscope.fr/blog)'), TD('Articles longs, guides, templates'), TD('4-8/mois'), TD('10K sessions/mois')],
        [TD('LinkedIn (fondateurs)'), TD('Posts, carrousels, threads'), TD('5-10/mois'), TD('50K impressions/mois')],
        [TD('Newsletter'), TD('Curated insights + product updates'), TD('Hebdomadaire'), TD('5K abonnes')],
        [TD('YouTube'), TD('Demos, tutorials, insights'), TD('2-4/mois'), TD('2K vues/video')],
        [TD('Podcast (guest)'), TD('Interviews, panels M&amp;A'), TD('1-2/mois'), TD('Audience podcast host')],
        [TD('Reddit / Communities'), TD('Insights, reponses, AMA'), TD('3-5/mois'), TD('10K+ vues')],
        [TD('Guest Posts'), TD('Articles externes'), TD('1-2/mois'), TD('5K-20K readers/post')],
        [TD('PR / Media'), TD('Press releases, interviews'), TD('Mensuel'), TD('Variable')],
    ], [110, 130, 65, 100]))
    E.append(sp(6))

    # 8.4 Thought Leadership
    E.append(h2("8.4 Sujets de Thought Leadership"))
    E.append(p("Les sujets suivants positionnent DealScope comme un leader d'opinion dans l'intersection IA + M&amp;A :"))
    E.append(bul("<b>\"Pourquoi 90% des analystes M&amp;A perdent leur temps sur le sourcing manuel\"</b> - Donnees de notre beta, benchmarks sectoriels."))
    E.append(bul("<b>\"L'IA-native va tuer les bases de donnees M&amp;A traditionnelles\"</b> - Vision technologique, comparaison architectures legacy vs AI-native."))
    E.append(bul("<b>\"Le mid-market M&amp;A est sous-ecoute - et c'est une opportunite a $500M\"</b> - Analyse du marche, white paper."))
    E.append(bul("<b>\"Comment un fond PE a 3x son deal flow en 3 mois avec l'IA\"</b> - Case study anonymisee (des que disponible)."))
    E.append(bul("<b>\"Le futur du CorpDev : de la reaction a l'anticipation\"</b> - Vision produit, roadmap."))
    E.append(bul("<b>\"2027 : l'annee ou l'IA orchestre 80% du sourcing M&amp;A\"</b> - Predications, rapport de tendances."))
    E.append(PageBreak())
    return E


# ===== SECTION 9: PROGRAMME DE REFERRALS & AFFILIATE =====
def sec_referrals():
    E = []
    E.append(h1("9. Programme de Referrals & Affiliate"))
    E.append(hr())

    # 9.1 Mecanique Referral
    E.append(h2("9.1 Mecanique du Programme de Referral"))
    E.append(tbl([
        [THL('Component'), THL('Details')],
        [TD('<b>Inscription</b>'), TD('Automatique pour tout utilisateur actif (compte age de +30 jours avec au moins 1 ICP cree).')],
        [TD('<b>Lien de referral</b>'), TD('Lien unique personnalise accessible depuis le dashboard utilisateur : dealscope.fr/ref/[username]')],
        [TD('<b>Tracking</b>'), TD('Cookie de 90 jours + attribution last-click. Dashboard en temps reel : clics, inscriptions, conversions, gains.')],
        [TD('<b>Avantage referral (parrain)</b>'), TD('1 mois gratuit ajoute au cycle de facturation en cours. Maximum : 2 mois gratuits/annee. Cumulatif.')],
        [TD('<b>Avantage referee (filleul)</b>'), TD('20% de remise sur les 3 premiers mois de tout plan payant (Starter, Pro ou Business).')],
        [TD('<b>Communication</b>'), TD('Email automatique J30 post-signup + reminder J60. In-app notification apres la 3eme utilisation. Share buttons sur le dashboard.')],
        [TD('<b>Conditions</b>'), TD('Le referee doit completer un essai gratuit et convertir en plan payant dans les 90 jours. Pas de self-referral.')],
    ], [130, 350]))
    E.append(sp(6))

    # 9.2 Commission Affiliate
    E.append(h2("9.2 Structure de Commissions Affiliate"))
    E.append(tbl([
        [THL('Tier Partenaire'), THL('Clients Referes'), THL('Commission'), THL('Duree'), THL('Bonus')],
        [TD('<b>Silver</b>'), TD('1-5 clients'), TD('15% MRR'), TD('12 mois'), TD('')],
        [TD('<b>Gold</b>'), TD('6-20 clients'), TD('20% MRR'), TD('12 mois'), TD('$500 bonus a 10 refs')],
        [TD('<b>Platinum</b>'), TD('20+ clients'), TD('25% MRR'), TD('24 mois'), TD('$2 000 bonus + co-marketing')],
    ], [80, 80, 75, 75, 140]))
    E.append(sp(6))
    E.append(p_left("<i>Exemple : Un partenaire Gold avec 10 clients Pro ($299/mo) genere 10 x $299 x 20% = $598/mois pendant 12 mois = $7 176 de revenus recurrents de commissions.</i>"))
    E.append(sp(6))

    # 9.3 Partner Enablement
    E.append(h2("9.3 Kit d'Enablement Partenaire"))
    E.append(p("Chaque partenaire recu un kit complet pour maximiser ses conversions :"))
    E.append(bul("<b>Sales Deck co-branded</b> : Presentation commercialisable avec les logos du partenaire et de DealScope, personnalisable."))
    E.append(bul("<b>One-pager produit</b> : Document synthetique 1 page avec features, pricing, ROI, et CTA personnalise."))
    E.append(bul("<b>Demo video pre-recorded</b> : Video de demonstration produit de 5 minutes avec voiceover, utilisable en sales motion."))
    E.append(bul("<b>Email templates</b> : 5 templates d'emails prospecting adaptes par persona (Analyste, CorpDev, PE, Consultant)."))
    E.append(bul("<b>ROI Calculator</b> : Outil interactif permettant au prospect d'estimer son ROI avec DealScope (temps gagne, deals qualifies supplementaires)."))
    E.append(bul("<b>Formation produit</b> : Session de formation en ligne de 2h + documentation technique pour les partenaires avances."))
    E.append(bul("<b>Support partenaire</b> : Channel Slack dedie, reponse sous 4h ouvrables,季度 business review."))
    E.append(bul("<b>Co-marketing</b> : Webinaires co-hotes, co-publications, partage de leads qualifiés (pour Gold+)."))
    E.append(PageBreak())
    return E


# ===== SECTION 10: ANALYSE CONCURRENTIELLE GTM =====
def sec_analyse_concurrence():
    E = []
    E.append(h1("10. Analyse Concurrentielle GTM"))
    E.append(hr())

    # 10.1 Competitor Acquisition
    E.append(h2("10.1 Comment les Concurrents Acquirent leurs Clients"))
    E.append(tbl([
        [THL('Concurrent'), THL('Segment'), THL('Prix'), THL('Modele de vente'), THL('Acquisition principale'), THL('Faiblesse GTM')],
        [TD('<b>PitchBook</b>'), TD('Enterprise'), TD('$12-27K/an'), TD('Sales-led'), TD('Brand heritage + conferences + events'), TD('Pas de PLG, depend des vendeurs, pricing opaque')],
        [TD('<b>Capital IQ</b>'), TD('Enterprise'), TD('$20-80K/an'), TD('Sales-led'), TD('Donnees historiques + reputation S&P'), TD('UX obsolete, formation lourde, pas d\'IA')],
        [TD('<b>Grata (Datasite)</b>'), TD('Upper mid'), TD('$15-40K/an'), TD('Sales-led'), TD('Datasite ecosystem + outbound'), TD('Integration SourceScrub en cours, complexite')],
        [TD('<b>Affinity</b>'), TD('Enterprise'), TD('$18-60K/an'), TD('Sales-led'), TD('CRM network effects + events'), TD('Pas M&A-specifique, pricing opaque')],
        [TD('<b>SourceScrub</b>'), TD('Mid/Upper'), TD('$8-15K/an'), TD('Sales-assisted'), TD('SEO + content + outbound'), TD('Acquisition par Datasite, aucune IA, roadmap incertaine')],
        [TD('<b>Conceptor.ai</b>'), TD('Startup'), TD('$500-2K/an'), TD('Self-serve'), TD('SEO + Product Hunt + Reddit'), TD('Produit premature, feature set limite')],
    ], [65, 55, 60, 55, 120, 120]))
    E.append(sp(6))
    E.append(p_left("<i>Tableau 13 : Analyse GTM concurrentielle</i>"))

    # 10.2 Unfair Advantage
    E.append(h2("10.2 L'Avantage Injuste de DealScope en Distribution"))
    E.append(p("DealScope dispose de plusieurs avantages competitifs structurels en matiere de distribution :"))
    E.append(bul("<b>Product-Led Growth (PLG) natif</b> : Contrairement a PitchBook/CapIQ/Grata qui necessitent un commercial pour vendre, DealScope est concu pour une adoption self-serve. L'utilisateur peut tester le produit gratuitement en 14 jours sans parler a personne. Cela reduit le CAC de 5-10x vs sales-led."))
    E.append(bul("<b>Pricing disruptif</b> : A $99-$499/mois, DealScope est 20-80x moins cher que les solutions enterprise. Cela ouvre un marche massif non dessert : les milliers de petites equipes M&amp;A, boutiques advisory et consultants independants qui ne pouvaient pas se permettre les outils existants."))
    E.append(bul("<b>AI-native = viralite</b> : Les fonctionnalites IA generent des \"wow moments\" partageables (ex: \"J'ai trouve 50 cibles qualifiees en 3 minutes\"). Chaque resultats impressive est une opportunaute de partage organique sur LinkedIn et dans les communautes."))
    E.append(bul("<b>Architecture LangGraph = differentiation</b> : L'orchestration de 5 agents IA est un avantage technique concurrentiel qui ne peut pas etre facilement replica par les legacy players qui ont des architectures monolithiques."))
    E.append(bul("<b>Focus mid-market = niche sans concurrence directe</b> : Les enterprise players (PitchBook, CapIQ) ne descendent pas sur le segment $99/mois. Les startup players (Conceptor.ai) n'ont pas la profondeur fonctionnelle. DealScope occupe un \"sweet spot\" unique."))

    # 10.3 Community-Driven Growth
    E.append(h2("10.3 Strategie de Croissance Communaute-Driven"))
    E.append(p("La strategie de croissance de DealScope repose sur 4 piliers communautes qui creent un avantage cumulatif :"))
    E.append(tbl([
        [THL('Pilier'), THL('Actions'), THL('KPI'), THL('Horizon')],
        [TD('<b>Content Community</b>'),
         TD('Blog M&amp;A, newsletter, templates gratuits, guides telechargeables, open data'),
         TD('10K sessions/mois, 5K abonnes newsletter'),
         TD('M1-M6')],
        [TD('<b>Social Community</b>'),
         TD('LinkedIn fondateurs (10K+ followers), Reddit value-first, X/Twitter, Product Hunt'),
         TD('50K impressions/mois LinkedIn'),
         TD('M1-M9')],
        [TD('<b>User Community</b>'),
         TD('Slack/Discord utilisateurs, ambassadeurs, beta testers, feature requests co-creation'),
         TD('500 membres communaute, 20 ambassadeurs'),
         TD('M4-M12')],
        [TD('<b>Partner Community</b>'),
         TD('Resellers, affiliates, integration partners, co-marketing, events'),
         TD('10 partenaires actifs, 20% revenus via partenaires'),
         TD('M7-M12')],
    ], [90, 195, 115, 60]))
    E.append(sp(6))
    E.append(p_left("<i>Tableau 14 : Piliers de la croissance communaute-driven</i>"))
    E.append(sp(6))
    E.append(p(
        "<b>Effet de levier</b> : Chaque pilier renforce les autres. Le contenu attire des utilisateurs qui deviennent membres "
        "de la communaute, qui generent des case studies, qui attirent des partenaires, qui amplifient le contenu. "
        "Cet effet flywheel cree un avantage competitif durable et croissant que les concurrents sales-led ne peuvent pas replica "
        "sans transformer fondamentalement leur modele."
    ))

    # Conclusion
    E.append(sp(12))
    E.append(hr())
    E.append(sp(6))
    E.append(Paragraph(
        "<b>Conclusion</b>",
        ParagraphStyle('Conc', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=14, leading=20,
                       textColor=C_DARK, alignment=TA_CENTER, spaceAfter=8)
    ))
    E.append(p(
        "La strategie Go-to-Market de DealScope est concue pour maximiser la croissance a cout maitrise en combinant "
        "Product-Led Growth, SEO, community marketing et partnerships. Le pricing disruptif ($99-$499 vs $12K-$80K), "
        "l'architecture AI-native et le focus sur le mid-market non dessert creent un positionnement unique et defensible. "
        "Avec un objectif de $100K ARR a M12 et une trajectoire vers $1M+ ARR en M24, DealScope est positionne pour devenir "
        "la reference de l'intelligence M&amp;A pour le mid-market."
    ))
    E.append(sp(20))
    E.append(HRFlowable(width="40%", color=C_GOLD, thickness=1.5, spaceBefore=10, spaceAfter=10))
    E.append(Paragraph("<b>DealScope - Z.ai - Mars 2026</b>", S_COVER_INFO))
    E.append(Paragraph("CONFIDENTIEL", ParagraphStyle('Conf2', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=9, leading=12, textColor=C_GRAY, alignment=TA_CENTER)))
    return E


# ===== MAIN BUILD =====
def main():
    doc = TocDocTemplate(
        OUT,
        pagesize=A4,
        leftMargin=0.9*inch,
        rightMargin=0.9*inch,
        topMargin=0.8*inch,
        bottomMargin=0.8*inch,
        title="DealScope_Go_To_Market_Strategie_Lancement",
        author="Z.ai",
        creator="Z.ai"
    )

    E = []
    E.extend(cover())
    E.extend(toc())
    E.extend(sec_positionnement())
    E.extend(sec_pricing())
    E.extend(sec_canaux())
    E.extend(sec_lancement())
    E.extend(sec_funnel())
    E.extend(sec_content_plan())
    E.extend(sec_referrals())
    E.extend(sec_analyse_concurrence())

    doc.multiBuild(E, onLaterPages=footer, onFirstPage=lambda c, d: None)
    print(f"PDF genere : {OUT}")


if __name__ == '__main__':
    main()
