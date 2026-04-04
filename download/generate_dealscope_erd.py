#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""DealScope Modele de Donnees ERD PDF Generator"""

import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch, cm
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle,
    HRFlowable, KeepTogether
)
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
pdfmetrics.registerFont(TTFont('DejaVuSansMono', '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'))
pdfmetrics.registerFont(TTFont('DejaVuSansMonoBold', '/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf'))
registerFontFamily('TimesNewRoman', normal='TimesNewRoman', bold='TimesNewRoman', italic='CalibriItalic', boldItalic='CalibriBold')
registerFontFamily('Calibri', normal='Calibri', bold='CalibriBold', italic='CalibriItalic', boldItalic='CalibriBold')
registerFontFamily('DejaVuSans', normal='DejaVuSans', bold='DejaVuSansBold')
registerFontFamily('DejaVuSansMono', normal='DejaVuSansMono', bold='DejaVuSansMonoBold')

# ===== COLORS =====
TABLE_HEADER_COLOR = colors.HexColor('#1F4E79')
C_DARK = colors.HexColor('#1F4E79')
C_MED = colors.HexColor('#2E75B6')
C_LIGHT = colors.HexColor('#D6E4F0')
C_GOLD = colors.HexColor('#C49A2A')
C_TEXT = colors.HexColor('#1A1A1A')
C_GRAY = colors.HexColor('#555555')
C_CODE_BG = colors.HexColor('#F5F5F0')
C_CODE_BD = colors.HexColor('#CCCCCC')
C_TH = colors.HexColor('#1F4E79')
C_ALT = colors.HexColor('#EBF1F8')
C_NOTE_BG = colors.HexColor('#F0F6FF')
C_NOTE_BD = colors.HexColor('#336699')

# ===== OUTPUT =====
OUT = '/home/z/my-project/download/DealScope_Modele_Donnees_ERD.pdf'

# ===== STYLES =====
sty = getSampleStyleSheet()
sty['Heading1'].fontName = 'TimesNewRoman'
sty['Heading1'].fontSize = 20
sty['Heading1'].textColor = C_DARK
sty['Heading1'].spaceAfter = 14
sty['Heading1'].spaceBefore = 20
sty['Heading1'].keepWithNext = True

sty['Heading2'].fontName = 'TimesNewRoman'
sty['Heading2'].fontSize = 15
sty['Heading2'].textColor = C_MED
sty['Heading2'].spaceAfter = 10
sty['Heading2'].spaceBefore = 16
sty['Heading2'].keepWithNext = True

sty['Heading3'].fontName = 'TimesNewRoman'
sty['Heading3'].fontSize = 12
sty['Heading3'].textColor = C_DARK
sty['Heading3'].spaceAfter = 8
sty['Heading3'].spaceBefore = 12

S_BODY = ParagraphStyle('Body', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=10.5, leading=15, textColor=C_TEXT, alignment=TA_JUSTIFY, spaceAfter=8, spaceBefore=2)
S_BULLET = ParagraphStyle('Bul', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=10.5, leading=15, textColor=C_TEXT, leftIndent=20, bulletIndent=8, spaceAfter=4)
S_CODE = ParagraphStyle('Code', parent=sty['Normal'], fontName='DejaVuSansMono', fontSize=7.2, leading=10, textColor=C_TEXT, leftIndent=8, rightIndent=8, spaceAfter=4, spaceBefore=4, backColor=C_CODE_BG)
S_TH = ParagraphStyle('TH', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=10, leading=13, textColor=colors.white, alignment=TA_CENTER)
S_TD = ParagraphStyle('TD', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=9.5, leading=13, textColor=C_TEXT, alignment=TA_LEFT)
S_TDC = ParagraphStyle('TDC', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=9.5, leading=13, textColor=C_TEXT, alignment=TA_CENTER)
S_NOTE = ParagraphStyle('Note', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=9.5, leading=13, textColor=C_NOTE_BD, leftIndent=15, spaceAfter=8, backColor=C_NOTE_BG, borderPadding=6)
S_COV_TITLE = ParagraphStyle('CovT', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=40, leading=48, textColor=C_GOLD, alignment=TA_CENTER, spaceAfter=6)
S_COV_SUB = ParagraphStyle('CovS', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=26, leading=34, textColor=C_DARK, alignment=TA_CENTER, spaceAfter=10)
S_COV_INFO = ParagraphStyle('CovI', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=14, leading=20, textColor=C_GRAY, alignment=TA_CENTER, spaceAfter=6)
S_COV_SM = ParagraphStyle('CovSm', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=12, leading=18, textColor=C_TEXT, alignment=TA_CENTER, spaceAfter=4)
S_CONF = ParagraphStyle('Conf', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=9, leading=12, textColor=C_GRAY, alignment=TA_CENTER)

# ===== HELPERS =====
def h1(t): return Paragraph(t, sty['Heading1'])
def h2(t): return Paragraph(t, sty['Heading2'])
def h3(t): return Paragraph(t, sty['Heading3'])
def p(t): return Paragraph(t, S_BODY)
def bul(t): return Paragraph(t, S_BULLET, bulletText='\u2022')
def sp(pts=8): return Spacer(1, pts)
def hr(): return HRFlowable(width="100%", color=C_LIGHT, thickness=1, spaceBefore=6, spaceAfter=6)
def TH(t): return Paragraph(t, S_TH)
def TD(t, center=False): return Paragraph(t, S_TDC if center else S_TD)


def code_block(text, max_lines=35):
    """Create formatted code block."""
    lines = text.strip().split('\n')
    parts = []
    for i in range(0, len(lines), max_lines):
        chunk = lines[i:i+max_lines]
        fmt = '<br/>'.join(
            ln.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;').replace(' ', '&nbsp;')
            for ln in chunk
        )
        pp = Paragraph(fmt, S_CODE)
        tt = Table([[pp]], colWidths=[470])
        tt.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), C_CODE_BG),
            ('BOX', (0, 0), (-1, -1), 0.5, C_CODE_BD),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('RIGHTPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        parts.append(tt)
    return parts


def tbl(data, widths=None):
    """Create styled table with all Paragraph cells."""
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
            cmds.append(('BACKGROUND', (0, i), (-1, i), C_ALT))
    t.setStyle(TableStyle(cmds))
    return t


def note_box(text):
    """Create a note/callout box."""
    pp = Paragraph(text, S_NOTE)
    tt = Table([[pp]], colWidths=[460])
    tt.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), C_NOTE_BG),
        ('BOX', (0, 0), (-1, -1), 1, C_NOTE_BD),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    return tt


# ===== PAGE FOOTER =====
def footer(canvas, doc):
    canvas.saveState()
    canvas.setFont('TimesNewRoman', 9)
    canvas.setFillColor(C_GRAY)
    canvas.drawCentredString(A4[0]/2, 0.5*inch, "DealScope - Modele de Donnees Detaille (ERD)  |  Page %d" % doc.page)
    canvas.setStrokeColor(C_LIGHT)
    canvas.setLineWidth(0.5)
    canvas.line(1.0*inch, A4[1]-0.65*inch, A4[0]-1.0*inch, A4[1]-0.65*inch)
    canvas.restoreState()


# ===== PAGE DE COUVERTURE =====
def cover():
    E = []
    E.append(Spacer(1, 80))
    E.append(HRFlowable(width="60%", color=C_DARK, thickness=3, spaceBefore=0, spaceAfter=20))
    E.append(Paragraph("DealScope", S_COV_TITLE))
    E.append(sp(15))
    E.append(Paragraph("Modele de Donnees Detaille", S_COV_SUB))
    E.append(Paragraph("(ERD + Migrations)", S_COV_SUB))
    E.append(sp(12))
    E.append(HRFlowable(width="40%", color=C_MED, thickness=1.5, spaceBefore=10, spaceAfter=20))
    E.append(Paragraph("Plateforme SaaS M&amp;A Intelligence Multi-Agents IA", S_COV_INFO))
    E.append(sp(50))
    E.append(Paragraph("Version 1.0 - Mars 2026", S_COV_SM))
    E.append(sp(8))
    E.append(Paragraph("Z.ai", S_COV_SM))
    E.append(sp(40))
    E.append(HRFlowable(width="60%", color=C_DARK, thickness=3, spaceBefore=20, spaceAfter=20))
    E.append(sp(40))
    E.append(Paragraph("CONFIDENTIEL - Document interne a usage exclusif de l'equipe technique DealScope.", S_CONF))
    E.append(PageBreak())
    return E


# ===== TABLE DES MATIERES =====
def toc():
    E = []
    S_TITLE = ParagraphStyle('TT', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=20, leading=26, textColor=C_DARK, spaceAfter=20)
    S_H1 = ParagraphStyle('TH1', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=11, leading=22, textColor=C_DARK)
    S_H2 = ParagraphStyle('TH2', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=10, leading=18, textColor=C_TEXT, leftIndent=20)
    S_DOT = ParagraphStyle('TDOT', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=7, leading=22, textColor=colors.HexColor('#888888'))
    S_PN = ParagraphStyle('TPN', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=11, leading=22, textColor=C_TEXT, alignment=TA_RIGHT)

    E.append(Paragraph("Table des matieres", S_TITLE))
    E.append(HRFlowable(width="100%", color=C_DARK, thickness=1.5, spaceBefore=4, spaceAfter=14))

    entries = [
        ("1. Introduction &amp; Principes", "1", 0),
        ("2. Architecture Multi-Tenant", "2", 0),
        ("3. Schema PostgreSQL Complet", "3", 0),
        ("4. Schema Neo4j - Knowledge Graph", "4", 0),
        ("5. Schema Weaviate - Embeddings RAG", "5", 0),
        ("6. Migrations Alembic", "6", 0),
        ("7. Strategie de Backup &amp; Restoration", "7", 0),
        ("8. Index Full-Text Search", "8", 0),
    ]
    sub_entries = [
        ("1.1 Philosophie de modelisation multi-tenant SaaS", 1),
        ("1.2 Schema-per-tenant vs Row-Level Security", 1),
        ("1.3 Conventions de nommage", 1),
        ("1.4 Strategie de concurrence et verrouillage", 1),
        ("2.1 Implementation detaillee du RLS", 2),
        ("2.2 Garantie d'isolation des tenants", 2),
        ("2.3 Propagation du contexte workspace", 2),
        ("2.4 Pooling de connexions (PgBouncer)", 2),
        ("3.1 Types enumeres et domaines", 3),
        ("3.2 Table workspaces", 3),
        ("3.3 Table users", 3),
        ("3.4 Table icp_profiles", 3),
        ("3.5 Table target_companies", 3),
        ("3.6 Table company_signals", 3),
        ("3.7 Table contacts", 3),
        ("3.8 Table osint_profiles", 3),
        ("3.9 Table analysis_reports", 3),
        ("3.10 Table email_sequences &amp; email_sends", 3),
        ("3.11 Table pipeline_stages", 3),
        ("3.12 Tables scan_executions, audit_logs, api_keys", 3),
        ("3.13 Table data_retention_policies", 3),
        ("3.14 Contraintes, index et politiques RLS", 3),
        ("4.1 Noeuds du graphe", 4),
        ("4.2 Types de relations", 4),
        ("4.3 Index et contraintes Neo4j", 4),
        ("4.4 Patterns de requetes GraphRAG", 4),
        ("5.1 Schema de collection Weaviate", 5),
        ("5.2 Dimensions vectorielles et modele", 5),
        ("5.3 Recherche hybride (BM25 + vector)", 5),
        ("6.1 Strategie de numerotation des migrations", 6),
        ("6.2 Liste ordonnee des 15 migrations", 6),
        ("6.3 Strategie de rollback", 6),
        ("6.4 Scripts de donnees de test (seed)", 6),
        ("6.5 Exemple de code DDL de migration", 6),
        ("7.1 PostgreSQL : pg_dump, archivage WAL, PITR", 7),
        ("7.2 Neo4j : procedure de backup", 7),
        ("7.3 Redis : snapshots RDB", 7),
        ("7.4 Weaviate : backup", 7),
        ("7.5 Objectifs RTO/RPO", 7),
        ("8.1 Colonnes tsvector", 8),
        ("8.2 Dictionnaires francais/anglais", 8),
        ("8.3 Index GIN", 8),
    ]

    dots_w = 200
    pn_w = 40
    dots_count = max(1, int(dots_w / 4.5))

    for title, page, level in entries:
        row_data = [[Paragraph(title, S_H1), Paragraph('.' * dots_count, S_DOT), Paragraph(page, S_PN)]]
        t = Table(row_data, colWidths=[None, dots_w, pn_w])
        t.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'BOTTOM'),
            ('LEFTPADDING', (0, 0), (-1, -1), 0),
            ('RIGHTPADDING', (0, 0), (-1, -1), 0),
            ('TOPPADDING', (0, 0), (-1, -1), 1),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 1),
        ]))
        E.append(t)

    for title, level in sub_entries:
        E.append(Paragraph(title, S_H2))

    E.append(PageBreak())
    return E


