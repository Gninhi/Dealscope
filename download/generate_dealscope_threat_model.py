#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""DealScope Plan Securite & Threat Model PDF Generator"""

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
pdfmetrics.registerFont(TTFont('DejaVuSansMono', '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'))
registerFontFamily('TimesNewRoman', normal='TimesNewRoman', bold='TimesNewRomanBold', italic='TimesNewRomanItalic', boldItalic='TimesNewRomanBold')
registerFontFamily('DejaVuSans', normal='DejaVuSans', bold='DejaVuSansBold')
registerFontFamily('DejaVuSansMono', normal='DejaVuSansMono')

# ===== COLORS =====
TABLE_HEADER_COLOR = colors.HexColor('#1F4E79')
C_DARK = colors.HexColor('#1F4E79')
C_MED = colors.HexColor('#2E75B6')
C_LIGHT = colors.HexColor('#D6E4F0')
C_GOLD = colors.HexColor('#C49A2A')
C_TEXT = colors.HexColor('#1A1A1A')
C_GRAY = colors.HexColor('#555555')
C_ALT = colors.HexColor('#EBF1F8')
C_RED = colors.HexColor('#C0392B')
C_GREEN = colors.HexColor('#27AE60')
C_ORANGE = colors.HexColor('#E67E22')

# ===== OUTPUT =====
OUT = '/home/z/my-project/download/DealScope_Plan_Securite_Threat_Model.pdf'

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
S_BULLET = ParagraphStyle('Bul', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=10.5, leading=15, textColor=C_TEXT, leftIndent=20, bulletIndent=8, spaceAfter=3)
S_TH = ParagraphStyle('TH', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=9, leading=12, textColor=colors.white, alignment=TA_CENTER)
S_TD = ParagraphStyle('TD', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=8.5, leading=11, textColor=C_TEXT, alignment=TA_LEFT)
S_TDC = ParagraphStyle('TDC', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=8.5, leading=11, textColor=C_TEXT, alignment=TA_CENTER)
S_COVER_TITLE = ParagraphStyle('CoverTitle', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=34, leading=42, textColor=C_DARK, alignment=TA_CENTER, spaceAfter=8)
S_COVER_SUB = ParagraphStyle('CoverSub', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=18, leading=24, textColor=C_MED, alignment=TA_CENTER, spaceAfter=6)
S_COVER_INFO = ParagraphStyle('CoverInfo', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=12, leading=18, textColor=C_TEXT, alignment=TA_CENTER, spaceAfter=4)
S_COVER_CONF = ParagraphStyle('CoverConf', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=10, leading=14, textColor=C_GRAY, alignment=TA_CENTER)
S_TOC_TITLE = ParagraphStyle('TocTitle', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=20, leading=26, textColor=C_DARK, spaceAfter=20)
S_NOTE = ParagraphStyle('Note', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=9.5, leading=13, textColor=colors.HexColor('#336699'), leftIndent=15, spaceAfter=8, backColor=colors.HexColor('#F0F6FF'), borderPadding=6)
S_SMALL = ParagraphStyle('Small', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=8, leading=10, textColor=C_GRAY, alignment=TA_LEFT)


# ===== HELPERS =====
def h1(t): return Paragraph(t, sty['Heading1'])
def h2(t): return Paragraph(t, sty['Heading2'])
def h3(t): return Paragraph(t, sty['Heading3'])
def p(t): return Paragraph(t, S_BODY)
def bul(t): return Paragraph(t, S_BULLET, bulletText='\u2022')
def sp(pts=8): return Spacer(1, pts)
def hr(): return HRFlowable(width="100%", color=C_LIGHT, thickness=1, spaceBefore=4, spaceAfter=4)
def TH(t): return Paragraph(t, S_TH)
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


def threat_table(threats, col_widths=None):
    """Create a STRIDE threat table. Each threat is (id, name, likelihood, impact, score, mitigation, owner)."""
    if col_widths is None:
        col_widths = [22, 105, 35, 35, 35, 165, 50]
    header = [TH('#'), TH('Menace'), TH('Vraisem. (1-5)'), TH('Impact (1-5)'), TH('Score'), TH('Contre-mesure'), TH('Responsable')]
    data = [header]
    for t in threats:
        tid, name, l, i, score, mit, owner = t
        score_color = C_RED if score >= 15 else (C_ORANGE if score >= 10 else C_GREEN)
        score_style = ParagraphStyle('ScoreCell', parent=S_TDC, textColor=score_color, fontName='TimesNewRoman')
        data.append([
            TD(tid, True), TD(name), TD(str(l), True), TD(str(i), True),
            Paragraph(str(score), score_style),
            TD(mit), TD(owner, True)
        ])
    return tbl(data, col_widths)


def risk_badge(score):
    if score >= 20: return Paragraph('<b>CRITIQUE</b>', ParagraphStyle('RB', parent=S_TDC, textColor=colors.white, backColor=C_RED, borderPadding=2))
    if score >= 15: return Paragraph('<b>HAUT</b>', ParagraphStyle('RB', parent=S_TDC, textColor=colors.white, backColor=C_ORANGE, borderPadding=2))
    if score >= 10: return Paragraph('<b>MOYEN</b>', ParagraphStyle('RB', parent=S_TDC, textColor=colors.white, backColor=C_GOLD, borderPadding=2))
    return Paragraph('<b>FAIBLE</b>', ParagraphStyle('RB', parent=S_TDC, textColor=colors.white, backColor=C_GREEN, borderPadding=2))


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
        canvas.drawCentredString(PAGE_W/2, 0.8*cm, "DealScope - Plan de Securite &amp; Audit - Threat Model  |  Page %d" % doc.page)
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


# ===== COVER PAGE =====
def cover():
    E = []
    E.append(Spacer(1, 60))
    E.append(HRFlowable(width="60%", color=C_DARK, thickness=3, spaceBefore=0, spaceAfter=20))
    E.append(Paragraph("Plan de Securite &amp; Audit", S_COVER_TITLE))
    E.append(sp(8))
    E.append(Paragraph("<b>Threat Model</b>", ParagraphStyle('CoverTM', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=28, leading=36, textColor=C_GOLD, alignment=TA_CENTER, spaceAfter=6)))
    E.append(sp(12))
    E.append(HRFlowable(width="40%", color=C_MED, thickness=1.5, spaceBefore=10, spaceAfter=20))
    E.append(Paragraph("DealScope - Plateforme SaaS M&amp;A Intelligence", S_COVER_SUB))
    E.append(sp(6))
    E.append(Paragraph("Multi-tenant SaaS | FastAPI | Next.js | PostgreSQL RLS | Redis | Neo4j | Weaviate | LangGraph Agents | AWS ECS", ParagraphStyle('Stack', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=9, leading=13, textColor=C_GRAY, alignment=TA_CENTER, spaceAfter=6)))
    E.append(sp(40))
    E.append(Paragraph("Version 1.0 - Mars 2026", S_COVER_INFO))
    E.append(sp(4))
    E.append(Paragraph("Z.ai", S_COVER_INFO))
    E.append(sp(30))
    E.append(HRFlowable(width="60%", color=C_DARK, thickness=3, spaceBefore=20, spaceAfter=20))
    E.append(sp(20))
    E.append(Paragraph("CONFIDENTIEL", ParagraphStyle('ConfBadge', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=14, leading=18, textColor=colors.white, alignment=TA_CENTER, backColor=C_RED, borderPadding=8)))
    E.append(sp(10))
    E.append(Paragraph("Document interne a usage exclusif de l'equipe technique DealScope et des auditeurs autorises. Toute reproduction ou distribution non autorisee est strictement interdite.", S_COVER_CONF))
    E.append(PageBreak())
    return E


