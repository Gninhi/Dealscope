#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""DealScope - Plan d'Onboarding & Documentation Utilisateur - PDF Generator v1.0"""

import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch, cm, mm
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from reportlab.platypus import (
    Paragraph, Spacer, PageBreak, Table, TableStyle, HRFlowable,
    KeepTogether
)
from reportlab.platypus.tableofcontents import TableOfContents
from reportlab.platypus import BaseDocTemplate, PageTemplate, Frame
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily

# ===== FONT REGISTRATION =====
pdfmetrics.registerFont(TTFont('TimesNewRoman', '/usr/share/fonts/truetype/english/Times-New-Roman.ttf'))
pdfmetrics.registerFont(TTFont('TimesNewRomanBold', '/usr/share/fonts/truetype/english/calibri-bold.ttf'))
pdfmetrics.registerFont(TTFont('TimesNewRomanItalic', '/usr/share/fonts/truetype/english/calibri-italic.ttf'))
pdfmetrics.registerFont(TTFont('DejaVuSans', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'))
pdfmetrics.registerFont(TTFont('DejaVuSansBold', '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'))
registerFontFamily('TimesNewRoman',
    normal='TimesNewRoman', bold='TimesNewRomanBold',
    italic='TimesNewRomanItalic', boldItalic='TimesNewRomanBold')
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
C_GREEN = colors.HexColor('#27AE60')
C_ORANGE = colors.HexColor('#E67E22')
C_RED = colors.HexColor('#C0392B')

# ===== OUTPUT =====
OUT = '/home/z/my-project/download/DealScope_Plan_Onboarding_Documentation.pdf'

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
S_BULLET = ParagraphStyle('Bul', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=10.5, leading=15, textColor=C_TEXT, leftIndent=20, bulletIndent=8, spaceAfter=3)
S_BULLET2 = ParagraphStyle('Bul2', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=10, leading=14, textColor=C_TEXT, leftIndent=35, bulletIndent=22, spaceAfter=3)
S_TH = ParagraphStyle('TH', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=9, leading=12, textColor=colors.white, alignment=TA_CENTER)
S_THL = ParagraphStyle('THL', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=9, leading=12, textColor=colors.white, alignment=TA_LEFT)
S_TD = ParagraphStyle('TD', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=8.5, leading=11, textColor=C_TEXT, alignment=TA_LEFT)
S_TDC = ParagraphStyle('TDC', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=8.5, leading=11, textColor=C_TEXT, alignment=TA_CENTER)
S_NOTE = ParagraphStyle('Note', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=9.5, leading=13, textColor=colors.HexColor('#336699'), leftIndent=15, spaceAfter=8, backColor=colors.HexColor('#F0F6FF'), borderPadding=6)
S_SMALL = ParagraphStyle('Small', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=8.5, leading=11, textColor=C_GRAY, alignment=TA_LEFT, spaceAfter=3)

# Cover styles
S_COVER_TITLE = ParagraphStyle('CoverTitle', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=30, leading=38, textColor=C_DARK, alignment=TA_CENTER, spaceAfter=10)
S_COVER_SUB = ParagraphStyle('CoverSub', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=16, leading=22, textColor=C_GOLD, alignment=TA_CENTER, spaceAfter=10)
S_COVER_INFO = ParagraphStyle('CoverInfo', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=12, leading=18, textColor=C_GRAY, alignment=TA_CENTER, spaceAfter=4)
S_TOC_TITLE = ParagraphStyle('TocTitle', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=20, leading=26, textColor=C_DARK, spaceAfter=20)

# ===== PAGE TEMPLATES =====
PAGE_W, PAGE_H = A4
MARGIN = 1.8 * cm


class TocDocTemplate(BaseDocTemplate):
    """Custom doc template with TOC support via multiBuild."""

    def __init__(self, filename, **kwargs):
        BaseDocTemplate.__init__(self, filename, **kwargs)
        frame = Frame(MARGIN, MARGIN + 0.5*cm, PAGE_W - 2*MARGIN, PAGE_H - 2*MARGIN - 1*cm, id='normal')
        template = PageTemplate(id='toc', frames=frame, onPage=self._page_footer)
        self.addPageTemplates([template])

    def _page_footer(self, canvas, doc):
        canvas.saveState()
        canvas.setFont('TimesNewRoman', 8)
        canvas.setFillColor(C_GRAY)
        canvas.drawCentredString(PAGE_W/2, 0.8*cm, "DealScope - Plan d'Onboarding & Documentation Utilisateur  |  Page %d" % doc.page)
        canvas.setStrokeColor(C_LIGHT)
        canvas.setLineWidth(0.5)
        canvas.line(MARGIN, PAGE_H - MARGIN + 0.3*cm, PAGE_W - MARGIN, PAGE_H - MARGIN + 0.3*cm)
        canvas.restoreState()

    def afterFlowable(self, flowable):
        """Register TOC entries for Heading1 and Heading2."""
        if isinstance(flowable, Paragraph):
            style = flowable.style.name
            text = flowable.getPlainText()
            if style == 'Heading1':
                key = 'h1_%s' % self.seq.nextf('heading1')
                self.canv.bookmarkPage(key)
                self.notify('TOCEntry', (0, text, self.page, key))
            elif style == 'Heading2':
                key = 'h2_%s' % self.seq.nextf('heading2')
                self.canv.bookmarkPage(key)
                self.notify('TOCEntry', (1, text, self.page, key))


# ===== HELPERS =====
def h1(t): return Paragraph(t, sty['Heading1'])
def h2(t): return Paragraph(t, sty['Heading2'])
def h3(t): return Paragraph(t, sty['Heading3'])
def p(t): return Paragraph(t, S_BODY)
def p_left(t): return Paragraph(t, S_BODY_LEFT)
def bul(t): return Paragraph(t, S_BULLET, bulletText='\u2022')
def bul2(t): return Paragraph(t, S_BULLET2, bulletText='-')
def sp(pts=8): return Spacer(1, pts)
def hr(): return HRFlowable(width="100%", color=C_LIGHT, thickness=1, spaceBefore=4, spaceAfter=4)
def TH(t): return Paragraph(t, S_TH)
def THL(t): return Paragraph(t, S_THL)
def TD(t, center=False): return Paragraph(t, S_TDC if center else S_TD)


def tbl(data, widths=None):
    """Create styled table with all Paragraph cells."""
    t = Table(data, colWidths=widths, repeatRows=1)
    cmds = [
        ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_COLOR),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#BBBBBB')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]
    for i in range(1, len(data)):
        if i % 2 == 0:
            cmds.append(('BACKGROUND', (0, i), (-1, i), C_ALT))
    t.setStyle(TableStyle(cmds))
    return t


# ===== PAGE DE COUVERTURE =====
def cover():
    E = []
    E.append(Spacer(1, 60))
    E.append(HRFlowable(width="60%", color=C_DARK, thickness=3, spaceBefore=0, spaceAfter=20))
    E.append(Paragraph("<b>DealScope</b>", ParagraphStyle('CB', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=42, leading=50, textColor=C_GOLD, alignment=TA_CENTER, spaceAfter=6)))
    E.append(sp(20))
    E.append(Paragraph("<b>Plan d'Onboarding &amp;</b>", S_COVER_TITLE))
    E.append(Paragraph("<b>Documentation Utilisateur</b>", S_COVER_TITLE))
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
def toc_page():
    E = []
    toc = TableOfContents()
    toc.levelStyles = [
        ParagraphStyle('TOC1', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=12, leading=20, textColor=C_DARK, leftIndent=0, spaceBefore=6),
        ParagraphStyle('TOC2', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=10.5, leading=18, textColor=C_TEXT, leftIndent=20, spaceBefore=2),
    ]
    E.append(Paragraph("Table des matieres", S_TOC_TITLE))
    E.append(HRFlowable(width="100%", color=C_DARK, thickness=1.5, spaceBefore=4, spaceAfter=14))
    E.append(toc)
    E.append(PageBreak())
    return E


# ===== SECTION 1: STRATEGIE D'ONBOARDING =====
def sec_strategie_onboarding():
    E = []
    E.append(h1("1. Strategie d'Onboarding"))
    E.append(hr())

    # 1.1 Philosophie
    E.append(h2("1.1 Philosophie d'Onboarding"))
    E.append(p(
        "DealScope adopte une philosophie d'onboarding centree sur le concept de <b>\"Time to First Value in &lt; 15 minutes\"</b>. "
        "L'objectif est de permettre a chaque utilisateur, quel que soit son profil, de constater un resultat concret et "
        "actionnable dans les 15 premieres minutes suivant sa premiere connexion a la plateforme. Cette approche repose "
        "sur trois piliers fondamentaux :"
    ))
    E.append(bul("<b>Friction minimale</b> : chaque etape est concue pour necessiter le minimum d'effort cognitif. Les formulaires sont courts, les choix sont guides, et les donnees par defaut sont intelligentes."))
    E.append(bul("<b>Valorisation immediate</b> : le premier resultat tangible (liste de cibles, score ICP, rapport d'analyse) est delivre le plus rapidement possible pour creer un effet \"aha moment\" irresistiblement addictif."))
    E.append(bul("<b>Apprentissage contextual</b> : la formation est integree dans le flux de travail et non separes de celui-ci. Chaque fonctionnalite est decouverte au moment ou l'utilisateur en a besoin."))
    E.append(sp(4))
    E.append(p(
        "Notre analyse du marche SaaS B2B indique que 60% des utilisateurs abandonnent un outil dans les 24 premieres heures "
        "s'ils n'ont pas atteint leur premier \"aha moment\". DealScope vise a reduire ce drop-off initial a moins de 15% grace "
        "a un onboarding ultra-personnalise et intelligent."
    ))

    # 1.2 Definition de l'activation
    E.append(h2("1.2 Definition de l'Activation"))
    E.append(p(
        "L'activation d'un utilisateur DealScope est definie comme l'accomplissement des deux actions suivantes :"
    ))
    E.append(tbl([
        [TH('Critere d\'activation'), TH('Description'), TH('KPI associe'), TH('Objectif')],
        [TD('<b>Completion du premier ICP</b>'),
         TD('L\'utilisateur definit un profil Ideal Customer Profile complet (secteur, taille, criteres financiers, signaux d\'acquisition)'),
         TD('Taux de completion ICP'),
         TD('80% en 48h')],
        [TD('<b>Lancement du premier scan</b>'),
         TD('L\'utilisateur declenche un premier scan intelligent sur la base de son ICP et consulte les resultats'),
         TD('Taux de premier scan'),
         TD('70% en 72h')],
    ], [100, 170, 90, 80]))
    E.append(sp(4))
    E.append(p_left("<i>Tableau 1 : Criteres d'activation utilisateur DealScope</i>"))
    E.append(sp(4))
    E.append(p(
        "Ces deux actions sont le signal le plus fort de la probabilite de conversion trial-to-paid. Les utilisateurs qui "
        "completent les deux etapes ont un taux de conversion de 35%, contre seulement 5% pour ceux qui ne completent que "
        "la premiere."
    ))

    # 1.3 Onboarding Flow par Persona
    E.append(h2("1.3 Parcours d'Onboarding par Persona"))
    E.append(p(
        "DealScope s'adresse a quatre personas distinctes, chacun avec des besoins, un niveau de sophistication technique "
        "et des objectifs specifiques. Le parcours d'onboarding est automatiquement adapte en fonction du persona detecte "
        "lors de l'inscription (source de trafic, reponses au questionnaire initial)."
    ))
    E.append(tbl([
        [THL('Persona'), THL('Profil d\'onboarding'), THL('Parcours prioritaire'), THL('Aha Moment')],
        [TD('<b>Analyste M&amp;A</b>'),
         TD('Setup rapide, templates ICP pre-configures, autonomie maximale'),
         TD('1. Selection ICP template &gt; 2. Premier scan &gt; 3. Exploration resultats &gt; 4. Creation pipeline'),
         TD('Voir 50+ cibles correlees a son ICP avec scores de fit en &lt; 3 minutes')],
        [TD('<b>Directeur CorpDev</b>'),
         TD('Onboarding d\'equipe, configuration workspace collaboratif, integration CRM'),
         TD('1. Config workspace &gt; 2. Inviter equipe &gt; 3. Connecter CRM &gt; 4. Lancer scan strategique'),
         TD('Dashboard unifie avec pipeline M&amp;A synchronise en temps reel avec Salesforce')],
        [TD('<b>Partner PE/VC</b>'),
         TD('Analyse de portefeuille, ICP par strategie de fund, scanning en lot'),
         TD('1. Configurer strategie fund &gt; 2. Creer ICP multi-criteres &gt; 3. Batch scan &gt; 4. Export rapport'),
         TD('Identification de 10+ deals off-market correspondant a la strategie d\'investissement')],
        [TD('<b>Consultant independant</b>'),
         TD('Workflow solo, focus export, pipeline rapide'),
         TD('1. ICP simplifie &gt; 2. Scan rapide &gt; 3. Export CSV/PDF &gt; 4. Partage client'),
         TD('Rapport professionnel personnalise exportable en 1 clic pour presentation client')],
    ], [80, 110, 140, 120]))
    E.append(sp(4))
    E.append(p_left("<i>Tableau 2 : Parcours d'onboarding par persona</i>"))

    # 1.4 KPI d'onboarding
    E.append(h2("1.4 KPI de Suivi d'Onboarding"))
    E.append(tbl([
        [TH('KPI'), TH('Definition'), TH('Cible'), TH('Frequence de mesure')],
        [TD('Time to First Value (TTFV)'), TD('Temps entre inscription et premier resultat actionnable'), TD('&lt; 15 minutes'), TD('Temps reel (PostHog)'],
        [TD('Activation Rate'), TD('% d\'utilisateurs completant ICP + scan en 72h'), TD('55%+'), TD('Hebdomadaire')],
        [TD('Onboarding Completion Rate'), TD('% d\'utilisateurs terminant le parcours guide'), TD('70%+'), TD('Hebdomadaire')],
        [TD('Drop-off par etape'), TD('% d\'abandon a chaque etape du funnel'), TD('&lt; 10% / etape'), TD('Quotidien')],
        [TD('Day-1 Retention'), TD('% d\'utilisateurs actifs le lendemain de l\'inscription'), TD('60%+'), TD('Quotidien')],
        [TD('Trial-to-Paid Rate'), TD('% de trials convertis en abonnement payant'), TD('25%+'), TD('Mensuel')],
    ], [110, 140, 75, 110]))
    E.append(sp(4))
    E.append(p_left("<i>Tableau 3 : KPI de suivi de l'onboarding</i>"))
    E.append(PageBreak())
    return E


# ===== SECTION 2: PREMIERE EXPERIENCE UTILISATEUR =====
def sec_ftue():
    E = []
    E.append(h1("2. Premiere Experience Utilisateur (FTUE)"))
    E.append(hr())

    E.append(h2("2.1 Parcours d'Onboarding Etape par Etape"))
    E.append(p(
        "Le parcours de First-Time User Experience (FTUE) est concu comme une sequence guidee de 9 etapes, "
        "chaque etape etant optimisee pour minimiser la friction et maximiser la progression vers l'activation. "
        "Le parcours complet est estime entre 10 et 15 minutes."
    ))
    E.append(sp(4))
    E.append(tbl([
        [TH('#'), TH('Etape'), TH('Description'), TH('Temps estime'), TH('Drop-off cible')],
        [TD('1', True), TD('<b>Ecran de bienvenue &amp; creation workspace</b>'),
         TD('Message de bienvenue personnalise, choix du nom du workspace, selection du logo. Aucune donnee de carte bancaire requise.'),
         TD('30 sec', True), TD('2%', True)],
        [TD('2', True), TD('<b>Selection du role</b>'),
         TD('Auto-detecte depuis la source d\'inscription (LinkedIn, Google, email pro). 4 choix : Analyste M&amp;A, Directeur CorpDev, Partner PE/VC, Consultant. Possibilite de modifier.'),
         TD('15 sec', True), TD('3%', True)],
        [TD('3', True), TD('<b>Focus sectoriel</b>'),
         TD('Selection multi-choix parmi 12 secteurs (SaaS, FinTech, E-sante, Industrie 4.0, etc.) avec pre-selection intelligente basee sur le role.'),
         TD('20 sec', True), TD('4%', True)],
        [TD('4', True), TD('<b>Assistant ICP (Wizard)</b>'),
         TD('Choix entre 8 templates pre-configures ou creation personnalisee guidée. Criteres : taille, CA, secteur, signaux, localisation. Validation en temps reel de la qualite de l\'ICP.'),
         TD('3 min', True), TD('12%', True)],
        [TD('5', True), TD('<b>Lancement du premier scan</b>'),
         TD('Bouton CTA prominent \"Lancer mon premier scan\". Barre de progression animee. Indication du nombre d\'entreprises analysees en temps reel. Temps de scan : 2-5 min.'),
         TD('4 min', True), TD('8%', True)],
        [TD('6', True), TD('<b>Decouverte du dashboard resultats</b>'),
         TD('Tour interactif du dashboard : score de fit, repartition sectorielle, signaux forts, top cibles. Callout pour les fonctionnalites cles.'),
         TD('2 min', True), TD('5%', True)],
        [TD('7', True), TD('<b>Deep-dive sur un profil entreprise</b>'),
         TD('Invitation a cliquer sur une entreprise recommandee. Decouverte de la fiche detaillee : donnees financieres, OSINT, GraphRAG, contacts. Modal de feedback.'),
         TD('2 min', True), TD('6%', True)],
        [TD('8', True), TD('<b>Creation du pipeline</b>'),
         TD('Guide pour ajouter 3+ entreprises au pipeline Kanban. Presentation des colonnes (Prospect, Qualifie, En discussion, LOI, Term Sheet, Clot).'),
         TD('1 min', True), TD('5%', True)],
        [TD('9', True), TD('<b>Connection CRM (optionnel)</b>'),
         TD('Etape facultative. Proposition de connecter Salesforce, HubSpot ou Pipedrive. Tutorial rapide en 3 etapes. Peut etre differe.'),
         TD('1 min', True), TD('20%', True)],
    ], [22, 110, 195, 55, 55]))
    E.append(sp(4))
    E.append(p_left("<i>Tableau 4 : Parcours FTUE detaille avec estimation de temps et drop-off</i>"))

    # 2.2 Analyse Drop-off
    E.append(h2("2.2 Analyse et Optimisation des Points de Friction"))
    E.append(p(
        "L'analyse des points de drop-off est realisee en continu via PostHog. Les etapes identifiees comme les plus "
        "critiques sont l'etape 4 (Assistant ICP) et l'etape 5 (Premier scan), qui representent ensemble plus de 50% "
        "des abandons. Les strategies d'optimisation incluent :"
    ))
    E.append(bul("<b>Pre-remplissage intelligent</b> : lorsque le role et le secteur sont selectionnes, les criteres ICP sont automatiquement pre-remplis avec des valeurs recommandees, reduisant l'effort de saisie de 60%."))
    E.append(bul("<b>Scan express</b> : en complement du scan complet, un \"scan express\" (30 secondes) est propose pour montrer un apercu instantane de 10 resultats. Cela reduit le drop-off a l'etape 5 de 8% a 3%."))
    E.append(bul("<b>Re-engagement email</b> : si l'utilisateur abandonne entre les etapes 3 et 5, un email automatique est envoye a H+2 avec un lien de reprise one-click."))
    E.append(bul("<b>Chat onboarding</b> : un assistant conversationnel (powered par LLM) est disponible a chaque etape pour repondre aux questions et guider l'utilisateur en temps reel."))
    E.append(bul("<b>Sauvegarde progressive</b> : chaque etape est sauvegardee automatiquement, permettant a l'utilisateur de reprendre son parcours exactement ou il s'est arrete."))

    # 2.3 Empty States
    E.append(h2("2.3 Conception des Etats Vides (Empty States)"))
    E.append(p(
        "Les etats vides sont des moments critiques de l'experience utilisateur. Avant que l'utilisateur n'ait genere "
        "ses premieres donnees, chaque ecran affiche un message encourageant et une action claire :"
    ))
    E.append(tbl([
        [TH('Ecran'), TH('Message Empty State'), TH('Action proposee')],
        [TD('Dashboard principal'),
         TD('"Votre premier scan est en cours de preparation. Pendant ce temps, decouvrez les fonctionnalites cles de DealScope."'),
         TD('Lancer le scan | Voir le tutoriel rapide')],
        [TD('Pipeline Kanban'),
         TD('"Votre pipeline est vide. Ajoutez des entreprises depuis les resultats de votre scan pour commencer a les suivre."'),
         TD('Voir les resultats du scan | Importer depuis CRM')],
        [TD('Liste de contacts'),
         TD('"Aucun contact pour le moment. Explorez les fiches entreprises pour decouvrir les decideurs cles."'),
         TD('Parcourir les entreprises | Lancer une recherche')],
        [TD('Rapports d\'analyse'),
         TD('"Vos rapports d\'analyse apparaitront ici une fois vos premiers scans termines."'),
         TD('Voir le statut des scans | Consulter un exemple')],
        [TD('Sequences email'),
         TD('"Vous n\'avez pas encore de sequence email active. Creez-en une pour contacter vos cibles."'),
         TD('Creer une sequence | Voir les templates')],
    ], [85, 195, 145]))
    E.append(sp(4))
    E.append(p_left("<i>Tableau 5 : Conception des etats vides par ecran</i>"))
    E.append(PageBreak())
    return E


# ===== SECTION 3: GUIDES INTERACTIFS IN-APP =====
def sec_guides_interactifs():
    E = []
    E.append(h1("3. Guides Interactifs In-App"))
    E.append(hr())

    E.append(h2("3.1 Systeme de Tooltips Contextuels"))
    E.append(p(
        "Chaque fonctionnalite de DealScope est accompagnee de tooltips contextuels qui s'affichent au survol ou au premier "
        "passage de l'utilisateur. Ces tooltips sont concis (2-3 lignes maximum), informatifs et actionnables. Ils "
        "disparaissent apres 3 interactions avec la fonctionnalite concernee, mais restent accessibles via un point d'interrogation "
        "en permanence. Le systeme est configure via PostHog ou une solution custom basee sur des evenements d'usage."
    ))
    E.append(bul("<b>Info-bulles basiques</b> : description courte de chaque element d'interface (boutons, champs, colonnes)."))
    E.append(bul("<b>Info-bulles avancees</b> : explication des concepts metier (ICP, scoring, signaux d'acquisition, GraphRAG)."))
    E.append(bul("<b>Info-bulles contextuelles</b> : reactivites basees sur l'action en cours (\"Cliquez ici pour exporter en format CRM\")."))

    E.append(h2("3.2 Systeme de Checklist d'Onboarding"))
    E.append(p(
        "Une checklist d'onboarding persistante est affichee dans la barre laterale jusqu'a ce que toutes les etapes "
        "soient completees. Elle offre une vision claire de la progression et motive l'utilisateur via un systeme de gamification "
        "leger (progression en pourcentage, badges de completion)."
    ))
    E.append(tbl([
        [TH('Etape'), TH('Description'), TH('Statut'), TH('Recompense')],
        [TD('Workspace cree'), TD('Votre espace de travail est configure'), TD('Automatique'), TD('5% progression')],
        [TD('Role defini'), TD('Votre profil est personnalise'), TD('Automatique'), TD('10% progression')],
        [TD('ICP complete'), TD('Votre premier profil cible est pret'), TD('Manuel'), TD('30% progression')],
        [TD('Premier scan lance'), TD('La recherche de cibles est en cours'), TD('Manuel'), TD('50% progression + badge')],
        [TD('Pipeline initialise'), TD('Votre pipeline M&amp;A est cree'), TD('Manuel'), TD('75% progression')],
        [TD('CRM connecte'), TD('Vos donnees sont synchronisees'), TD('Optionnel'), TD('100% + badge Expert')],
    ], [95, 160, 70, 110]))
    E.append(sp(4))
    E.append(p_left("<i>Tableau 6 : Checklist d'onboarding avec progression et badges</i>"))

    E.append(h2("3.3 Tours Interactifs"))
    E.append(p(
        "Cinq tours interactifs sont disponibles dans l'application, declenchables manuellement ou automatiquement "
        "lorsque l'utilisateur atteint la fonctionnalite concernee pour la premiere fois. Chaque tour utilise des "
        "spotlights, des annotations et des modals pour guider l'utilisateur pas a pas."
    ))
    E.append(tbl([
        [TH('Tour'), TH('Theme'), TH('Etapes'), TH('Declenchement')],
        [TD('<b>Tour 1</b>'), TD('Vue d\'ensemble du Dashboard'), TD('5 etapes : sidebar, KPI, resultats scan, pipeline, alertes'), TD('Automatique apres 1er scan')],
        [TD('<b>Tour 2</b>'), TD('Creation d\'un profil ICP'), TD('4 etapes : criteres de base, signaux, poids, validation'), TD('Automatique a la 1ere creation')],
        [TD('<b>Tour 3</b>'), TD('Interpretation des resultats de scan'), TD('6 etapes : vue liste, carte, filtres, tri, export, deep-dive'), TD('Automatique apres 1er scan')],
        [TD('<b>Tour 4</b>'), TD('Gestion du Pipeline'), TD('3 etapes : colonnes, drag&amp;drop, ajout de notes'), TD('Automatique a la 1ere utilisation')],
        [TD('<b>Tour 5</b>'), TD('Sequences Email'), TD('5 etapes : template, personnalisation, A/B test, envoi, suivi'), TD('Automatique a la 1ere sequence')],
    ], [55, 115, 175, 100]))
    E.append(sp(4))
    E.append(p_left("<i>Tableau 7 : Tours interactifs disponibles</i>"))

    E.append(h2("3.4 Smart Nudges (Suggestions Comportementales)"))
    E.append(p(
        "Contrairement aux notifications temporelles genantes, les smart nudges de DealScope sont declenches par le "
        "comportement reel de l'utilisateur, offrant des suggestions pertinentes au moment opportun :"
    ))
    E.append(bul("<b>Apres 3 entreprises consultees sans ajout au pipeline</b> : \"Ces cibles correspondent a votre ICP. Voulez-vous les ajouter a votre pipeline ?\""))
    E.append(bul("<b>Si aucun scan lance depuis 7 jours</b> : \"Vos donnees ICP ont peut-etre evolue. Lancez un nouveau scan pour decouvrir de nouvelles cibles.\""))
    E.append(bul("<b>Si 10+ entreprises dans le pipeline sans action depuis 5 jours</b> : \"Certaines de vos cibles n'ont pas ete contactees. Creez une sequence email.\""))
    E.append(bul("<b>Apres consultation de 5 fiches entreprises</b> : \"Decouvrez comment notre IA analyse automatiquement ces entreprises avec GraphRAG.\""))

    E.append(h2("3.5 Modal \"Nouveautes\""))
    E.append(p(
        "A chaque mise a jour majeure, un modal \"What's new\" est affiche lors de la prochaine connexion de l'utilisateur. "
        "Ce modal presente les nouvelles fonctionnalites avec des captures d'ecran, des GIFs demonstratifs et des liens "
        "vers la documentation. Les modal sont archivables et accessibles depuis un lien \"Historique des nouveautes\" dans "
        "la sidebar. Le systeme est concu pour ne jamais bloquer le workflow de l'utilisateur."
    ))
    E.append(PageBreak())
    return E


# ===== SECTION 4: TEMPLATES PRE-CONFIGURES ICP =====
def sec_templates_icp():
    E = []
    E.append(h1("4. Templates Pre-configures ICP"))
    E.append(hr())

    E.append(p(
        "DealScope met a disposition 8 templates d'ICP pre-configures, couvrant les strategies d'acquisition les plus "
        "courantes du marche M&amp;A francais et europeen. Chaque template inclut des criteres pre-remplis, des poids "
        "de scoring optimises et des filtres suggestes. L'utilisateur peut utiliser un template tel quel ou le personnaliser."
    ))
    E.append(sp(4))

    # Template 1
    E.append(h2("4.1 Template 1 : Private Equity Mid-Market France"))
    E.append(tbl([
        [THL('Critere'), THL('Valeur')],
        [TD('<b>Secteur</b>'), TD('B2B SaaS, Cloud, Data, Cybersecurite')],
        [TD('<b>Chiffre d\'affaires</b>'), TD('5-50M EUR')],
        [TD('<b>Nombre d\'employes</b>'), TD('20-200')],
        [TD('<b>Croissance CA (3 ans)</b>'), TD('&gt; 15% par an')],
        [TD('<b>Marge recurrente (ARR)</b>'), TD('&gt; 60%')],
        [TD('<b>Fondeurs encore actifs</b>'), TD('Oui (preference)')],
        [TD('<b>Signaux d\'acquisition</b>'), TD('Levee de fonds Serie A/B recente, recrutement key execs, expansion internationale')],
        [TD('<b>Persona fit</b>'), TD('Partner PE/VC, Analyste M&amp;A')],
    ], [140, 310]))
    E.append(sp(4))

    # Template 2
    E.append(h2("4.2 Template 2 : Corporate Development Tech"))
    E.append(tbl([
        [THL('Critere'), THL('Valeur')],
        [TD('<b>Secteur</b>'), TD('SaaS scale-up, AI/ML, FinTech, e-commerce')],
        [TD('<b>Chiffre d\'affaires</b>'), TD('10-100M EUR')],
        [TD('<b>Stade de financement</b>'), TD('Serie B a Serie C')],
        [TD('<b>Complementarite strategique</b>'), TD('Technologie, marche, talents')],
        [TD('<b>Localisation</b>'), TD('France, Europe (extension Nord-americaine pour certain corporates)')],
        [TD('<b>Signaux d\'acquisition</b>'), TD('Ralentissement de la croissance, pivot strategique, CTO/COO depart')],
        [TD('<b>Persona fit</b>'), TD('Directeur CorpDev')],
    ], [140, 310]))
    E.append(sp(4))

    # Template 3
    E.append(h2("4.3 Template 3 : Succession Familiale PME"))
    E.append(tbl([
        [THL('Critere'), THL('Valeur')],
        [TD('<b>Secteur</b>'), TD('Industrie, Services B2B, Commerce de gros')],
        [TD('<b>Chiffre d\'affaires</b>'), TD('5-30M EUR')],
        [TD('<b>Anciennete</b>'), TD('35+ ans')],
        [TD('<b>Signal cle</b>'), TD('Age du dirigeant &gt; 55 ans, pas de repreneur identifie')],
        [TD('<b>Performance</b>'), TD('EBITDA &gt; 1M EUR, stabilite financiere')],
        [TD('<b>Signaux</b>'), TD('Dirigeant en age de depart, absence de succession familial, mandats de courtage')],
        [TD('<b>Persona fit</b>'), TD('Consultant independant, PE/VC')],
    ], [140, 310]))
    E.append(sp(4))

    # Template 4
    E.append(h2("4.4 Template 4 : Actifs en Difficulte (Distressed)"))
    E.append(tbl([
        [THL('Critere'), THL('Valeur')],
        [TD('<b>Signal principal</b>'), TD('Redressement judiciaire, procedure de sauvegarde, preliquidation')],
        [TD('<b>Evolution CA</b>'), TD('Baisse &gt; 20% sur 12 mois')],
        [TD('<b>Secteur</b>'), TD('Retail, Industrie traditionnelle, Tourisme, Immobilier')],
        [TD('<b>CA minimum</b>'), TD('&gt; 3M EUR (valeur d\'actifs a sauvegarder)')],
        [TD('<b>Signaux OSINT</b>'), TD('Annonces tribunal de commerce, licenciements collectifs, retard paiement fournisseurs')],
        [TD('<b>Persona fit</b>'), TD('PE/VC specialise turn-around, Analyste M&amp;A')],
    ], [140, 310]))
    E.append(sp(4))

    # Template 5
    E.append(h2("4.5 Template 5 : M&A Transfrontalier (Cross-Border)"))
    E.append(tbl([
        [THL('Critere'), THL('Valeur')],
        [TD('<b>Geographie</b>'), TD('France et UK / Allemagne')],
        [TD('<b>Secteur</b>'), TD('Tech companies (SaaS, FinTech, DeepTech)')],
        [TD('<b>CA</b>'), TD('10-100M EUR')],
        [TD('<b>Signaux</b>'), TD('Expansion transfrontaliere, ouverture bureau, partenariats internationaux, nommage de comite de方向 (direction internationale)')],
        [TD('<b>Criteres</b>'), TD('Compliance reglementaire OK (RGPD, MAR), equipe internationale, double comptabilite')],
        [TD('<b>Persona fit</b>'), TD('Directeur CorpDev international, Partner PE cross-border')],
    ], [140, 310]))
    E.append(sp(4))

    # Template 6
    E.append(h2("4.6 Template 6 : E-sante et IT Medicale"))
    E.append(tbl([
        [THL('Critere'), THL('Valeur')],
        [TD('<b>Secteur</b>'), TD('E-sante, Telemecine, Biotech IT, MedTech')],
        [TD('<b>CA</b>'), TD('2-20M EUR')],
        [TD('<b>Certifications</b>'), TD('CE medical, HDS, ISO 13485')],
        [TD('<b>Signaux</b>'), TD('Homologation nouveau produit, partenariat hopital, brevet depose, levee de fonds')],
        [TD('<b>Reglementation</b>'), TD('Conformite RGPD + donnees de sante (HDS), accord CADRE')],
        [TD('<b>Persona fit</b>'), TD('PE/VC sante, Analyste M&amp;A')],
    ], [140, 310]))
    E.append(sp(4))

    # Template 7
    E.append(h2("4.7 Template 7 : Buy-and-Build FinTech"))
    E.append(tbl([
        [THL('Critere'), THL('Valeur')],
        [TD('<b>Secteur</b>'), TD('Paiements, InsurTech, WealthTech, RegTech, Neo-banque')],
        [TD('<b>CA</b>'), TD('&lt; 50M EUR')],
        [TD('<b>Model</b>'), TD('SaaS, Marketplace, API-first')],
        [TD('<b>Licence</b>'), TD('ACPR / AMF, PSD2, EMI')],
        [TD('<b>Signaux</b>'), TD('Integration API tierce, partenariats bancaires, adoption B2B rapide')],
        [TD('<b>Persona fit</b>'), TD('Partner PE/VC FinTech, Directeur CorpDev bancaire')],
    ], [140, 310]))
    E.append(sp(4))

    # Template 8
    E.append(h2("4.8 Template 8 : Consolidation Industrielle"))
    E.append(tbl([
        [THL('Critere'), THL('Valeur')],
        [TD('<b>Secteur</b>'), TD('Industrie 4.0, IoT, Robotique, Automatisation')],
        [TD('<b>CA</b>'), TD('10-100M EUR')],
        [TD('<b>Model</b>'), TD('B2B, equiements industriels, solutions embedded')],
        [TD('<b>Criteres</b>'), TD('SAV/contrats recurrents &gt; 30% CA, base clients diversifiee, savoir-faire technique unique')],
        [TD('<b>Signaux</b>'), TD('Investissement R&amp;D important, depots brevets, marches a l\'etranger, restructuration')],
        [TD('<b>Persona fit</b>'), TD('PE/VC industrie, Corporate M&amp;A industriel')],
    ], [140, 310]))
    E.append(sp(4))
    E.append(p_left("<i>Tableau 8-15 : 8 templates ICP pre-configures pour couvrir les principales strategies M&amp;A</i>"))
    E.append(PageBreak())
    return E


# ===== SECTION 5: CENTRE D'AIDE & KNOWLEDGE BASE =====
def sec_centre_aide():
    E = []
    E.append(h1("5. Centre d'Aide &amp; Knowledge Base"))
    E.append(hr())

    E.append(h2("5.1 Structure du Centre d'Aide"))
    E.append(p(
        "Le centre d'aide DealScope est organise de maniere hierarchique pour permettre une recherche rapide et intuitive. "
        "Il utilise GitBook ou une solution custom (Next.js + MDX) integree dans le domaine help.dealscope.ai. La structure "
        "couvre 10 categories avec un total de 50+ articles."
    ))
    E.append(tbl([
        [TH('Categorie'), TH('Nombre d\'articles'), TH('Articles principaux')],
        [TD('<b>Getting Started</b>'), TD('5', True),
         TD('Guide de demarrage rapide | Creer votre workspace | Configurer votre profil | Premier scan | Checklist onboarding')],
        [TD('<b>ICP &amp; Scoring</b>'), TD('8', True),
         TD('Comprendre les ICP | Creer un profil ICP | Templates ICP | Scoring de fit | Poids et critres | Modifier un ICP | ICP multi-criteres | Bonnes pratiques')],
        [TD('<b>OSINT &amp; Sources de donnees</b>'), TD('6', True),
         TD('Sources de donnees | Verification des donnees | Mises a jour en temps reel | Historique des entreprises | Compliance RGPD | Api data')],
        [TD('<b>Rapports d\'analyse</b>'), TD('5', True),
         TD('Rapports automatiques | Analyse GraphRAG | Rapports personnalises | Export PDF/CSV | Intelligence artificielle')],
        [TD('<b>Sequences Email</b>'), TD('4', True),
         TD('Creer une sequence | Templates d\'email | A/B testing | Suivi des performances')],
        [TD('<b>Pipeline M&amp;A</b>'), TD('3', True),
         TD('Gestion du pipeline Kanban | Etapes du pipeline | Collaborer sur le pipeline')],
        [TD('<b>Integration CRM</b>'), TD('4', True),
         TD('Connecter Salesforce | Connecter HubSpot | Connecter Pipedrive | Synchronisation bidirectionnelle')],
        [TD('<b>API &amp; Webhooks</b>'), TD('6', True),
         TD('Documentation API | Authentification | Endpoints | Webhooks | SDK Python | SDK JavaScript')],
        [TD('<b>Facturation &amp; Plans</b>'), TD('5', True),
         TD('Plans et tarifs | Essai gratuit | Facturation annuelle | Gestion de l\'abonnement | Cancelation')],
        [TD('<b>Securite &amp; Confiance</b>'), TD('4', True),
         TD('Chiffrement des donnees | Conformite RGPD | Certification SOC 2 | Politique de retention')],
    ], [95, 60, 295]))
    E.append(sp(4))
    E.append(p_left("<i>Tableau 16 : Structure du centre d'aide (50+ articles)</i>"))

    E.append(h2("5.2 FAQ (25+ questions)"))
    E.append(p(
        "La FAQ est structuree en 6 categories pour une navigation rapide. Les questions les plus consultees sont "
        "mises en avant et mises a jour mensuellement en fonction des retours du support."
    ))
    E.append(tbl([
        [TH('Categorie'), TH('Questions les plus frequentes')],
        [TD('<b>General</b>'),
         TD('Qu\'est-ce que DealScope ? Comment fonctionne la plateforme ? Quels sont les plans et tarifs ? Existe-t-il un essai gratuit ? Combien d\'utilisateurs par plan ?')],
        [TD('<b>Donnees</b>'),
         TD('D\'ou proviennent les donnees ? Quelle est la precision des donnees ? Les donnees sont-elles conformes RGPD ? A quelle frequence les donnees sont-elles mises a jour ?')],
        [TD('<b>Fonctionnalites</b>'),
         TD('Qu\'est-ce que les agents IA ? Qu\'est-ce que GraphRAG ? Comment fonctionnent les sequences email ? Qu\'est-ce qu\'un ICP ?')],
        [TD('<b>Technique</b>'),
         TD('Comment acceder a l\'API ? Quelles integrations sont disponibles ? Quels navigateurs sont supportes ? Comment fonctionne la synchronisation CRM ?')],
        [TD('<b>Facturation</b>'),
         TD('Comment annuler mon abonnement ? Quelle est la politique de remboursement ? Comment changer de plan ? Y a-t-il un engagement ?')],
        [TD('<b>Securite</b>'),
         TD('Les donnees sont-elles chiffrees ? DealScope est-il certifie SOC 2 ? Comment demander la suppression de mes donnees ? Où sont hebergees les donnees ?')],
    ], [80, 370]))
    E.append(sp(4))
    E.append(p_left("<i>Tableau 17 : FAQ structuree par categorie (25+ questions)</i>"))

    E.append(h2("5.3 Plan de Video-Tutoriels"))
    E.append(p(
        "Un programme de 12 video-tutoriels est prevu, d'une duree de 5 a 10 minutes chacun. Les videos sont hebergees "
        "sur YouTube et integrees dans le centre d'aide. Elles sont sous-titrees en francais et en anglais."
    ))
    E.append(tbl([
        [TH('#'), TH('Titre'), TH('Duree'), TH('Audience')],
        [TD('1', True), TD('Decouverte de DealScope en 5 min'), TD('5 min', True), TD('Tous les debutants')],
        [TD('2', True), TD('Creer votre premier ICP'), TD('7 min', True), TD('Analystes, Consultants')],
        [TD('3', True), TD('Lancer et interpreter un scan'), TD('8 min', True), TD('Analystes, PE/VC')],
        [TD('4', True), TD('Explorer le GraphRAG'), TD('6 min', True), TD('Analystes, CorpDev')],
        [TD('5', True), TD('Gerer votre pipeline M&amp;A'), TD('5 min', True), TD('Tous les utilisateurs')],
        [TD('6', True), TD('Sequences email avancees'), TD('8 min', True), TD('Analystes, Consultants')],
        [TD('7', True), TD('Integrer votre CRM'), TD('7 min', True), TD('CorpDev, Admins')],
        [TD('8', True), TD('Utiliser l\'API DealScope'), TD('10 min', True), TD('Developpeurs')],
        [TD('9', True), TD('Configuration equipe et permissions'), TD('6 min', True), TD('Admins workspace')],
        [TD('10', True), TD('Analyse de portefeuille PE/VC'), TD('8 min', True), TD('PE/VC Partners')],
        [TD('11', True), TD('Exporter et partager des rapports'), TD('5 min', True), TD('Consultants')],
        [TD('12', True), TD('Bonnes pratiques M&amp;A intelligence'), TD('10 min', True), TD('Tous les utilisateurs')],
    ], [22, 195, 50, 170]))
    E.append(sp(4))
    E.append(p_left("<i>Tableau 18 : Plan de video-tutoriels (12 videos)</i>"))

    E.append(h2("5.4 Optimisation de la Recherche"))
    E.append(p(
        "Le centre d'aide intègre un moteur de recherche full-text optimise avec les fonctionnalites suivantes :"
    ))
    E.append(bul("<b>Auto-completion</b> : suggestions de recherche en temps reel basees sur les requetes populaires."))
    E.append(bul("<b>Recherche semantique</b> : utilisation d'embeddings pour comprendre les intentions derriere les requetes (ex : \"comment trouver des cibles\" redirige vers l'article ICP)."))
    E.append(bul("<b>Articles lies</b> : chaque article suggere 3-5 articles connexes en bas de page."))
    E.append(bul("<b>Feedback sur articles</b> : chaque article propose un feedback \"Cet article a-t-il ete utile ? (Oui/Non)\" pour ameliorer la qualite."))
    E.append(bul("<b>Analytics</b> : suivi des articles les plus consultes, du temps moyen de lecture et du taux de resolution pour identifier les lacunes documentaires."))
    E.append(PageBreak())
    return E


# ===== SECTION 6: DOCUMENTATION API (DEVELOPER PORTAL) =====
def sec_doc_api():
    E = []
    E.append(h1("6. Documentation API (Developer Portal)"))
    E.append(hr())

    E.append(h2("6.1 Structure du Portail Developpeur"))
    E.append(p(
        "Le portail developpeur de DealScope est accessible a l'adresse api.dealscope.ai/docs. Il fournit "
        "une documentation complete de l'API REST et GraphQL, ainsi que des guides d'integration pour les developpeurs."
    ))
    E.append(bul("<b>API Reference</b> : documentation interactive Swagger/OpenAPI avec try-it-out en ligne."))
    E.append(bul("<b>GraphQL Schema</b> : schema complet avec introspection, types, mutations et subscriptions."))
    E.append(bul("<b>Authentication Guide</b> : guide d'authentification via API Key, OAuth 2.0 et JWT."))
    E.append(bul("<b>Quickstart Guide</b> : premier appel API en 5 minutes avec exemples copier-coller."))
    E.append(bul("<b>Changelog</b> : historique des versions API avec breaking changes et deprecations."))
    E.append(bul("<b>Status Page</b> : statut en temps reel de l'API et des services associes."))

    E.append(h2("6.2 Exemples SDK"))
    E.append(p(
        "Des SDK officiels sont disponibles en Python et JavaScript pour accelerer l'integration :"
    ))
    E.append(h3("SDK Python"))
    E.append(Paragraph(
        "from dealscope import DealScopeClient<br/>"
        "client = DealScopeClient(api_key='ds_pk_live_xxxx')<br/>"
        "# Creer un profil ICP<br/>"
        "icp = client.icp.create(name='PE Mid-Market', sector='SaaS', revenue_min=5000000, revenue_max=50000000)<br/>"
        "# Lancer un scan<br/>"
        "scan = client.scans.create(icp_id=icp.id)<br/>"
        "# Recuperer les resultats<br/>"
        "results = client.scans.results(scan.id)",
        ParagraphStyle('Code', parent=sty['Normal'], fontName='DejaVuSans', fontSize=8.5, leading=13, textColor=C_TEXT, backColor=colors.HexColor('#F5F5F5'), leftIndent=10, borderPadding=8)
    ))
    E.append(sp(6))
    E.append(h3("SDK JavaScript"))
    E.append(Paragraph(
        "import { DealScopeClient } from '@dealscope/sdk';<br/>"
        "const client = new DealScopeClient({ apiKey: 'ds_pk_live_xxxx' });<br/>"
        "const icp = await client.icp.create({ name: 'PE Mid-Market', sector: 'SaaS', revenueMin: 5000000, revenueMax: 50000000 });<br/>"
        "const scan = await client.scans.create({ icpId: icp.id });<br/>"
        "const results = await client.scans.results(scan.id);",
        ParagraphStyle('CodeJS', parent=sty['Normal'], fontName='DejaVuSans', fontSize=8.5, leading=13, textColor=C_TEXT, backColor=colors.HexColor('#F5F5F5'), leftIndent=10, borderPadding=8)
    ))

    E.append(h2("6.3 Guide de Test des Webhooks"))
    E.append(p(
        "Le guide de test des webhooks inclut : un webhook tester integre dans le portail (simule des payloads), "
        "des exemples de signatures HMAC-SHA256 pour la verification, une liste de tous les evenements subscribable "
        "(scan.completed, company.scored, pipeline.stage_changed, email.sequences.opened), et un outil de rejeu "
        "de webhooks pour le debugging."
    ))

    E.append(h2("6.4 Documentation Rate Limiting"))
    E.append(tbl([
        [TH('Plan'), TH('Rate Limit (req/min)'), TH('Rate Limit (req/heure)'), TH('Burst')],
        [TD('Starter'), TD('30', True), TD('1 000', True), TD('50', True)],
        [TD('Pro'), TD('100', True), TD('5 000', True), TD('200', True)],
        [TD('Business'), TD('300', True), TD('15 000', True), TD('500', True)],
        [TD('Enterprise'), TD('Custom', True), TD('Custom', True), TD('Custom', True)],
    ], [80, 110, 120, 100]))
    E.append(sp(4))
    E.append(p(
        "Les headers de reponse incluent : X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset. "
        "En cas de depassement, l'API retourne un code 429 avec un header Retry-After."
    ))
    E.append(PageBreak())
    return E


# ===== SECTION 7: WEBINAIRES & PROGRAMME DE FORMATION =====
def sec_webinaires():
    E = []
    E.append(h1("7. Webinaires &amp; Programme de Formation"))
    E.append(hr())

    E.append(h2("7.1 Calendrier Mensuel des Webinaires"))
    E.append(p(
        "DealScope organise un programme de webinaires reguliers pour accompagner les utilisateurs a chaque etape "
        "de leur parcours. Tous les webinaires sont enregistres et disponibles en replay dans le centre d'aide."
    ))
    E.append(tbl([
        [TH('Type'), TH('Frequence'), TH('Duree'), TH('Contenu'), TH('Audience')],
        [TD('<b>Onboarding</b>'), TD('Hebdomadaire', True), TD('30 min', True),
         TD('Tour de la plateforme, creation ICP, premier scan, pipeline, questions/reponses'),
         TD('Nouveaux utilisateurs')],
        [TD('<b>Fonctionnalites avancees</b>'), TD('Bi-mensuel', True), TD('45 min', True),
         TD('GraphRAG, sequences email, API, CRM, bonnes pratiques M&amp;A intelligence'),
         TD('Utilisateurs actifs')],
        [TD('<b>Focus metier</b>'), TD('Mensuel', True), TD('60 min', True),
         TD('Cas d\'usage specifiques : PE buy-and-build, CorpDev tech, succession familiale, cross-border'),
         TD('Tous les utilisateurs')],
        [TD('<b>Formation Enterprise</b>'), TD('Sur mesure', True), TD('2-4h', True),
         TD('Programme complet personnalise : onboarding equipe, configuration avancee, formation admin, ateliers pratiques'),
         TD('Clients Enterprise')],
    ], [80, 65, 45, 175, 80]))
    E.append(sp(4))
    E.append(p_left("<i>Tableau 19 : Programme de webinaires DealScope</i>"))

    E.append(h2("7.2 Webinaire d'Onboarding Hebdomadaire"))
    E.append(p(
        "Le webinaire d'onboarding hebdomadaire est la pierre angulaire de la strategie de formation. Il est anime "
        "par un Customer Success Manager et couvre le parcours complet en 30 minutes :"
    ))
    E.append(bul("<b>Minutes 0-5</b> : Presentation de DealScope, positionnement, value proposition."))
    E.append(bul("<b>Minutes 5-12</b> : Demonstration live - creation d'un ICP et lancement d'un scan."))
    E.append(bul("<b>Minutes 12-20</b> : Exploration des resultats, pipeline, et premier export."))
    E.append(bul("<b>Minutes 20-27</b> : Fonctionnalites avancees (GraphRAG, sequences email)."))
    E.append(bul("<b>Minutes 27-30</b> : Questions et reponses en direct."))
    E.append(sp(4))
    E.append(p(
        "Chaque webinaire est automatiquement enregistre et disponible en replay sous 2 heures. Les participants "
        "recçoivent un email de suivi avec les slides, le lien replay et un lien vers le centre d'aide."
    ))

    E.append(h2("7.3 Programme de Formation Enterprise"))
    E.append(p(
        "Pour les clients Enterprise (plan Business+), DealScope propose un programme de formation personnalise incluant :"
    ))
    E.append(bul("<b>Session de demarrage</b> (2h) : onboarding complet de l'equipe, configuration du workspace, definition des ICP strategiques."))
    E.append(bul("<b>Formation utilisateurs</b> (4h) : formation approfondie de chaque role (analystes, directeurs, admins)."))
    E.append(bul("<b>Formation admin</b> (2h) : gestion des permissions, configuration des integrations CRM, parametres de securite."))
    E.append(bul("<b>Atelier pratique</b> (2h) : session hands-on avec les donnees reelles du client, creation de pipelines."))
    E.append(bul("<b>Suivi mensuel</b> (30 min) : review de l'usage, bonnes pratiques, nouvelles fonctionnalites."))
    E.append(sp(4))
    E.append(p(
        "Le programme est accompagne d'un Customer Success Manager dedie et d'un canal Slack/Teams prive pour "
        "le support prioritaire. L'objectif est d'atteindre 90%+ d'adoption au sein de l'equipe client en 30 jours."
    ))
    E.append(PageBreak())
    return E


# ===== SECTION 8: FAQ DETAILLEE =====
def sec_faq():
    E = []
    E.append(h1("8. Foire Aux Questions (FAQ)"))
    E.append(hr())

    E.append(h2("8.1 Questions Generales"))
    E.append(h3("Q1 : Qu'est-ce que DealScope ?"))
    E.append(p(
        "DealScope est une plateforme SaaS d'intelligence M&amp;A propulsee par l'IA, concue specifiquement pour "
        "les equipes mid-market. Elle automatise le sourcing de deals, l'analyse OSINT et la qualification automatique "
        "des cibles d'acquisition grace a 5 agents IA orchestres."
    ))
    E.append(h3("Q2 : Comment fonctionne DealScope ?"))
    E.append(p(
        "DealScope utilise des agents IA bases sur LangGraph pour orchestrer plusieurs etapes : definition d'un profil "
        "ICP cible, scanning automatique de milliers d'entreprises, analyse OSINT multi-sources, scoring de fit predictive "
        "via GraphRAG, et generation de rapports d'analyse actionnables. Tout est accessible via une interface web intuitive."
    ))
    E.append(h3("Q3 : Quels sont les plans et tarifs ?"))
    E.append(p(
        "DealScope propose 4 plans : Starter a 99 EUR/mois, Pro a 299 EUR/mois, Business a 499 EUR/mois et Enterprise "
        "sur devis. Chaque plan inclut un essai gratuit de 14 jours sans carte bancaire. La facturation annuelle offre "
        "une remise de 20%."
    ))
    E.append(h3("Q4 : Existe-t-il un essai gratuit ?"))
    E.append(p(
        "Oui, chaque plan inclut un essai gratuit de 14 jours avec acces complet aux fonctionnalites du plan Pro. "
        "Aucune carte bancaire n'est requise. Vous pouvez annuler a tout moment pendant la periode d'essai."
    ))

    E.append(h2("8.2 Questions sur les Donnees"))
    E.append(h3("Q5 : D'ou proviennent les donnees ?"))
    E.append(p(
        "Les donnees proviennent de 15+ sources : bases de donnees publiques (INPI, Pappers, BODACC), registres "
        "d'entreprises europeens, APIs commerciales (Apollo, Crunchbase), sources web OSINT (sites entreprises, "
        "presse financiere, reseaux sociaux), et donnees financieres publiees."
    ))
    E.append(h3("Q6 : Quelle est la precision des donnees ?"))
    E.append(p(
        "Les donnees financieres ont une precision de 85-95% pour les entreprises francaises (verifiees via INPI et "
        "Pappers). Les donnees de contact sont verifiees en temps reel et ont un taux de deliverabilite de 90%+. "
        "L'IA de DealScope croise les sources pour maximiser la fiabilite."
    ))
    E.append(h3("Q7 : Les donnees sont-elles conformes RGPD ?"))
    E.append(p(
        "Oui, DealScope est entierement conforme au RGPD. Toutes les donnees personnelles sont collectees sur une base "
        "legale d'interet legitime (Art. 6.1.f), sont chiffrees (AES-256), et les utilisateurs peuvent exercer leurs "
        "droits (access, rectification, effacement) via le portail ou en contactant le DPO."
    ))

    E.append(h2("8.3 Questions sur les Fonctionnalites"))
    E.append(h3("Q8 : Qu'est-ce que les agents IA ?"))
    E.append(p(
        "Les agents IA sont 5 modeles specialises orchestres par LangGraph : un agent de sourcing qui scanne les bases "
        "de donnees, un agent OSINT qui collecte les informations en ligne, un agent d'analyse qui evalue les signaux, "
        "un agent GraphRAG qui genere des insights a partir du graphe de connaissances, et un agent de reporting qui "
        "synthetise les resultats."
    ))
    E.append(h3("Q9 : Qu'est-ce que GraphRAG ?"))
    E.append(p(
        "GraphRAG (Graph Retrieval-Augmented Generation) combine un graphe de connaissances (Neo4j) avec la generation "
        "augmentee par retrieval (RAG via Weaviate). Cela permet a DealScope de comprendre les relations entre entreprises, "
        "personnes, investisseurs et evenements, et de generer des analyses contextuelles tres riches et pertinentes."
    ))
    E.append(h3("Q10 : Comment fonctionnent les sequences email ?"))
    E.append(p(
        "Les sequences email permettent de creer des campagnes d'outreach personnalisees multi-etapes. Vous pouvez "
        "utiliser des templates, personnaliser avec des variables dynamiques (nom, entreprise, signal), tester des "
        "variantes (A/B), et suivre les performances (ouverture, clic, reponse). L'envoi se fait via SendGrid/Mailgun."
    ))

    E.append(h2("8.4 Questions Techniques"))
    E.append(h3("Q11 : Comment acceder a l'API ?"))
    E.append(p(
        "L'API est accessible via api.dealscope.ai. L'authentification se fait par cle API (ds_pk_live_xxxx) ou "
        "OAuth 2.0. La documentation complete est disponible sur le portail developpeur, avec des SDK en Python et "
        "JavaScript."
    ))
    E.append(h3("Q12 : Quelles integrations sont disponibles ?"))
    E.append(p(
        "DealScope integre nativement Salesforce, HubSpot et Pipedrive pour la synchronisation CRM. Une API REST et "
        "GraphQL est disponible pour les integrations sur mesure. Des webhooks permettent de connecter n'importe quel "
        "systeme externe."
    ))
    E.append(h3("Q13 : Quels navigateurs sont supportes ?"))
    E.append(p(
        "DealScope supporte les dernieres versions de Chrome, Firefox, Safari et Edge. L'application est optimisee "
        "pour une utilisation desktop. L'experience mobile est disponible en mode responsive mais certaines "
        "fonctionnalites avancees requierent un ecran desktop."
    ))

    E.append(h2("8.5 Questions de Facturation"))
    E.append(h3("Q14 : Comment annuler mon abonnement ?"))
    E.append(p(
        "Vous pouvez annuler votre abonnement a tout moment depuis les parametres de votre compte. L'annulation prend "
        "effet a la fin de la periode en cours. Vos donnees sont conservees pendant 30 jours apres l'annulation, puis "
        "supprimees conformement a notre politique de retention."
    ))
    E.append(h3("Q15 : Quelle est la politique de remboursement ?"))
    E.append(p(
        "DealScope offre un remboursement integral sous 30 jours pour tout abonnement annuel. Pour les abonnements "
        "mensuels, aucune facture deja payee n'est remboursee, mais l'acces reste actif jusqu'a la fin de la periode."
    ))

    E.append(h2("8.6 Questions de Securite"))
    E.append(h3("Q16 : Les donnees sont-elles chiffrees ?"))
    E.append(p(
        "Oui, toutes les donnees sont chiffrees au repos (AES-256-GCM) et en transit (TLS 1.3). Les donnees "
        "personnelles (emails, telephones) beneficient d'un chiffrement supplementaire au niveau applicatif "
        "(Field-Level Encryption)."
    ))
    E.append(h3("Q17 : DealScope est-il certifie SOC 2 ?"))
    E.append(p(
        "DealScope est en cours de certification SOC 2 Type II, avec un audit prevu pour le 3e trimestre 2026. "
        "La plateforme est deja conforme aux exigences SOC 2 en matiere de securite, disponibilite et confidentialite. "
        "Un rapport de conformite est disponible sur demande pour les prospects Enterprise."
    ))
    E.append(h3("Q18 : Comment demander la suppression de mes donnees ?"))
    E.append(p(
        "Conformement au RGPD (Article 17), vous pouvez demander la suppression de vos donnees via le portail "
        "utilisateur (Section Donnees et Confidentialite) ou en envoyant une demande a dpo@dealscope.ai. La demande "
        "est traitee dans les 30 jours."
    ))
    E.append(h3("Q19 : Ou sont hebergees les donnees ?"))
    E.append(p(
        "Toutes les donnees sont hebergees dans la region AWS eu-west-3 (Paris). Aucune donnee ne quitte le "
        "territoire de l'Union europeenne. Les backups sont stockes en France et en Allemagne pour la resilience."
    ))
    E.append(h3("Q20 : Comment DealScope protege-t-il contre les fuites de donnees inter-tenants ?"))
    E.append(p(
        "DealScope utilise Row-Level Security (RLS) PostgreSQL pour isoler les donnees de chaque workspace. "
        "Des tests de penetration trimestriels sont realises, et chaque requete API valide le workspace_id "
        "de l'utilisateur. Il n'existe aucun acces cross-tenant possible."
    ))
    E.append(PageBreak())
    return E


# ===== SECTION 9: SYSTEME DE FEEDBACK IN-APP =====
def sec_feedback():
    E = []
    E.append(h1("9. Systeme de Feedback In-App"))
    E.append(hr())

    E.append(h2("9.1 Widget de Feedback (NPS + Texte Libre)"))
    E.append(p(
        "DealScope integre un widget de feedback non-intrusif accessible depuis le coin inferieur droit de l'interface. "
        "Le widget combine un score NPS (Net Promoter Score) et un champ de texte libre pour les suggestions."
    ))
    E.append(bul("<b>Declenchement</b> : automatique apres 14 jours d'utilisation, puis trimestriellement. Peut aussi etre declenche manuellement via le bouton \"Donner votre avis\"."))
    E.append(bul("<b>Score NPS</b> : echelle de 0 a 10, avec categorisation automatique (Detracteurs 0-6, Passifs 7-8, Promoteurs 9-10)."))
    E.append(bul("<b>Texte libre</b> : champ optionnel de 500 caracteres maximum pour les commentaires detailles."))
    E.append(bul("<b>Suivi</b> : les detracteurs recoivent un email automatique du Customer Success Manager sous 24h. Les promoteurs sont invites a laisser un temoignage."))

    E.append(h2("9.2 Votes sur les Demandes de Fonctionnalites"))
    E.append(p(
        "Un systeme de vote sur les demandes de fonctionnalites (Feature Request Board) est accessible depuis le menu "
        "\"Idees &amp; Votes\". Les utilisateurs peuvent :"
    ))
    E.append(bul("<b>Creer une demande</b> : titre, description, categorie, priorite percue."))
    E.append(bul("<b>Voter pour des demandes existantes</b> : 10 votes par utilisateur par mois, pouvant etre repartis sur plusieurs demandes."))
    E.append(bul("<b>Suivre le statut</b> : chaque demande a un statut visible (Sous revue, Planifie, En cours, Livre)."))
    E.append(bul("<b>Transparence</b> : le Product Manager publie des mises a jour mensuelles sur les fonctionnalites les plus votees et leur statut."))

    E.append(h2("9.3 Flux de Signalement de Bugs"))
    E.append(p(
        "Le signalement de bugs est integre dans le widget de feedback avec un formulaire dedie :"
    ))
    E.append(tbl([
        [TH('Champ'), TH('Description'), TH('Obligatoire')],
        [TD('Titre du bug'), TD('Description courte du probleme (150 caracteres max)'), TD('Oui')],
        [TD('Description detaillee'), TD('Etapes pour reproduire le bug, comportement attendu vs observe'), TD('Oui')],
        [TD('Capture d\'ecran'), TD('Upload d\'une capture d\'ecran ou video (max 10 MB)'), TD('Non')],
        [TD('Niveau de severite'), TD('Critique / Eleve / Moyen / Faible (auto-qualifie par l\'equipe)'), TD('Non')],
        [TD('Navigateur / OS'), TD('Auto-detecte par le widget'), TD('Auto')],
    ], [100, 230, 60]))
    E.append(sp(4))
    E.append(p(
        "Les bugs critiques sont traites sous 4 heures (SLA), les bugs eleves sous 24 heures, et les bugs "
        "moyens/faibles sont integres au backlog sprint. L'utilisateur recoit une notification a chaque changement de statut."
    ))

    E.append(h2("9.4 Boucle de Feedback (Feedback Loop)"))
    E.append(p(
        "Le feedback suit un processus structure pour garantir que chaque retour utilisateur est traite et que "
        "l'equipe produit dispose d'une vue d'ensemble sur les besoins de la base utilisateurs :"
    ))
    E.append(bul("<b>Collecte</b> : centralisation de tous les retours (NPS, feature requests, bugs, support tickets) dans un hub product (Linear/Jira)."))
    E.append(bul("<b>Tri</b> : classification automatique par categorie, priorite et persona. Taggage par theme recurrent."))
    E.append(bul("<b>Qualification</b> : review hebdomadaire par le Product Manager pour evoluer les demandes et identifier les tendances."))
    E.append(bul("<b>Action</b> : integration au roadmap trimestrielle pour les demandes les plus populaires. Communication proactive pour les fonctionnalites livrees."))
    E.append(bul("<b>Fermeture</b> : notification a l'utilisateur lorsque sa demande est livree ou declinee avec justification."))
    E.append(sp(6))

    # KPI Feedback
    E.append(tbl([
        [TH('Metrique'), TH('Cible'), TH('Frequence de mesure')],
        [TD('Score NPS global'), TD('&gt; 40'), TD('Mensuel')],
        [TD('Taux de reponse aux sondages'), TD('&gt; 30%'), TD('Trimestriel')],
        [TD('Temps de traitement bug critique'), TD('&lt; 4 heures'), TD('En temps reel')],
        [TD('Taux de satisfaction du support'), TD('&gt; 90%'), TD('Mensuel')],
        [TD('Feature requests traitees / trimestrielles'), TD('&gt; 5'), TD('Trimestriel')],
    ], [170, 100, 150]))
    E.append(sp(4))
    E.append(p_left("<i>Tableau 20 : KPI du systeme de feedback</i>"))
    E.append(PageBreak())
    return E


# ===== BUILD =====
def build():
    doc = TocDocTemplate(
        OUT,
        pagesize=A4,
        leftMargin=MARGIN,
        rightMargin=MARGIN,
        topMargin=MARGIN + 0.5*cm,
        bottomMargin=MARGIN,
        title='DealScope_Plan_Onboarding_Documentation',
        author='Z.ai',
        creator='Z.ai'
    )
    story = []
    story += cover()
    story += toc_page()
    story += sec_strategie_onboarding()
    story += sec_ftue()
    story += sec_guides_interactifs()
    story += sec_templates_icp()
    story += sec_centre_aide()
    story += sec_doc_api()
    story += sec_webinaires()
    story += sec_faq()
    story += sec_feedback()

    # Build with multiBuild for TOC
    doc.multiBuild(story)
    print(f"PDF generated: {OUT}")


if __name__ == '__main__':
    build()