# ===== SECTION 1: INTRODUCTION & PRINCIPES =====
def sec_intro():
    E = []
    E.append(h1("1. Introduction &amp; Principes"))
    E.append(hr())

    E.append(h2("1.1 Philosophie de modelisation multi-tenant SaaS"))
    E.append(p(
        "Le modele de donnees de DealScope est concu autour de quatre principes fondamentaux : "
        "<b>isolation stricte</b> des donnees entre tenants, <b>extensibilite</b> via des colonnes JSONB pour les "
        "metadonnees non structurees, <b>auditabilite complete</b> de chaque action, et <b>performance optimale</b> "
        "pour les requetes analytiques et de recherche. En tant que plateforme SaaS multi-tenant dans le domaine "
        "sensible du M&amp;A (fusions &amp; acquisitions), chaque workspace doit etre totalement isole au niveau "
        "de la base de donnees pour garantir la confidentialite des donnees strategiques."
    ))
    E.append(p(
        "Le modele repose sur PostgreSQL 16 comme source de verite transactionnelle, complete par Neo4j 5 pour "
        "le graphe de connaissances (relations entre entreprises, personnes, investissements), Weaviate pour les "
        "embeddings vectoriels (recherche semantique RAG), Redis 7 pour le cache et la messagerie pub/sub, et "
        "Celery pour l'orchestration des 5 agents IA (Ciblage, OSINT, Analyse, Email Matching, Data Management). "
        "SQLAlchemy ORM assure l'abstraction et Alembic gere les migrations schema de maniere versionnee."
    ))
    E.append(sp(4))

    E.append(h2("1.2 Schema-per-tenant vs Row-Level Security"))
    E.append(p(
        "Deux approches principales existent pour le multi-tenancy dans PostgreSQL : le schema-per-tenant "
        "(un schema SQL par workspace) et le Row-Level Security (RLS). DealScope a choisi RLS pour les raisons suivantes :"
    ))
    E.append(bul("<b>Simplicite operationnelle</b> : Un seul schema logique simplifie les migrations, les backups et la maintenance. Ajouter un tenant ne necessite aucune modification DDL."))
    E.append(bul("<b>Performance de connexion</b> : Avec PgBouncer en mode transactionnel, les connexions sont reusees entre tenants sans changer de search_path."))
    E.append(bul("<b>Isolation garantie par la DB</b> : Les politiques RLS filtrent au niveau de l'execution du plan de requete, avant meme que les donnees ne soient lues. Un bug applicatif ne peut pas causer de fuite inter-tenant."))
    E.append(bul("<b>Evolutivite</b> : Passer de 10 a 10 000 tenants ne necessite aucun changement architectural."))
    E.append(bul("<b>Requetes cross-tenant</b> : Les administrateurs systeme peuvent desactiver RLS pour des operations d'administration globales."))
    E.append(sp(4))

    E.append(h2("1.3 Conventions de nommage"))
    E.append(p(
        "Les conventions suivantes sont appliquees de maniere rigoureuse a l'ensemble du schema :"
    ))
    E.append(tbl([
        [TH('Element'), TH('Convention'), TH('Exemple')],
        [TD('Tables'), TD('Pluriel, snake_case'), TD('target_companies, email_sends')],
        [TD('Colonnes PK'), TD('id (UUID)'), TD('id UUID PRIMARY KEY DEFAULT gen_random_uuid()')],
        [TD('Colonnes FK'), TD('{table}_id (UUID)'), TD('workspace_id, company_id')],
        [TD('Colonnes timestamp'), TD('*_at / *_at (TIMESTAMPTZ)'), TD('created_at, updated_at, detected_at')],
        [TD('Colonnes booleennes'), TD('is_* / has_*'), TD('is_default, is_processed, email_verified')],
        [TD('Enumerations'), TD('TYPE ENUM (UPPER_SNAKE)'), TD('company_status, signal_type, user_role')],
        [TD('Index'), TD('idx_{table}_{colonnes}'), TD('idx_target_companies_workspace_status')],
        [TD('Contraintes'), TD('ck_{table}_{description}'), TD('ck_users_valid_role')],
        [TD('Politiques RLS'), TD('rls_{table}_{action}'), TD('rls_target_companies_select')],
    ], [120, 150, 190]))
    E.append(sp(4))

    E.append(h2("1.4 Strategie de concurrence et verrouillage"))
    E.append(p(
        "DealScope utilise plusieurs strategies de concurrence adaptees a chaque cas d'usage. Pour les mises a jour "
        "de donnees, le verrouillage optimiste est privilegie via la colonne <b>enrichment_version</b> (target_companies) "
        "et <b>version</b> (osint_profiles, analysis_reports), incrementee a chaque modification. Le pattern "
        "<font face='DejaVuSansMono' size=8>UPDATE ... SET version = version + 1 WHERE version = :expected_version</font> "
        "garantit qu'aucune mise a jour concurrente n'ecrase les donnees d'un autre processus."
    ))
    E.append(p(
        "Pour les operations d'ecriture intensives (scan_executions), le verrouillage pessimiste au niveau ligne "
        "(SELECT ... FOR UPDATE SKIP LOCKED) est utilise par les workers Celery pour eviter les traitements "
        "dupliques. Les transactions sont maintenues courtes pour minimiser les contentions. L'isolation READ "
        "COMMITTED est le niveau par defaut, REPEATABLE READ etant utilise uniquement pour les rapports financiers "
        "necessitant une coherence temporelle stricte. Les deadlocks sont geres par un mecanisme de retry automatique "
        "avec backoff exponentiel dans la couche ORM."
    ))
    E.append(PageBreak())
    return E


# ===== SECTION 2: ARCHITECTURE MULTI-TENANT =====
def sec_multitenant():
    E = []
    E.append(h1("2. Architecture Multi-Tenant"))
    E.append(hr())

    E.append(h2("2.1 Implementation detaillee du RLS"))
    E.append(p(
        "Le Row-Level Security de PostgreSQL 16 constitue le mecanisme central d'isolation multi-tenant de DealScope. "
        "Chaque table contenant des donnees specifiques a un workspace dispose d'une colonne <b>workspace_id</b> "
        "et de politiques RLS qui filtrent automatiquement les lignes accessibles en fonction du contexte de session."
    ))
    E.extend(code_block("""-- Activation du RLS sur chaque table
ALTER TABLE target_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_signals ENABLE ROW LEVEL SECURITY;
-- ... (toutes les tables multi-tenant)

-- Politique SELECT : lecture uniquement des donnees du workspace courant
CREATE POLICY rls_target_companies_select ON target_companies
  FOR SELECT USING (
    workspace_id = current_setting('app.current_workspace_id', TRUE)::uuid
  );

-- Politique INSERT : insertion automatique du workspace_id
CREATE POLICY rls_target_companies_insert ON target_companies
  FOR INSERT WITH CHECK (
    workspace_id = current_setting('app.current_workspace_id', TRUE)::uuid
  );

-- Politique UPDATE : modification uniquement des lignes du workspace
CREATE POLICY rls_target_companies_update ON target_companies
  FOR UPDATE USING (
    workspace_id = current_setting('app.current_workspace_id', TRUE)::uuid
  );

-- Politique DELETE : suppression uniquement des lignes du workspace
CREATE POLICY rls_target_companies_delete ON target_companies
  FOR DELETE USING (
    workspace_id = current_setting('app.current_workspace_id', TRUE)::uuid
  );"""))
    E.append(sp(6))

    E.append(h2("2.2 Garantie d'isolation des tenants"))
    E.append(p(
        "L'isolation est garantie a trois niveaux. Au niveau <b>session</b>, le parametre "
        "<font face='DejaVuSansMono' size=8>app.current_workspace_id</font> est defini par le middleware "
        "d'authentification avant chaque requete et ne peut etre modifie par l'utilisateur. Au niveau "
        "<b>execution</b>, PostgreSQL applique les politiques RLS avant toute lecture ou ecriture, rendant "
        "toute tentative d'acces inter-tenant impossible au niveau SQL. Au niveau <b>connexion</b>, "
        "le role PostgreSQL <font face='DejaVuSansMono' size=8>app_user</font> est utilise par l'ORM, "
        "avec les droits minimums necessaires (pas de superuser, pas de BYPASSRLS)."
    ))
    E.append(note_box(
        "<b>Important</b> : Les comptes de service (Celery workers, migrations) utilisent un role "
        "<font face='DejaVuSansMono' size=8>app_admin</font> avec BYPASSRLS pour les operations d'administration. "
        "Ce role n'est jamais utilise pour les requetes utilisateur et est strictement limite aux migrations "
        "et aux taches de maintenance programmee."
    ))
    E.append(sp(4))

    E.append(h2("2.3 Propagation du contexte workspace"))
    E.append(p(
        "Le contexte workspace est propage a chaque requete via la fonction "
        "<font face='DejaVuSansMono' size=8>set_app_settings_role()</font>, qui est un trigger PostgreSQL "
        "declenche automatiquement a chaque nouvelle connexion. Cette fonction verifie le jeton JWT dans le "
        "parametre de requete et extrait le workspace_id pour le definir en variable de session."
    ))
    E.extend(code_block("""-- Fonction de configuration du contexte multi-tenant
CREATE OR REPLACE FUNCTION app.set_app_settings_role()
RETURNS void AS $$
BEGIN
  -- Le workspace_id est extrait du JWT par le middleware FastAPI
  -- et transmis via SET LOCAL a l'ouverture de la transaction
  IF current_setting('app.current_workspace_id', TRUE) IS NULL THEN
    RAISE EXCEPTION 'Workspace context not set. Authentication required.';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger de session pour verification du contexte
CREATE OR REPLACE FUNCTION app.check_workspace_context()
RETURNS trigger AS $$
BEGIN
  PERFORM current_setting('app.current_workspace_id', TRUE);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;"""))
    E.append(sp(4))

    E.append(h2("2.4 Pooling de connexions (PgBouncer)"))
    E.append(p(
        "PgBouncer est configure en mode <b>transactionnel</b> pour maximiser le reuse des connexions PostgreSQL. "
        "Dans ce mode, une connexion physique est attribuee a une transaction et rendue au pool a la fin de celle-ci. "
        "Cela permet de gerer un grand nombre de tenants avec un nombre limite de connexions PostgreSQL (typiquement "
        "200 connexions pour 2000+ clients concurrents). Le parametre <font face='DejaVuSansMono' size=8>"
        "app.current_workspace_id</font> etant definit via SET LOCAL, il est automatiquement reinitialise a chaque "
        "nouvelle transaction, ce qui est compatible avec le mode transactionnel de PgBouncer."
    ))
    E.append(tbl([
        [TH('Parametre'), TH('Valeur'), TH('Description')],
        [TD('pool_mode'), TD('transaction'), TD('Connexion par transaction, pas par session')],
        [TD('max_client_conn'), TD('5000'), TD('Connexions max cote applicatif')],
        [TD('default_pool_size'), TD('200'), TD('Connexions max vers PostgreSQL')],
        [TD('reserve_pool_size'), TD('50'), TD('Connexions reservees pour les pics')],
        [TD('server_idle_timeout'), TD('300'), TD('Duree avant fermeture connexion inactive (s)')],
        [TD('server_lifetime'), TD('3600'), TD('Duree de vie max d\'une connexion (s)')],
    ], [140, 100, 220]))
    E.append(PageBreak())
    return E