# ===== TOC PAGE =====
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


# ===== SECTION 1: INTRODUCTION =====
def sec_introduction():
    E = []
    E.append(h1("1. Introduction"))
    E.append(hr())

    E.append(h2("1.1 Objectif et portee"))
    E.append(p(
        "Le present document constitue le Plan de Securite et le Modele de Menaces (Threat Model) de la plateforme DealScope. "
        "Il a pour vocation d'identifier, d'evaluer et de prioriser les menaces de securite applicables a l'architecture "
        "de la plateforme, et de definir les contre-mesures techniques et organisationnelles correspondantes. Ce document "
        "s'inscrit dans une demarche proactive de gestion des risques, conforme aux bonnes pratiques de l'industrie (OWASP, "
        "NIST Cybersecurity Framework) et aux exigences reglementaires du RGPD."
    ))
    E.append(p(
        "La portee couvre l'ensemble de la stack technique de DealScope : le backend FastAPI, le frontend Next.js, les bases "
        "de donnees (PostgreSQL avec RLS, Redis, Neo4j, Weaviate), le moteur d'agents IA LangGraph, les integrations CRM "
        "(Salesforce, HubSpot, Pipedrive), l'authentification Clerk.dev, l'infrastructure AWS ECS, ainsi que les flux de "
        "donnees entre ces composants. Les menaces sont analysees selon la methodologie STRIDE, complementee par une matrice "
        "d'attack surface et un audit OWASP Top 10 2021."
    ))

    E.append(h2("1.2 Philosophie de conception Security-first"))
    E.append(p(
        "DealScope adopte une philosophie <b>Security-by-Design</b> : la securite n'est pas un ajout a posteriori mais un "
        "pilier fondamental de l'architecture. Chaque decision de conception est evaluee sous le prisme de la securite. "
        "Les principes directeurs sont :"
    ))
    E.append(bul("<b>Defense en profondeur</b> : plusieurs couches de protection independantes, de sorte que la compromission d'un mecanisme ne suffit pas a compromettre l'ensemble du systeme."))
    E.append(bul("<b>Moindre privilege</b> : chaque composant, utilisateur et service ne dispose que des permissions strictement necessaires a sa fonction."))
    E.append(bul("<b>Zero Trust</b> : aucune entite (interne ou externe) n'est implicitement fiable. Chaque requete est authentifiee, autorisee et auditée."))
    E.append(bul("<b>Echec securise</b> : en cas d'erreur, le systeme privilegie la securite (deni d'acces) plutot que la disponibilite."))
    E.append(bul("<b>Chiffrement omnipresent</b> : toutes les donnees sont chiffrees au repos (AES-256-GCM) et en transit (TLS 1.3)."))

    E.append(h2("1.3 Cadres de conformite"))
    E.append(p(
        "DealScope vise la conformite simultanee avec trois cadres de reference complémentaires, adaptés a son positionnement "
        "de plateforme SaaS europeenne traitant des donnees personnelles B2B :"
    ))
    E.append(sp(4))
    E.append(tbl([
        [TH('Cadre'), TH('Scope'), TH('Statut'), TH('Exigences cles')],
        [TD('RGPD (GDPR)'), TD('Protection des donnees personnelles B2B'), TD('En cours'), TD('DPO, AIPD, registre des traitements, droit a l\'effacement, sous-traitants')],
        [TD('ISO 27001:2022'), TD('Systeme de management de la securite de l\'information'), TD('Planifie'), TD('Annexe A controls, SOA, audit interne, revue de direction')],
        [TD('SOC 2 Type II'), TD('Securite, Disponibilite, Confidentialite des services cloud'), TD('Planifie'), TD('Controles TSC, audit annuel independant, rapports de confiance')],
    ], [70, 130, 55, 195]))
    E.append(sp(6))
    E.append(p(
        "L'intersection de ces trois cadres garantit un niveau de maturite securitaire adapte aux exigences des clients "
        "institutionnels et aux regulations europeennes, tout en facilitant les audits de conformite realises par les "
        "prospects et partenaires de DealScope."
    ))
    E.append(PageBreak())
    return E


