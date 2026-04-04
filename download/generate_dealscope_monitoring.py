#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""DealScope Plan Monitoring & Observabilite PDF Generator"""

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
OUT = '/home/z/my-project/download/DealScope_Plan_Monitoring_Observabilite.pdf'

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
S_COVER_TITLE = ParagraphStyle('CoverTitle', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=30, leading=38, textColor=C_DARK, alignment=TA_CENTER, spaceAfter=8)
S_COVER_SUB = ParagraphStyle('CoverSub', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=18, leading=24, textColor=C_MED, alignment=TA_CENTER, spaceAfter=6)
S_COVER_INFO = ParagraphStyle('CoverInfo', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=12, leading=18, textColor=C_TEXT, alignment=TA_CENTER, spaceAfter=4)
S_COVER_CONF = ParagraphStyle('CoverConf', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=10, leading=14, textColor=C_GRAY, alignment=TA_CENTER)
S_TOC_TITLE = ParagraphStyle('TocTitle', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=20, leading=26, textColor=C_DARK, spaceAfter=20)
S_NOTE = ParagraphStyle('Note', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=9.5, leading=13, textColor=colors.HexColor('#336699'), leftIndent=15, spaceAfter=8, backColor=colors.HexColor('#F0F6FF'), borderPadding=6)
S_SMALL = ParagraphStyle('Small', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=8, leading=10, textColor=C_GRAY, alignment=TA_LEFT)
S_CODE = ParagraphStyle('Code', parent=sty['Normal'], fontName='DejaVuSansMono', fontSize=8, leading=11, textColor=colors.HexColor('#333333'), backColor=colors.HexColor('#F5F5F5'), leftIndent=10, borderPadding=4, spaceAfter=4)
S_EVNAME = ParagraphStyle('EvName', parent=sty['Normal'], fontName='DejaVuSansMono', fontSize=7.5, leading=10, textColor=C_DARK)

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
def ev(t): return Paragraph(t, S_EVNAME)


def tbl(data, widths=None):
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


# ===== PAGE TEMPLATES =====
PAGE_W, PAGE_H = A4
MARGIN = 1.8 * cm


class TocDocTemplate(BaseDocTemplate):
    def __init__(self, filename, **kwargs):
        BaseDocTemplate.__init__(self, filename, **kwargs)
        frame = Frame(MARGIN, MARGIN + 0.5*cm, PAGE_W - 2*MARGIN, PAGE_H - 2*MARGIN - 1*cm, id='normal')
        template = PageTemplate(id='toc', frames=frame, onPage=self._page_footer)
        self.addPageTemplates([template])

    def _page_footer(self, canvas, doc):
        canvas.saveState()
        canvas.setFont('TimesNewRoman', 8)
        canvas.setFillColor(C_GRAY)
        canvas.drawCentredString(PAGE_W/2, 0.8*cm, "DealScope - Plan de Monitoring &amp; Observabilite  |  Page %d" % doc.page)
        canvas.setStrokeColor(C_LIGHT)
        canvas.setLineWidth(0.5)
        canvas.line(MARGIN, PAGE_H - MARGIN + 0.3*cm, PAGE_W - MARGIN, PAGE_H - MARGIN + 0.3*cm)
        canvas.restoreState()

    def afterFlowable(self, flowable):
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
    E.append(Paragraph("Plan de Monitoring &amp; Observabilite Produit", S_COVER_TITLE))
    E.append(sp(8))
    E.append(Paragraph("<b>DealScope</b>", ParagraphStyle('CoverDS', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=28, leading=36, textColor=C_GOLD, alignment=TA_CENTER, spaceAfter=6)))
    E.append(sp(12))
    E.append(HRFlowable(width="40%", color=C_MED, thickness=1.5, spaceBefore=10, spaceAfter=20))
    E.append(Paragraph("Plateforme SaaS M&amp;A Intelligence Multi-Agents IA", S_COVER_SUB))
    E.append(sp(6))
    E.append(Paragraph("FastAPI | Next.js | PostgreSQL | Redis | Neo4j | Weaviate | LangGraph (5 agents IA) | AWS ECS Fargate", ParagraphStyle('Stack', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=9, leading=13, textColor=C_GRAY, alignment=TA_CENTER, spaceAfter=6)))
    E.append(sp(40))
    E.append(Paragraph("Version 1.0 - Mars 2026", S_COVER_INFO))
    E.append(sp(4))
    E.append(Paragraph("Z.ai", S_COVER_INFO))
    E.append(sp(30))
    E.append(HRFlowable(width="60%", color=C_DARK, thickness=3, spaceBefore=20, spaceAfter=20))
    E.append(sp(20))
    E.append(Paragraph("CONFIDENTIEL", ParagraphStyle('ConfBadge', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=14, leading=18, textColor=colors.white, alignment=TA_CENTER, backColor=C_RED, borderPadding=8)))
    E.append(sp(10))
    E.append(Paragraph("Document interne a usage exclusif de l'equipe produit, technique et DevOps de DealScope. Toute reproduction ou distribution non autorisee est strictement interdite.", S_COVER_CONF))
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


# ===== SECTION 1: ARCHITECTURE D'OBSERVABILITE =====
def sec_architecture():
    E = []
    E.append(h1("1. Architecture d'Observabilite"))
    E.append(hr())
    E.append(p(
        "L'architecture d'observabilite de DealScope est structuree en quatre couches complementaires, couvrant l'integralite "
        "de la stack technique, depuis l'infrastructure AWS jusqu'aux comportements utilisateurs finaux. Cette approche en couches "
        "garantit une visibilite complete sur la sante du systeme, la qualite du code, les performances des agents IA et "
        "l'adoption produit par les utilisateurs."
    ))

    E.append(h2("1.1 Les quatre couches d'observabilite"))
    E.append(tbl([
        [TH('Couche'), TH('Outil'), TH('Scope'), TH('Donnees collectees'), TH('Equipe responsable')],
        [TD('<b>Couche 1 : Infrastructure</b>'), TD('Prometheus + Grafana'), TD('AWS ECS Fargate, RDS, ElastiCache, S3, CloudFront'), TD('CPU, memoire, reseau, disque, requetes/s, latence, erreurs HTTP'), TD('DevOps / SRE')],
        [TD('<b>Couche 2 : Application</b>'), TD('Sentry + Logs structures (JSON)'), TD('FastAPI backend, Next.js frontend, agents LangGraph'), TD('Erreurs, stack traces, transactions, logs applicatifs, performance'), TD('Backend / Frontend')],
        [TD('<b>Couche 3 : Agents IA</b>'), TD('LangSmith + Langfuse'), TD('5 agents LangGraph (ICP, Scoring, RAG, GraphRAG, Synthese)'), TD('Traces input/output, tokens, latence, cout, evaluations qualite'), TD('AI Engineering')],
        [TD('<b>Couche 4 : Product Analytics</b>'), TD('PostHog (open-source)'), TD('Portail web, app mobile, API'), TD('Evenements utilisateur, funnels, retention, A/B tests, session replay'), TD('Product / Growth')],
    ], [70, 70, 95, 115, 60]))
    E.append(sp(6))

    E.append(h2("1.2 Diagramme de flux de donnees"))
    E.append(p("Le flux de donnees d'observabilite suit le pipeline suivant :"))
    E.append(sp(4))
    E.append(S_CODE(
        "[Navigateur/Client] --> CloudFront --> [ECS Fargate: Next.js + FastAPI]<br/>"
        "    |                                |<br/>"
        "    +-- PostHog (events client)      +-- Sentry (erreurs frontend/backend)<br/>"
        "    |                                |<br/>"
        "    +-- PostHog Session Replay       +-- Logs structures --> CloudWatch --> Grafana<br/>"
        "                                     |<br/>"
        "    [FastAPI] --> [LangGraph Agents]---> LangSmith/Langfuse (traces IA)<br/>"
        "    |                                |<br/>"
        "    +-- Prometheus (metrics app)      +-- RDS/Redis/Neo4j/Weaviate --> Prometheus<br/>"
        "    |<br/>"
        "    [Prometheus] --> [Grafana] --> Dashboards + Alertes"
    ))
    E.append(sp(6))

    E.append(h2("1.3 Matrice d'integration des outils"))
    E.append(tbl([
        [TH('Outil'), TH('Type'), TH('Hebergement'), TH('Données sortantes'), TH('Integration alertes'), TH('Cout mensuel estime')],
        [TD('Prometheus'), TD('Metriques temps reel'), TD('AWS ECS (self-hosted)'), TD('Grafana, AlertManager'), TD('Slack, PagerDuty'), TD('$0 (open-source)')],
        [TD('Grafana'), TD('Dashboards + Alertes'), TD('AWS ECS (self-hosted)'), TD('Dashboards partages'), TD('Slack, Email'), TD('$0 (open-source)')],
        [TD('Sentry'), TD('Error tracking'), TD('Cloud (SaaS)'), TD('Jira, Slack'), TD('Slack, Email, PagerDuty'), TD('$80 (Dev plan)')],
        [TD('LangSmith'), TD('Tracing IA'), TD('Cloud (SaaS)'), TD('Langfuse (backup)'), TD('Slack, Email'), TD('$150 (Pro)')],
        [TD('Langfuse'), TD('Tracing IA (backup)'), TD('Self-hosted'), TD('Grafana (via API)'), TD('Slack, Webhook'), TD('$0 (self-hosted)')],
        [TD('PostHog'), TD('Product analytics'), TD('Self-hosted'), TD('Grafana (via API)'), TD('Slack, Email'), TD('$0 (self-hosted)')],
    ], [60, 65, 72, 80, 72, 72]))
    E.append(PageBreak())
    return E