# ===== SECTION 3: SCHEMA POSTGRESQL COMPLET =====
def sec_postgresql():
    E = []
    E.append(h1("3. Schema PostgreSQL Complet"))
    E.append(hr())

    # 3.1 Enum types
    E.append(h2("3.1 Types enumeres et domaines"))
    E.extend(code_block("""-- ============================================================
-- TYPES ENUMERES
-- ============================================================
CREATE TYPE user_role AS ENUM (
  'OWNER', 'ADMIN', 'MEMBER', 'VIEWER'
);

CREATE TYPE subscription_plan AS ENUM (
  'STARTER', 'PROFESSIONAL', 'BUSINESS', 'ENTERPRISE'
);

CREATE TYPE company_status AS ENUM (
  'NEW', 'IDENTIFIED', 'QUALIFIED', 'IN_ANALYSIS',
  'IN_CONTACT', 'IN_NEGOTIATION', 'COMPLETED', 'ARCHIVED'
);

CREATE TYPE signal_type AS ENUM (
  'FUNDING_ROUND', 'ACQUISITION', 'EXECUTIVE_CHANGE',
  'PRODUCT_LAUNCH', 'PARTNERSHIP', 'LEGAL_FILING',
  'FINANCIAL_REPORT', 'SOCIAL_MENTION', 'JOB_POSTING',
  'TECHNOLOGY_CHANGE', 'MARKET_EXPANSION', 'REGULATORY_CHANGE'
);

CREATE TYPE report_type AS ENUM (
  'STRATEGIC_FIT', 'FINANCIAL_ANALYSIS', 'RISK_ASSESSMENT',
  'MARKET_ANALYSIS', 'TECHNOLOGY_AUDIT', 'COMPREHENSIVE'
);

CREATE TYPE email_status AS ENUM (
  'DRAFT', 'SCHEDULED', 'SENDING', 'SENT', 'BOUNCED', 'FAILED'
);

CREATE TYPE pipeline_stage_enum AS ENUM (
  'PROSPECTING', 'INITIAL_OUTREACH', 'QUALIFICATION',
  'DUE_DILIGENCE', 'NEGOTIATION', 'LETTER_OF_INTENT',
  'FINAL_REVIEW', 'CLOSED_WON', 'CLOSED_LOST'
);

CREATE TYPE scan_status AS ENUM (
  'PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED'
);

CREATE TYPE sequence_status AS ENUM (
  'DRAFT', 'ACTIVE', 'PAUSED', 'ARCHIVED'
);

CREATE TYPE expiry_action AS ENUM (
  'DELETE', 'ANONYMIZE', 'ARCHIVE', 'FLAG_FOR_REVIEW'
);"""))
    E.append(sp(6))

    # 3.2 workspaces
    E.append(h2("3.2 Table workspaces"))
    E.extend(code_block("""CREATE TABLE workspaces (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(255) NOT NULL,
  slug            VARCHAR(100) NOT NULL UNIQUE,
  plan            subscription_plan NOT NULL DEFAULT 'STARTER',
  settings        JSONB NOT NULL DEFAULT '{}',
  stripe_customer_id VARCHAR(255),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT ck_workspaces_valid_slug CHECK (
    slug ~ '^[a-z0-9][a-z0-9-]{1,98}[a-z0-9]$'
  ),
  CONSTRAINT ck_workspaces_settings_json CHECK (
    jsonb_typeof(settings) = 'object'
  )
);

-- Index unique sur le slug pour les lookups
CREATE UNIQUE INDEX idx_workspaces_slug ON workspaces (slug);
-- Index sur le plan pour les requetes d'administration
CREATE INDEX idx_workspaces_plan ON workspaces (plan);
-- Index GIN sur settings pour les requetes JSONB
CREATE INDEX idx_workspaces_settings ON workspaces USING GIN (settings);

-- RLS est desactive sur workspaces car c'est la table racine
-- L'acces est controle par la couche applicative"""))
    E.append(sp(6))

    # 3.3 users
    E.append(h2("3.3 Table users"))
    E.extend(code_block("""CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  email           VARCHAR(320) NOT NULL,
  first_name      VARCHAR(100) NOT NULL,
  last_name       VARCHAR(100) NOT NULL,
  role            user_role NOT NULL DEFAULT 'MEMBER',
  auth_provider_id VARCHAR(255),
  last_login      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT ck_users_valid_email CHECK (
    email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'
  ),
  CONSTRAINT ck_users_valid_role CHECK (role IN ('OWNER','ADMIN','MEMBER','VIEWER'))
);

-- Index unique email par workspace (unicite globale)
CREATE UNIQUE INDEX idx_users_workspace_email
  ON users (workspace_id, email);
-- Index pour la recherche d'utilisateurs par workspace
CREATE INDEX idx_users_workspace ON users (workspace_id);
-- Index sur auth_provider_id pour les lookups Clerk
CREATE INDEX idx_users_auth_provider ON users (auth_provider_id)
  WHERE auth_provider_id IS NOT NULL;

-- RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY rls_users_select ON users
  FOR SELECT USING (workspace_id = current_setting('app.current_workspace_id', TRUE)::uuid);
CREATE POLICY rls_users_update ON users
  FOR UPDATE USING (workspace_id = current_setting('app.current_workspace_id', TRUE)::uuid);
CREATE POLICY rls_users_delete ON users
  FOR DELETE USING (workspace_id = current_setting('app.current_workspace_id', TRUE)::uuid);
-- INSERT gere par la couche applicative (seuls les admins peuvent creer des users)"""))
    E.append(sp(6))

    # 3.4 icp_profiles
    E.append(h2("3.4 Table icp_profiles"))
    E.extend(code_block("""CREATE TABLE icp_profiles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name            VARCHAR(255) NOT NULL,
  criteria        JSONB NOT NULL DEFAULT '{}',
  weights         JSONB NOT NULL DEFAULT '{}',
  is_default      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT ck_icp_profiles_criteria CHECK (
    jsonb_typeof(criteria) = 'object'
  ),
  CONSTRAINT ck_icp_profiles_weights CHECK (
    jsonb_typeof(weights) = 'object'
  )
);

CREATE INDEX idx_icp_profiles_workspace ON icp_profiles (workspace_id);
CREATE INDEX idx_icp_profiles_default
  ON icp_profiles (workspace_id, is_default) WHERE is_default = TRUE;
CREATE INDEX idx_icp_profiles_criteria
  ON icp_profiles USING GIN (criteria);

ALTER TABLE icp_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY rls_icp_profiles_select ON icp_profiles
  FOR SELECT USING (workspace_id = current_setting('app.current_workspace_id', TRUE)::uuid);
CREATE POLICY rls_icp_profiles_insert ON icp_profiles
  FOR INSERT WITH CHECK (workspace_id = current_setting('app.current_workspace_id', TRUE)::uuid);
CREATE POLICY rls_icp_profiles_update ON icp_profiles
  FOR UPDATE USING (workspace_id = current_setting('app.current_workspace_id', TRUE)::uuid);
CREATE POLICY rls_icp_profiles_delete ON icp_profiles
  FOR DELETE USING (workspace_id = current_setting('app.current_workspace_id', TRUE)::uuid);"""))
    E.append(sp(6))

    # 3.5 target_companies
    E.append(h2("3.5 Table target_companies"))
    E.extend(code_block("""CREATE TABLE target_companies (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id      UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  icp_profile_id    UUID REFERENCES icp_profiles(id) ON DELETE SET NULL,
  name              VARCHAR(500) NOT NULL,
  legal_name        VARCHAR(500),
  siret             VARCHAR(20),
  sector            VARCHAR(255),
  size_range        VARCHAR(50),
  revenue_range     VARCHAR(50),
  location          JSONB,
  technologies      JSONB DEFAULT '[]',
  website_url       VARCHAR(2048),
  linkedin_url      VARCHAR(2048),
  icp_score         FLOAT,
  status            company_status NOT NULL DEFAULT 'NEW',
  source            VARCHAR(100),
  notes             TEXT,
  enrichment_version INT NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT ck_target_companies_score CHECK (
    icp_score IS NULL OR (icp_score >= 0 AND icp_score <= 100)
  ),
  CONSTRAINT ck_target_companies_siret CHECK (
    siret IS NULL OR siret ~ '^[0-9]{14}$'
  ),
  CONSTRAINT ck_target_companies_urls CHECK (
    (website_url IS NULL OR website_url LIKE 'https://%')
    AND (linkedin_url IS NULL OR linkedin_url LIKE 'https://%')
  ),
  CONSTRAINT ck_target_companies_version CHECK (
    enrichment_version >= 0
  )
);

CREATE INDEX idx_tc_workspace_status
  ON target_companies (workspace_id, status);
CREATE INDEX idx_tc_icp_score
  ON target_companies (workspace_id, icp_score DESC)
  WHERE icp_score IS NOT NULL;
CREATE INDEX idx_tc_sector
  ON target_companies (workspace_id, sector);
CREATE INDEX idx_tc_technologies
  ON target_companies USING GIN (technologies);
CREATE INDEX idx_tc_location
  ON target_companies USING GIN (location);
CREATE INDEX idx_tc_name
  ON target_companies (workspace_id, name);
CREATE INDEX idx_tc_siret
  ON target_companies (siret) WHERE siret IS NOT NULL;
CREATE INDEX idx_tc_created
  ON target_companies (workspace_id, created_at DESC);

ALTER TABLE target_companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY rls_tc_select ON target_companies
  FOR SELECT USING (workspace_id = current_setting('app.current_workspace_id', TRUE)::uuid);
CREATE POLICY rls_tc_insert ON target_companies
  FOR INSERT WITH CHECK (workspace_id = current_setting('app.current_workspace_id', TRUE)::uuid);
CREATE POLICY rls_tc_update ON target_companies
  FOR UPDATE USING (workspace_id = current_setting('app.current_workspace_id', TRUE)::uuid);
CREATE POLICY rls_tc_delete ON target_companies
  FOR DELETE USING (workspace_id = current_setting('app.current_workspace_id', TRUE)::uuid);"""))
    E.append(PageBreak())

    # 3.6 company_signals
    E.append(h2("3.6 Table company_signals"))
    E.extend(code_block("""CREATE TABLE company_signals (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id       UUID NOT NULL REFERENCES target_companies(id) ON DELETE CASCADE,
  signal_type      signal_type NOT NULL,
  title            VARCHAR(500) NOT NULL,
  description      TEXT,
  source_url       VARCHAR(2048),
  source_name      VARCHAR(255),
  detected_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  confidence_score FLOAT,
  is_processed     BOOLEAN NOT NULL DEFAULT FALSE,
  metadata         JSONB DEFAULT '{}',

  CONSTRAINT ck_signals_confidence CHECK (
    confidence_score IS NULL OR (confidence_score >= 0 AND confidence_score <= 1)
  )
);

CREATE INDEX idx_signals_company
  ON company_signals (company_id, detected_at DESC);
CREATE INDEX idx_signals_type
  ON company_signals (company_id, signal_type)
  WHERE is_processed = FALSE;
CREATE INDEX idx_signals_detected
  ON company_signals (detected_at DESC);
CREATE INDEX idx_signals_metadata
  ON company_signals USING GIN (metadata);
CREATE INDEX idx_signals_unprocessed
  ON company_signals (company_id) WHERE is_processed = FALSE;

ALTER TABLE company_signals ENABLE ROW LEVEL SECURITY;
CREATE POLICY rls_signals_select ON company_signals
  FOR SELECT USING (
    company_id IN (
      SELECT id FROM target_companies
      WHERE workspace_id = current_setting('app.current_workspace_id', TRUE)::uuid
    )
  );
CREATE POLICY rls_signals_insert ON company_signals
  FOR INSERT WITH CHECK (
    company_id IN (
      SELECT id FROM target_companies
      WHERE workspace_id = current_setting('app.current_workspace_id', TRUE)::uuid
    )
  );
CREATE POLICY rls_signals_update ON company_signals
  FOR UPDATE USING (
    company_id IN (
      SELECT id FROM target_companies
      WHERE workspace_id = current_setting('app.current_workspace_id', TRUE)::uuid
    )
  );
CREATE POLICY rls_signals_delete ON company_signals
  FOR DELETE USING (
    company_id IN (
      SELECT id FROM target_companies
      WHERE workspace_id = current_setting('app.current_workspace_id', TRUE)::uuid
    )
  );"""))
    E.append(sp(6))

    # 3.7 contacts
    E.append(h2("3.7 Table contacts"))
    E.extend(code_block("""CREATE TABLE contacts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id        UUID NOT NULL REFERENCES target_companies(id) ON DELETE CASCADE,
  first_name        VARCHAR(100) NOT NULL,
  last_name         VARCHAR(100) NOT NULL,
  email             VARCHAR(320),
  role              VARCHAR(255),
  seniority         VARCHAR(50),
  linkedin_url      VARCHAR(2048),
  email_verified    BOOLEAN NOT NULL DEFAULT FALSE,
  email_validated_at TIMESTAMPTZ,
  validation_method VARCHAR(50),
  phone             VARCHAR(50),
  metadata          JSONB DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT ck_contacts_email CHECK (
    email IS NULL
    OR email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'
  )
);

CREATE INDEX idx_contacts_company
  ON contacts (company_id);
CREATE INDEX idx_contacts_email
  ON contacts (email) WHERE email IS NOT NULL;
CREATE INDEX idx_contacts_name
  ON contacts (first_name, last_name);
CREATE INDEX idx_contacts_seniority
  ON contacts (company_id, seniority) WHERE seniority IS NOT NULL;
CREATE INDEX idx_contacts_verified
  ON contacts (company_id, email_verified)
  WHERE email_verified = TRUE;

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY rls_contacts_select ON contacts
  FOR SELECT USING (
    company_id IN (
      SELECT id FROM target_companies
      WHERE workspace_id = current_setting('app.current_workspace_id', TRUE)::uuid
    )
  );
CREATE POLICY rls_contacts_insert ON contacts
  FOR INSERT WITH CHECK (
    company_id IN (
      SELECT id FROM target_companies
      WHERE workspace_id = current_setting('app.current_workspace_id', TRUE)::uuid
    )
  );
CREATE POLICY rls_contacts_update ON contacts
  FOR UPDATE USING (
    company_id IN (
      SELECT id FROM target_companies
      WHERE workspace_id = current_setting('app.current_workspace_id', TRUE)::uuid
    )
  );
CREATE POLICY rls_contacts_delete ON contacts
  FOR DELETE USING (
    company_id IN (
      SELECT id FROM target_companies
      WHERE workspace_id = current_setting('app.current_workspace_id', TRUE)::uuid
    )
  );"""))
    E.append(PageBreak())

    # 3.8 osint_profiles
    E.append(h2("3.8 Table osint_profiles"))
    E.extend(code_block("""CREATE TABLE osint_profiles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES target_companies(id) ON DELETE CASCADE,
  data_source     VARCHAR(100) NOT NULL,
  raw_data        JSONB NOT NULL DEFAULT '{}',
  extracted_entities JSONB DEFAULT '[]',
  crawl_metadata  JSONB DEFAULT '{}',
  extracted_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  version         INT NOT NULL DEFAULT 1,

  CONSTRAINT ck_osint_version CHECK (version >= 1)
);

CREATE INDEX idx_osint_company ON osint_profiles (company_id, version DESC);
CREATE INDEX idx_osint_source ON osint_profiles (data_source);
CREATE INDEX idx_osint_raw_data ON osint_profiles USING GIN (raw_data);
CREATE INDEX idx_osint_entities ON osint_profiles USING GIN (extracted_entities);

ALTER TABLE osint_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY rls_osint_select ON osint_profiles
  FOR SELECT USING (
    company_id IN (
      SELECT id FROM target_companies
      WHERE workspace_id = current_setting('app.current_workspace_id', TRUE)::uuid
    )
  );
CREATE POLICY rls_osint_insert ON osint_profiles
  FOR INSERT WITH CHECK (
    company_id IN (
      SELECT id FROM target_companies
      WHERE workspace_id = current_setting('app.current_workspace_id', TRUE)::uuid
    )
  );"""))
    E.append(sp(6))

    # 3.9 analysis_reports
    E.append(h2("3.9 Table analysis_reports"))
    E.extend(code_block("""CREATE TABLE analysis_reports (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES target_companies(id) ON DELETE CASCADE,
  report_type     report_type NOT NULL,
  content         JSONB NOT NULL DEFAULT '{}',
  fit_score       FLOAT,
  strengths       TEXT[] DEFAULT '{}',
  weaknesses      TEXT[] DEFAULT '{}',
  triggers        TEXT[] DEFAULT '{}',
  risks           TEXT[] DEFAULT '{}',
  sources         JSONB DEFAULT '[]',
  llm_model_used  VARCHAR(100),
  llm_tokens_used INT,
  generated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  version         INT NOT NULL DEFAULT 1,

  CONSTRAINT ck_reports_fit_score CHECK (
    fit_score IS NULL OR (fit_score >= 0 AND fit_score <= 100)
  ),
  CONSTRAINT ck_reports_tokens CHECK (
    llm_tokens_used IS NULL OR llm_tokens_used > 0
  ),
  CONSTRAINT ck_reports_version CHECK (version >= 1)
);

CREATE INDEX idx_reports_company
  ON analysis_reports (company_id, generated_at DESC);
CREATE INDEX idx_reports_type
  ON analysis_reports (company_id, report_type);
CREATE INDEX idx_reports_fit_score
  ON analysis_reports (company_id, fit_score DESC)
  WHERE fit_score IS NOT NULL;
CREATE INDEX idx_reports_content
  ON analysis_reports USING GIN (content);

ALTER TABLE analysis_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY rls_reports_select ON analysis_reports
  FOR SELECT USING (
    company_id IN (
      SELECT id FROM target_companies
      WHERE workspace_id = current_setting('app.current_workspace_id', TRUE)::uuid
    )
  );
CREATE POLICY rls_reports_insert ON analysis_reports
  FOR INSERT WITH CHECK (
    company_id IN (
      SELECT id FROM target_companies
      WHERE workspace_id = current_setting('app.current_workspace_id', TRUE)::uuid
    )
  );"""))
    E.append(sp(6))

    # 3.10 email_sequences & email_sends
    E.append(h2("3.10 Table email_sequences &amp; email_sends"))
    E.extend(code_block("""CREATE TABLE email_sequences (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id      UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name              VARCHAR(255) NOT NULL,
  subject_template  TEXT NOT NULL,
  body_template     TEXT NOT NULL,
  status            sequence_status NOT NULL DEFAULT 'DRAFT',
  target_segment    JSONB DEFAULT '{}',
  sent_count        INT NOT NULL DEFAULT 0,
  open_count        INT NOT NULL DEFAULT 0,
  reply_count       INT NOT NULL DEFAULT 0,
  bounce_count      INT NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_sent_at      TIMESTAMPTZ,

  CONSTRAINT ck_seq_counts CHECK (
    sent_count >= 0 AND open_count >= 0
    AND reply_count >= 0 AND bounce_count >= 0
  ),
  CONSTRAINT ck_seq_reply_rate CHECK (
    reply_count <= sent_count
  ),
  CONSTRAINT ck_seq_open_rate CHECK (
    open_count <= sent_count
  )
);

CREATE INDEX idx_seq_workspace ON email_sequences (workspace_id);
CREATE INDEX idx_seq_status ON email_sequences (workspace_id, status);
CREATE INDEX idx_seq_segment ON email_sequences USING GIN (target_segment);

ALTER TABLE email_sequences ENABLE ROW LEVEL SECURITY;
CREATE POLICY rls_seq_select ON email_sequences
  FOR SELECT USING (workspace_id = current_setting('app.current_workspace_id', TRUE)::uuid);
CREATE POLICY rls_seq_insert ON email_sequences
  FOR INSERT WITH CHECK (workspace_id = current_setting('app.current_workspace_id', TRUE)::uuid);
CREATE POLICY rls_seq_update ON email_sequences
  FOR UPDATE USING (workspace_id = current_setting('app.current_workspace_id', TRUE)::uuid);
CREATE POLICY rls_seq_delete ON email_sequences
  FOR DELETE USING (workspace_id = current_setting('app.current_workspace_id', TRUE)::uuid);"""))
    E.append(sp(4))
    E.extend(code_block("""CREATE TABLE email_sends (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id          UUID NOT NULL REFERENCES email_sequences(id) ON DELETE CASCADE,
  contact_id           UUID NOT NULL REFERENCES contacts(id),
  company_id           UUID NOT NULL REFERENCES target_companies(id),
  personalized_subject TEXT NOT NULL,
  personalized_body    TEXT NOT NULL,
  status               email_status NOT NULL DEFAULT 'DRAFT',
  opened_at            TIMESTAMPTZ,
  replied_at           TIMESTAMPTZ,
  bounced_reason       VARCHAR(500),
  sent_at              TIMESTAMPTZ
);

CREATE INDEX idx_sends_sequence
  ON email_sends (sequence_id, sent_at DESC);
CREATE INDEX idx_sends_contact
  ON email_sends (contact_id);
CREATE INDEX idx_sends_company
  ON email_sends (company_id);
CREATE INDEX idx_sends_status
  ON email_sends (sequence_id, status);
CREATE INDEX idx_sends_sent
  ON email_sends (sent_at DESC) WHERE sent_at IS NOT NULL;

ALTER TABLE email_sends ENABLE ROW LEVEL SECURITY;
CREATE POLICY rls_sends_select ON email_sends
  FOR SELECT USING (
    sequence_id IN (
      SELECT id FROM email_sequences
      WHERE workspace_id = current_setting('app.current_workspace_id', TRUE)::uuid
    )
  );
CREATE POLICY rls_sends_insert ON email_sends
  FOR INSERT WITH CHECK (
    sequence_id IN (
      SELECT id FROM email_sequences
      WHERE workspace_id = current_setting('app.current_workspace_id', TRUE)::uuid
    )
  );"""))
    E.append(PageBreak())

    # 3.11 pipeline_stages
    E.append(h2("3.11 Table pipeline_stages"))
    E.extend(code_block("""CREATE TABLE pipeline_stages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  company_id      UUID NOT NULL REFERENCES target_companies(id) ON DELETE CASCADE,
  stage           pipeline_stage_enum NOT NULL DEFAULT 'PROSPECTING',
  assigned_to     UUID REFERENCES users(id) ON DELETE SET NULL,
  notes           TEXT,
  moved_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  moved_by        UUID REFERENCES users(id) ON DELETE SET NULL,

  CONSTRAINT ck_pipeline_assigned CHECK (
    assigned_to IS NULL OR assigned_to IN (SELECT id FROM users)
  ),
  CONSTRAINT ck_pipeline_moved_by CHECK (
    moved_by IS NULL OR moved_by IN (SELECT id FROM users)
  )
);

CREATE INDEX idx_pipeline_company
  ON pipeline_stages (company_id, moved_at DESC);
CREATE INDEX idx_pipeline_workspace_stage
  ON pipeline_stages (workspace_id, stage);
CREATE INDEX idx_pipeline_assigned
  ON pipeline_stages (assigned_to) WHERE assigned_to IS NOT NULL;
CREATE UNIQUE INDEX idx_pipeline_unique
  ON pipeline_stages (company_id);

ALTER TABLE pipeline_stages ENABLE ROW LEVEL SECURITY;
CREATE POLICY rls_pipeline_select ON pipeline_stages
  FOR SELECT USING (
    workspace_id = current_setting('app.current_workspace_id', TRUE)::uuid
  );
CREATE POLICY rls_pipeline_insert ON pipeline_stages
  FOR INSERT WITH CHECK (
    workspace_id = current_setting('app.current_workspace_id', TRUE)::uuid
  );
CREATE POLICY rls_pipeline_update ON pipeline_stages
  FOR UPDATE USING (
    workspace_id = current_setting('app.current_workspace_id', TRUE)::uuid
  );"""))
    E.append(sp(6))

    # 3.12 scan_executions, audit_logs, api_keys
    E.append(h2("3.12 Tables scan_executions, audit_logs, api_keys"))
    E.extend(code_block("""CREATE TABLE scan_executions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id      UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  icp_profile_id    UUID NOT NULL REFERENCES icp_profiles(id) ON DELETE CASCADE,
  status            scan_status NOT NULL DEFAULT 'PENDING',
  total_targets     INT NOT NULL DEFAULT 0,
  processed_targets INT NOT NULL DEFAULT 0,
  failed_targets    INT NOT NULL DEFAULT 0,
  started_at        TIMESTAMPTZ,
  completed_at      TIMESTAMPTZ,
  duration_ms       INT,
  cost_usd          FLOAT,

  CONSTRAINT ck_scan_counts CHECK (
    total_targets >= 0 AND processed_targets >= 0
    AND failed_targets >= 0
  ),
  CONSTRAINT ck_scan_processed CHECK (processed_targets <= total_targets),
  CONSTRAINT ck_scan_failed CHECK (failed_targets <= total_targets),
  CONSTRAINT ck_scan_cost CHECK (cost_usd IS NULL OR cost_usd >= 0)
);

CREATE INDEX idx_scan_workspace
  ON scan_executions (workspace_id, started_at DESC);
CREATE INDEX idx_scan_icp
  ON scan_executions (icp_profile_id, started_at DESC);
CREATE INDEX idx_scan_status
  ON scan_executions (workspace_id, status);

ALTER TABLE scan_executions ENABLE ROW LEVEL SECURITY;
CREATE POLICY rls_scan_select ON scan_executions
  FOR SELECT USING (workspace_id = current_setting('app.current_workspace_id', TRUE)::uuid);
CREATE POLICY rls_scan_insert ON scan_executions
  FOR INSERT WITH CHECK (workspace_id = current_setting('app.current_workspace_id', TRUE)::uuid);
CREATE POLICY rls_scan_update ON scan_executions
  FOR UPDATE USING (workspace_id = current_setting('app.current_workspace_id', TRUE)::uuid);"""))
    E.append(sp(4))
    E.extend(code_block("""CREATE TABLE audit_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
  action          VARCHAR(100) NOT NULL,
  entity_type     VARCHAR(100) NOT NULL,
  entity_id       UUID,
  changes         JSONB,
  ip_address      INET,
  user_agent      TEXT,
  timestamp       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_workspace
  ON audit_logs (workspace_id, timestamp DESC);
CREATE INDEX idx_audit_user
  ON audit_logs (user_id, timestamp DESC);
CREATE INDEX idx_audit_entity
  ON audit_logs (entity_type, entity_id);
CREATE INDEX idx_audit_action
  ON audit_logs (workspace_id, action, timestamp DESC);
CREATE INDEX idx_audit_changes
  ON audit_logs USING GIN (changes);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY rls_audit_select ON audit_logs
  FOR SELECT USING (workspace_id = current_setting('app.current_workspace_id', TRUE)::uuid);
CREATE POLICY rls_audit_insert ON audit_logs
  FOR INSERT WITH CHECK (workspace_id = current_setting('app.current_workspace_id', TRUE)::uuid);"""))
    E.append(sp(4))
    E.extend(code_block("""CREATE TABLE api_keys (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name            VARCHAR(255) NOT NULL,
  key_hash        VARCHAR(255) NOT NULL,
  permissions     JSONB NOT NULL DEFAULT '[]',
  last_used_at    TIMESTAMPTZ,
  expires_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT ck_api_keys_permissions CHECK (
    jsonb_typeof(permissions) = 'array'
  )
);

CREATE UNIQUE INDEX idx_api_keys_hash ON api_keys (key_hash);
CREATE INDEX idx_api_keys_workspace
  ON api_keys (workspace_id);
CREATE INDEX idx_api_keys_expires
  ON api_keys (expires_at) WHERE expires_at IS NOT NULL;

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY rls_apikeys_select ON api_keys
  FOR SELECT USING (workspace_id = current_setting('app.current_workspace_id', TRUE)::uuid);
CREATE POLICY rls_apikeys_insert ON api_keys
  FOR INSERT WITH CHECK (workspace_id = current_setting('app.current_workspace_id', TRUE)::uuid);
CREATE POLICY rls_apikeys_update ON api_keys
  FOR UPDATE USING (workspace_id = current_setting('app.current_workspace_id', TRUE)::uuid);
CREATE POLICY rls_apikeys_delete ON api_keys
  FOR DELETE USING (workspace_id = current_setting('app.current_workspace_id', TRUE)::uuid);"""))
    E.append(PageBreak())

    # 3.13 data_retention_policies
    E.append(h2("3.13 Table data_retention_policies"))
    E.extend(code_block("""CREATE TABLE data_retention_policies (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  entity_type     VARCHAR(100) NOT NULL,
  retention_days  INT NOT NULL,
  action_on_expiry expiry_action NOT NULL DEFAULT 'ARCHIVE',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT ck_retention_days CHECK (retention_days > 0)
);

CREATE INDEX idx_retention_workspace
  ON data_retention_policies (workspace_id, entity_type);
CREATE UNIQUE INDEX idx_retention_unique
  ON data_retention_policies (workspace_id, entity_type);

ALTER TABLE data_retention_policies ENABLE ROW LEVEL SECURITY;
CREATE POLICY rls_retention_select ON data_retention_policies
  FOR SELECT USING (workspace_id = current_setting('app.current_workspace_id', TRUE)::uuid);
CREATE POLICY rls_retention_insert ON data_retention_policies
  FOR INSERT WITH CHECK (workspace_id = current_setting('app.current_workspace_id', TRUE)::uuid);
CREATE POLICY rls_retention_update ON data_retention_policies
  FOR UPDATE USING (workspace_id = current_setting('app.current_workspace_id', TRUE)::uuid);
CREATE POLICY rls_retention_delete ON data_retention_policies
  FOR DELETE USING (workspace_id = current_setting('app.current_workspace_id', TRUE)::uuid);"""))
    E.append(sp(6))

    # 3.14 Contraintes, index et politiques RLS (summary)
    E.append(h2("3.14 Resume des contraintes, index et politiques RLS"))
    E.append(p(
        "Le tableau ci-dessous resume les index principaux du schema PostgreSQL, classes par type :"
    ))
    E.append(tbl([
        [TH('Type index'), TH('Tables concernees'), TH('Usage')],
        [TD('B-tree standard'), TD('Toutes les tables'), TD('Recherches par cle primaire, FK, filtres d\'egalite, tri')],
        [TD('B-tree composite'), TD('target_companies, scan_executions'), TD('Requetes multi-colonnes (workspace + status + date)')],
        [TD('B-tree conditionnel'), TD('users, contacts, api_keys'), TD('Index partiels WHERE col IS NOT NULL')],
        [TD('GIN (JSONB)'), TD('workspaces, icp_profiles, target_companies'), TD('Requetes sur champs JSONB (criteria, settings, technologies)')],
        [TD('GIN (JSONB array)'), TD('osint_profiles, analysis_reports'), TD('Recherche dans tableaux JSONB (strengths, entities)')],
        [TD('UNIQUE'), TD('workspaces(slug), api_keys(key_hash)'), TD('Contraintes d\'unicite metier')],
        [TD('UNIQUE composite'), TD('users(workspace, email), pipeline(company)'), TD('Unicite multi-colonnes')],
    ], [110, 170, 180]))
    E.append(sp(6))
    E.append(note_box(
        "<b>Total :</b> 15 tables, 11 types enumeres, 40+ index (B-tree, GIN, conditionnels), "
        "13 tables avec RLS (4 politiques CRUD chacune = 52 politiques RLS), "
        "30+ contraintes CHECK."
    ))
    E.append(PageBreak())
    return E