# ===== SECTION 2: MODELE DE MENACES STRIDE =====
def sec_stride():
    E = []
    E.append(h1("2. Modele de Menaces STRIDE"))
    E.append(hr())
    E.append(p(
        "La methodologie STRIDE (Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege) "
        "developpee par Microsoft est utilisee pour identifier systematiquement les menaces applicables a la plateforme DealScope. "
        "Chaque menace est evaluee selon sa vraisemblance (1-5), son impact (1-5), et un score de risque calcule comme le produit "
        "des deux. Les contre-mesures sont assignees a un responsable metier."
    ))

    # S - Spoofing
    E.append(h2("2.1 S - Spoofing (Usurpation d'identite)"))
    E.append(p("L'usurpation d'identite consiste a se faire passer pour un utilisateur, un service ou un systeme legitime afin d'obtenir un acces non autorise."))
    E.append(threat_table([
        ("S-1", "Creation de workspace fictif via vol de token Clerk.dev", 3, 5, 15, "MFA obligatoire, validation email, monitoring des creations de workspace, rotation des tokens JWT (15 min)", "SecOps / Auth"),
        ("S-2", "Fabrication de cle API Enterprise", 2, 5, 10, "Format ds_pk_live_ avec prefix HMAC, stockage hash SHA-256, audit des creations de cles, IP allowlisting", "Backend / IAM"),
        ("S-3", "Spoofing de l'expediteur de sequences email", 3, 4, 12, "SPF/DKIM/DMARC strict, envoi via SendGrid/Mailgun avec verification d'identite, BCC d'archivage", "Email Ops"),
        ("S-4", "Détournement de subscription WebSocket", 3, 4, 12, "Auth JWT sur upgrade WebSocket, validation workspace_id dans chaque message, timeout de session (30 min)", "Backend / Realtime"),
        ("S-5", "Usurpation d'identite CRM lors de la synchronisation webhook", 2, 4, 8, "Signature HMAC-SHA256 des webhooks, verification timestamp (< 5 min), IP allowlisting", "Integration"),
    ]))

    # T - Tampering
    E.append(h2("2.2 T - Tampering (Falsification des donnees)"))
    E.append(p("La falsification consiste a modifier des donnees ou du code sans autorisation, compromettant l'integrite du systeme et des informations."))
    E.append(threat_table([
        ("T-1", "Manipulation des criteres ICP pour fausser le scoring", 2, 4, 8, "Versioning des profils ICP, journalisation des modifications, validation des changements par admin", "Product / Backend"),
        ("T-2", "Injection de contenu dans les rapports d'analyse IA", 3, 5, 15, "Sanitisation des inputs LLM, sandbox d'execution des agents, validation structurelle des rapports", "AI Eng / Sec"),
        ("T-3", "Modification non autorisee des etapes du pipeline", 3, 4, 12, "RBAC granulaire sur les mutations pipeline, audit trail immuable, validation business rules", "Product / IAM"),
        ("T-4", "Falsification des logs d'audit", 2, 5, 10, "Ecriture append-only (S3 WORM), hash chain des logs, monitoring d'integrite, separateur de devoirs", "SecOps / Infra"),
        ("T-5", "Alteration des donnees du graphe de connaissances (Neo4j)", 2, 4, 8, "RLS-equivalent sur Neo4j, validation des mutations, backup quotidien, chiffrement at-rest", "Data / Backend"),
    ]))

    # R - Repudiation
    E.append(h2("2.3 R - Repudiation (Repudiation d'actions)"))
    E.append(p("La repudiation consiste a nier avoir effectue une action, rendant difficile l'attribution de responsabilites."))
    E.append(threat_table([
        ("R-1", "Deni d'envoi de sequences email", 3, 3, 9, "Logs d'envoi avec ID unique, horodatage signe, archivage S3 immuable, rapport de livraison", "Email Ops"),
        ("R-2", "Export de donnees sans tracabilite", 2, 4, 8, "Journalisation obligatoire de tout export, conservation 36 mois, horodatage et ID utilisateur", "Backend / DPO"),
        ("R-3", "Litiges de synchronisation CRM", 3, 3, 9, "Logs bidirectionnels de sync, ID de correlation, snapshots pre/post sync, reconciliation automatisee", "Integration"),
        ("R-4", "Deni de modification de permissions", 2, 4, 8, "Audit trail des changements RBAC, notification email aux administrateurs, historique complet", "IAM / SecOps"),
    ]))

    # I - Information Disclosure
    E.append(h2("2.4 I - Information Disclosure (Divulgation d'informations)"))
    E.append(p("La divulgation d'informations concerne l'exposition non autorisee de donnees sensibles a des parties non habilitées."))
    E.append(threat_table([
        ("I-1", "Fuite de donnees inter-tenants (contournement RLS)", 2, 5, 10, "RLS PostgreSQL + validation applicative, tests de penetration trimestriels, monitoring des acces", "Backend / Sec"),
        ("I-2", "Exposition d'emails via introspection GraphQL", 3, 5, 15, "Desactivation introspection en production, champs PII masques par defaut, access control sur schema", "Backend / GraphQL"),
        ("I-3", "Injection de prompt LLM revelant les system prompts", 3, 4, 12, "Output filtering, separation stricte system/user prompts, rate limiting des appels LLM, monitoring", "AI Eng / Sec"),
        ("I-4", "Exposition de cle API dans le code frontend", 3, 5, 15, "Zero cle secrete dans le frontend, server-side proxy pour les appels sensibles, DAST scan CI/CD", "Frontend / CI"),
        ("I-5", "Fuite de donnees PII via logs verbeux", 3, 4, 12, "Masquage automatique PII dans les logs (email, telephone), rotation des logs, audit de configuration logging", "Backend / Infra"),
    ]))

    # D - Denial of Service
    E.append(h2("2.5 D - Denial of Service (Deni de service)"))
    E.append(p("Le deni de service vise a rendre la plateforme indisponible ou a degrader significativement ses performances."))
    E.append(threat_table([
        ("D-1", "Attaques par complexite de requetes GraphQL (requetes imbriquees)", 4, 4, 16, "Analyse de complexite (query depth, node count), limites par plan, timeout 30s, query cost analysis", "Backend / GraphQL"),
        ("D-2", "Inondation de scans (bombes de cout LLM)", 3, 4, 12, "Quota de scans par workspace/mois, queue async avec priorite, budget LLM alertes, throttling progressif", "AI Eng / Product"),
        ("D-3", "Epuisement des limites d'API (rate limit exhaustion)", 4, 3, 12, "Rate limiting multi-niveaux (IP, user, workspace), AWS WAF, backoff exponentiel, alerting SevOps", "Infra / Backend"),
        ("D-4", "Inondation de subscriptions WebSocket", 3, 3, 9, "Limite de 5 subscriptions concurrentes par utilisateur, validation JWT, heartbeat timeout, auto-cleanup", "Backend / Realtime"),
    ]))

    # E - Elevation of Privilege
    E.append(h2("2.6 E - Elevation of Privilege (Elevation de privilege)"))
    E.append(p("L'elevation de privilege consiste a obtenir des droits superieurs a ceux normalement accordes, permettant un acces non autorise a des fonctionnalites sensibles."))
    E.append(threat_table([
        ("E-1", "Escalade de role workspace (member -> admin)", 2, 5, 10, "RBAC enforce cote serveur, validation du role dans chaque requête, audit des changements de role, protection admin lock", "IAM / Backend"),
        ("E-2", "Acces admin cross-workspace", 2, 5, 10, "Workspace_id obligatoire dans chaque requete, RLS PostgreSQL, pas de token super-admin applicatif, audit cross-tenant", "IAM / Sec"),
        ("E-3", "Escalade de privilege via cle API Enterprise", 2, 5, 10, "Permissions granulaires par cle, verification workspace_id associe, pas de privilege *:*, revocation immediate", "Backend / IAM"),
        ("E-4", "Exploitation des vulnérabilites de deserialisation dans les agents LangGraph", 2, 5, 10, "Input validation stricte, sandbox d'execution, pas de pickle, signature des payloads inter-agents", "AI Eng / Sec"),
    ]))

    # Risk summary
    E.append(h2("2.7 Synthese des scores de risque"))
    E.append(p("Le tableau ci-dessous resume la distribution des scores de risque par categorie STRIDE :"))
    E.append(tbl([
        [TH('Categorie STRIDE'), TH('Nb menaces'), TH('Score moyen'), TH('Score max'), TH('Niveau de risque global')],
        [TD('S - Spoofing'), TD('5', True), TD('11.4', True), TD('15', True), TD('HAUT')],
        [TD('T - Tampering'), TD('5', True), TD('10.6', True), TD('15', True), TD('MOYEN')],
        [TD('R - Repudiation'), TD('4', True), TD('8.5', True), TD('9', True), TD('MOYEN')],
        [TD('I - Information Disclosure'), TD('5', True), TD('12.8', True), TD('15', True), TD('HAUT')],
        [TD('D - Denial of Service'), TD('4', True), TD('12.3', True), TD('16', True), TD('HAUT')],
        [TD('E - Elevation of Privilege'), TD('4', True), TD('10.0', True), TD('10', True), TD('MOYEN')],
    ], [120, 65, 65, 65, 100]))
    E.append(PageBreak())
    return E