# ===== SECTION 2: EVENT TRACKING PLAN - POSTHOG =====
def sec_event_tracking():
    E = []
    E.append(h1("2. Plan de Tracking des Evenements - PostHog"))
    E.append(hr())
    E.append(p(
        "Le plan de tracking definit la taxonomie complete des evenements collectes par PostHog. Chaque evenement est "
        "categorise, decrit avec ses proprietes (typage inclus), son declencheur et sa valeur metier. Cette taxonomie "
        "est la base de toute l'analyse produit et constitue le contrat de donnees entre l'equipe produit et l'equipe technique."
    ))

    # Helper to build event tables
    def event_table(events, col_widths=None):
        if col_widths is None:
            col_widths = [70, 125, 105, 100]
        header = [TH('Evenement'), TH('Proprietes (type)'), TH('Condition de declenchement'), TH('Valeur metier')]
        data = [header]
        for evt in events:
            name, props, trigger, value = evt
            data.append([ev(name), TD(props), TD(trigger), TD(value)])
        return tbl(data, col_widths)

    # 2.1 Authentication Events
    E.append(h2("2.1 Evenements d'Authentification (8 evenements)"))
    E.append(p("Ces evenements couvrent le cycle de vie complet de l'authentification et de la gestion des workspaces."))
    E.append(event_table([
        ('user_signed_up', 'method (string), plan (string), referral_source (string)', 'Inscription validee via Clerk.dev', 'Mesure du volume d\'acquisition, optimisation des canaux'),
        ('user_logged_in', 'method (string), mfa_enabled (boolean)', 'Connexion reussie avec token JWT', 'Suivi de l\'engagement quotidien'),
        ('user_logged_out', 'session_duration (number)', 'Deconnexion volontaire', 'Calcul de la duree de session moyenne'),
        ('workspace_created', 'name (string), member_count (number)', 'Creation d\'un workspace apres signup', 'Activation initiale, indicateur de conversion'),
        ('user_invited', 'role (string), email_domain (string)', 'Invitation envoyee par email', 'Mesure de la viralite et de l\'expansion compte'),
        ('user_role_changed', 'old_role (string), new_role (string)', 'Changement de role par admin', 'Audit securite, governance equipe'),
        ('sso_login', 'provider (string), workspace_id (string)', 'Connexion via SSO (SAML/OIDC)', 'Adoption SSO, indicateur Enterprise'),
        ('password_reset', 'reason (string: forgot/forced)', 'Demande de reinitialisation', 'Indicateur de friction ou de securite'),
    ], [68, 128, 103, 102]))
    E.append(sp(6))

    # 2.2 ICP & Scanning Events
    E.append(h2("2.2 Evenements ICP &amp; Scanning (6 evenements)"))
    E.append(p("Le profil ICP (Ideal Customer Profile) et les scans sont le coeur de la valeur produit de DealScope."))
    E.append(event_table([
        ('icp_created', 'industry (string), size_range (string), geo (string), criteria_count (number)', 'Sauvegarde d\'un profil ICP', 'Adoption de la fonctionnalite cle'),
        ('icp_updated', 'change_type (string), criteria_count (number)', 'Modification d\'un profil ICP existant', 'Engagement iteratif, maturite utilisateur'),
        ('scan_launched', 'icp_id (string), source_filter (string), estimated_companies (number)', 'Lancement manuel ou automatique d\'un scan', 'Usage core, consommation de la valeur produit'),
        ('scan_completed', 'icp_id (string), companies_found (number), duration_ms (number)', 'Scan termine avec resultats', 'Satisfaction utilisateur, performance IA'),
        ('scan_failed', 'icp_id (string), error_type (string), retry_attempt (number)', 'Echec du scan (timeout, LLM error, etc.)', 'Indicateur de fiabilite, support proactif'),
        ('icp_deleted', 'reason (string: unused/duplicate/other)', 'Suppression d\'un profil ICP', 'Comprehension des motifs d\'abandon'),
    ], [68, 128, 103, 102]))
    E.append(sp(6))

    # 2.3 Company & Pipeline Events
    E.append(h2("2.3 Evenements Entreprise &amp; Pipeline (8 evenements)"))
    E.append(p("Ces evenements mesurent l'engagement avec les resultats de scan et le pipeline M&A."))
    E.append(event_table([
        ('company_viewed', 'company_id (string), source (string: scan/search/recommendation)', 'Ouverture de la fiche detail d\'une entreprise', 'Taux de decouverte, qualite des resultats de scan'),
        ('company_added_to_pipeline', 'company_id (string), pipeline_stage (string)', 'Ajout au pipeline M&A', 'Conversion scan vers action metier'),
        ('pipeline_stage_changed', 'company_id (string), from_stage (string), to_stage (string)', 'Deplacement dans le pipeline', 'Suivi du cycle de vie deal, velocity pipeline'),
        ('company_exported', 'format (string: csv/pdf/xlsx), companies_count (number)', 'Export de donnees entreprises', 'Usage avancé, valeur percue'),
        ('contact_viewed', 'contact_id (string), company_id (string)', 'Consultation d\'un contact', 'Engagement avec les donnees de contact'),
        ('contact_email_copied', 'contact_id (string), company_id (string)', 'Copie d\'adresse email dans le presse-papiers', 'Intent d\'outreach, activation CRM'),
        ('company_tagged', 'company_id (string), tag_name (string)', 'Ajout d\'un tag personnalise', 'Organisation, usage avance du pipeline'),
        ('company_notes_added', 'company_id (string), note_length (number)', 'Ajout d\'une note sur une entreprise', 'Engagement qualitatif, preparation deal'),
    ], [68, 128, 103, 102]))
    E.append(PageBreak())

    # 2.4 AI Agent Events
    E.append(h2("2.4 Evenements Agents IA (6 evenements)"))
    E.append(p("Le monitoring des agents IA est critique pour optimiser les couts LLM et la qualite des resultats."))
    E.append(event_table([
        ('agent_execution_started', 'agent_name (string), icp_id (string), input_tokens_est (number)', 'Demarrage d\'un agent LangGraph', 'Volume d\'utilisation IA, planification capacite'),
        ('agent_execution_completed', 'agent_name (string), duration_ms (number), output_tokens (number), quality_score (number)', 'Execution terminee avec succes', 'Performance IA, satisfaction cachee'),
        ('agent_execution_failed', 'agent_name (string), error_type (string), duration_ms (number)', 'Erreur d\'execution agent', 'Fiabilite IA, debug proactif'),
        ('agent_cost_recorded', 'agent_name (string), total_cost_usd (number), model (string)', 'Cout LLM calcule et enregistre', 'Suivi couts, optimisation budget IA'),
        ('rag_query_executed', 'query (string), sources_count (number), relevance_score (number)', 'Requete RAG executee sur Weaviate', 'Qualite de la recherche semantique'),
        ('graphrag_query_executed', 'query (string), nodes_explored (number), depth (number)', 'Requete GraphRAG sur Neo4j', 'Utilisation du graphe de connaissances'),
    ], [68, 128, 103, 102]))
    E.append(sp(6))

    # 2.5 Email & Outreach Events
    E.append(h2("2.5 Evenements Email &amp; Outreach (7 evenements)"))
    E.append(p("La sequence email est une fonctionnalite d'engagement cle pour la conversion prospects."))
    E.append(event_table([
        ('email_sequence_created', 'sequence_name (string), step_count (number), target_count (number)', 'Creation d\'une sequence email', 'Activation de la fonctionnalite outreach'),
        ('email_sequence_sent', 'sequence_id (string), email_count (number)', 'Envoi effectif d\'une sequence', 'Volume d\'emails, adoption outreach'),
        ('email_opened', 'sequence_id (string), contact_id (string), open_position (number)', 'Ouverture d\'un email par le destinataire', 'Taux d\'ouverture, qualite du contenu'),
        ('email_replied', 'sequence_id (string), contact_id (string)', 'Reponse positive a un email', 'Conversion outreach, ROI sequences'),
        ('email_bounced', 'sequence_id (string), bounce_type (string: hard/soft)', 'Email non delivre', 'Sante de la base de contacts, deliverabilite'),
        ('email_sequence_paused', 'sequence_id (string), reason (string)', 'Pause d\'une sequence en cours', 'Friction utilisateur, ajustement strategie'),
        ('ab_test_started', 'test_name (string), variant_a (string), variant_b (string)', 'Lancement d\'un test A/B email', 'Culture d\'experimentation, optimisation'),
    ], [68, 128, 103, 102]))
    E.append(sp(6))

    # 2.6 CRM & Integration Events
    E.append(h2("2.6 Evenements CRM &amp; Integrations (4 evenements)"))
    E.append(p("La synchronisation CRM est un levier de retention pour les plans Professionnel et superieurs."))
    E.append(event_table([
        ('crm_connected', 'provider (string: salesforce/hubspot/pipedrive)', 'Connexion initiale d\'un CRM tiers', 'Adoption integration, valeur ecosysteme'),
        ('crm_sync_started', 'provider (string), direction (string: bidirectional)', 'Demarrage d\'une synchronisation', 'Volume de sync, frequence d\'utilisation'),
        ('crm_sync_completed', 'provider (string), records_synced (number), duration_ms (number)', 'Synchronisation terminee', 'Fiabilite integration, satisfaction'),
        ('crm_sync_failed', 'provider (string), error_code (string)', 'Echec de synchronisation', 'Support proactif, fiabilite percue'),
    ], [68, 128, 103, 102]))
    E.append(sp(6))

    # 2.7 Billing Events
    E.append(h2("2.7 Evenements Facturation (5 evenements)"))
    E.append(p("Les evenements de facturation alimentent les dashboards de revenus et de retention."))
    E.append(event_table([
        ('plan_viewed', 'plan_tier (string), source (string)', 'Consultation de la page tarifs', 'Intention d\'achat, optimisation conversion'),
        ('trial_started', 'plan_tier (string), trial_days (number)', 'Debut de periode d\'essai', 'Entonnoir trial-to-paid'),
        ('subscription_created', 'plan_tier (string), mrr (number), billing_cycle (string)', 'Premier paiement abonnement', 'Conversion payante, premiere revenue'),
        ('subscription_upgraded', 'old_plan (string), new_plan (string), delta_mrr (number)', 'Changement vers un plan superieur', 'Expansion revenue, upsell tracking'),
        ('subscription_cancelled', 'plan_tier (string), reason (string), mrr_lost (number)', 'Annulation de l\'abonnement', 'Churn analysis, prevention'),
    ], [68, 128, 103, 102]))
    E.append(PageBreak())

    # 2.8 Feature Usage Events
    E.append(h2("2.8 Evenements d'Utilisation des Fonctionnalites (6 evenements)"))
    E.append(p("Ces evenements mesurent l'adoption des fonctionnalites differenciantes de DealScope."))
    E.append(event_table([
        ('knowledge_graph_viewed', 'company_id (string), node_count (number)', 'Visualisation du graphe de connaissances', 'Adoption feature IA differenciante'),
        ('knowledge_graph_explored', 'company_id (string), depth (number), nodes_clicked (number)', 'Exploration interactive du graphe', 'Engagement avance, valeur percue'),
        ('alert_created', 'alert_type (string), trigger_condition (string)', 'Creation d\'une alerte automatique', 'Engagement recurrent, stickiness produit'),
        ('alert_triggered', 'alert_id (string), companies_matched (number)', 'Declenchement d\'une alerte', 'Valeur delivered, retention driver'),
        ('report_downloaded', 'report_type (string), format (string), pages (number)', 'Telechargement d\'un rapport d\'analyse', 'Tangible value delivery, sharing proxy'),
        ('search_executed', 'query (string), result_count (number), filters_used (boolean)', 'Execution d\'une recherche', 'Engagement, qualite des resultats'),
    ], [68, 128, 103, 102]))
    E.append(sp(6))

    # 2.9 Cohorts
    E.append(h2("2.9 Definition des Cohorts (5 cohorts)"))
    E.append(p(
        "Les cohorts permettent de segmenter les utilisateurs pour des analyses comportementales ciblees. Elles sont "
        "configurees dans PostHog avec des criteres de comportement dynamiques."
    ))
    E.append(tbl([
        [TH('Cohort'), TH('Critere d\'entree'), TH('Criteres de sortie'), TH('Objectif analytique'), TH('Action declenchee')],
        [TD('Utilisateurs Actives'), TD('Premier scan complete avec succes'), TD('Jamais (cohort permanent)'), TD('Mesure de l\'activation produit'), TD('Onboarding complete, nudges feature discovery')],
        [TD('Power Users'), TD('10+ scans sur les 30 derniers jours'), TD('Moins de 5 scans/mois pendant 2 mois consecutifs'), TD('Identification des ambassadeurs'), TD('Programme beta, feedback prioritaire')],
        [TD('Utilisateurs a Risque'), TD('Aucune connexion depuis 7+ jours ET plan actif'), TD('Connexion ou annulation du plan'), TD('Prevention du churn'), TD('Email de re-engagement, in-app nudge, offre speciale')],
        [TD('Candidats Enterprise'), TD('100+ entreprises dans le pipeline ET usage frequent'), TD('Downgrade vers un plan inferieur'), TD('Upsell vers Enterprise'), TD('Contacter le sales team, demo personnalisee')],
        [TD('Churned'), TD('Annulation de l\'abonnement confirmee'), TD('Reactivation de l\'abonnement'), TD('Analyse du churn et win-back'), TD('Survey exit, offre win-back a J+30')],
    ], [62, 80, 80, 80, 100]))
    E.append(sp(6))
    E.append(p("<b>Total des evenements :</b> 50 evenements repartis en 8 categories, avec 5 cohorts definies. Cette taxonomie couvre l'integralite du parcours utilisateur, de l'acquisition a la retention, en passant par l'utilisation des fonctionnalites cles et les interactions avec les agents IA."))
    E.append(PageBreak())
    return E