# ===== SECTION 4: SCHEMA NEO4J =====
def sec_neo4j():
    E = []
    E.append(h1("4. Schema Neo4j - Knowledge Graph"))
    E.append(hr())

    E.append(h2("4.1 Noeuds du graphe (Node Labels)"))
    E.append(p(
        "Le graphe de connaissances Neo4j 5 de DealScope structure les entites du marche M&amp;A sous forme de "
        "noeuds avec les labels suivants. Chaque noeud dispose d'un identifiant unique (propriete <b>ds_id</b>) "
        "synchronise avec la table PostgreSQL correspondante via un mecanisme de CDC (Change Data Capture)."
    ))
    E.append(tbl([
        [TH('Label'), TH('Proprietes principales'), TH('Source PostgreSQL')],
        [TD('Company'), TD('ds_id, name, sector, size_range, revenue_range, founded_year, headquarters, website_url'), TD('target_companies')],
        [TD('Person'), TD('ds_id, first_name, last_name, role, seniority, linkedin_url, email'), TD('contacts')],
        [TD('Investment'), TD('ds_id, amount, currency, round_type, announced_at, investor_ids[]'), TD('company_signals')],
        [TD('Acquisition'), TD('ds_id, amount, currency, announced_at, acquirer_name, target_name, status'), TD('company_signals')],
        [TD('Partnership'), TD('ds_id, partnership_type, announced_at, description, partner_ids[]'), TD('company_signals')],
        [TD('Technology'), TD('ds_id, name, category, description, website_url'), TD('target_companies.technologies')],
        [TD('Industry'), TD('ds_id, name, sector, sub_sector, description'), TD('target_companies.sector')],
    ], [90, 220, 150]))
    E.append(sp(6))

    E.append(h2("4.2 Types de relations (Relationship Types)"))
    E.append(p(
        "Les relations structurent les liens entre entites du graphe. Chaque relation porte des proprietes "
        "contextuelles (date, poids, source) permettant des requetes temporelles et ponderees."
    ))
    E.extend(code_block("""-- Relations principales du graphe de connaissances

// Une personne dirige une entreprise
(:Person)-[:LED_BY {since: date, role: string}]->(:Company)

// Une entreprise a ete investie par une autre
(:Company)-[:INVESTED_IN {
  amount: float, currency: string,
  round: string, date: date
}]->(:Company)

// Une entreprise a ete acquise
(:Company)-[:ACQUIRED_BY {
  amount: float, currency: string,
  date: date, status: string
}]->(:Company)

// Deux entreprises sont partenaires
(:Company)-[:PARTNERS_WITH {
  type: string, since: date,
  description: string
}]->(:Company)

// Une entreprise utilise une technologie
(:Company)-[:USES_TECHNOLOGY {
  detected_at: date, confidence: float,
  source: string
}]->(:Technology)

// Deux entreprises sont concurrentes
(:Company)-[:COMPETES_WITH {
  overlap_score: float,
  shared_technologies: int,
  shared_market: string
}]->(:Company)

// Une personne travaille dans une entreprise
(:Person)-[:EMPLOYED_AT {
  role: string, seniority: string,
  since: date, is_current: boolean
}]->(:Company)"""))
    E.append(sp(6))

    E.append(h2("4.3 Index et contraintes Neo4j"))
    E.extend(code_block("""-- Index pour la recherche par nom (performance)
CREATE INDEX company_name_idx FOR (c:Company) ON (c.name);
CREATE INDEX person_name_idx FOR (p:Person) ON (p.first_name, p.last_name);
CREATE INDEX technology_name_idx FOR (t:Technology) ON (t.name);
CREATE INDEX industry_name_idx FOR (i:Industry) ON (i.name);

-- Index pour les lookups par identifiant externe
CREATE INDEX company_ds_id_idx FOR (c:Company) ON (c.ds_id);
CREATE INDEX person_ds_id_idx FOR (p:Person) ON (p.ds_id);

-- Contraintes d'unicite
CREATE CONSTRAINT company_ds_id_unique FOR (c:Company) REQUIRE c.ds_id IS UNIQUE;
CREATE CONSTRAINT person_ds_id_unique FOR (p:Person) REQUIRE p.ds_id IS UNIQUE;
CREATE CONSTRAINT technology_name_unique FOR (t:Technology) REQUIRE t.name IS UNIQUE;

-- Index composite pour les requetes par secteur
CREATE INDEX company_sector_idx FOR (c:Company) ON (c.sector);
CREATE INDEX company_size_idx FOR (c:Company) ON (c.size_range);

-- Index sur proprietes de relation
CREATE INDEX invested_in_date_idx FOR ()-[r:INVESTED_IN]-() ON (r.date);
CREATE INDEX acquired_by_date_idx FOR ()-[r:ACQUIRED_BY]-() ON (r.date);"""))
    E.append(sp(6))

    E.append(h2("4.4 Patterns de requetes GraphRAG"))
    E.append(p(
        "Les requetes GraphRAG combinent le graphe de connaissances avec les embeddings vectoriels pour fournir "
        "des reponses contextuelles riches. Le pattern typique est : (1) recherche vectorielle dans Weaviate pour "
        "identifier les entreprises pertinentes, (2) traversal du graphe Neo4j pour enrichir le contexte avec les "
        "relations, (3) synthese par un LLM pour generer une reponse coherente."
    ))
    E.extend(code_block("""-- Trouver le sous-graphe d'ecosysteme d'une cible M&amp;A
MATCH path = (target:Company {ds_id: $company_id})-[*1..3]-(related)
RETURN path
ORDER BY length(path) ASC
LIMIT 50;

-- Identifier les concurrents indirects (competiteurs de mes competiteurs)
MATCH (c:Company {ds_id: $company_id})-[:COMPETES_WITH]->(comp)-[:COMPETES_WITH]->(indirect)
WHERE indirect <> c AND NOT (c)-[:COMPETES_WITH]-(indirect)
RETURN indirect.name, indirect.sector, comp.overlap_score AS via_competitor
ORDER BY comp.overlap_score DESC
LIMIT 20;

-- Trouver les investisseurs communs entre deux cibles potentielles
MATCH (c1:Company {ds_id: $id1})<-[:INVESTED_IN]-(inv:Company)-[:INVESTED_IN]->(c2:Company {ds_id: $id2})
RETURN inv.name, inv.sector,
  [(inv)-[r1:INVESTED_IN]->(c1) | r1.amount] AS investment_c1,
  [(inv)-[r2:INVESTED_IN]->(c2) | r2.amount] AS investment_c2;

-- Cartographie complete des relations d'une personne cle
MATCH (p:Person {ds_id: $person_id})-[r]-(entity)
RETURN type(r) AS relation, labels(entity)[0] AS entity_type,
  coalesce(entity.name, entity.first_name) AS entity_name,
  properties(r) AS details
ORDER BY type(r);"""))
    E.append(PageBreak())
    return E