# ===== SECTION 3: MATRICE D'ATTAQUE SURFACE =====
def sec_attack_surface():
    E = []
    E.append(h1("3. Matrice d'Attaque Surface"))
    E.append(hr())
    E.append(p(
        "La matrice d'attack surface identifie les interfaces exposees de la plateforme DealScope et les associe aux "
        "vecteurs d'attaque potentiels. Cette analyse permet de prioriser les efforts de securite sur les points d'entree "
        "les plus exposes et les plus critiques."
    ))

    E.append(h2("3.1 Interfaces externes"))
    E.append(tbl([
        [TH('Interface'), TH('Protocole'), TH('Vecteurs d\'attaque'), TH('Menaces STRIDE'), TH('Niveau de risque')],
        [TD('GraphQL API'), TD('HTTPS / WSS'), TD('Injection, complexite, introspection, brute-force'), TD('S, T, I, D, E'), TD('CRITIQUE')],
        [TD('WebSocket (Realtime)'), TD('WSS'), TD('Subscription flooding, message injection, session hijack'), TD('S, D, I'), TD('HAUT')],
        [TD('Webhooks entrants'), TD('HTTPS'), TD('Rejeu, spoofing, payload injection, timestamp manipulation'), TD('S, T, R'), TD('HAUT')],
        [TD('Webhooks sortants'), TD('HTTPS'), TD('Interception MTM, modification reponse, SSRF'), TD('T, I, D'), TD('MOYEN')],
        [TD('CRM Sync API'), TD('HTTPS'), TD('Credential leak, data exfiltration, sync corruption'), TD('S, T, I, R'), TD('HAUT')],
        [TD('Portail Web (Next.js)'), TD('HTTPS'), TD('XSS, CSRF, clickjacking, open redirect'), TD('S, T, I'), TD('MOYEN')],
        [TD('API REST Enterprise'), TD('HTTPS'), TD('Key theft, privilege escalation, rate exhaustion'), TD('S, I, D, E'), TD('HAUT')],
        [TD('Email sending'), TD('SMTP'), TD('Spoofing, phishing relay, content injection'), TD('S, T'), TD('MOYEN')],
    ], [75, 50, 140, 75, 65]))
    E.append(sp(6))

    E.append(h2("3.2 Interfaces internes"))
    E.append(tbl([
        [TH('Interface'), TH('Technologie'), TH('Vecteurs d\'attaque'), TH('Menaces STRIDE'), TH('Niveau de risque')],
        [TD('Communication inter-agents'), TD('Redis Pub/Sub + LangGraph'), TD('Message spoofing, payload injection, queue flooding'), TD('S, T, D'), TD('MOYEN')],
        [TD('Acces base de donnees'), TD('PostgreSQL RLS'), TD('SQL injection, RLS bypass, privilege escalation'), TD('T, I, E'), TD('CRITIQUE')],
        [TD('Cache Redis'), TD('Redis 7'), TD('Cache poisoning, deserialization, unauthorized flush'), TD('T, D'), TD('MOYEN')],
        [TD('Graphe Neo4j'), TD('Bolt / Neo4j'), TD('Cypher injection, traversal abuse, data exfiltration'), TD('T, I'), TD('MOYEN')],
        [TD('Vecteur Weaviate'), TD('gRPC'), TD('Embedding poisoning, query manipulation, data leak'), TD('T, I'), TD('MOYEN')],
        [TD('Stockage S3'), TD('AWS S3 API'), TD('Bucket misconfiguration, unauthorized access, data exposure'), TD('I, D'), TD('HAUT')],
        [TD('Services AWS internes'), TD('AWS SDK'), TD('Credential leak via IAM, SSRF, privilege escalation'), TD('S, I, E'), TD('HAUT')],
    ], [85, 75, 145, 65, 60]))
    E.append(PageBreak())
    return E


# ===== SECTION 4: OWASP TOP 10 2021 =====
def sec_owasp():
    E = []
    E.append(h1("4. Checklist OWASP Top 10 2021"))
    E.append(hr())
    E.append(p(
        "L'OWASP Top 10 2021 identifie les dix risques de securite les plus critiques pour les applications web. "
        "Le tableau ci-dessous mappe chaque categorie aux composants specifiques de DealScope, indique le statut de mitigation, "
        "et decrit les contre-mesures implementees ou planifiees."
    ))

    owasp_data = [
        [TH('#'), TH('Categorie OWASP'), TH('Application DealScope'), TH('Statut'), TH('Contre-mesures specifiques')],
        [TD('A01'), TD('Broken Access Control'), TD('RLS PostgreSQL, RBAC Clerk.dev, GraphQL permissions, API key scoping'), TD('Mitige'), TD('RLS + validation applicative, tests penetration RLS, audit cross-tenant, role enforcement server-side')],
        [TD('A02'), TD('Cryptographic Failures'), TD('Chiffrement PII (emails), TLS 1.3, AES-256-GCM at-rest, KMS'), TD('Mitige'), TD('Field-level encryption pour PII, TLS 1.3 mandatory, AWS KMS rotation, HSM pour cles maitresses')],
        [TD('A03'), TD('Injection'), TD('SQL (PostgreSQL), NoSQL (Neo4j), GraphQL injection, LLM prompt injection'), TD('Mitige'), TD('Parameterized queries, GraphQL depth limiting, input validation, LLM output filtering, sandbox agents')],
        [TD('A04'), TD('Insecure Design'), TD('Architecture multi-tenant, ICP criteria, scoring algorithm'), TD('Partiel'), TD('Threat modeling STRIDE (ce document), security design reviews, abuse case analysis, penetration tests')],
        [TD('A05'), TD('Security Misconfiguration'), TD('AWS ECS, CloudFront, S3 buckets, CORS, GraphQL introspection'), TD('Mitige'), TD('IaC avec Terraform, CIS benchmarks, introspection disabled en prod, S3 block public access, security headers')],
        [TD('A06'), TD('Vulnerable &amp; Outdated Components'), TD('FastAPI, Next.js, PostgreSQL, Redis, Neo4j, Weaviate, LangGraph'), TD('Partiel'), TD('Dependabot, Snyk scanning, mise a jour automatique, politique de cycle de vie, SBOM')],
        [TD('A07'), TD('Identification &amp; Auth Failures'), TD('Clerk.dev JWT, MFA, API keys, session management'), TD('Mitige'), TD('Clerk.dev MFA, JWT 15 min rotation, refresh token rotation, brute-force protection, API key HMAC')],
        [TD('A08'), TD('Software &amp; Data Integrity Failures'), TD('CI/CD pipeline, LangGraph agent outputs, CRM sync, audit logs'), TD('Partiel'), TD('Signed CI/CD artifacts, output validation agents, HMAC webhooks, immutable audit logs (S3 WORM)')],
        [TD('A09'), TD('Security Logging &amp; Monitoring Failures'), TD('Application logs, audit trail, error monitoring, alerts'), TD('Partiel'), TD('Centralized logging (CloudWatch), PII masking, 36-month retention, real-time alerting, SIEM integration')],
        [TD('A10'), TD('Server-Side Request Forgery (SSRF)'), TD('Webhook delivery, CRM sync, agent OSINT, API integrations'), TD('Partiel'), TD('URL allowlisting, no internal IP resolution, metadata service blocking, VPC endpoints, request signing')],
    ]
    E.append(tbl(owasp_data, [28, 80, 110, 42, 190]))
    E.append(sp(8))
    E.append(p("<b>Resume :</b> 6 categories sur 10 sont pleinement mitigees, 4 sont en mitigation partielle avec un plan de remédiation defini. Aucune categorie n'est non applicable. Les categories A04, A06, A08, A09 et A10 sont prioritisees pour le prochain trimestre."))
    E.append(PageBreak())
    return E