# ===== SECTION 3: DASHBOARDS PRODUIT =====
def sec_dashboards():
    E = []
    E.append(h1("3. Dashboards Produit"))
    E.append(hr())
    E.append(p(
        "Les dashboards produit sont construits dans PostHog et Grafana. Ils constituent la source de verite pour le suivi "
        "de la performance produit, de la sante business et de l'engagement utilisateur. Chaque dashboard est conçu pour une "
        "audience specifique avec un rafraichissement quotidien (batch) ou temps reel selon le cas."
    ))

    E.append(h2("3.1 Dashboard 1 : Vue Executif"))
    E.append(p("<b>Audience :</b> CEO, CSO, CTO, Board. <b>Rafraichissement :</b> Quotidien."))
    E.append(tbl([
        [TH('Metrique'), TH('Definition'), TH('Source'), TH('Frequence'), TH('Seuil d\'alerte')],
        [TD('MRR (Monthly Recurring Revenue)'), TD('Somme des abonnements mensuels actifs'), TD('Stripe + PostHog'), TD('Quotidien'), TD('Baisse > 5% MoM')],
        [TD('ARR (Annual Run Rate)'), TD('MRR x 12'), TD('Stripe + PostHog'), TD('Quotidien'), TD('Baisse > 5% QoQ')],
        [TD('Utilisateurs Actifs (WAU)'), TD('Utilisateurs uniques avec >= 1 session / semaine'), TD('PostHog'), TD('Quotidien'), TD('Baisse > 10% WoW')],
        [TD('Churn Rate'), TD('% d\'abonnements annules / mois'), TD('PostHog + Stripe'), TD('Mensuel'), TD('> 5% mensuel')],
        [TD('NRR (Net Revenue Retention)'), TD('(MRR debut + expansion - contraction - churn) / MRR debut'), TD('Stripe'), TD('Mensuel'), TD('< 100%')],
    ], [75, 100, 60, 55, 85]))
    E.append(sp(6))

    E.append(h2("3.2 Dashboard 2 : Acquisition &amp; Activation"))
    E.append(p("<b>Audience :</b> Head of Growth, Product Manager. <b>Rafraichissement :</b> Quotidien."))
    E.append(tbl([
        [TH('Metrique'), TH('Definition'), TH('Source'), TH('Seuil d\'alerte')],
        [TD('Signup Funnel'), TD('Visite page pricing > Signup > Workspace cree > Premier scan'), TD('PostHog Funnel'), TD('Drop-off > 30% a une etape')],
        [TD('Taux d\'activation'), TD('% de signups ayant complete un premier scan'), TD('PostHog'), TD('< 40% sous J+7')],
        [TD('Trial-to-Paid'), TD('% d\'essais convertis en abonnement payant'), TD('PostHog + Stripe'), TD('< 15% a J+14')],
        [TD('CAC par canal'), TD('Cout d\'acquisition par canal (organic, paid, referral, partner)'), TD('GA4 + Stripe'), TD('CAC > LTV/3')],
    ], [80, 155, 65, 115]))
    E.append(sp(6))

    E.append(h2("3.3 Dashboard 3 : Utilisation des Fonctionnalites"))
    E.append(p("<b>Audience :</b> Product Manager, UX Designer. <b>Rafraichissement :</b> Hebdomadaire."))
    E.append(tbl([
        [TH('Metrique'), TH('Description'), TH('Visualisation')],
        [TD('Matrice d\'adoption des features'), TD('Pourcentage d\'utilisateurs actifs par fonctionnalite, segmente par plan'), TD('Heatmap (feature x plan)')],
        [TD('Heatmap d\'utilisation'), TD('Frequence d\'utilisation par jour de la semaine et heure'), TD('Heatmap temporelle')],
        [TD('Top 10 fonctionnalites'), TD('Classement des fonctionnalites les plus utilisees'), TD('Bar chart horizontal')],
        [TD('Adoption par cohort'), TD('Utilisation des features par cohorte d\'inscription'), TD('Line chart multi-serie')],
    ], [105, 195, 115]))
    E.append(sp(6))

    E.append(h2("3.4 Dashboard 4 : Retention &amp; Engagement"))
    E.append(p("<b>Audience :</b> Product Manager, Customer Success. <b>Rafraichissement :</b> Hebdomadaire."))
    E.append(tbl([
        [TH('Metrique'), TH('Definition'), TH('Cible')],
        [TD('Retention M1 / M3 / M6'), TD('% d\'utilisateurs actifs a J+30, J+90, J+180'), TD('M1 > 60%, M3 > 40%, M6 > 30%')],
        [TD('DAU/MAU (Stickiness)'), TD('Ratio utilisateurs quotidiens / mensuels'), TD('> 25%')],
        [TD('Frequence de session'), TD('Nombre median de sessions par utilisateur / semaine'), TD('> 3 sessions / semaine')],
        [TD('Duree mediane de session'), TD('Temps passe par session (minutes)'), TD('> 8 minutes')],
    ], [95, 200, 120]))
    E.append(sp(6))

    E.append(h2("3.5 Dashboard 5 : Revenus"))
    E.append(p("<b>Audience :</b> CEO, CSO, Finance. <b>Rafraichissement :</b> Quotidien."))
    E.append(tbl([
        [TH('Metrique'), TH('Description'), TH('Visualisation')],
        [TD('Revenu par plan'), TD('MRR reparti par tier (Starter, Pro, Business, Enterprise)'), TD('Stacked bar chart')],
        [TD('Expansion Revenue'), TD('MRR additionnel issu des upgrades et add-ons'), TD('Line chart cumulatif')],
        [TD('Contraction Revenue'), TD('MRR perdu par downgrades'), TD('Line chart cumulatif')],
        [TD('Tendance LTV'), TD('Customer Lifetime Value moyen par cohorte et par plan'), TD('Line chart par cohorte')],
    ], [95, 205, 115]))
    E.append(sp(6))

    E.append(h2("3.6 Dashboard 6 : Performance des Agents IA"))
    E.append(p("<b>Audience :</b> AI Engineering, CTO, Product. <b>Rafraichissement :</b> Temps reel (LangSmith/Langfuse)."))
    E.append(tbl([
        [TH('Metrique'), TH('Description'), TH('Seuil d\'alerte')],
        [TD('Taux de succes par agent'), TD('% d\'executions terminees sans erreur, par agent'), TD('< 90% sur 1h')],
        [TD('Cout moyen par scan'), TD('Cout LLM total / nombre de scans', USD'), TD('> $2.50 / scan')],
        [TD('Latence P50 / P95 / P99'), TD('Duree d\'execution en ms (percentiles)', 'ms'), TD('P95 > 30 000 ms')],
        [TD('Utilisation tokens par agent'), TD('Nombre de tokens consommes par agent et par jour'), TD('Depassement budget journalier')],
        [TD('Taux d\'erreur par agent'), TD('% d\'executions en erreur, par agent'), TD('> 10% sur 24h')],
    ], [90, 185, 100]))
    E.append(PageBreak())
    return E


# ===== SECTION 4: ALERTES METIER =====
def sec_alertes():
    E = []
    E.append(h1("4. Alertes Metier"))
    E.append(hr())
    E.append(p(
        "Les alertes metier sont configurees dans PostHog (based on cohort behavior) et Grafana (based on metrics thresholds). "
        "Elles permettent a l'equipe produit et au management de reagir proactivement aux signaux faibles avant qu'ils ne "
        "deviennent des problemes majeurs."
    ))

    E.append(h2("4.1 Alerte de Churn Predictif"))
    E.append(tbl([
        [TH('Parametre'), TH('Valeur')],
        [TD('Declencheur'), TD('0 scan realise dans les 14 derniers jours ET moins de 3 connexions dans les 7 derniers jours')],
        [TD('Cible'), TD('Utilisateurs avec abonnement actif (plans Pro, Business, Enterprise)')],
        [TD('Frequence de verification'), TD('Quotidienne (cron PostHog)')],
        [TD('Action automatique'), TD('Email de re-engagement personnalise + notification in-app avec suggestions d\'actions')],
        [TD('Notification interne'), TD('Slack #customer-success avec liste des utilisateurs a risque')],
        [TD('Escalade'), TD('Si l\'utilisateur ne reagit pas sous 7 jours : contact CS manuel')],
    ], [100, 335]))
    E.append(sp(6))

    E.append(h2("4.2 Alerte de Drop-off Onboarding"))
    E.append(tbl([
        [TH('Parametre'), TH('Valeur')],
        [TD('Declencheur'), TD('Drop-off superieur a 30% a une etape de l\'entonnoir d\'onboarding sur les 7 derniers jours')],
        [TD('Cible'), TD('Etapes : Signup > Workspace cree > Premier ICP > Premier scan lance > Premier scan complete')],
        [TD('Frequence de verification'), TD('Quotidienne')],
        [TD('Action automatique'), TD('Alerte Slack #product-team + declenchement d\'un tooltip in-app a l\'etape critique')],
        [TD('Notification interne'), TD('Slack #product-team avec donnees detaillees du funnel')],
    ], [100, 335]))
    E.append(sp(6))

    E.append(h2("4.3 Alerte de Degradation du Scoring"))
    E.append(tbl([
        [TH('Parametre'), TH('Valeur')],
        [TD('Declencheur'), TD('Score ICP moyen baisse de plus de 15% semaine contre semaine')],
        [TD('Cible'), TD('Tous les profils ICP actifs')],
        [TD('Frequence de verification'), TD('Hebdomadaire')],
        [TD('Action automatique'), TD('Alerte Slack #data-team + investigation automatique des sources de donnees')],
        [TD('Notification interne'), TD('Slack #data-team + email au Lead AI Engineering')],
    ], [100, 335]))
    E.append(sp(6))

    E.append(h2("4.4 Alerte de Revenu"))
    E.append(tbl([
        [TH('Parametre'), TH('Valeur')],
        [TD('Declencheur'), TD('Croissance MRR inferieure a 5% mois contre mois')],
        [TD('Cible'), TD('MRR global et MRR par plan')],
        [TD('Frequence de verification'), TD('Mensuelle (J+5 du mois)')],
        [TD('Action automatique'), TD('Email au CEO et CSO avec rapport detaille')],
        [TD('Notification interne'), TD('Email + Slack #executive avec decomposition par plan')],
    ], [100, 335]))
    E.append(sp(6))

    E.append(h2("4.5 Alerte de Defaillance des Agents IA"))
    E.append(tbl([
        [TH('Parametre'), TH('Valeur')],
        [TD('Declencheur'), TD('Taux d\'echec d\'un agent superieur a 10% sur une fenetre glissante de 24 heures')],
        [TD('Cible'), TD('Tous les agents LangGraph (ICP, Scoring, RAG, GraphRAG, Synthese)')],
        [TD('Frequence de verification'), TD('Continue (monitoring temps reel LangSmith/Langfuse)')],
        [TD('Action automatique'), TD('Alerte PagerDuty a l\'ingenieur on-call + Slack #ai-engineering')],
        [TD('Escalade'), TD('Si non resolu sous 30 min : escalation au CTO')],
    ], [100, 335]))
    E.append(PageBreak())
    return E


# ===== SECTION 5: ERROR TRACKING - SENTRY =====
def sec_sentry():
    E = []
    E.append(h1("5. Error Tracking - Sentry"))
    E.append(hr())
    E.append(p(
        "Sentry est l'outil central de suivi des erreurs pour l'ensemble de la stack DealScope. Il capture les erreurs "
        "frontend (Next.js), backend (FastAPI) et les erreurs specifiques aux agents IA, avec une categorisation par "
        "severite et des regles d'escalade definies."
    ))

    E.append(h2("5.1 Structure des projets Sentry"))
    E.append(tbl([
        [TH('Projet Sentry'), TH('Plateforme'), TH('SDK'), TH('Scope des erreurs capturees')],
        [TD('dealscope-frontend'), TD('JavaScript/TypeScript'), TD('@sentry/nextjs'), TD('Erreurs React, erreurs reseau, erreurs GraphQL, unhandledrejection')],
        [TD('dealscope-backend'), TD('Python'), TD('sentry-sdk[fastapi]'), TD('Erreurs 500, erreurs de validation, erreurs DB, timeouts')],
        [TD('dealscope-agents'), TD('Python'), TD('sentry-sdk + custom'), TD('Erreurs LangGraph, erreurs LLM, erreurs Neo4j/Weaviate, timeouts agents')],
    ], [90, 80, 85, 180]))
    E.append(sp(6))

    E.append(h2("5.2 Regles d'echantillonnage"))
    E.append(tbl([
        [TH('Type d\'erreur'), TH('Environnement'), TH('Taux d\'echantillonnage'), TH('Raison')],
        [TD('Erreurs 5xx (serveur)'), TD('Production'), TD('100%'), TD('Impact utilisateur direct, necessite suivi complet')],
        [TD('Erreurs 4xx (client)'), TD('Production'), TD('10%'), TD('Volume eleve, echantillonnage suffisant pour tendances')],
        [TD('Avertissements'), TD('Production'), TD('5%'), TD('Volume tres eleve, focus sur les erreurs bloquantes')],
        [TD('Toutes les erreurs'), TD('Staging'), TD('100%'), TD('Environnement de test, visibilite complete')],
        [TD('Transactions (performance)'), TD('Production'), TD('20%'), TD('Equilibre cout/visibilite pour le monitoring perf')],
    ], [100, 70, 70, 195]))
    E.append(sp(6))

    E.append(h2("5.3 Monitoring de performance (Transactions)"))
    E.append(bul("<b>Transactions frontend :</b> Navigation entre pages (Next.js), appels API GraphQL, temps de rendu des composants critiques (knowledge graph, pipeline view)."))
    E.append(bul("<b>Transactions backend :</b> Requetes GraphQL par operation, appels aux bases de donnees (PostgreSQL, Neo4j, Weaviate, Redis), appels LLM (OpenAI, Anthropic)."))
    E.append(bul("<b>Transactions agents :</b> Execution complete de chaque agent LangGraph (de l'entree a la sortie), sous-etapes individuelles (embedding, retrieval, generation)."))
    E.append(sp(4))

    E.append(h2("5.4 Suivi des releases"))
    E.append(p(
        "Chaque deploiement est automatiquement associe a une release Sentry via les integractions CI/CD (GitHub Actions). "
        "Les releases permettent de corréler l'apparition de nouvelles erreurs avec un deploiement specifique et de faciliter "
        "le rollback si necessaire."
    ))
    E.append(bul("<b>Format :</b> dealscope-frontend@v2.3.1, dealscope-backend@v2.3.1"))
    E.append(bul("<b>Auto-resolution :</b> les erreurs apparues avant une release sont automatiquement marquees comme resolues."))
    E.append(bul("<b>Commit tracking :</b> chaque release est associee aux commits correspondants pour un debogage rapide."))
    E.append(sp(4))

    E.append(h2("5.5 Regles d'alerte (P1 a P4)"))
    E.append(tbl([
        [TH('Severite'), TH('Critere'), TH('Canal de notification'), TH('Delai de reponse')],
        [TD('P1 - Critique'), TD('Erreur 5xx > 1% des requetes OU crash de l\'app'), TD('PagerDuty + Slack #incidents'), TD('15 minutes')],
        [TD('P2 - Haut'), TD('Erreur inedite en production OU erreur recurrente (> 50 occurences/h)'), TD('Slack #engineering-alerts + Email on-call'), TD('1 heure')],
        [TD('P3 - Moyen'), TD('Erreur connue non corrigee avec impact limite'), TD('Slack #engineering-alerts'), TD('24 heures')],
        [TD('P4 - Faible'), TD('Avertissement ou erreur cosmétique (UI, log)', TD('Ticket Jira automatique'), TD('Prochain sprint')],
    ], [60, 140, 120, 80]))
    E.append(PageBreak())
    return E


# ===== SECTION 6: SESSION REPLAY =====
def sec_session_replay():
    E = []
    E.append(h1("6. Session Replay pour Debug UX"))
    E.append(hr())
    E.append(p(
        "Le session replay de PostHog permet d'enregistrer et de rejouer les sessions utilisateurs pour analyser les "
        "comportements reels, reproduire les bugs et optimiser l'experience utilisateur. La configuration respecte "
        "scrupuleusement la vie privee et le RGPD."
    ))

    E.append(h2("6.1 Configuration du session replay"))
    E.append(tbl([
        [TH('Parametre'), TH('Configuration')],
        [TD('SDK'), TD('posthog-js v1.80+ avec session replay integre')],
        [TD('Qualite video'), TD('Qualite reduite (640px) pour minimiser la taille des enregistrements')],
        [TD('Max session length'), TD('30 minutes (auto-stop apres 30 min d\'inactivite)')],
        [TD('Max recording length'), TD('10 minutes par session individuelle')],
        [TD('Capture réseau'), TD('Requetes et reponses GraphQL capturees (sans contenu PII)')],
    ], [100, 335]))
    E.append(sp(6))

    E.append(h2("6.2 Regles de confidentialite (masquage PII)"))
    E.append(p("Conformement au RGPD, les champs suivants sont systematiquement masques dans les sessions replay :"))
    E.append(tbl([
        [TH('Element masque'), TH('Selecteur CSS'), TH('Methode de masquage')],
        [TD('Adresses email'), TD('[data-ph-mask="email"]'), TD('Remplacement par [email masque]')],
        [TD('Numeros de telephone'), TD('[data-ph-mask="phone"]'), TD('Remplacement par [tel masque]')],
        [TD('Donnees financieres'), TD('[data-ph-mask="financial"]'), TD('Remplacement par [donnee masquee]')],
        [TD('Tokens et cles API'), TD('input[type="password"], input[name*="key"], input[name*="token"]'), TD('Blocage total de la saisie')],
        [TD('Contenu dynamique sensible'), TD('.sensitive-data, .pii-field'), TD('Floutage CSS (blur)')],
    ], [110, 170, 155]))
    E.append(sp(6))

    E.append(h2("6.3 Taux d'echantillonnage par plan"))
    E.append(tbl([
        [TH('Plan tarifaire'), TH('Taux d\'enregistrement'), TH('Raison')],
        [TD('Starter ($99/mois)'), TD('5% des sessions'), TD('Echantillon representatif pour tendances generales')],
        [TD('Professional ($299/mois)'), TD('15% des sessions'), TD('Meilleure visibilite sur les utilisateurs payants')],
        [TD('Business ($499/mois)'), TD('30% des sessions'), TD('Visibilite avancee pour optimisation UX')],
        [TD('Enterprise (custom)'), TD('100% des sessions (opt-in)', TD('Support premium avec replay complet sur demande')],
    ], [100, 110, 225]))
    E.append(sp(6))

    E.append(h2("6.4 Cas d'utilisation"))
    E.append(bul("<b>Analyse de funnels :</b> identifier les etapes ou les utilisateurs abandonnent et comprendre pourquoi (confusion, bug, friction)."))
    E.append(bul("<b>Reproduction de bugs :</b> rejouer la session exacte ayant produit une erreur pour la reproduire et la corriger rapidement."))
    E.append(bul("<b>Optimisation UX :</b> observer les parcours reels pour identifier les patterns de navigation inattendus et optimiser l'interface."))
    E.append(bul("<b>Support client :</b> en cas de signalement utilisateur, retrouver la session correspondante pour comprendre le contexte."))
    E.append(PageBreak())
    return E


# ===== SECTION 7: A/B TESTING FRAMEWORK =====
def sec_ab_testing():
    E = []
    E.append(h1("7. Framework A/B Testing"))
    E.append(hr())
    E.append(p(
        "Le framework d'A/B testing est base sur les feature flags et les experiments de PostHog. Il permet a l'equipe "
        "produit d'experimenter de maniere rigoureuse avec des seuils de significativite statistique definis."
    ))

    E.append(h2("7.1 Cycle de vie d'un experiment"))
    E.append(tbl([
        [TH('Etape'), TH('Description'), TH('Responsable')],
        [TD('1. Hypothese'), TD('Formulation de l\'hypothese avec metric primaire et secondaire'), TD('Product Manager')],
        [TD('2. Configuration'), TD('Creation du feature flag + experiment dans PostHog avec variantes et target'), TD('Product Manager + Backend')],
        [TD('3. Lancement'), TD('Activation de l\'experiment avec trafic alloue (ex: 50/50)'), TD('Product Manager')],
        [TD('4. Monitoring'), TD('Surveillance des metriques en temps reel, verification pas de degradation'), TD('Product Manager + Data')],
        [TD('5. Analyse'), TD('Evaluation de la significativite statistique, analyse des resultats'), TD('Data Analyst')],
        [TD('6. Decision'), TD('Rollout a 100% de la variante gagnante OU retour a la variante de controle'), TD('Product Manager')],
        [TD('7. Nettoyage'), TD('Suppression du feature flag, merge du code de la variante gagnante', 'CTA principal de la page pricing'), TD('Product Manager + Backend')],
    ], [75, 220, 115]))
    E.append(sp(6))

    E.append(h2("7.2 Seuils de significativite statistique"))
    E.append(bul("<b>Significance level (alpha) :</b> 0.05 (5% de chance que le resultat soit du au hasard)."))
    E.append(bul("<b>Statistical power (1 - beta) :</b> 0.80 (80% de chance de detecter un veritable effet)."))
    E.append(bul("<b>Minimum detectable effect (MDE) :</b> 10% (variation minimum pour etre consideree significative)."))
    E.append(bul("<b>Duree minimum :</b> 14 jours (pour couvrir les variations hebdomadaires de comportement)."))
    E.append(bul("<b>Echantillon minimum :</b> 1 000 utilisateurs par variante (calcule via calculateur PostHog)."))
    E.append(sp(6))

    E.append(h2("7.3 Exemples de tests planifies"))
    E.append(tbl([
        [TH('Test'), TH('Variante A (Controle)'), TH('Variante B (Test)'), TH('Metrique primaire'), TH('Statut')],
        [TD('Onboarding'), TD('Wizard guidé (5 etapes lineaires)'), TD('Template-first (commencer par un template ICP pre-rempli)'), TD('Taux d\'activation (J+7)'), TD('Planifie')],
        [TD('Page Pricing'), TD('Layout actuel (grille 4 colonnes)'), TD('Layout alterne (highlight du plan Business + badges sociaux)'), TD('Conversion pricing-to-signup'), TD('Planifie')],
        [TD('Email CTA'), TD('Bouton "Decouvrir"'), TD('Bouton "Voir le rapport"'), TD('Taux de clic'), TD('Planifie')],
        [TD('Dashboard'), TD('Vue par defaut : liste entreprises'), TD('Vue par defaut : pipeline kanban'), TD('Engagement (sessions/semaine)'), TD('Planifie')],
    ], [55, 95, 115, 85, 50]))
    E.append(PageBreak())
    return E


# ===== SECTION 8: FEATURE FLAGS =====
def sec_feature_flags():
    E = []
    E.append(h1("8. Feature Flags"))
    E.append(hr())
    E.append(p(
        "Les feature flags (drapeaux de fonctionnalites) permettent de controler le deploiement des nouvelles fonctionnalites "
        "de maniere progressive et sure, sans necessiter de deploiement de code. Ils sont geres via PostHog et integres dans "
        "le frontend (Next.js) et le backend (FastAPI)."
    ))

    E.append(h2("8.1 Strategie de deploiement progressif"))
    E.append(tbl([
        [TH('Strategie'), TH('Description'), TH('Cas d\'utilisation typique')],
        [TD('Canary Deployment'), TD('Activation pour 1-5% des utilisateurs, surveillance des metriques, puis augmentation progressive'), TD('Nouvelles fonctionnalites a risque (ex: nouveau pipeline de scan)')],
        [TD('Percentage Rollout'), TD('Activation pour un pourcentage fixe de la base utilisateurs'), TD('Tests A/B, feature en beta ouverte')],
        [TD('User Segment'), TD('Activation pour un segment specifique (plan, pays, langue, workspace_id)'), TD('Features Enterprise, features par pays')],
        [TD('Gradual Rollout'), TD('Augmentation de 10% en 10% toutes les 24h avec monitoring'), TD('Deploiement de features majeures')],
    ], [80, 185, 170]))
    E.append(sp(6))

    E.append(h2("8.2 Cycle de vie d'un feature flag"))
    E.append(tbl([
        [TH('Etat'), TH('Description'), TH('Action')],
        [TD('Created'), TD('Flag cree dans PostHog, inactif, serveur renvoie toujours false'), TD('Configuration initiale + documentation')],
        [TD('Testing'), TD('Flag active uniquement en environnement staging pour test interne'), TD('QA + validation produit')],
        [TD('Staged'), TD('Flag active en production pour un petit pourcentage d\'utilisateurs'), TD('Monitoring des metriques et des erreurs')],
        [TD('Production'), TD('Flag active a 100% en production'), TD('Suppression progressive du code conditionnel')],
        [TD('Removed'), TD('Flag supprime de PostHog et du code (cleanup)'), TD('Suppression du flag et du code if/else associe')],
    ], [70, 220, 135]))
    E.append(sp(6))

    E.append(h2("8.3 Configuration PostHog des feature flags"))
    E.append(bul("<b>Naming convention :</b> {category}_{feature_name}_{environment} (ex: ai_graphrag_explorer_prod)."))
    E.append(bul("<b>Variants :</b> chaque flag supporte jusqu'a 10 variants pour les experiments."))
    E.append(bul("<b>Targeting rules :</b> supporte les filtres par propriete utilisateur, par cohort, par plan, par pays."))
    E.append(bul("<b>Multi-tenancy :</b> les flags sont evalues par workspace_id pour respecter l'isolement multi-tenant."))
    E.append(sp(4))

    E.append(h2("8.4 Procedure de kill switch"))
    E.append(p(
        "En cas de problemes detectes apres le deploiement d'une nouvelle fonctionnalite, la procedure de kill switch "
        "permet de desactiver instantanement la fonctionnalite sans redeployer le code :"
    ))
    E.append(bul("<b>Etape 1 :</b> identification du flag concerne (via l'alerte Sentry ou le monitoring Grafana)."))
    E.append(bul("<b>Etape 2 :</b> connexion a l'interface PostHog et desactivation immediate du flag (1 clic)."))
    E.append(bul("<b>Etape 3 :</b> verification que le flag est bien a false pour tous les utilisateurs (Propagate delay < 30s)."))
    E.append(bul("<b>Etape 4 :</b> notification Slack #engineering-alerts avec le flag desactive et le motif."))
    E.append(bul("<b>Etape 5 :</b> investigation et correction du code, puis re-activation progressive."))
    E.append(PageBreak())
    return E


# ===== SECTION 9: LANGSMITH / LANGFUSE =====
def sec_langsmith():
    E = []
    E.append(h1("9. LangSmith / Langfuse - Monitoring Agents IA"))
    E.append(hr())
    E.append(p(
        "Le monitoring des agents IA LangGraph est assure par LangSmith (primaire) et Langfuse (backup/self-hosted). "
        "Ces outils fournissent une visibilite complete sur le comportement des 5 agents de DealScope : l'agent ICP, "
        "l'agent Scoring, l'agent RAG, l'agent GraphRAG et l'agent Synthese."
    ))

    E.append(h2("9.1 Traces : Input/Output des agents"))
    E.append(p("Chaque execution d'agent genere une trace complete comprenant :"))
    E.append(bul("<b>Input :</b> prompt system, context utilisateur (ICP, requete), parametres du modele (temperature, max_tokens)."))
    E.append(bul("<b>Chain steps :</b> chaque sous-etape de l'agent (embedding, retrieval, chain-of-thought, generation)."))
    E.append(bul("<b>Output :</b> reponse finale du LLM, donnees structurees extraites, scores de confiance."))
    E.append(bul("<b>Metadata :</b> model utilise (GPT-4, Claude), version du prompt, workspace_id, timestamp."))
    E.append(sp(4))

    E.append(h2("9.2 Metriques collectees"))
    E.append(tbl([
        [TH('Metrique'), TH('Description'), TH('Granularite'), TH('Seuil d\'alerte')],
        [TD('Token usage'), TD('Nombre de tokens (input + output) par execution', 'par agent, par jour'), TD('Budget journalier depasse')],
        [TD('Latence totale'), TD('Duree complete de l\'execution agent (ms)', 'P50, P95, P99'), TD('P95 > 30s pour scan complet')],
        [TD('Cout par execution'), TD('Cout LLM calcule en USD par execution', 'par agent, par scan'), TD('> $2.50 / scan')],
        [TD('Taux d\'erreur'), TD('Pourcentage d\'executions en erreur', 'par agent, par heure'), TD('> 10% sur 24h')],
        [TD('Feedback utilisateur'), TD('Score de satisfaction (thumbs up/down sur les resultats)', 'par agent, par jour'), TD('Satisfaction < 70%')],
    ], [70, 140, 80, 115]))
    E.append(sp(6))

    E.append(h2("9.3 Evaluations de qualite"))
    E.append(p(
        "Des benchmarks de qualite automatisees sont configures pour chaque agent afin de mesurer objectivement la qualite "
        "des resultats produits par les agents IA."
    ))
    E.append(tbl([
        [TH('Agent'), TH('Metric d\'evaluation'), TH('Methode'), TH('Seuil minimum')],
        [TD('ICP Agent'), TD('Pertinence du profil genere'), TD('LLM-as-judge (GPT-4) + dataset de reference'), TD('Score >= 0.80')],
        [TD('Scoring Agent'), TD('Precision du matching ICP'), TD('Comparaison avec annotations humaines (gold dataset)'), TD('F1-score >= 0.85')],
        [TD('RAG Agent'), TD('Pertinence des sources retrievees'), TD('Recall@10 sur le dataset de reference Weaviate'), TD('Recall >= 0.75')],
        [TD('GraphRAG Agent'), TD('Completude de l\'exploration'), TD('Couverture des noeuds pertinents vs. reference Neo4j'), TD('Coverage >= 0.70')],
        [TD('Synthese Agent'), TD('Qualite redactionnelle'), TD('LLM-as-judge + critere clarte/exhaustivite'), TD('Score >= 0.80')],
    ], [65, 85, 155, 90]))
    E.append(sp(6))

    E.append(h2("9.4 Alertes specifiques aux agents IA"))
    E.append(tbl([
        [TH('Alerte'), TH('Declencheur'), TH('Action')],
        [TD('Depassement budget LLM'), TD('Cout journalier > 120% du budget prevu'), TD('Alerte Slack #ai-engineering + throttle automatique des scans')],
        [TD('Pic de latence'), TD('Latence P95 > 45s pendant 15 min consecutives'), TD('Alerte PagerDuty on-call + investigation provider LLM')],
        [TD('Degradation qualite'), TD('Score d\'evaluation < seuil minimum pendant 1h'), TD('Alerte Slack #ai-engineering + rollback du prompt si necessaire')],
        [TD('Erreur recurrente'), TD('Meme erreur sur > 5 executions consecutives d\'un agent'), TD('Alerte Slack #ai-engineering + auto-disable de l\'agent']),
    ], [90, 140, 205]))
    E.append(sp(6))

    E.append(h2("9.5 Vues des dashboards IA"))
    E.append(bul("<b>Comparaison des agents :</b> tableau de bord comparatif avec toutes les metriques cote a cote pour les 5 agents."))
    E.append(bul("<b>Tendances de cout :</b> evolution du cout LLM par agent, par jour et par mois avec projection."))
    E.append(bul("<b>Patterns d\'erreur :</b> clustering des erreurs par type et par agent pour identifier les causes recurrentes."))
    E.append(bul("<b>Explorateur de traces :</b> recherche et filtrage des traces par agent, par workspace, par date pour le debug."))
    E.append(PageBreak())
    return E


# ===== SECTION 10: SLIS & SLAS =====
def sec_slis_slas():
    E = []
    E.append(h1("10. SLIs &amp; SLAs"))
    E.append(hr())
    E.append(p(
        "Les SLIs (Service Level Indicators) mesurent la sante reelle du service, tandis que les SLOs (Service Level Objectifs) "
        "definissent les cibles a atteindre. Les SLAs (Service Level Agreements) contractualisent ces engagements aupres des "
        "clients selon leur plan tarifaire."
    ))

    E.append(h2("10.1 SLIs definis"))
    E.append(tbl([
        [TH('SLI'), TH('Definition'), TH('Mesure'), TH('Source de donnees')],
        [TD('Disponibilite'), TD('% de requetes reussies (code HTTP 2xx/3xx) sur le total des requetes'), TD('Ratio count(2xx,3xx) / count(total)'), TD('Prometheus + CloudFront')],
        [TD('Latence P95', TD('95eme percentile du temps de reponse pour les requetes de consultation'), TD('histogram_quantile(0.95, rate())'), TD('Prometheus')],
        [TD('Latence (scan complet)'), TD('Temps total d\'un scan M&A complet (ICP + Scoring + RAG + Synthese)'), TD('Mesure end-to-end via trace LangSmith'), TD('LangSmith / Grafana')],
        [TD('Taux d\'erreur'), TD('% de requetes en erreur (code HTTP 5xx) sur le total des requetes'), TD('Ratio count(5xx) / count(total)'), TD('Prometheus')],
    ], [70, 145, 100, 100]))
    E.append(sp(6))

    E.append(h2("10.2 SLOs cibles"))
    E.append(tbl([
        [TH('SLO'), TH('Cible'), TH('Fenetre de mesure'), TD('Budget d\'erreur mensuel')],
        [TD('Disponibilite'), TD('99.9%'), TD('30 jours glissants'), TD('43.2 minutes / mois')],
        [TD('Latence P95 (requetes)', TD('< 2 secondes'), TD('30 jours glissants'), TD('N/A (seuil absolu)')],
        [TD('Latence (scan complet)'), TD('< 30 secondes'), TD('30 jours glissants'), TD('N/A (seuil absolu)')],
        [TD('Taux d\'erreur'), TD('< 0.1%'), TD('30 jours glissants'), TD('En accord avec la disponibilite')],
    ], [80, 70, 95, 145]))
    E.append(sp(6))

    E.append(h2("10.3 Calcul du budget d'erreur"))
    E.append(p(
        "Le budget d'erreur represente la marge de manuvre acceptable pour les incidents avant de violer le SLO. "
        "Pour une disponibilite cible de 99.9% sur une fenetre de 30 jours (43 200 minutes) :"
    ))
    E.append(bul("<b>Budget d\'erreur mensuel :</b> 43 200 x 0.1% = 43.2 minutes d\'indisponibilite maximum."))
    E.append(bul("<b>Budget consomme :</b> (temps d\'indisponibilite cumule) / 43.2 minutes."))
    E.append(bul("<b>Budget restant :</b> 100% - budget consomme. Si le budget tombe a 0%, les deploiements non-critiques sont geler."))
    E.append(sp(6))

    E.append(h2("10.4 SLA par plan tarifaire"))
    E.append(tbl([
        [TH('Plan'), TH('Disponibilite SLA'), TH('Support'), TD('Credits de service'), TD('Priorite d\'incident')],
        [TD('Starter ($99)'), TD('99.5%'), TD('Email (48h)'), TD('10% credit si SLA non respecte'), TD('P4')],
        [TD('Professional ($299)'), TD('99.5%'), TD('Email + Chat (24h)'), TD('15% credit si SLA non respecte'), TD('P3')],
        [TD('Business ($499)'), TD('99.9%'), TD('Chat + Phone (4h)'), TD('20% credit si SLA non respecte'), TD('P2')],
        [TD('Enterprise (custom)'), TD('99.95%'), TD('Dedicated CSM + Phone (1h)'), TD('Negocie contractuellement'), TD('P1')],
    ], [80, 65, 95, 110, 60]))
    E.append(sp(6))
    E.append(p(
        "<b>Politique de credits :</b> les credits de service sont appliques automatiquement sur la facture du mois suivant "
        "lorsque le SLA de disponibilite n'est pas respecte. Les credits sont plafonnes a un mois de frais d'abonnement "
        "et ne s'appliquent pas aux periodes de maintenance planifiees (annoncees 72h a l'avance)."
    ))
    E.append(PageBreak())
    return E


# ===== BUILD =====
def build():
    doc = TocDocTemplate(OUT, pagesize=A4, title="DealScope_Plan_Monitoring_Observabilite",
                         author="Z.ai", creator="Z.ai", subject="Plan de Monitoring & Observabilite Produit - DealScope")
    story = []

    # Cover
    story.extend(cover())

    # TOC
    story.extend(toc_page())

    # All sections
    story.extend(sec_architecture())
    story.extend(sec_event_tracking())
    story.extend(sec_dashboards())
    story.extend(sec_alertes())
    story.extend(sec_sentry())
    story.extend(sec_session_replay())
    story.extend(sec_ab_testing())
    story.extend(sec_feature_flags())
    story.extend(sec_langsmith())
    story.extend(sec_slis_slas())

    # Build with multiBuild for TOC
    doc.multiBuild(story)
    print(f"PDF generated: {OUT}")


if __name__ == '__main__':
    build()