# ===== SECTION 5: SCHEMA WEAVIATE =====
def sec_weaviate():
    E = []
    E.append(h1("5. Schema Weaviate - Embeddings RAG"))
    E.append(hr())

    E.append(h2("5.1 Schema de collection Weaviate"))
    E.extend(code_block("""// Collection : CompanyProfiles
// Objectif : stocker les embeddings vectoriels des profils d'entreprises
// pour la recherche semantique et le RAG (Retrieval-Augmented Generation)

{
  "class": "CompanyProfiles",
  "description": "Embeddings vectoriels des profils d'entreprises pour la recherche semantique M&A",
  "vectorizer": "text2vec-openai",
  "moduleConfig": {
    "text2vec-openai": {
      "model": "text-embedding-3-small",
      "dimensions": 1536,
      "type": "text"
    }
  },
  "properties": [
    {
      "name": "workspace_id",
      "dataType": ["text"],
      "description": "Identifiant du workspace (filtrage multi-tenant)"
    },
    {
      "name": "company_id",
      "dataType": ["text"],
      "description": "Reference vers target_companies.id dans PostgreSQL"
    },
    {
      "name": "name",
      "dataType": ["text"],
      "description": "Nom de l'entreprise"
    },
    {
      "name": "description",
      "dataType": ["text"],
      "description": "Description synthetique de l'entreprise (generee par LLM)"
    },
    {
      "name": "sector",
      "dataType": ["text"],
      "description": "Secteur d'activite"
    },
    {
      "name": "technologies",
      "dataType": ["text[]"],
      "description": "Liste des technologies detectees"
    },
    {
      "name": "signals_summary",
      "dataType": ["text"],
      "description": "Resume des signaux de marche recents"
    },
    {
      "name": "analysis_summary",
      "dataType": ["text"],
      "description": "Resume de l'analyse strategique"
    },
    {
      "name": "icp_score",
      "dataType": ["number"],
      "description": "Score de compatibilite ICP (0-100)"
    },
    {
      "name": "enriched_at",
      "dataType": ["date"],
      "description": "Date de derniere mise a jour de l'embedding"
    }
  ]
}"""))
    E.append(sp(6))

    E.append(h2("5.2 Dimensions vectorielles et modele"))
    E.append(tbl([
        [TH('Parametre'), TH('Valeur'), TH('Justification')],
        [TD('Modele d\'embedding'), TD('text-embedding-3-small (OpenAI)'), TD('Bon compromis performance/cout pour texte d\'entreprise')],
        [TD('Dimensions'), TD('1536'), TD('Dimensionnalite native du modele')],
        [TD('Metrique de distance'), TD('cosine'), TD('Standard pour les embeddings semantiques')],
        [TD('Taille vecteur'), TD('~6 Ko par vecteur'), TD('Stockage optimal pour millions d\'entreprises')],
        [TD('Index vectoriel'), TD('HNSW'), TD('Recherche approximative haute performance (recall > 95%)')],
        [TD('ef_construction'), TD('128'), TD('Equilibre precision/construction')],
        [TD('max_connections'), TD('64'), TD('Optimise pour les requetes multi-tenant')],
    ], [130, 170, 160]))
    E.append(sp(6))

    E.append(h2("5.3 Recherche hybride (BM25 + vector)"))
    E.extend(code_block("""// Exemple de requete hybride dans Weaviate
// Combine recherche lexicale (BM25) et recherche semantique (vectorielle)
// avec filtrage par workspace (multi-tenant)

{
  "hybrid": {
    "query": "entreprise SaaS B2B AI croissance rapide Europe",
    "alpha": 0.7,
    "vector": null,
    "fusionType": "relativeScoreFusion"
  },
  "where": {
    "operator": "And",
    "operands": [
      {
        "path": ["workspace_id"],
        "operator": "Equal",
        "valueText": "a1b2c3d4-..."
      },
      {
        "path": ["icp_score"],
        "operator": "GreaterThanEqual",
        "valueNumber": 50
      }
    ]
  },
  "limit": 20,
  "offset": 0
}

// alpha = 0.0 => pure BM25 (lexicale)
// alpha = 1.0 => pure vectorielle (semantique)
// alpha = 0.7 => 70% semantique + 30% lexicale (recommande pour M&A)"""))
    E.append(PageBreak())
    return E