# ===== SECTION 5: POLITIQUE DE CHIFFREMENT =====
def sec_encryption():
    E = []
    E.append(h1("5. Politique de Chiffrement"))
    E.append(hr())
    E.append(p(
        "DealScope met en oeuvre une politique de chiffrement exhaustive couvrant toutes les donnees au repos et en transit. "
        "Cette politique garantit la confidentialite des donnees personnelles (RGPD Article 32) et la protection contre "
        "les acces non autorises."
    ))

    E.append(h2("5.1 Chiffrement au repos"))
    E.append(tbl([
        [TH('Composant'), TH('Algorithme'), TH('Gestion des cles'), TH('Details')],
        [TD('PostgreSQL 16 (RDS)'), TD('AES-256-GCM'), TD('AWS KMS (CMK)'), TD('Encryption automatique des volumes EBS, chiffrement TDE active, rotation annuelle des cles')],
        [TD('AWS S3 (stockage objet)'), TD('AES-256 (SSE-S3 / SSE-KMS)'), TD('AWS KMS (CMK)'), TD('Bucket encryption par defaut, S3 Object Lock pour audit logs, versioning active')],
        [TD('Neo4j (graph DB)'), TD('AES-256'), TD('AWS KMS'), TD('Encryption des volumes de donnees, chiffrement des backups, acces restreint par VPC')],
        [TD('Redis 7 (ElastiCache)'), TD('AES-256'), TD('AWS KMS'), TD('Encryption in-transit et at-rest, authentification IAM, pas d\'acces public')],
        [TD('Weaviate (vecteurs)'), TD('AES-256'), TD('AWS KMS'), TD('Encryption des volumes, chiffrement des embeddings, isolation VPC')],
    ], [80, 80, 80, 190]))
    E.append(sp(6))

    E.append(h2("5.2 Chiffrement en transit"))
    E.append(tbl([
        [TH('Flux de donnees'), TH('Protocole'), TH('Version minimum'), TH('Configuration')],
        [TD('API GraphQL (client -> backend)'), TD('TLS'), TD('TLS 1.3'), TD('Certificat wildcard ACM, HSTS header (max-age=31536000), OCSP stapling')],
        [TD('WebSocket (realtime)'), TD('WSS (TLS over WS)'), TD('TLS 1.3'), TD('Meme certificat que l\'API, upgrade securise, heartbeat 30s')],
        [TD('DB connections (app -> RDS)'), TD('TLS'), TD('TLS 1.2+'), TD('RDS force SSL, certificat CA AWS, verification hostname')],
        [TD('CRM Sync (webhooks)'), TD('HTTPS + HMAC'), TD('TLS 1.3'), TD('Signature HMAC-SHA256, verification timestamp, IP allowlist')],
        [TD('Services AWS internes'), TD('TLS'), TD('TLS 1.2+'), TD('VPC endpoints, IAM authentication, pas de transit sur internet')],
    ], [95, 75, 65, 195]))
    E.append(sp(6))

    E.append(h2("5.3 Chiffrement au niveau des champs (Field-Level Encryption)"))
    E.append(p(
        "Les donnees personnelles sensibles (adresses email, numeros de telephone) sont chiffrees au niveau applicatif "
        "avant stockage en base de donnees, en plus du chiffrement au repos de la couche infrastructure. Ce double chiffrement "
        "garantit que meme un acces administrateur a la base de donnees ne permet pas de lire les donnees PII en clair."
    ))
    E.append(tbl([
        [TH('Champ'), TH('Type de donnee'), TH('Algorithme FLE'), TH('Gestion des cles')],
        [TD('Contact.email'), TD('Adresse email B2B'), TD('AES-256-GCM (per-tenant key)'), TD('AWS KMS, derivation de cle par workspace_id')],
        [TD('Contact.phone'), TD('Numero de telephone'), TD('AES-256-GCM (per-tenant key)'), TD('AWS KMS, derivation de cle par workspace_id')],
        [TD('Contact.firstName / lastName'), TD('Nom / Prenom'), TD('AES-256-GCM (per-tenant key)'), TD('AWS KMS, derivation de cle par workspace_id')],
    ], [90, 90, 120, 130]))
    E.append(sp(6))

    E.append(h2("5.4 Gestion du cycle de vie des cles"))
    E.append(bul("<b>Rotation automatique</b> : les cles KMS sont rotatees automatiquement tous les 365 jours (politique AWS KMS auto-rotation)."))
    E.append(bul("<b>Rotation manuelle</b> : rotation manuelle dans les 24h en cas de compromission suspectee (procedure d'urgence IRP)."))
    E.append(bul("<b>Certificats TLS</b> : renouvellement automatique via AWS Certificate Manager (ACM), rotation tous les 90 jours."))
    E.append(bul("<b>Cles FLE</b> : derivation par workspace_id via HKDF-SHA256, permettant le re-chiffrement par workspace si necessaire."))
    E.append(bul("<b>Backup des cles</b> : export des cles KMS dans AWS CloudHSM pour recuperation en cas de catastrophe."))
    E.append(PageBreak())
    return E


# ===== SECTION 6: GESTION DES SECRETS & API KEYS =====
def sec_secrets():
    E = []
    E.append(h1("6. Gestion des Secrets &amp; API Keys"))
    E.append(hr())
    E.append(p(
        "La gestion securisee des secrets et cles API est essentielle pour prevenir les compromissions de credentials "
        "qui pourraient conduire a des violations de donnees massives. DealScope implemente une politique stricte de gestion "
        "des secrets couvrant le stockage, la rotation, l'acces et le cycle de vie."
    ))

    E.append(h2("6.1 Stockage et gestion"))
    E.append(tbl([
        [TH('Secret'), TH('Stockage'), TH('Acces'), TH('Rotation')],
        [TD('Cles API Stripe / SendGrid'), TD('AWS Secrets Manager'), TD('IAM role ECS task + ARN restrictif'), TD('90 jours (auto)')],
        [TD('Cles Clerk.dev (JWT verification)'), TD('AWS Secrets Manager'), TD('IAM role ECS task'), TD('90 jours (auto)')],
        [TD('Chaines de connexion DB'), TD('AWS Secrets Manager + IAM'), TD('RDS IAM authentication'), TD('90 jours (auto)')],
        [TD('Cles API clients Enterprise'), TD('PostgreSQL (hash SHA-256)'), TD('IAM role + RLS'), TD('Non (revoquable)')],
        [TD('Webhook secrets CRM'), TD('AWS Secrets Manager'), TD('IAM role ECS task'), TD('90 jours (auto)')],
        [TD('Cles LLM (OpenAI, Anthropic)'), TD('AWS Secrets Manager'), TD('IAM role ECS task'), TD('90 jours (auto)')],
    ], [105, 100, 120, 95]))
    E.append(sp(6))

    E.append(h2("6.2 Politique de rotation"))
    E.append(bul("<b>Rotation automatique</b> : tous les secrets stockes dans AWS Secrets Manager sont configures pour une rotation automatique tous les 90 jours via Lambda functions dediees."))
    E.append(bul("<b>Rotation d'urgence</b> : en cas de compromission suspectee, la rotation manuelle est declenchee dans les 2 heures (procedure IRP P1)."))
    E.append(bul("<b>Cles API Enterprise</b> : pas de rotation automatique, mais revoquation immediate possible et historique d'utilisation."))
    E.append(sp(4))

    E.append(h2("6.3 Variables d'environnement et CI/CD"))
    E.append(bul("<b>Zero secret dans le code</b> : les secrets ne sont jamais commites dans le depot Git. Detection automatique via git-secrets et truffleHog."))
    E.append(bul("<b>Fichiers .env</b> : ignores via .gitignore, generés dynamiquement en CI/CD depuis AWS Secrets Manager."))
    E.append(bul("<b>Pipeline CI/CD</b> : les secrets sont injectés comme variables d'environnement ephemeres dans les runners GitHub Actions, sans persistance."))
    E.append(bul("<b>Audit</b> : scan hebdomadaire des repositories pour detecter d'eventuels secrets exposes (Gitleaks + truffleHog dans CI)."))
    E.append(PageBreak())
    return E


