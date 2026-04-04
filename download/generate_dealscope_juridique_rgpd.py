#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""DealScope - Documents Juridiques RGPD - PDF Generator v1.0"""

import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch, cm
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY, TA_RIGHT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle, HRFlowable
)
from reportlab.platypus.tableofcontents import TableOfContents
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily

# ===== FONT REGISTRATION =====
pdfmetrics.registerFont(TTFont('TimesNewRoman', '/usr/share/fonts/truetype/english/Times-New-Roman.ttf'))
pdfmetrics.registerFont(TTFont('Calibri', '/usr/share/fonts/truetype/english/calibri-regular.ttf'))
pdfmetrics.registerFont(TTFont('CalibriBold', '/usr/share/fonts/truetype/english/calibri-bold.ttf'))
pdfmetrics.registerFont(TTFont('CalibriItalic', '/usr/share/fonts/truetype/english/calibri-italic.ttf'))
pdfmetrics.registerFont(TTFont('DejaVuSans', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'))
pdfmetrics.registerFont(TTFont('DejaVuSansBold', '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'))
registerFontFamily('TimesNewRoman', normal='TimesNewRoman', bold='TimesNewRoman', italic='CalibriItalic', boldItalic='CalibriBold')
registerFontFamily('Calibri', normal='Calibri', bold='CalibriBold', italic='CalibriItalic', boldItalic='CalibriBold')
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

# ===== OUTPUT =====
OUT = '/home/z/my-project/download/DealScope_Documents_Juridiques_RGPD.pdf'

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
S_TH = ParagraphStyle('TH', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=9.5, leading=13, textColor=colors.white, alignment=TA_CENTER)
S_TD = ParagraphStyle('TD', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=9, leading=12, textColor=C_TEXT, alignment=TA_LEFT)
S_TDC = ParagraphStyle('TDC', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=9, leading=12, textColor=C_TEXT, alignment=TA_CENTER)
S_NOTE = ParagraphStyle('Note', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=9.5, leading=13, textColor=colors.HexColor('#336699'), leftIndent=15, spaceAfter=8, backColor=colors.HexColor('#F0F6FF'), borderPadding=6)

# Cover styles
S_COVER_TITLE = ParagraphStyle('CoverTitle', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=36, leading=44, textColor=C_DARK, alignment=TA_CENTER, spaceAfter=12)
S_COVER_SUB = ParagraphStyle('CoverSub', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=16, leading=22, textColor=C_GOLD, alignment=TA_CENTER, spaceAfter=10)
S_COVER_INFO = ParagraphStyle('CoverInfo', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=12, leading=18, textColor=C_GRAY, alignment=TA_CENTER, spaceAfter=6)

# Form field style
S_FORM_LABEL = ParagraphStyle('FormLabel', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=10.5, leading=15, textColor=C_DARK, alignment=TA_LEFT, spaceAfter=2)
S_FORM_LINE = ParagraphStyle('FormLine', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=10, leading=22, textColor=C_GRAY, alignment=TA_LEFT, spaceAfter=4)


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
def TD(t, center=False): return Paragraph(t, S_TDC if center else S_TD)


def add_heading(text, style, level=0):
    """Create heading with bookmark for auto-TOC"""
    para = Paragraph(text, style)
    para.bookmark_name = text
    para.bookmark_level = level
    para.bookmark_text = text
    return para


def tbl(data, widths=None):
    """Create styled table with alternating rows."""
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
    canvas.drawCentredString(A4[0]/2, 0.5*inch, "DealScope - Documents Juridiques RGPD  |  Page %d" % doc.page)
    canvas.setStrokeColor(C_LIGHT)
    canvas.setLineWidth(0.5)
    canvas.line(1.0*inch, A4[1]-0.65*inch, A4[0]-1.0*inch, A4[1]-0.65*inch)
    canvas.restoreState()


# ===== COVER PAGE =====
def cover():
    E = []
    E.append(Spacer(1, 100))
    E.append(HRFlowable(width="60%", color=C_DARK, thickness=3, spaceBefore=0, spaceAfter=20))
    E.append(Paragraph("<b>DealScope</b>", ParagraphStyle('CB', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=40, leading=48, textColor=C_GOLD, alignment=TA_CENTER, spaceAfter=6)))
    E.append(sp(15))
    E.append(Paragraph("<b>Documents Juridiques</b>", S_COVER_TITLE))
    E.append(Paragraph("<b>Conformite RGPD</b>", ParagraphStyle('CT', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=28, leading=36, textColor=C_DARK, alignment=TA_CENTER, spaceAfter=10)))
    E.append(sp(12))
    E.append(HRFlowable(width="40%", color=C_MED, thickness=1.5, spaceBefore=10, spaceAfter=20))
    E.append(S_COVER_SUB.__class__("Conditions Generales, Politique de Confidentialite, Mentions Legales", S_COVER_SUB))
    E.append(sp(40))
    E.append(Paragraph("<b>Version 1.0 - Mars 2026</b>", S_COVER_INFO))
    E.append(sp(8))
    E.append(Paragraph("<b>Z.ai</b>", S_COVER_INFO))
    E.append(sp(30))
    E.append(HRFlowable(width="60%", color=C_DARK, thickness=3, spaceBefore=20, spaceAfter=20))
    E.append(sp(40))
    E.append(Paragraph("CONFIDENTIEL - Document juridique a usage de DealScope SAS.", ParagraphStyle('Conf', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=9, leading=12, textColor=C_GRAY, alignment=TA_CENTER)))
    E.append(PageBreak())
    return E


# ===== TABLE OF CONTENTS (auto-generated) =====
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


# ===== 1. CONDITIONS GENERALES D'UTILISATION (CGU) =====
def sec_cgu():
    E = []
    E.append(h1("1. Conditions Generales d'Utilisation (CGU)"))
    E.append(hr())

    # Art 1
    E.append(h2("Article 1 - Objet"))
    E.append(p(
        "Les presentes Conditions Generales d'Utilisation (ci-apres \"CGU\") ont pour objet de definir les conditions "
        "dans lesquelles DealScope SAS, societe par actions simplifiee au capital de 50 000 euros, immatriculee au "
        "Registre du Commerce et des Societes de Paris sous le numero XXX XXX XXX, dont le siege social est situe "
        "12 rue de la Paix, 75002 Paris, France (ci-apres \"DealScope\" ou \"l'Editeur\"), met a la disposition "
        "de ses utilisateurs la plateforme logicielle en mode SaaS (Software as a Service) denominee \"DealScope\"."
    ))
    E.append(p(
        "DealScope est une plateforme d'intelligence M&amp;A (Fusions et Acquisitions) destinee aux professionnels "
        "du capital-investissement, du corporate development, du conseil en fusion-acquisition et de la gestion "
        "d'actifs. La plateforme propose des fonctionnalites de ciblage d'entreprises cibles basees sur des profils "
        "ICP (Ideal Customer Profile), d'analyse de signaux de marche, de recherche de contacts decisionnaires, "
        "d'enrichissement de donnees, de scoring et de pipeline management."
    ))
    E.append(p(
        "L'utilisation de la plateforme DealScope implique l'acceptation pleine et entiere des presentes CGU. "
        "Tout utilisateur declarant accepter les presentes CGU reconnait en avoir pris connaissance et s'engage "
        "a les respecter."
    ))

    # Art 2
    E.append(h2("Article 2 - Acceptation des CGU"))
    E.append(p(
        "L'utilisation de la plateforme DealScope est soumise a l'acceptation prealable des presentes CGU. "
        "L'utilisateur reconnait avoir pris connaissance des CGU avant toute inscription. L'utilisateur accepte "
        "les CGU en cochant la case prevue a cet effet lors du processus d'inscription ou lors de sa premiere "
        "connexion a la plateforme."
    ))
    E.append(p(
        "DealScope se reserve le droit de modifier les presentes CGU a tout moment. Les modifications entrent "
        "en vigueur des leur publication sur la plateforme. L'utilisateur est informe des modifications par "
        "notification email ou par banniere d'information sur la plateforme. L'utilisation continue de la "
        "plateforme apres la date d'entree en vigueur des modifications vaut acceptation des nouvelles CGU."
    ))
    E.append(p(
        "En cas de desaccord avec les nouvelles CGU, l'utilisateur dispose d'un delai de trente (30) jours "
        "a compter de la notification pour ressilier son abonnement. Passé ce delai, l'utilisateur sera "
        "repute avoir accepte les modifications."
    ))

    # Art 3
    E.append(h2("Article 3 - Inscription et Comptes"))
    E.append(h3("3.1 Creation du compte"))
    E.append(p(
        "L'inscription a la plateforme DealScope est ouverte a toute personne physique majeure capacite juridique, "
        "ou a toute personne morale representee par une personne dument habilitee. L'utilisateur doit fournir des "
        "informations exactes, completes et a jour lors de son inscription : nom, prenom, adresse email professionnelle, "
        "nom de l'entreprise et fonction."
    ))
    E.append(p(
        "L'authentification des utilisateurs est assuree par Clerk.dev, fournisseur d'identite tiers. DealScope "
        "met en oeuvre une authentification multi-facteurs (MFA) optionnelle pour renforcer la securite des comptes."
    ))

    E.append(h3("3.2 Workspace et roles"))
    E.append(p(
        "Chaque utilisateur appartient a un \"Workspace\" (espace de travail) correspondant a son organisation. "
        "Le Workspace regroupe l'ensemble des donnees, configurations et membres d'une meme entite. Les roles "
        "suivants sont definis au sein du Workspace :"
    ))
    E.append(bul("<b>Owner (Proprietaire)</b> : dispose de l'ensemble des droits d'administration, de gestion des membres, de configuration du billing et de suppression du Workspace. Il est designe comme le responsable du traitement au sens du RGPD."))
    E.append(bul("<b>Admin (Administrateur)</b> : peut gerer les membres, les profils ICP, les integrations et acceder a toutes les donnees du Workspace."))
    E.append(bul("<b>Member (Membre)</b> : peut creer et modifier des profils ICP, consulter et enrichir les donnees d'entreprises, lancer des scans d'agents IA et gerer le pipeline."))
    E.append(bul("<b>Viewer (Lecteur)</b> : dispose d'un acces en lecture seule a l'ensemble des donnees et rapports du Workspace."))

    E.append(h3("3.3 Securite du compte"))
    E.append(p(
        "L'utilisateur est seul responsable de la confidentialite de ses identifiants de connexion. Il s'engage "
        "a ne pas les communiquer a des tiers et a notifier immediatement DealScope de toute utilisation non "
        "autorisee de son compte. DealScope se reserve le droit de suspendre tout compte presenteant un risque "
        "de securite. Les mots de passe sont stockes sous forme de hash par Clerk.dev et ne sont jamais accessibles "
        "en clair par DealScope."
    ))

    # Art 4
    E.append(h2("Article 4 - Services proposes"))
    E.append(p(
        "DealScope propose une plateforme SaaS d'intelligence M&amp;A articulee autour de plusieurs modules "
        "fonctionnels. Les fonctionnalites disponibles dependent du plan de souscription choisi par l'utilisateur."
    ))
    E.append(sp(4))
    E.append(tbl([
        [TH('Plan'), TH('Prix/mois'), TH('Utilisateurs'), TH('Profils ICP'), TH('Entreprises'), TH('Scans/mois'), TH('Emails/mois')],
        [TD('Starter'), TD('99 EUR', True), TD('3', True), TD('3', True), TD('500', True), TD('10', True), TD('500', True)],
        [TD('Professional'), TD('299 EUR', True), TD('10', True), TD('10', True), TD('2 500', True), TD('50', True), TD('5 000', True)],
        [TD('Business'), TD('499 EUR', True), TD('25', True), TD('25', True), TD('10 000', True), TD('Illimite', True), TD('25 000', True)],
        [TD('Enterprise'), TD('Sur devis', True), TD('Illimite', True), TD('Illimite', True), TD('Illimite', True), TD('Illimite', True), TD('Sur devis', True)],
    ], [75, 65, 62, 62, 68, 68, 68]))
    E.append(sp(4))
    E.append(p_left("<i>Tableau 1 : Plans tarifaires et limites par offre DealScope</i>"))
    E.append(sp(6))
    E.append(p(
        "Les prix sont indiques en euros hors taxes (HT). La TVA est appliquee conformement a la legislation "
        "en vigueur. Les abonnements sont factures mensuellement ou annuellement selon l'option choisie. "
        "Le plan Enterprise fait l'objet d'un contrat specifique incluant des conditions particulieres, "
        "un SLA (Service Level Agreement) dedie et un support prioritaire."
    ))
    E.append(p("<b>Fonctionnalites principales :</b>"))
    E.append(bul("Ciblage ICP multi-criteres (secteur, taille, geographie, technologies, mots-cles)"))
    E.append(bul("Enrichissement automatique de donnees d'entreprises via API tierces (Apollo.io, Crunchbase)"))
    E.append(bul("Detection de signaux de marche (levées de fonds, acquisitions, changements executifs, lancements de produits)"))
    E.append(bul("Recherche et validation d'adresses email de contacts decisionnaires"))
    E.append(bul("Analyse technographique des entreprises cibles (Wappalyzer)"))
    E.append(bul("Gestion de pipeline M&amp;A avec CRM integre"))
    E.append(bul("Generation de rapports d'analyse par agents IA"))
    E.append(bul("Export de donnees et synchronisation CRM (Salesforce, HubSpot, Pipedrive)"))
    E.append(bul("Tableau de bord analytics et suivi des performances"))

    # Art 5
    E.append(h2("Article 5 - Donnees et Propriete intellectuelle"))
    E.append(p(
        "DealScope ne confere a l'utilisateur aucun droit de propriete sur la plateforme elle-meme. L'ensemble "
        "des elements composant la plateforme (code source, interfaces graphiques, marques, logos, base de donnees, "
        "algorithmes, modeles d'intelligence artificielle) sont la propriete exclusive de DealScope SAS et sont "
        "proteges par le droit d'auteur, le droit des dessins et modeles et le droit des marques."
    ))
    E.append(p(
        "L'utilisateur conserve l'entiere propriete des donnees qu'il importe et genere sur la plateforme "
        "(profils ICP, annotations, configurations de pipeline). DealScope ne cede aucune licence ni aucun "
        "droit d'utilisation sur les donnees de l'utilisateur a des tiers, sauf dans le cadre strict des "
        "sous-traitants necessaires au fonctionnement de la plateforme (voir Politique de Confidentialite)."
    ))
    E.append(p(
        "DealScope est titulaire des droits de propriete intellectuelle sur les donnees enrichies et les "
        "analyses generees par ses algorithmes et agents IA a partir de sources publiques. L'utilisateur "
        "beneficie d'un droit d'utilisation non exclusif de ces enrichissements dans le cadre de son "
        "abonnement."
    ))

    # Art 6
    E.append(h2("Article 6 - Obligations de l'utilisateur"))
    E.append(p("L'utilisateur s'engage a respecter les obligations suivantes :"))
    E.append(bul("Utiliser la plateforme conformement a sa destination et aux lois et regulations en vigueur, notamment le RGPD et la legislation nationale sur la protection des donnees personnelles."))
    E.append(bul("Ne pas utiliser la plateforme a des fins illicites, de spam, de harcelement ou d'atteinte aux droits de tiers."))
    E.append(bul("Ne pas tenter d'acceder de maniere non autorisee aux systemes, reseaux ou donnees de DealScope ou de ses sous-traitants."))
    E.append(bul("Fournir des informations exactes et a jour lors de son inscription et lors de toute modification de celles-ci."))
    E.append(bul("S'assurer que toute utilisation des donnees de contacts obtenues via la plateforme respecte la legislation applicable, notamment en matiere de prospection commerciale et d'emailing (Directive 2002/58/CE, loi Informatique et Libertes, reglementation LCEN)."))
    E.append(bul("Ne pas reproduire, copier, modifier, distribuer ou commercialiser la plateforme ou ses composants sans autorisation prealable ecrite de DealScope."))
    E.append(p(
        "En cas de manquement a ces obligations, DealScope se reserve le droit de suspendre ou ressilier "
        "le compte de l'utilisateur, sans preavis ni indemnite, et d'engager toute action legale appropriee."
    ))

    # Art 7
    E.append(h2("Article 7 - Protection des donnees personnelles"))
    E.append(p(
        "DealScope s'engage a traiter les donnees personnelles conformement au Reglement General sur la Protection "
        "des Donnees (RGPD - Reglement (UE) 2016/679) et a la loi Informatique et Libertes du 6 janvier 1978 "
        "modifiee. Pour plus d'informations sur le traitement des donnees personnelles, l'utilisateur est invite "
        "a consulter la Politique de Confidentialite de DealScope (Section 2 du present document)."
    ))
    E.append(p(
        "Les donnees personnelles collectees directement aupres des utilisateurs inscrits (nom, prenom, email, "
        "entreprise, fonction) font l'objet d'un traitement fonde sur l'execution du contrat (Article 6(1)(b) du RGPD). "
        "Les donnees de contacts professionnels collectees via des sources publiques et des API tierces font l'objet "
        "d'un traitement fonde sur l'interet legitime (Article 6(1)(f) du RGPD), comme detaille dans la Politique "
        "de Confidentialite."
    ))
    E.append(p(
        "DealScope a designe un Delegue a la Protection des Donnees (DPO) joignable a l'adresse : "
        "dpo@dealscope.fr. L'utilisateur peut exercer ses droits directement aupres du DPO ou via le formulaire "
        "d'exercice des droits disponible en Section 7 du present document."
    ))

    # Art 8
    E.append(h2("Article 8 - Limitation de responsabilite"))
    E.append(p(
        "DealScope s'efforce d'assurer la disponibilite, la performance et la securite de la plateforme. "
        "Neanmoins, DealScope ne saurait etre tenu responsable des interruptions temporaires de service "
        "liees a des operations de maintenance, des mises a jour, des pannes d'infrastructure ou des cas "
        "de force majeure."
    ))
    E.append(p(
        "DealScope ne garantit pas l'exactitude, l'exhaustivite ou l'actualite des donnees enrichies "
        "provenant de sources tierces (Apollo.io, Crunchbase, Wappalyzer). Ces donnees sont fournies "
        "a titre indicatif et ne sauraient se substituer a une verification par l'utilisateur. DealScope "
        "ne saurait etre tenu responsable des decisions prises sur la base de ces donnees."
    ))
    E.append(p(
        "La responsabilite globale de DealScope est limitee au montant des redevances effectivement versees "
        "par l'utilisateur au cours des douze (12) mois precedant l'evenement generateur de responsabilite, "
        "dans la limite maximale de douze (12) mois de redevances. DealScope ne saurait etre tenu responsable "
        "des dommages indirects, perte de chance, perte de profit ou prejudice commercial."
    ))

    # Art 9
    E.append(h2("Article 9 - Force majeure"))
    E.append(p(
        "Aucune des parties ne sera tenue pour responsable en cas d'inexecution de ses obligations resultant "
        "d'un cas de force majeure tel que defini par l'article 1218 du Code civil. Sont notamment consideres "
        "comme cas de force majeure : les catastrophes naturelles, les epidemies, les pandemies, les actes "
        "de terrorisme, les guerres, les grèves generales, les interruptions des reseaux de telecommunication "
        "ou d'electricite, les cyberattaques massives, les decisions gouvernementales restrictives et les "
        "pannes chez les fournisseurs d'infrastructure cloud (AWS)."
    ))
    E.append(p(
        "En cas de force majeure, la partie affectee en informera l'autre partie dans les meilleurs delais. "
        "L'execution des obligations suspendues sera prolongee d'une duree egale a celle de l'evenement "
        "de force majeure."
    ))

    # Art 10
    E.append(h2("Article 10 - Duree et resiliation"))
    E.append(p(
        "Les presentes CGU entrent en vigueur a la date d'inscription de l'utilisateur. L'abonnement est "
        "reconduit tacitement a l'echance pour des periodes successives d'un (1) mois ou d'un (1) an "
        "selon l'option choisie, sauf resiliation par l'une ou l'autre partie."
    ))
    E.append(p(
        "L'utilisateur peut resilier son abonnement a tout moment depuis son espace de gestion ou par "
        "notification ecrite adressee a contact@dealscope.fr. La resiliation prend effet a la fin de "
        "la periode en cours. Aucun remboursement partiel ne sera effectue pour la periode en cours."
    ))
    E.append(p(
        "DealScope se reserve le droit de resilier l'abonnement de plein droit et sans preavis en cas "
        "de manquement grave aux presentes CGU, notamment : utilisation illicite de la plateforme, "
        "non-paiement des redevances, violation de la propriete intellectuelle, atteinte a la securite "
        "des donnees. Dans ce cas, DealScope informera l'utilisateur par email et le compte sera desactive."
    ))
    E.append(p(
        "Suite a la resiliation, DealScope conservera les donnees de l'utilisateur pendant une duree de "
        "trente (30) jours pour permettre l'export. Au-dela de ce delai, les donnees seront definitivement "
        "supprimees, sous reserve des obligations legales de conservation."
    ))

    # Art 11
    E.append(h2("Article 11 - Modifications des CGU"))
    E.append(p(
        "DealScope se reserve le droit de modifier les presentes CGU a tout moment. Les modifications "
        "seront notifiees aux utilisateurs par email au moins quinze (15) jours avant leur entree en vigueur. "
        "L'utilisateur dispose d'un delai de trente (30) jours a compter de la notification pour s'opposer "
        "aux modifications en resiliant son abonnement."
    ))

    # Art 12
    E.append(h2("Article 12 - Droit applicable et juridiction competente"))
    E.append(p(
        "Les presentes CGU sont soumises au droit francais. En cas de litige relatif a l'interpretation "
        "ou a l'execution des presentes CGU, les parties s'efforceront de trouver une solution amiable. "
        "A defaut d'accord amiable dans un delai de quarante-cinq (45) jours, le litige sera soumis "
        "a la competence exclusive du Tribunal de Commerce de Paris, nonobstant pluralite de defendeurs "
        "ou appel en garantie."
    ))

    # Art 13
    E.append(h2("Article 13 - Contact"))
    E.append(p("Pour toute question relative aux presentes CGU, l'utilisateur peut contacter DealScope :"))
    E.append(bul("<b>Email</b> : contact@dealscope.fr"))
    E.append(bul("<b>Adresse postale</b> : DealScope SAS, 12 rue de la Paix, 75002 Paris, France"))
    E.append(bul("<b>DPO</b> : dpo@dealscope.fr"))
    E.append(PageBreak())
    return E


# ===== 2. POLITIQUE DE CONFIDENTIALITE =====
def sec_politique_confidentialite():
    E = []
    E.append(h1("2. Politique de Confidentialite"))
    E.append(hr())

    E.append(p(
        "La presente Politique de Confidentialite decrit les pratiques de DealScope SAS (ci-apres \"DealScope\", "
        "\"nous\" ou \"notre\") en matiere de collecte, d'utilisation, de stockage, de partage et de protection "
        "des donnees personnelles. Elle s'applique a la plateforme DealScope accessible a l'adresse www.dealscope.fr "
        "et a l'ensemble des services associes."
    ))

    # 1. Responsable du traitement
    E.append(h2("2.1 Responsable du traitement"))
    E.append(p(
        "Le responsable du traitement des donnees personnelles au sens de l'article 4(7) du RGPD est :"
    ))
    E.append(tbl([
        [TH('Element'), TH('Information')],
        [TD('<b>Raison sociale</b>'), TD('DealScope SAS')],
        [TD('<b>Forme juridique</b>'), TD('Societe par Actions Simplifiee (SAS)')],
        [TD('<b>Siege social</b>'), TD('12 rue de la Paix, 75002 Paris, France')],
        [TD('<b>Email de contact</b>'), TD('contact@dealscope.fr')],
        [TD('<b>DPO</b>'), TD('dpo@dealscope.fr')],
    ], [150, 340]))
    E.append(sp(6))

    # 2. Donnees collectees
    E.append(h2("2.2 Donnees collectees"))
    E.append(p(
        "DealScope collecte les categories de donnees personnelles suivantes, en fonction de leur provenance "
        "et de leur finalite de traitement :"
    ))
    E.append(tbl([
        [TH('Categorie'), TH('Donnees'), TH('Source'), TH('Base legale')],
        [TD('<b>Identite</b>'), TD('Nom, prenom, photo de profil'), TD('Utilisateur inscrit'), TD('Art. 6(1)(b)')],
        [TD('<b>Contact professionnel</b>'), TD('Email professionnel, telephone, fonction, departement, seniorite, LinkedIn'), TD('Sources publiques, API (Apollo.io, Crunchbase)'), TD('Art. 6(1)(f)')],
        [TD('<b>Donnees d\'entreprise</b>'), TD('Nom, secteur, CA, nombre de salaries, siege, technologies utilisees, logo'), TD('Sources publiques, API, Wappalyzer'), TD('Art. 6(1)(f)')],
        [TD('<b>Donnees de navigation</b>'), TD('Adresse IP, type de navigateur, pages visitees, duree des sessions, cookies'), TD('Plateforme (tracking automatique)'), TD('Art. 6(1)(f)')],
        [TD('<b>Donnees de facturation</b>'), TD('Coordonnees bancaires, adresse de facturation, historique des paiements'), TD('Utilisateur inscrit (Stripe)'), TD('Art. 6(1)(b)')],
    ], [90, 155, 125, 80]))
    E.append(sp(6))

    # 3. Finalites du traitement
    E.append(h2("2.3 Finalites du traitement"))
    E.append(p("Les donnees personnelles sont traitees pour les finalites suivantes :"))
    E.append(bul("Gestion des comptes utilisateurs et authentification (Clerk.dev)"))
    E.append(bul("Fourniture et personnalisation des services de la plateforme DealScope"))
    E.append(bul("Enrichissement des donnees d'entreprises cibles a des fins de ciblage M&amp;A"))
    E.append(bul("Verification et validation des adresses email de contacts professionnels (ZeroBounce)"))
    E.append(bul("Analyse technographique des entreprises cibles (Wappalyzer)"))
    E.append(bul("Gestion de la relation client, support technique et facturation (Stripe)"))
    E.append(bul("Amelioration continue de la plateforme et analyse d'usage (PostHog, cookies)"))
    E.append(bul("Securite de la plateforme et prevention de la fraude"))
    E.append(bul("Communication de mises a jour produit et informations commerciales (consentement pour les newsletters)"))

    # 4. Base legale
    E.append(h2("2.4 Base legale"))
    E.append(p(
        "Le traitement des donnees personnelles par DealScope repose sur les bases legales suivantes, "
        "conformement a l'article 6 du RGPD :"
    ))
    E.append(bul("<b>Article 6(1)(b) - Execution du contrat</b> : traitement des donnees des utilisateurs inscrits necessaires a la fourniture des services (gestion du compte, authentification, facturation, support)."))
    E.append(bul("<b>Article 6(1)(f) - Interet legitime</b> : collecte et enrichment de donnees de contacts professionnels a partir de sources publiquement accessibles et d'API tierces. DealScope considere que la collecte de donnees B2B publiquement disponibles pour des finalites de prospection commerciale constitue un interet legitime, conformement a la pratique courante du secteur et aux recommandations du G29. Les personnes concernees disposent d'un droit d'opposition a tout moment (Article 21 du RGPD)."))
    E.append(bul("<b>Article 6(1)(a) - Consentement</b> : cookies non essentiels et communications marketing (newsletters). Le consentement est recueilli via un bandeau cookies conforme au framework TCF v2.2."))

    # 5. Destinataires des donnees
    E.append(h2("2.5 Destinataires des donnees"))
    E.append(p(
        "Les donnees personnelles sont accessibles aux categories de destinataires suivantes :"
    ))
    E.append(bul("<b>Personnel autorise de DealScope</b> : equipes technique, produit, support et commerciale, dans le cadre de leurs fonctions et sous le controle d'un chef de file."))
    E.append(bul("<b>Sous-traitants</b> : des sous-traitants sont mobilises pour le traitement de donnees dans le cadre de leurs prestations. La liste detaillee est disponible en Section 5 (Sous-traitance / DPA)."))
    E.append(bul("<b>Utilisateurs du meme Workspace</b> : les membres d'un Workspace ont acces aux donnees partagees au sein de leur organisation, selon leur role."))
    E.append(p(
        "DealScope ne vend, ne loue et ne partage pas les donnees personnelles de ses utilisateurs "
        "avec des tiers a des fins publicitaires ou commerciales."
    ))

    # 6. Transferts internationaux
    E.append(h2("2.6 Transferts internationaux"))
    E.append(p(
        "Certaines donnees sont hebergees et traitees par des sous-traitants situes en dehors de l'Espace "
        "Economique Europeen (EEE). DealScope s'assure que les transferts sont encadres par des garanties "
        "appropriees :"
    ))
    E.append(bul("<b>AWS (Amazon Web Services)</b> : donnees hebergees dans la region eu-west-3 (Paris, France). Aucun transfert en dehors de l'EEE n'a lieu pour le stockage principal des donnees."))
    E.append(bul("<b>Clauses contractuelles types (SCCs)</b> : pour les sous-traitants situes hors EEE (notamment Apollo.io aux Etats-Unis), DealScope a signe les Clauses Contractuelles Types approuvees par la Commission europeenne (Decision 2021/914)."))
    E.append(bul("<b>Decisions d'adequation</b> : lorsque le pays destinataire beneficie d'une decision d'adequation de la Commission europeenne, les donnees y sont transferees sur cette base."))
    E.append(bul("<b>Stripe</b> : le prestataire de paiement beneficie d'un certification PCI DSS et ses transferts sont encadres par les SCCs."))

    # 7. Duree de conservation
    E.append(h2("2.7 Duree de conservation"))
    E.append(tbl([
        [TH('Categorie de donnees'), TH('Duree de conservation'), TH('Justification')],
        [TD('Donnees du compte utilisateur'), TD('Duree du contrat + 3 ans'), TD('Obligations comptables et fiscales (Code de commerce)')],
        [TD('Donnees de contacts professionnels enrichis'), TD('18 mois a compter de la collecte'), TD('Activite de prospection M&amp;A raisonnable')],
        [TD('Historique des scans et analyses'), TD('24 mois'), TD('Amelioration des services et reconstitution des analyses')],
        [TD('Donnees de navigation et cookies'), TD('13 mois maximum (cookies persistants)'), TD('Recommandations CNIL')],
        [TD('Donnees de facturation'), TD('10 ans a compter de la cloture de l\'exercice'), TD('Obligations comptables (Code de commerce)')],
        [TD('Logs de securite'), TD('12 mois'), TD('Detection d\'incidents et securite')],
    ], [145, 140, 205]))
    E.append(sp(6))
    E.append(p(
        "A l'expiration des durees de conservation, les donnees sont automatiquement supprimees ou anonymisees. "
        "L'utilisateur peut demander la suppression anticipée de ses donnees en exercant son droit d'effacement."
    ))

    # 8. Droits des personnes concernees
    E.append(h2("2.8 Droits des personnes concernees"))
    E.append(p(
        "Conformement au RGPD, toute personne concernee par un traitement de donnees personnelles par DealScope "
        "dispose des droits suivants :"
    ))
    E.append(tbl([
        [TH('Droit'), TH('Article RGPD'), TH('Portee')],
        [TD('<b>Droit d\'acces</b>'), TD('Article 15'), TD('Obtenir confirmation et copie des donnees traitees')],
        [TD('<b>Droit de rectification</b>'), TD('Article 16'), TD('Correction des donnees inexactes ou incompletes')],
        [TD('<b>Droit d\'effacement</b>'), TD('Article 17'), TD('Suppression des donnees dans les cas prevus par la loi')],
        [TD('<b>Droit a la limitation</b>'), TD('Article 18'), TD('Suspension du traitement dans certaines circonstances')],
        [TD('<b>Droit a la portabilite</b>'), TD('Article 20'), TD('Recevoir les donnees dans un format structure et courant')],
        [TD('<b>Droit d\'opposition</b>'), TD('Article 21'), TD('S\'opposer au traitement fonde sur l\'interet legitime')],
    ], [120, 70, 300]))
    E.append(sp(6))
    E.append(p(
        "L'exercice de ces droits est gratuit. DealScope s'engage a repondre a toute demande dans un delai "
        "maximal d'un (1) mois a compter de la reception de la demande. Ce delai peut etre prolonge de deux "
        "(2) mois supplementaires en cas de complexite de la demande, auquel cas DealScope en informera "
        "la personne concernee dans le premier mois."
    ))

    # 9. Exercice des droits
    E.append(h2("2.9 Exercice des droits"))
    E.append(p(
        "Pour exercer vos droits, vous pouvez :"
    ))
    E.append(bul("Envoyer un email a dpo@dealscope.fr en precisant votre identite et le droit que vous souhaitez exercer."))
    E.append(bul("Utiliser le formulaire d'exercice des droits disponible en Section 7 du present document."))
    E.append(bul("Adresser un courrier a : DPO - DealScope SAS, 12 rue de la Paix, 75002 Paris, France."))
    E.append(p(
        "Afin de traiter votre demande, DealScope pourra vous demander de justifier de votre identite. "
        "En cas de reponse insatisfaisante, vous pouvez introduire une reclamation aupres de la Commission "
        "Nationale de l'Informatique et des Libertes (CNIL) : www.cnil.fr."
    ))

    # 10. Cookies
    E.append(h2("2.10 Cookies et technologies similaires"))
    E.append(p(
        "DealScope utilise des cookies et technologies similaires pour assurer le fonctionnement, la securite "
        "et l'amelioration de la plateforme. Le consentement aux cookies non essentiels est recueilli conformement "
        "au framework Transparency and Consent Framework (TCF) v2.2 de l'IAB Europe."
    ))
    E.append(tbl([
        [TH('Categorie'), TH('Finalite'), TH('Duree'), TH('Consentement')],
        [TD('<b>Strictement necessaires</b>'), TD('Authentification, securite, preferences'), TD('Session a 12 mois'), TD('Non requis')],
        [TD('<b>Fonctionnels</b>'), TD('Langue, preferences utilisateur, theme'), TD('12 mois'), TD('Oui')],
        [TD('<b>Analytics</b>'), TD('Mesure d\'audience (PostHog), analyse d\'usage'), TD('13 mois'), TD('Oui')],
        [TD('<b>Marketing</b>'), TD('Publicites ciblees, retargeting'), TD('13 mois'), TD('Oui')],
    ], [100, 175, 80, 75]))
    E.append(sp(6))
    E.append(p(
        "L'utilisateur peut gerer ses preferences de cookies a tout moment via le bandeau de consentement "
        "ou dans les parametres de son navigateur."
    ))

    # 11. Securite
    E.append(h2("2.11 Securite des donnees"))
    E.append(p(
        "DealScope met en oeuvre des mesures techniques et organisationnelles appropriees pour proteger "
        "les donnees personnelles contre la destruction accidentelle ou illegale, la perte, l'alteration, "
        "la divulgation ou l'acces non autorise :"
    ))
    E.append(bul("<b>Chiffrement</b> : chiffrement TLS 1.3 en transit, chiffrement AES-256 au repos pour les donnees stockees dans PostgreSQL, Redis et les autres bases de donnees."))
    E.append(bul("<b>Infrastructure</b> : hebergement sur AWS eu-west-3 (Paris) avec VPC, groupes de securite, pare-feu et isolation reseau par tenant (PostgreSQL RLS)."))
    E.append(bul("<b>Authentification</b> : Clerk.dev avec JWT, MFA optionnel, rotation des tokens, gestion des sessions securisee."))
    E.append(bul("<b>Controle d\'acces</b> : politique de moindre privilege, roles granulaires (Owner, Admin, Member, Viewer), audit des acces."))
    E.append(bul("<b>Monitoring</b> : journalisation centralisee, alertes de securite, scans de vulnerabilites reguliers."))
    E.append(bul("<b>Plan de reponse aux incidents</b> : procedure documentee de notification a la CNIL dans les 72 heures en cas de violation de donnees (Article 33 du RGPD)."))

    # 12. Modifications
    E.append(h2("2.12 Modifications de la politique"))
    E.append(p(
        "DealScope se reserve le droit de modifier la presente Politique de Confidentialite a tout moment. "
        "Les modifications seront publiees sur la plateforme et notifiees aux utilisateurs par email. "
        "La date de derniere mise a jour est indiquee en haut de la politique. L'utilisateur est invite "
        "a consulter regulierement la politique."
    ))

    # 13. Contact DPO
    E.append(h2("2.13 Contact DPO"))
    E.append(p("Pour toute question relative a la protection des donnees personnelles :"))
    E.append(bul("<b>Delegue a la Protection des Donnees (DPO)</b> : dpo@dealscope.fr"))
    E.append(bul("<b>DealScope SAS</b> : 12 rue de la Paix, 75002 Paris, France"))
    E.append(bul("<b>CNIL</b> : www.cnil.fr / 3 place de Fontenoy, TSA 80715, 75334 PARIS CEDEX 07"))
    E.append(PageBreak())
    return E


# ===== 3. MENTIONS LEGALES =====
def sec_mentions_legales():
    E = []
    E.append(h1("3. Mentions Legales"))
    E.append(hr())

    E.append(h2("3.1 Editeur"))
    E.append(tbl([
        [TH('Element'), TH('Information')],
        [TD('<b>Raison sociale</b>'), TD('DealScope SAS')],
        [TD('<b>Forme juridique</b>'), TD('Societe par Actions Simplifiee (SAS)')],
        [TD('<b>Capital social</b>'), TD('50 000 EUR')],
        [TD('<b>RCS</b>'), TD('Paris B XXX XXX XXX')],
        [TD('<b>SIEGE SOCIAL</b>'), TD('12 rue de la Paix, 75002 Paris, France')],
        [TD('<b>SIRET</b>'), TD('XXX XXX XXX XXXXX')],
        [TD('<b>N. TVA Intracommunautaire</b>'), TD('FR XX XXX XXX XXX')],
    ], [160, 330]))
    E.append(sp(6))

    E.append(h2("3.2 Directeur de la publication"))
    E.append(p(
        "Le directeur de la publication de la plateforme DealScope est Monsieur Jean DUPONT, "
        "President de DealScope SAS."
    ))

    E.append(h2("3.3 Hebergeur"))
    E.append(tbl([
        [TH('Element'), TH('Information')],
        [TD('<b>Raison sociale</b>'), TD('Amazon Web Services, Inc.')],
        [TD('<b>Adresse</b>'), TD('38 Avenue John F. Kennedy, L-1855 Luxembourg')],
        [TD('<b>Region</b>'), TD('eu-west-3 (Paris, France)')],
    ], [160, 330]))
    E.append(sp(6))

    E.append(h2("3.4 CNIL"))
    E.append(p(
        "DealScope SAS a effectue aupres de la Commission Nationale de l'Informatique et des Libertes (CNIL) "
        "une declaration de conformite au RGPD. Numero d'enregistrement : XXXXXXXX."
    ))

    E.append(h2("3.5 Mediation"))
    E.append(p(
        "En cas de litige entre un utilisateur et DealScope SAS non resolu par le service client, "
        "l'utilisateur peut recourir a la mediation conventionnelle. Le mediateur designe est :"
    ))
    E.append(bul("<b>Mediateur</b> : Mediateur de la Consommation Numérique"))
    E.append(bul("<b>Adresse</b> : 60 rue La Boetie, 75008 Paris, France"))
    E.append(bul("<b>Email</b> : mediation@conso-numerique.fr"))
    E.append(bul("<b>Site</b> : www.conso-numerique.fr"))
    E.append(p(
        "La mediation est gratuite et confidentielle. Le recours a la mediation n'exclut pas le droit "
        "de l'utilisateur de saisir la juridiction competente."
    ))
    E.append(PageBreak())
    return E


# ===== 4. SOUS-TRAITANCE (DPA) =====
def sec_sous_traitance():
    E = []
    E.append(h1("4. Sous-traitance (DPA)"))
    E.append(hr())

    E.append(p(
        "Conformement aux articles 28 du RGPD, DealScope informe ses utilisateurs des sous-traitants "
        "auxquels il fait appel pour le traitement de donnees personnelles. Un accord de sous-traitance "
        "(Data Processing Agreement - DPA) conforme au RGPD a ete signe avec chacun des sous-traitants listes ci-dessous."
    ))
    E.append(sp(4))
    E.append(tbl([
        [TH('Sous-traitant'), TH('Finalite'), TH('Donnees traitees'), TH('Localisation'), TH('DPA'), TH('SCCs')],
        [TD('<b>AWS</b>'), TD('Hebergement et infrastructure cloud'), TD('Toutes les donnees'), TD('eu-west-3 (Paris, FR)'), TD('Signe'), TD('N/A (UE)')],
        [TD('<b>Clerk.dev</b>'), TD('Authentification et gestion des comptes'), TD('Email, nom, prenom, photo, sessions'), TD('USA (SCCs)'), TD('Signe'), TD('Oui')],
        [TD('<b>Stripe</b>'), TD('Paiement et facturation'), TD('Coordonnees bancaires, adresse, historique'), TD('USA / UE (SCCs)'), TD('Signe'), TD('Oui')],
        [TD('<b>Apollo.io</b>'), TD('Enrichissement de donnees B2B et recherche de contacts'), TD('Emails, noms, fonctions, entreprises'), TD('USA (SCCs)'), TD('Signe'), TD('Oui')],
        [TD('<b>Crunchbase</b>'), TD('Donnees financieres et informations d\'entreprises'), TD('CA, levées de fonds, effectifs, secteur'), TD('USA (SCCs)'), TD('Signe'), TD('Oui')],
        [TD('<b>ZeroBounce</b>'), TD('Verification d\'adresses email'), TD('Adresses email'), TD('USA (SCCs)'), TD('Signe'), TD('Oui')],
        [TD('<b>Wappalyzer</b>'), TD('Analyse technographique des sites web'), TD('URL, technologies detectees'), TD('UE'), TD('Signe'), TD('N/A (UE)')],
        [TD('<b>SendGrid</b>'), TD('Envoi d\'emails transactionnels et de securite'), TD('Emails de destination, contenu des emails'), TD('USA (SCCs)'), TD('Signe'), TD('Oui')],
        [TD('<b>PostHog</b>'), TD('Analytics et suivi d\'utilisation (anonymise)'), TD('Evenements de navigation (anonymises)'), TD('USA (SCCs)'), TD('Signe'), TD('Oui')],
    ], [62, 80, 95, 65, 45, 55]))
    E.append(sp(6))
    E.append(p(
        "DealScope realise un audit regulier de ses sous-traitants et se reserve le droit de modifier "
        "cette liste. Les utilisateurs seront informes de tout changement par email ou via la plateforme. "
        "Les SCCs (Clauses Contractuelles Types) signes avec les sous-traitants hors UE sont conformes "
        "a la Decision d'execution (UE) 2021/914 de la Commission."
    ))
    E.append(PageBreak())
    return E


# ===== 5. FORMULAIRE D'EXERCICE DES DROITS =====
def sec_formulaire():
    E = []
    E.append(h1("5. Formulaire d'Exercice des Droits RGPD"))
    E.append(hr())

    E.append(p(
        "Le formulaire ci-dessous vous permet d'exercer vos droits en matiere de protection des donnees "
        "personnelles conformement au Reglement General sur la Protection des Donnees (RGPD). "
        "Remplissez les champs ci-dessous et envoyez ce formulaire a :"
    ))
    E.append(bul("<b>Email</b> : dpo@dealscope.fr"))
    E.append(bul("<b>Courrier</b> : DPO - DealScope SAS, 12 rue de la Paix, 75002 Paris, France"))
    E.append(sp(10))

    # Form fields
    form_data = [
        [Paragraph("<b>FORMULAIRE D'EXERCICE DES DROITS - RGPD</b>", ParagraphStyle('FormTitle', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=13, leading=18, textColor=C_DARK, alignment=TA_CENTER)), '', ''],
    ]

    form_fields = [
        ("Nom", ""),
        ("Prenom", ""),
        ("Adresse email professionnelle", ""),
        ("Entreprise / Organisation", ""),
        ("Droit exerce", "Acces  /  Rectification  /  Effacement  /  Limitation  /  Portabilite  /  Opposition"),
        ("Description de la demande", ""),
        ("Date", ""),
        ("Signature", ""),
    ]

    for label, value in form_fields:
        if value:
            form_data.append([
                Paragraph(label, S_FORM_LABEL),
                Paragraph(value, ParagraphStyle('FormVal', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=9.5, leading=13, textColor=C_TEXT)),
                Paragraph('', S_FORM_LABEL),
            ])
        else:
            form_data.append([
                Paragraph(label, S_FORM_LABEL),
                Paragraph('_' * 60, S_FORM_LINE),
                Paragraph('', S_FORM_LABEL),
            ])

    form_table = Table(form_data, colWidths=[130, 300, 60])
    form_table.setStyle(TableStyle([
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#BBBBBB')),
        ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_COLOR),
        ('SPAN', (0, 0), (-1, 0)),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    E.append(form_table)
    E.append(sp(12))

    E.append(p(
        "<b>Delai de traitement</b> : DealScope s'engage a traiter votre demande dans un delai maximal "
        "d'un (1) mois a compter de sa reception. Ce delai peut etre prolonge de deux (2) mois "
        "supplementaires en cas de complexite."
    ))
    E.append(p(
        "<b>Pieces justificatives</b> : Joinez une copie de votre piece d'identite pour faciliter "
        "la verification de votre identite."
    ))
    E.append(p(
        "<b>Reclamation</b> : Si vous estimez que le traitement de vos donnees est non conforme "
        "au RGPD, vous pouvez introduire une reclamation aupres de la CNIL : www.cnil.fr"
    ))
    return E


# ===== MAIN BUILD =====
def main():
    os.makedirs(os.path.dirname(OUT), exist_ok=True)

    doc = TocDocTemplate(
        OUT,
        pagesize=A4,
        leftMargin=0.75*inch,
        rightMargin=0.75*inch,
        topMargin=0.75*inch,
        bottomMargin=0.75*inch,
        title="DealScope_Documents_Juridiques_RGPD",
        author="Z.ai",
        creator="Z.ai",
        subject="Documents Juridiques et Conformite RGPD - DealScope SAS"
    )

    story = []

    # 1. Cover Page
    story.extend(cover())

    # 2. Table of Contents
    story.extend(toc())

    # 3. CGU
    story.extend(sec_cgu())

    # 4. Politique de Confidentialite
    story.extend(sec_politique_confidentialite())

    # 5. Mentions Legales
    story.extend(sec_mentions_legales())

    # 6. Sous-traitance (DPA)
    story.extend(sec_sous_traitance())

    # 7. Formulaire
    story.extend(sec_formulaire())

    # Build with multiBuild for auto-TOC
    doc.multiBuild(story, onLaterPages=footer, onFirstPage=footer)
    print(f"PDF built successfully: {OUT}")


if __name__ == '__main__':
    main()