# ===== SECTION 6: MIGRATIONS ALEMBIC =====
def sec_migrations():
    E = []
    E.append(h1("6. Migrations Alembic"))
    E.append(hr())

    E.append(h2("6.1 Strategie de numerotation des migrations"))
    E.append(p(
        "DealScope utilise Alembic avec une strategie de numerotation sequentielle a 3 chiffres. Chaque migration "
        "est un fichier unique avec un prefixe numerique incrementale et un descriptif explicite. Les migrations "
        "sont stockees dans le repertoire <font face='DejaVuSansMono' size=8>alembic/versions/</font> et sont "
        "gerees par la commande <font face='DejaVuSansMono' size=8>alembic upgrade head</font>."
    ))
    E.extend(code_block("""# Convention de nommage des fichiers de migration
# {revision_id}_{description_descriptive}.py
# Exemple : 001_create_initial_schema.py

# Configuration alembic.ini
[alembic]
script_location = alembic
sqlalchemy.url = postgresql://app_user:xxx@db:5432/dealscope

# Configuration env.py
# - Revision ID auto-generee (12 caracteres hex)
# - Chaque revision stocke 'down_revision' pointant vers la precedente
# - 'head' est toujours la derniere revision"""))
    E.append(sp(6))

    E.append(h2("6.2 Liste ordonnee des 15 migrations"))
    E.append(tbl([
        [TH('#'), TH('Fichier'), TH('Description'), TH('Dependance')],
        [TD('001', True), TD('create_initial_schema'), TD('Tables workspaces, users, types enum'), TD('-')],
        [TD('002', True), TD('create_icp_profiles'), TD('Table icp_profiles + index JSONB'), TD('001')],
        [TD('003', True), TD('create_target_companies'), TD('Table target_companies + index composites'), TD('002')],
        [TD('004', True), TD('create_company_signals'), TD('Table company_signals + index type/date'), TD('003')],
        [TD('005', True), TD('create_contacts'), TD('Table contacts + index email/name'), TD('003')],
        [TD('006', True), TD('create_osint_profiles'), TD('Table osint_profiles + index raw_data'), TD('003')],
        [TD('007', True), TD('create_analysis_reports'), TD('Table analysis_reports + index fit_score'), TD('003')],
        [TD('008', True), TD('create_email_tables'), TD('Tables email_sequences + email_sends'), TD('001, 005')],
        [TD('009', True), TD('create_pipeline_stages'), TD('Table pipeline_stages + index stage'), TD('001, 003')],
        [TD('010', True), TD('create_scan_executions'), TD('Table scan_executions + index status'), TD('001, 002')],
        [TD('011', True), TD('create_audit_logs'), TD('Table audit_logs + index GIN changes'), TD('001')],
        [TD('012', True), TD('create_api_keys'), TD('Table api_keys + index key_hash unique'), TD('001')],
        [TD('013', True), TD('create_data_retention'), TD('Table data_retention_policies'), TD('001')],
        [TD('014', True), TD('enable_rls_policies'), TD('Activation RLS + creation 52 politiques'), TD('001-013')],
        [TD('015', True), TD('add_fulltext_indexes'), TD('Colonnes tsvector + index GIN FTS'), TD('003, 004, 005')],
    ], [30, 120, 200, 100]))
    E.append(sp(6))

    E.append(h2("6.3 Strategie de rollback"))
    E.append(p(
        "Chaque migration Alembic dispose d'une fonction <font face='DejaVuSansMono' size=8>downgrade()</font> "
        "qui effectue les operations inverses de <font face='DejaVuSansMono' size=8>upgrade()</font>. Les rollbacks "
        "suivent le principe de la revertibility : suppression des index, des contraintes, puis des tables dans l'ordre "
        "inverse de la creation. Pour les migrations destructives (donnees non reversibles), un backup est "
        "systematiquement effectue avant l'execution."
    ))
    E.append(p(
        "Les commandes de gestion sont : <font face='DejaVuSansMono' size=8>alembic downgrade -1</font> (une version "
        "en arriere), <font face='DejaVuSansMono' size=8>alembic downgrade base</font> (retour a l'etat initial), "
        "et <font face='DejaVuSansMono' size=8>alembic history</font> (historique des versions). En production, "
        "les rollbacks sont encadres par un processus d'approbation et un backup prealable."
    ))
    E.append(sp(6))

    E.append(h2("6.4 Scripts de donnees de test (seed)"))
    E.extend(code_block("""# alembic/seed_data.py
# Execute apres alembic upgrade head pour peupler la base de donnees

from datetime import datetime, timezone
import uuid

SEED_WORKSPACES = [
    {
        "id": uuid.uuid4(),
        "name": "DealCorp Partners",
        "slug": "dealcorp-partners",
        "plan": "ENTERPRISE",
        "settings": {
            "default_currency": "EUR",
            "default_language": "fr",
            "notifications": {
                "email_alerts": True,
                "signal_alerts": True
            }
        }
    }
]

SEED_ICP_PROFILES = [
    {
        "name": "SaaS B2B Europe",
        "criteria": {
            "industries": ["SaaS", "Software"],
            "revenue_min": 5000000,
            "revenue_max": 100000000,
            "geographies": ["France", "Germany", "UK"],
            "technologies": ["AWS", "React", "Python"],
            "maturity_stage": "GROWTH"
        },
        "weights": {
            "industry_match": 0.25,
            "revenue_fit": 0.20,
            "geographic_fit": 0.15,
            "technology_stack": 0.15,
            "growth_rate": 0.15,
            "team_quality": 0.10
        },
        "is_default": True
    }
]"""))
    E.append(sp(4))

    E.append(h2("6.5 Exemple de code DDL de migration"))
    E.extend(code_block("""# alembic/versions/001_create_initial_schema.py
\"\"\"Create initial schema: workspaces, users, enum types

Revision ID: a1b2c3d4e5f6
Revises: None
Create Date: 2026-01-15 10:00:00.000000
\"\"\"

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision = 'a1b2c3d4e5f6'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Types enumeres
    user_role_enum = postgresql.ENUM(
        'OWNER', 'ADMIN', 'MEMBER', 'VIEWER',
        name='user_role', create_type=False
    )
    user_role_enum.create(op.get_bind(), checkfirst=True)

    subscription_plan_enum = postgresql.ENUM(
        'STARTER', 'PROFESSIONAL', 'BUSINESS', 'ENTERPRISE',
        name='subscription_plan', create_type=False
    )
    subscription_plan_enum.create(op.get_bind(), checkfirst=True)

    # 2. Table workspaces
    op.create_table(
        'workspaces',
        sa.Column('id', postgresql.UUID(),
                  primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('slug', sa.String(100), nullable=False, unique=True),
        sa.Column('plan', subscription_plan_enum, nullable=False,
                  server_default='STARTER'),
        sa.Column('settings', postgresql.JSONB(), nullable=False,
                  server_default='{}'),
        sa.Column('stripe_customer_id', sa.String(255)),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True),
                  nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=True),
                  nullable=False, server_default=sa.text('now()')),
    )

    # 3. Table users
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(),
                  primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('workspace_id', postgresql.UUID(),
                  sa.ForeignKey('workspaces.id', ondelete='CASCADE'),
                  nullable=False),
        sa.Column('email', sa.String(320), nullable=False),
        sa.Column('first_name', sa.String(100), nullable=False),
        sa.Column('last_name', sa.String(100), nullable=False),
        sa.Column('role', user_role_enum, nullable=False,
                  server_default='MEMBER'),
        sa.Column('auth_provider_id', sa.String(255)),
        sa.Column('last_login', sa.TIMESTAMP(timezone=True)),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True),
                  nullable=False, server_default=sa.text('now()')),
    )
    op.create_index('idx_users_workspace_email',
                    'users', ['workspace_id', 'email'], unique=True)

    # 4. Trigger updated_at
    op.execute(\"\"\"
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = now();
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    \"\"\")
    op.execute(\"\"\"
        CREATE TRIGGER tr_workspaces_updated_at
        BEFORE UPDATE ON workspaces
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    \"\"\")


def downgrade() -> None:
    op.drop_index('idx_users_workspace_email', table_name='users')
    op.drop_table('users')
    op.drop_table('workspaces')
    postgresql.ENUM(name='user_role').drop(op.get_bind(), checkfirst=True)
    postgresql.ENUM(name='subscription_plan').drop(op.get_bind(), checkfirst=True)"""))
    E.append(PageBreak())
    return E