# ===== SECTION 7: POLITIQUE DE RETENTION DES DONNEES =====
def sec_retention():
    E = []
    E.append(h1("7. Politique de Retention des Donnees"))
    E.append(hr())
    E.append(p(
        "Conformement aux articles 5(1)(e) et 17 du RGPD (principe de limitation de la conservation et droit a l'effacement), "
        "DealScope definit des periodes de retention specifiques pour chaque categorie de donnees, associees a des mecanismes "
        "automatiques de suppression et d'anonymisation."
    ))

    E.append(h2("7.1 Categories de donnees et periodes de retention"))
    E.append(tbl([
        [TH('Categorie de donnees'), TH('Periode de retention'), TH('Action en fin de retention'), TH('Base legale')],
        [TD('Donnees de compte utilisateur'), TD('Duree du contrat + 3 ans'), TD('Anonymisation (pseudo-anonymisation irreversible)'), TD('Execution du contrat (Art. 6.1.b)')],
        [TD('Profils entreprises cibles (ICP)'), TD('24 mois apres dernier scan'), TD('Suppression automatique (cron job quotidien)'), TD('Interet legitime (Art. 6.1.f)')],
        [TD('Contacts (emails, telephones)'), TD('18 mois apres creation'), TD('Suppression automatique + confirmation opt-in'), TD('Consentement ou interet legitime')],
        [TD('Rapports d\'analyse IA'), TD('36 mois'), TD('Archivage anonymise, suppression PII'), TD('Interet legitime')],
        [TD('Logs d\'audit et de securite'), TD('36 mois minimum'), TD('Archivage S3 Glacier (WORM), suppression apres 36 mois'), TD('Obligation legale (Art. 6.1.c)')],
        [TD('Logs applicatiques (non-PII)'), TD('90 jours (hot) + 1 an (cold)'), TD('Suppression automatique'), TD('Interet legitime')],
        [TD('Donnees de graphe (Neo4j)'), TD('18 mois'), TD('Suppression automatique des noeuds/relations expires'), TD('Interet legitime')],
        [TD('Embeddings Weaviate'), TD('Alignes sur les donnees source'), TD('Cascading delete avec les donnees source'), TD('Interet legitime')],
    ], [110, 100, 130, 115]))
    E.append(sp(6))

    E.append(h2("7.2 Droit a l'effacement (RGPD Article 17)"))
    E.append(p(
        "DealScope implemente un mecanisme complet de droit a l'effacement permettant aux utilisateurs de demander "
        "la suppression de toutes leurs donnees personnelles. Le processus est le suivant :"
    ))
    E.append(bul("<b>Reception</b> : la demande est recue via le portail utilisateur ou par email au DPO (dpo@dealscope.ai)."))
    E.append(bul("<b>Verification</b> : identification du demandeur et verification du droit a la suppression (pas d'exemption legale)."))
    E.append(bul("<b>Propagation</b> : la demande est diffusee a tous les sous-systemes (PostgreSQL, Neo4j, Weaviate, S3, Redis cache)."))
    E.append(bul("<b>Suppression</b> : execution automatique de la suppression en cascade dans les 72 heures (RGPD : 30 jours max)."))
    E.append(bul("<b>Confirmation</b> : accusé de reception envoyé au demandeur avec le certificat de suppression."))
    E.append(bul("<b>Audit</b> : la demande et son execution sont journalisees dans les logs d'audit immuables."))
    E.append(PageBreak())
    return E