# ===== SECTION 7: BACKUP & RESTORATION =====
def sec_backup():
    E = []
    E.append(h1("7. Strategie de Backup &amp; Restoration"))
    E.append(hr())

    E.append(h2("7.1 PostgreSQL : pg_dump, archivage WAL, PITR"))
    E.append(p(
        "La strategie de sauvegarde PostgreSQL combine trois mecanismes complementaires pour assurer une "
        "protection complete des donnees avec une capacite de restauration a un instant donne (PITR)."
    ))
    E.append(tbl([
        [TH('Mecanisme'), TH('Frequence'), TH('Retention'), TH('Description')],
        [TD('pg_dump (complet)'), TD('Quotidien a 02h00'), TD('30 jours'), TD('Dump logique complet, restoration flexible')],
        [TD('pg_dump (schema seul)'), TD('Avant chaque migration'), TD('Illimitee'), TD('Backup du schema DDL pour rollback de migration')],
        [TD('Archivage WAL continu'), TD('Continu (streaming replication)'), TD('7 jours'), TD('Fichiers WAL pour Point-in-Time Recovery')],
        [TD('Base backup (pg_basebackup)'), TD('Hebdomadaire'), TD('4 semaines'), TD('Snapshot physique complet de l\'instance')],
    ], [120, 110, 70, 160]))
    E.append(sp(4))
    E.extend(code_block("""# Script de backup quotidien (cron)
#!/bin/bash
BACKUP_DIR="/backups/postgresql/daily"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Dump logique complet
pg_dump -Fc dealscope > ${BACKUP_DIR}/dealscope_${DATE}.dump

# Purge des anciens backups
find ${BACKUP_DIR} -name "*.dump" -mtime +${RETENTION_DAYS} -delete

# Configuration WAL archivage (postgresql.conf)
wal_level = replica
archive_mode = on
archive_command = 'cp %p /backups/postgresql/wal/%f'
archive_timeout = '5min'"""))
    E.append(sp(6))

    E.append(h2("7.2 Neo4j : procedure de backup"))
    E.extend(code_block("""# Neo4j backup via neo4j-admin
# Backup complet de la base de donnees graphe

neo4j-admin database dump dealscope_graph \
  --to-path=/backups/neo4j/ \
  --overwrite-destination

# Restoration
neo4j-admin database load dealscope_graph \
  --from-path=/backups/neo4j/ \
  --overwrite-destination

# Pour les clusters Neo4j (Causal Clustering),
# utiliser les snapshots du cloud provider ou
# l'API de backup Neo4j AuraDB"""))
    E.append(sp(4))

    E.append(h2("7.3 Redis : snapshots RDB"))
    E.extend(code_block("""# Configuration Redis (redis.conf)
# Snapshots RDB automatiques
save 900 1       # Sauvegarde si 1 ecriture en 15 min
save 300 10      # Sauvegarde si 10 ecritures en 5 min
save 60 10000    # Sauvegarde si 10 000 ecritures en 1 min

# Replication (maitre-esclave pour haute dispo)
replicaof redis-master 6379

# AOF (Append-Only File) pour durabilite maximale
appendonly yes
appendfsync everysec

# Backup manuel
redis-cli BGSAVE
# Fichier genere : /var/lib/redis/dump.rdb"""))
    E.append(sp(4))

    E.append(h2("7.4 Weaviate : backup"))
    E.append(p(
        "Weaviate supporte les backups via son API REST. Les embeddings vectoriels et les metadonnees "
        "sont serialises au format binaire et stockes dans un bucket S3 compatible. La restauration "
        "se fait via l'endpoint dedie de l'API."
    ))
    E.extend(code_block("""# Backup Weaviate via API
curl -X POST "http://weaviate:8080/v1/backups/s3/dealscope" \\
  -H "Content-Type: application/json" \\
  -d '{
    "id": "backup_20260315",
    "bucket": "dealscope-backups",
    "path": "weaviate/",
    "storage": "s3"
  }'

# Restauration
curl -X POST "http://weaviate:8080/v1/backups/s3/dealscope/restore" \\
  -H "Content-Type: application/json" \\
  -d '{"backupId": "backup_20260315"}'"""))
    E.append(sp(4))

    E.append(h2("7.5 Objectifs RTO/RPO"))
    E.append(tbl([
        [TH('Composant'), TH('RTO'), TH('RPO'), TH('Strategie')],
        [TD('PostgreSQL'), TD('< 1 heure'), TD('< 5 minutes'), TD('WAL continu + PITR')],
        [TD('Neo4j'), TD('< 2 heures'), TD('< 24 heures'), TD('Backup quotidien + replication')],
        [TD('Redis'), TD('< 5 minutes'), TD('< 1 minute'), TD('Replication maitre-esclave + AOF')],
        [TD('Weaviate'), TD('< 2 heures'), TD('< 24 heures'), TD('Backup quotidien S3 + re-indexation')],
    ], [100, 90, 90, 180]))
    E.append(note_box(
        "<b>RTO</b> (Recovery Time Objective) = duree maximale d'indisponite acceptable. "
        "<b>RPO</b> (Recovery Point Objective) = perte de donnees maximale acceptable en temps."
    ))
    E.append(PageBreak())
    return E


# ===== SECTION 8: FULL-TEXT SEARCH =====
def sec_fts():
    E = []
    E.append(h1("8. Index Full-Text Search"))
    E.append(hr())

    E.append(h2("8.1 Colonnes tsvector"))
    E.append(p(
        "DealScope utilise les colonnes <font face='DejaVuSansMono' size=8>tsvector</font> de PostgreSQL "
        "pour la recherche textuelle avancee sur les noms d'entreprises, les descriptions et les signaux. "
        "Les colonnes tsvector sont maintenues a jour via des triggers automatiques qui les reindexent "
        "a chaque insertion ou modification des donnees sources."
    ))
    E.extend(code_block("""-- Colonne tsvector pour la recherche sur les entreprises
ALTER TABLE target_companies ADD COLUMN search_vector tsvector;

-- Trigger de mise a jour automatique du tsvector
CREATE OR REPLACE FUNCTION update_company_search_vector()
RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('french', coalesce(NEW.name, '')), 'A') ||
    setweight(to_tsvector('french', coalesce(NEW.legal_name, '')), 'A') ||
    setweight(to_tsvector('french', coalesce(NEW.sector, '')), 'B') ||
    setweight(to_tsvector('french', coalesce(NEW.size_range, '')), 'C') ||
    setweight(to_tsvector('french', coalesce(NEW.notes, '')), 'D');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_company_search_vector
  BEFORE INSERT OR UPDATE ON target_companies
  FOR EACH ROW EXECUTE FUNCTION update_company_search_vector();

-- Colonne tsvector pour les signaux de marche
ALTER TABLE company_signals ADD COLUMN search_vector tsvector;

CREATE OR REPLACE FUNCTION update_signal_search_vector()
RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('french', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('french', coalesce(NEW.description, '')), 'B') ||
    setweight(to_tsvector('french', coalesce(NEW.source_name, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_signal_search_vector
  BEFORE INSERT OR UPDATE ON company_signals
  FOR EACH ROW EXECUTE FUNCTION update_signal_search_vector();

-- Colonne tsvector pour les contacts
ALTER TABLE contacts ADD COLUMN search_vector tsvector;

CREATE OR REPLACE FUNCTION update_contact_search_vector()
RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('french', coalesce(NEW.first_name, '')), 'A') ||
    setweight(to_tsvector('french', coalesce(NEW.last_name, '')), 'A') ||
    setweight(to_tsvector('french', coalesce(NEW.role, '')), 'B') ||
    setweight(to_tsvector('french', coalesce(NEW.seniority, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_contact_search_vector
  BEFORE INSERT OR UPDATE ON contacts
  FOR EACH ROW EXECUTE FUNCTION update_contact_search_vector();"""))
    E.append(sp(6))

    E.append(h2("8.2 Dictionnaires francais/anglais"))
    E.append(p(
        "DealScope utilise les configurations de recherche textuelle de PostgreSQL pour supporter "
        "les requetes en francais et en anglais. Le dictionnaire francais est le dictionnaire par defaut, "
        "et le dictionnaire anglais est utilise pour les sources OSINT en anglais."
    ))
    E.extend(code_block("""-- Configuration FTS multilingue
-- Par defaut, la recherche est en francais
-- Pour les sources anglophones, un dictionnaire anglais est disponible

-- Recherche en francais (defaut)
SELECT * FROM target_companies
WHERE search_vector @@ plainto_tsquery('french', 'intelligence artificielle SaaS')
ORDER BY ts_rank(search_vector, plainto_tsquery('french', 'intelligence artificielle SaaS')) DESC;

-- Recherche en anglais
SELECT * FROM company_signals
WHERE search_vector @@ plainto_tsquery('english', 'artificial intelligence funding round')
ORDER BY ts_rank(search_vector, plainto_tsquery('english', 'artificial intelligence funding round')) DESC;

-- Recherche bilingue (union des deux dictionnaires)
SELECT * FROM target_companies
WHERE search_vector @@ plainto_tsquery('french', 'intelligence artificielle')
   OR search_vector @@ plainto_tsquery('english', 'artificial intelligence');"""))
    E.append(sp(6))

    E.append(h2("8.3 Index GIN pour Full-Text Search"))
    E.extend(code_block("""-- Index GIN pour la recherche textuelle (performance optimale)
-- Utilise le parametre fastupdate pour accelerer les insertions

-- Index principal sur target_companies
CREATE INDEX idx_tc_search_gin ON target_companies
  USING GIN (search_vector)
  WITH (fastupdate = on, gin_pending_list_limit = 4096);

-- Index principal sur company_signals
CREATE INDEX idx_signals_search_gin ON company_signals
  USING GIN (search_vector)
  WITH (fastupdate = on, gin_pending_list_limit = 4096);

-- Index principal sur contacts
CREATE INDEX idx_contacts_search_gin ON contacts
  USING GIN (search_vector)
  WITH (fastupdate = on, gin_pending_list_limit = 4096);

-- Exemples de requetes avec ponderation (ranking)
-- Recherche avec ranking par pertinence
SELECT
  id,
  name,
  sector,
  ts_rank(search_vector, query) AS rank
FROM target_companies, plainto_tsquery('french', $search_terms) query
WHERE search_vector @@ query
ORDER BY rank DESC
LIMIT 20;

-- Recherche avec highlight des termes correspondants
SELECT
  id,
  name,
  ts_headline('french', notes, plainto_tsquery('french', $search_terms),
    'StartSel=<mark>, StopSel=</mark>, MaxWords=50, MinWords=25')
  AS highlighted_notes
FROM target_companies
WHERE search_vector @@ plainto_tsquery('french', $search_terms)
ORDER BY ts_rank(search_vector, plainto_tsquery('french', $search_terms)) DESC;"""))
    E.append(sp(6))
    E.append(note_box(
        "<b>Performance</b> : Les index GIN avec fastupdate permettent des insertions rapides en accumulant "
        "les mises a jour dans une liste pending. Le parametre gin_pending_list_limit definit la taille "
        "de cette liste (4 Ko par defaut, ajustable selon le ratio lecture/ecriture). Pour les workspaces "
        "avec de forts volumes d'insertion (scans massifs), un VACUUM ANALYZE periodique est recommande "
        "pour maintenir la performance des index GIN."
    ))
    return E


# ===== BUILD DOCUMENT =====
def build():
    elements = []
    elements.extend(cover())
    elements.extend(toc())
    elements.extend(sec_intro())
    elements.extend(sec_multitenant())
    elements.extend(sec_postgresql())
    elements.extend(sec_neo4j())
    elements.extend(sec_weaviate())
    elements.extend(sec_migrations())
    elements.extend(sec_backup())
    elements.extend(sec_fts())

    doc = SimpleDocTemplate(
        OUT,
        pagesize=A4,
        topMargin=0.75*inch,
        bottomMargin=0.75*inch,
        leftMargin=0.85*inch,
        rightMargin=0.85*inch,
        title="DealScope_Modele_Donnees_ERD",
        author="Z.ai",
        creator="Z.ai",
    )
    doc.build(elements, onFirstPage=footer, onLaterPages=footer)
    print(f"PDF generated: {OUT}")


if __name__ == '__main__':
    build()