# ===== SECTION 8: PLAN DE REPONSE A INCIDENT =====
def sec_irp():
    E = []
    E.append(h1("8. Plan de Reponse a Incident (IRP)"))
    E.append(hr())
    E.append(p(
        "Le Plan de Reponse a Incident (Incident Response Plan) definit les procedures, les roles et les outils permettant "
        "a DealScope de detecter, contenir, eradiquer et se remettre d'incidents de securite de maniere structuree et efficace. "
        "Ce plan est conforme aux exigences du RGPD (notification CNIL sous 72h) et aux bonnes pratiques NIST SP 800-61."
    ))

    E.append(h2("8.1 Classification des incidents"))
    E.append(tbl([
        [TH('Severite'), TH('Description'), TH('Exemples'), TH('Delai de reponse'), TH('Notification')],
        [TD('P1 - Critique'), TD('Breach de donnees PII confirmé, ransomware, compromission totale'), TD('Fuite inter-tenant, base de donnees exposee, attaque active'), TD('15 minutes'), TD('CNIL < 72h, clients < 24h')],
        [TD('P2 - Haut'), TD('Attaque active non contenue, vulnérabilite exploitee, acces non autorise'), TD('Injection SQL reussie, compte admin compromis, DDoS massif'), TD('1 heure'), TD('Direction < 4h, clients si impact')],
        [TD('P3 - Moyen'), TD('Vulnerabilite detectee non exploitee, comportement suspect, tentative d\'attaque'), TD('Tentative de brute-force, anomalie de logs, scan de ports'), TD('4 heures'), TD('Equipe SecOps, rapport hebdo')],
        [TD('P4 - Faible'), TD('Incident mineur, pas d\'impact sur la securite ou les donnees'), TD('Erreur de config non critique, faux positif SIEM, scan legitime'), TD('24 heures'), TD('Rapport mensuel')],
    ], [55, 95, 105, 55, 90]))
    E.append(sp(6))

    E.append(h2("8.2 Equipe de reponse"))
    E.append(tbl([
        [TH('Role'), TH('Responsable'), TH('Responsabilites'), TH('Contact')],
        [TD('Incident Commander'), TD('CTO / VP Engineering'), TD('Coordination globale, decisions critiques, communication externe'), TD('On-call principal')],
        [TD('Security Lead'), TD('Lead SecOps'), TD('Investigation technique, containment, forensic analysis'), TD('On-call securite')],
        [TD('Backend Lead'), TD('Lead Backend'), TD('Patch et deploiement correctif, isolation des services'), TD('On-call backend')],
        [TD('DPO'), TD('DPO externe'), TD('Evaluation impact RGPD, notification CNIL, gestion droits personnes'), TD('dpo@dealscope.ai')],
        [TD('Communication'), TD('Head of Marketing'), TD('Communication clients, relation presse, FAQ'), TD('Comm backup')],
    ], [75, 80, 185, 70]))
    E.append(sp(6))

    E.append(h2("8.3 Matrice d'escalade"))
    E.append(p(
        "L'escalade suit une matrice stricte : P1 et P2 declenchent immediatement le war room (canal Slack #incident-response "
        "dedie + bridge telephonique). P3 et P4 sont geres via le canal Slack #security-alerts avec un rapport dans les "
        "delais specifies. Le CEO et le conseil juridique sont informes pour tout incident P1."
    ))
    E.append(sp(4))

    E.append(h2("8.4 Templates de notification"))
    E.append(h3("8.4.1 Notification CNIL (P1 - sous 72h)"))
    E.append(p(
        "Conformement a l'article 33 du RGPD, la notification a la CNIL est envoyee via le portail de notification en ligne. "
        "Elle contient : la nature de la violation (categories de donnees, nombre de personnes concernees), les mesures "
        "prises ou proposees pour traiter la violation, les consequences probables, et le point de contact du DPO. "
        "Un modele pre-rempli est maintenu dans le repertoire des procedures d'urgence."
    ))
    E.append(h3("8.4.2 Notification des utilisateurs concernes (P1 - sous 24h)"))
    E.append(p(
        "Si la violation est susceptible d'engendrer un risque eleve pour les droits et libertes des personnes (Article 34), "
        "les personnes concernees sont notifiees directement par email et via une banniere in-app. La notification contient : "
        "une description claire de la violation, le nom et les coordonnees du DPO, les consequences probables, les mesures "
        "prises, et les recommandations pour les personnes concernees."
    ))
    E.append(sp(4))

    E.append(h2("8.5 Cibles RTO / RPO"))
    E.append(tbl([
        [TH('Severite'), TH('RTO (Recovery Time Objective)'), TH('RPO (Recovery Point Objective)'), TH('Strategie')],
        [TD('P1 - Critique'), TD('4 heures'), TD('1 heure'), TD('Failover region secondaire AWS, backup continu PostgreSQL')],
        [TD('P2 - Haut'), TD('8 heures'), TD('4 heures'), TD('Rollback deploy, restoration depuis backup PostgreSQL')],
        [TD('P3 - Moyen'), TD('24 heures'), TD('12 heures'), TD('Patch et deploiement planifié, backup quotidien')],
        [TD('P4 - Faible'), TD('72 heures'), TD('24 heures'), TD('Correction dans le prochain cycle de deploiement')],
    ], [70, 110, 110, 165]))
    E.append(sp(4))

    E.append(h2("8.6 Post-incident review"))
    E.append(p(
        "Apres chaque incident P1 ou P2, une revue post-incident (post-mortem) est obligatoire dans les 5 jours ouvrables. "
        "Elle produit un rapport incluant : la chronologie detaillee, la cause racine (analyse des 5 pourquoi), les lecons "
        "apprentissage, les actions correctives avec echeances et responsables, et la mise a jour du threat model si necessaire. "
        "Les rapports post-incident sont archives dans le systeme de gestion de la securite et partages avec l'ensemble de "
        "l'equipe technique lors de la retro weekly."
    ))
    E.append(PageBreak())
    return E


# ===== SECTION 9: AUDIT DE PENETRATION =====
def sec_pentest():
    E = []
    E.append(h1("9. Audit de Penetration"))
    E.append(hr())
    E.append(p(
        "DealScope programme des audits de penetration reguliers pour identifier les vulnerabilites avant qu'elles ne soient "
        "exploitees par des attaquants. Les tests sont realises par des auditeurs certifies (OSCP, CEH) et couvrent l'ensemble "
        "de la surface d'attaque de la plateforme."
    ))

    E.append(h2("9.1 Calendrier et perimetre"))
    E.append(tbl([
        [TH('Frequence'), TH('Perimetre'), TH('Type de test'), TH('Auditteur')],
        [TD('Trimestrielle'), TD('API GraphQL, Portail Web, WebSocket, Auth Clerk.dev'), TD('Automatise + Manuel'), TD('Interne + Externe (certifie OSCP)')],
        [TD('Semestrielle'), TD('Infrastructure AWS (ECS, RDS, S3, VPC), Configuration securite'), TD('Automatise (ScoutSuite) + Manuel'), TD('Interne SecOps')],
        [TD('Annuelle'), TD('Audit complet incluant ingenierie sociale, phishing, physical security'), TD('Red Team'), TD('Externe (Boutique specialisee)'],
    ], [65, 160, 110, 110]))
    E.append(sp(6))

    E.append(h2("9.2 Outils utilises"))
    E.append(bul("<b>OWASP ZAP</b> : scan automatise DAST (Dynamic Application Security Testing) integre au pipeline CI/CD."))
    E.append(bul("<b>Burp Suite Professional</b> : tests manuels approfondis, fuzzing, manipulation de requetes."))
    E.append(bul("<b>Nuclei</b> : scan de vulnerabilites connues base sur des templates."))
    E.append(bul("<b>ScoutSuite</b> : audit de configuration AWS."))
    E.append(bul("<b>sqlmap</b> : tests d'injection SQL (en environnement de staging uniquement)."))
    E.append(sp(4))

    E.append(h2("9.3 SLA de remediation"))
    E.append(tbl([
        [TH('Severite'), TH('Description'), TH('SLA de remediation'), TH('Escalade si depassement')],
        [TD('Critique'), TD('Exploitable immediatement, impact eleve sur les donnees'), TD('24 heures'), TD('CTO + CEO + DPO')],
        [TD('Haute'), TD('Exploitable avec expertise, impact significatif'), TD('7 jours'), TD('VP Engineering')],
        [TD('Moyenne'), TD('Exploitable dans des conditions specifiques'), TD('30 jours'), TD('Lead SecOps')],
        [TD('Faible'), TD('Impact limite, difficilement exploitable'), TD('90 jours (prochaine release)'), TD('Product Owner')],
    ], [55, 155, 100, 130]))
    E.append(PageBreak())
    return E


# ===== SECTION 10: DPO & CONFORMITE RGPD =====
def sec_dpo():
    E = []
    E.append(h1("10. DPO &amp; Conformite RGPD"))
    E.append(hr())

    E.append(h2("10.1 DPO (Delegue a la Protection des Donnees)"))
    E.append(p(
        "DealScope a nomme un DPO externe conforme aux exigences de l'article 37 du RGPD. Le DPO est independant, "
        "dispose des ressources necessaires, et beneficie d'un acces direct a la direction generale. Ses missions incluent :"
    ))
    E.append(bul("Conseil et accompagnement sur les obligations RGPD."))
    E.append(bul("Controle de conformite et audit des traitements de donnees."))
    E.append(bul("Point de contact pour la CNIL et les personnes concernees."))
    E.append(bul("Gestion des demandes d'exercice de droits (acces, rectification, effacement, portabilite)."))
    E.append(bul("Participation aux AIPD (Analyses d'Impact)."))
    E.append(sp(4))

    E.append(h2("10.2 Registre des traitements"))
    E.append(p(
        "Le registre des traitements (Article 30 du RGPD) est maintenu a jour et contient l'exhaustivite des activites de "
        "traitement de donnees personnelles de DealScope. Pour chaque traitement, sont documentes : les finalites, les "
        "categories de personnes et de donnees, les destinataires, les transferts internationaux, les delais de retention, "
        "et les mesures techniques et organisationnelles de securite."
    ))

    E.append(h2("10.3 AIPD (Analyse d'Impact sur la Protection des Donnees)"))
    E.append(p(
        "Une AIPD a ete realisee pour les traitements suivants, identifies comme a risque eleve au sens de l'article 35 du RGPD :"
    ))
    E.append(bul("<b>Profiling IA</b> : les agents LangGraph realisent du profiling automatique d'entreprises cibles (scoring, ICP matching)."))
    E.append(bul("<b>Enrichissement de donnees OSINT</b> : collecte automatique de donnees publiques sur les entreprises et leurs dirigeants."))
    E.append(bul("<b>Segmentation et scoring</b> : algorithmes de scoring et de priorisation des cibles M&amp;A."))
    E.append(p("Les AIPD sont reexaminees annuellement et a chaque modification significative du traitement."))

    E.append(h2("10.4 Gestion des sous-traitants (DPA)"))
    E.append(tbl([
        [TH('Sous-traitant'), TH('Service'), TH('Localisation'), TH('DPA signee')],
        [TD('AWS'), TD('Infrastructure cloud (ECS, RDS, S3, KMS)'), TD('UE (Frankfurt, Ireland)'), TD('Oui')],
        [TD('Clerk.dev'), TD('Authentification et gestion des identites'), TD('USA (SCC signees)'), TD('Oui')],
        [TD('OpenAI / Anthropic'), TD('Moteur LLM pour les agents IA'), TD('USA (SCC signees)'), TD('Oui')],
        [TD('SendGrid / Mailgun'), TD('Envoi de sequences email'), TD('USA (SCC signees)'), TD('Oui')],
        [TD('Salesforce / HubSpot'), TD('Synchronisation CRM'), TD('UE / USA (SCC)'), TD('Oui (via client)')],
    ], [80, 140, 100, 55]))
    E.append(PageBreak())
    return E


# ===== SECTION 11: AUDIT LOGS & TRACABILITE =====
def sec_audit():
    E = []
    E.append(h1("11. Audit Logs &amp; Tracabilite"))
    E.append(hr())
    E.append(p(
        "Un systeme d'audit robuste et immuable est fondamental pour la conformite reglementaire, l'investigation des incidents "
        "et la responsabilisation des actions. DealScope met en oeuvre un journal d'audit complet qui couvre toutes les "
        "operations sensibles sur la plateforme."
    ))

    E.append(h2("11.1 Journal d'audit immuable"))
    E.append(p(
        "Toutes les operations sensibles sont journalisees dans un audit trail immuable stocke sur Amazon S3 avec "
        "S3 Object Lock (mode WORM - Write Once Read Many). Ce mecanisme garantit que les logs ne peuvent ni etre "
        "modifies ni supprimes pendant la periode de retention, assurant l'integrite de la preuve en cas d'investigation "
        "ou de litige."
    ))
    E.append(bul("<b>Evenements journalises</b> : authentification (succes/echec), changements RBAC, creation/suppression de ressources (workspace, ICP, contacts), exports de donnees, synchronisations CRM, modifications de configuration, escalades de privilege."))
    E.append(bul("<b>Format</b> : chaque evenement contient : timestamp (UTC, microsecondes), user_id, workspace_id, action, resource_type, resource_id, IP source, user-agent, et un hash de chaine (HMAC) permettant de detecter toute altération."))
    E.append(bul("<b>Stockage</b> : S3 Object Lock (compliance mode, 36 mois), replica dans une region AWS secondaire pour la resilience."))
    E.append(sp(4))

    E.append(h2("11.2 Retention et chiffrement des logs"))
    E.append(tbl([
        [TH('Type de log'), TH('Retention'), TH('Chiffrement'), TH('Stockage')],
        [TD('Audit trail (operations sensibles)'), TD('36 mois (WORM)'), TD('AES-256 (SSE-KMS)'), TD('S3 Object Lock + Glacier')],
        [TD('Logs applicatifs (erreurs, warnings)'), TD('90 jours (hot) + 1 an (cold)'), TD('AES-256 (SSE-S3)'), TD('CloudWatch Logs + S3')],
        [TD('Logs d\'acces (CloudTrail)'), TD('36 mois'), TD('AES-256 (SSE-KMS)'), TD('S3 + CloudTrail Lake')],
        [TD('Logs de securite (WAF, GuardDuty)'), TD('90 jours (hot) + 1 an (cold)'), TD('AES-256'), TD('CloudWatch + S3')],
    ], [105, 90, 90, 125]))
    E.append(sp(4))

    E.append(h2("11.3 Reporting de conformite"))
    E.append(p(
        "Des rapports de conformite sont generes automatiquement et communiques aux parties prenantes :"
    ))
    E.append(bul("<b>Hebdomadaire</b> : rapport d'anomalies SecOps (tentatives d'attaque, anomalies de comportement, alertes WAF)."))
    E.append(bul("<b>Mensuel</b> : rapport de conformite RGPD (demandes d'exercice de droits, violations, DPA status)."))
    E.append(bul("<b>Trimestriel</b> : rapport de posture securitaire (statut OWASP, remediation pentests, evolution du risque)."))
    E.append(bul("<b>Annuel</b> : rapport de conformite complet pour la direction et les partenaires (ISO 27001, SOC 2 evidence)."))
    E.append(PageBreak())
    return E


# ===== BUILD =====
def build():
    doc = TocDocTemplate(OUT, pagesize=A4, title="DealScope_Plan_Securite_Threat_Model",
                         author="Z.ai", creator="Z.ai", subject="Plan de Securite & Threat Model - DealScope")
    story = []

    # Cover
    story.extend(cover())

    # TOC
    story.extend(toc_page())

    # All sections
    story.extend(sec_introduction())
    story.extend(sec_stride())
    story.extend(sec_attack_surface())
    story.extend(sec_owasp())
    story.extend(sec_encryption())
    story.extend(sec_secrets())
    story.extend(sec_retention())
    story.extend(sec_irp())
    story.extend(sec_pentest())
    story.extend(sec_dpo())
    story.extend(sec_audit())

    # Build with multiBuild for TOC
    doc.multiBuild(story)
    print(f"PDF generated: {OUT}")


if __name__ == '__main__':
    build()
