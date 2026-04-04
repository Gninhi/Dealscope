#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""DealScope GraphQL API Specs PDF Generator - v2"""

import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle, HRFlowable
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

# ===== OUTPUT =====
OUT = '/home/z/my-project/download/DealScope_Specifications_API_GraphQL.pdf'

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
S_NOTE = ParagraphStyle('Note', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=9.5, leading=13, textColor=colors.HexColor('#336699'), leftIndent=15, spaceAfter=8, backColor=colors.HexColor('#F0F6FF'), borderPadding=6)


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


def code(text, max_lines=32):
    """Create formatted code block, auto-splitting if too large."""
    lines = text.strip().split('\n')
    parts = []
    for i in range(0, len(lines), max_lines):
        chunk = lines[i:i+max_lines]
        fmt = '<br/>'.join(
            ln.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;').replace(' ', '&nbsp;')
            for ln in chunk
        )
        pp = Paragraph(fmt, S_CODE)
        tt = Table([[pp]], colWidths=[460])
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
    """Create styled table."""
    t = Table(data, colWidths=widths, repeatRows=1)
    cmds = [
        ('BACKGROUND', (0, 0), (-1, 0), C_TH),
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


# ===== PAGE FOOTER =====
def footer(canvas, doc):
    canvas.saveState()
    canvas.setFont('TimesNewRoman', 9)
    canvas.setFillColor(C_GRAY)
    canvas.drawCentredString(A4[0]/2, 0.5*inch, "DealScope - Specifications API GraphQL  |  Page %d" % doc.page)
    canvas.setStrokeColor(C_LIGHT)
    canvas.setLineWidth(0.5)
    canvas.line(1.0*inch, A4[1]-0.65*inch, A4[0]-1.0*inch, A4[1]-0.65*inch)
    canvas.restoreState()


# ===== COVER PAGE =====
def cover():
    E = []
    E.append(Spacer(1, 100))
    E.append(HRFlowable(width="60%", color=C_DARK, thickness=3, spaceBefore=0, spaceAfter=20))
    E.append(Paragraph("DealScope", ParagraphStyle('CB', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=40, leading=48, textColor=C_GOLD, alignment=TA_CENTER, spaceAfter=6)))
    E.append(sp(15))
    E.append(Paragraph("Specifications API GraphQL", ParagraphStyle('CT', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=32, leading=40, textColor=C_DARK, alignment=TA_CENTER, spaceAfter=10)))
    E.append(sp(12))
    E.append(HRFlowable(width="40%", color=C_MED, thickness=1.5, spaceBefore=10, spaceAfter=20))
    E.append(Paragraph("Plateforme SaaS M&amp;A Intelligence Multi-Agents IA", ParagraphStyle('CS', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=16, leading=22, textColor=C_GRAY, alignment=TA_CENTER, spaceAfter=6)))
    E.append(sp(40))
    E.append(Paragraph("Version 1.0 - Mars 2026", ParagraphStyle('CI', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=12, leading=18, textColor=C_TEXT, alignment=TA_CENTER, spaceAfter=4)))
    E.append(sp(8))
    E.append(Paragraph("Z.ai - Equipe Technique", ParagraphStyle('CI2', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=12, leading=18, textColor=C_TEXT, alignment=TA_CENTER, spaceAfter=4)))
    E.append(sp(30))
    E.append(HRFlowable(width="60%", color=C_DARK, thickness=3, spaceBefore=20, spaceAfter=20))
    E.append(sp(40))
    E.append(Paragraph("CONFIDENTIEL - Document interne a usage exclusif de l'equipe technique DealScope.", ParagraphStyle('Conf', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=9, leading=12, textColor=C_GRAY, alignment=TA_CENTER)))
    E.append(PageBreak())
    return E


# ===== TOC =====
def toc():
    E = []
    S_TITLE = ParagraphStyle('TT', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=20, leading=26, textColor=C_DARK, spaceAfter=20)
    S_H1 = ParagraphStyle('TH1', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=11, leading=20, textColor=C_DARK)
    S_H2 = ParagraphStyle('TH2', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=10, leading=18, textColor=C_TEXT, leftIndent=20)
    S_DOT = ParagraphStyle('TDOT', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=7, leading=20, textColor=colors.HexColor('#888888'))
    S_PN = ParagraphStyle('TPN', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=11, leading=20, textColor=C_TEXT, alignment=TA_RIGHT)

    E.append(Paragraph("Table des matieres", S_TITLE))
    E.append(HRFlowable(width="100%", color=C_DARK, thickness=1.5, spaceBefore=4, spaceAfter=14))

    entries = [
        ("1. Introduction", "1", 0),
        ("2. Authentification &amp; Autorisation", "2", 0),
        ("3. Schema GraphQL Complet", "3", 0),
        ("4. Gestion des erreurs &amp; Format de reponse", "4", 0),
        ("5. Strategie de pagination", "5", 0),
        ("6. Politique de limitation de debit", "6", 0),
        ("7. Exemples d'utilisation de l'API", "7", 0),
        ("8. Webhooks &amp; Integrations", "8", 0),
        ("9. Considerations de securite", "9", 0),
        ("10. Annexe : Endpoints &amp; Configuration", "10", 0),
    ]
    sub_entries = [
        ("1.1 Objectif du document", 1),
        ("1.2 Pourquoi GraphQL", 1),
        ("1.3 Principes de conception", 1),
        ("1.4 Strategie de versionnage", 1),
        ("2.1 Flux d'authentification JWT / Clerk.dev", 2),
        ("2.2 Strategie de renouvellement des tokens", 2),
        ("2.3 Isolation multi-tenant par RLS", 2),
        ("2.4 Limitation de debit par endpoint et par plan", 2),
        ("2.5 Gestion des cles API pour Enterprise", 2),
        ("3.1 Enumerations", 3),
        ("3.2 Types principaux", 3),
        ("3.3 Types d'entree (Input)", 3),
        ("3.4 Types de pagination", 3),
        ("3.5 Requetes (Queries)", 3),
        ("3.6 Mutations", 3),
        ("3.7 Subscriptions (Temps reel)", 3),
        ("4.1 Format de reponse standard", 4),
        ("4.2 Codes d'erreur", 4),
        ("4.3 Extensions d'erreur GraphQL", 4),
        ("4.4 Strategies de reprise (Retry)", 4),
        ("5.1 Implementation cursor-based", 5),
        ("6.1 Limites par plan de souscription", 6),
        ("6.2 Headers de limitation de debit", 6),
        ("6.3 Analyse de complexite GraphQL", 6),
        ("7.1 Requete complete avec filtrage et pagination", 7),
        ("7.2 Mutation : lancement d'un scan d'agents IA", 7),
        ("7.3 Subscription WebSocket : suivi de scan", 7),
        ("7.4 Requete graphe de connaissances", 7),
        ("7.5 Exemple de reponse d'erreur", 7),
        ("8.1 Webhooks de synchronisation CRM", 8),
        ("8.2 Webhooks de notification d'alertes", 8),
        ("9.1 Limitation de la profondeur de requete", 9),
        ("9.2 Analyse de complexite des requetes", 9),
        ("9.3 Protection anti-DDoS", 9),
        ("9.4 Protection des donnees sensibles", 9),
        ("10.1 Endpoints de l'API", 10),
        ("10.2 Stack technologique", 10),
        ("10.3 Variables d'environnement", 10),
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


# ===== SECTION 1: INTRODUCTION =====
def sec_intro():
    E = []
    E.append(h1("1. Introduction"))
    E.append(hr())

    E.append(h2("1.1 Objectif du document"))
    E.append(p(
        "Le present document constitue la reference technique complete pour l'API GraphQL de la plateforme DealScope. "
        "Il detaille l'ensemble des types, requetes, mutations et subscriptions disponibles, ainsi que les mecanismes "
        "d'authentification, de gestion des erreurs, de pagination et de limitation de debit. Ce document s'adresse aux "
        "developpeurs front-end et back-end, aux architectes logiciels et aux equipes d'integration chargees de connecter "
        "DealScope aux systemes tiers (CRM, outils d'analytics, plateformes d'emailing). Il servira egalement de base "
        "pour la generation automatique de clients GraphQL types (TypeScript, Python, Go) et la documentation interactive "
        "via GraphQL Playground ou Apollo Explorer."
    ))
    E.append(sp(4))

    E.append(h2("1.2 Pourquoi GraphQL"))
    E.append(p(
        "DealScope utilise GraphQL comme protocole d'API principal pour plusieurs raisons fondamentales. Premierement, "
        "GraphQL permet aux clients de requeter exactement les donnees dont ils ont besoin, evitant le sur-requete "
        "(over-fetching) et le sous-requete (under-fetching) inherents aux API REST. Pour une application manipulant "
        "des profils d'entreprises complexes avec des dizaines de champs, des relations imbriquees (contacts, signaux, "
        "rapports d'analyse, graphes de connaissances), cette capacite est determinante pour les performances."
    ))
    E.append(p(
        "Deuxiemement, le systeme de types fort de GraphQL fournit un contrat explicite entre le client et le serveur, "
        "facilitant la validation des donnees, la generation de code et la documentation automatique. Troisiemement, les "
        "subscriptions GraphQL permettent une communication temps reel bidirectionnelle via WebSockets, essentielle pour "
        "les notifications de scan d'agents IA, les alertes de signaux de marche et les mises a jour de pipeline. "
        "Enfin, GraphQL s'integre naturellement avec notre architecture de microservices et notre orchestrateur "
        "LangGraph, permettant de federer les donnees depuis PostgreSQL, Neo4j, Weaviate et Redis en une interface unifiee."
    ))
    E.append(sp(4))

    E.append(h2("1.3 Principes de conception"))
    E.append(bul("<b>Schema-first</b> : Le schema GraphQL est la source de verite. Toute evolution de l'API passe par une modification validee par un processus de revue."))
    E.append(bul("<b>Cursor-based pagination</b> : Toutes les listes utilisent la pagination basee sur des curseurs pour garantir la coherence et les performances."))
    E.append(bul("<b>Multi-tenancy par RLS</b> : L'isolation des donnees est assuree par PostgreSQL Row Level Security, chaque requete etant automatiquement scopee au workspace courant."))
    E.append(bul("<b>Versioning semantique</b> : L'API suit le versionnage SemVer. Les changements breaking sont versions, les ajouts non-breaking integres dans la version courante."))
    E.append(bul("<b>Performance-oriented</b> : Utilisation de DataLoader pour le N+1, cache Redis pour les requetes frequentes, et analyse de complexite pour prevenir les requetes abusives."))
    E.append(sp(4))

    E.append(h2("1.4 Strategie de versionnage"))
    E.append(p(
        "La strategie de versionnage repose sur SemVer applique au schema. La version actuelle est v1.x.y. "
        "L'ajout de nouveaux types, champs ou requetes est un changement mineur (incrementation MINOR). La deprecation "
        "d'un champ est signalee par la directive @deprecated(reason) sans rupture immediate. La suppression effective "
        "d'un champ constitue un changement majeur (incrementation MAJOR) et necessite une nouvelle version du schema "
        "accessible via un endpoint dedie (/graphql/v2). Les clients sont informes des deprecations via les introspection "
        "queries et le changelog publie sur le portail developpeur. Une periode de grace minimale de 6 mois est respectee "
        "entre la deprecation et la suppression effective."
    ))
    E.append(PageBreak())
    return E


# ===== SECTION 2: AUTH =====
def sec_auth():
    E = []
    E.append(h1("2. Authentification &amp; Autorisation"))
    E.append(hr())

    E.append(h2("2.1 Flux d'authentification JWT / Clerk.dev"))
    E.append(p(
        "DealScope s'appuie sur Clerk.dev comme fournisseur d'identite (IdP) pour la gestion complete du cycle de vie "
        "des utilisateurs : inscription, connexion, reinitialisation de mot de passe, authentification multi-facteurs (MFA) "
        "et gestion des sessions. Le flux d'authentification fonctionne comme suit : lors de la connexion, Clerk emet un "
        "JWT (JSON Web Token) signe contenant les claims standards (sub, email, name) ainsi que des claims personnalises "
        "incluant le workspace_id courant et le role de l'utilisateur (admin, member, viewer). Ce JWT est transmis dans "
        "le header Authorization sous la forme 'Bearer {token}' a chaque requete GraphQL."
    ))
    E.append(p(
        "Le backend FastAPI valide le JWT a chaque requete via un middleware dedie. La validation inclut la verification "
        "de la signature (cle publique Clerk), la verification de l'expiration (exp claim), et l'extraction du workspace_id "
        "pour le scope multi-tenant. Le token a une duree de vie courte (15 minutes) pour limiter les risques en cas de "
        "compromission. Le claim 'org_id' est utilise comme identifiant de workspace, permettant a la couche de base de "
        "donnees d'appliquer automatiquement les politiques RLS de PostgreSQL 16."
    ))
    E.extend(code(
        "POST /graphql\n"
        "Headers:\n"
        "  Authorization: Bearer eyJhbGciOiJIUzI1NiIs...\n"
        "  Content-Type: application/json\n\n"
        'Body:\n'
        '  {"query": "{ me { id email workspace { id name plan } } }"}'
    ))
    E.append(sp(4))

    E.append(h2("2.2 Strategie de renouvellement des tokens"))
    E.append(p(
        "Pour maintenir une experience utilisateur fluide sans interruption de session, DealScope implemente un mecanisme "
        "de renouvellement automatique des tokens via des refresh tokens. Le refresh token est un JWT longue duree (7 jours) "
        "stocke de maniere securisee en cookie HTTP-only avec les attributs Secure, SameSite=Strict et un prefixe __Host-. "
        "Lorsque le token d'acces expire, le client peut utiliser le refresh token pour obtenir un nouveau token d'acces "
        "sans intervention de l'utilisateur. Ce mecanisme est transparent pour l'utilisateur et gere soit par le SDK Clerk "
        "cote client, soit par une mutation GraphQL dediee 'refreshToken' pour les integrations serveur-a-serveur."
    ))
    E.append(p(
        "En cas de compromission suspectee, l'utilisateur peut reveler tous ses refresh tokens depuis son espace personnel, "
        "provoquant l'invalidation immediate de toutes les sessions actives. Clerk gere cette invalidation via une "
        "liste noire (blacklist) des tokens, consultee a chaque validation. De plus, les tokens sont rotatifs : a chaque "
        "utilisation d'un refresh token, un nouveau est emis et l'ancien est invalide, prenant les attaques par rejeu."
    ))
    E.append(sp(4))

    E.append(h2("2.3 Isolation multi-tenant par RLS"))
    E.append(p(
        "L'isolation des donnees entre les workspaces est un fondement architectural de DealScope. PostgreSQL 16 Row Level "
        "Security (RLS) garantit que chaque requete SQL ne retourne que les donnees appartenant au workspace de "
        "l'utilisateur authentifie. Le mecanisme fonctionne comme suit : a chaque connexion, le middleware "
        "d'authentification definit le parametre de session PostgreSQL 'app.current_workspace_id' a partir du JWT. "
        "Les politiques RLS sur chaque table filtrent automatiquement les lignes en fonction de ce parametre."
    ))
    E.append(p(
        "Par exemple, la politique RLS sur la table target_companies est : USING (workspace_id = current_setting('app.current_workspace_id')::uuid). "
        "Cette approche garantit l'isolation au niveau de la base de donnees, ce qui signifie que meme un bug dans la "
        "couche applicative ne peut pas entrainer une fuite de donnees entre workspaces. Les administrateurs de workspace "
        "peuvent creer des projets et des ICP profiles, inviter des membres, et configurer les integrations CRM sans "
        "risque d'interference avec d'autres organisations."
    ))
    E.append(sp(4))

    E.append(h2("2.4 Limitation de debit par endpoint et par plan"))
    E.append(p(
        "DealScope implemente une politique de limitation de debit (rate limiting) a plusieurs niveaux pour proteger "
        "l'infrastructure et assurer une distribution equitable des ressources entre les clients. La limitation est "
        "appliquee par utilisateur, par workspace et par type d'operation (query, mutation, subscription). "
        "Les limites different selon le plan de souscription du workspace, comme detaille dans le tableau ci-dessous. "
        "Les compteurs sont geres via Redis 7 avec le pattern de fenetre glissante (sliding window) pour une precision "
        "optimale. Les headers de reponse incluent les informations de limitation pour adapter le comportement client."
    ))
    E.append(sp(4))
    E.append(tbl([
        [TH('Plan'), TH('Req./min'), TH('Mut./min'), TH('Subs actives'), TH('Complexite max')],
        [TD('Starter', True), TD('60', True), TD('20', True), TD('5', True), TD('200', True)],
        [TD('Professional', True), TD('150', True), TD('50', True), TD('20', True), TD('500', True)],
        [TD('Business', True), TD('300', True), TD('100', True), TD('50', True), TD('1000', True)],
        [TD('Enterprise', True), TD('Illimite', True), TD('Illimite', True), TD('200', True), TD('Perso.', True)],
    ], [90, 90, 90, 100, 90]))
    E.append(sp(4))

    E.append(h2("2.5 Gestion des cles API pour Enterprise"))
    E.append(p(
        "Les clients Enterprise disposent d'un mecanisme supplementaire d'authentification via des cles API. "
        "Ces cles sont generees depuis le tableau de bord administrateur et sont associees a un workspace et a un "
        "ensemble de permissions granulaires (read:companies, write:icp, execute:scans, manage:users). Les cles API "
        "suivent le format 'ds_pk_live_xxxxxxxxxxxxx' et sont stockees en base de donnees sous forme de hash SHA-256. "
        "Elles permettent l'authentification serveur-a-serveur sans necessiter un flux utilisateur interactif. "
        "Chaque cle API peut etre revoquee independamment, et un historique d'utilisation est disponible dans le "
        "tableau de bord. Les cles API sont transmises dans le header 'X-API-Key' a la place du header Authorization."
    ))
    E.append(PageBreak())
    return E


# ===== SECTION 3: GRAPHQL SCHEMA =====
def sec_schema():
    E = []
    E.append(h1("3. Schema GraphQL Complet"))
    E.append(hr())

    # 3.1 Enums
    E.append(h2("3.1 Enumerations"))
    E.append(p(
        "Les enumerations definissent les ensembles de valeurs autorisees pour les champs specifiques du schema. "
        "Elles garantissent la coherence des donnees et facilitent la validation cote client comme cote serveur."
    ))
    E.extend(code("""enum CompanyStatus {
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

enum UserRole { OWNER, ADMIN, MEMBER, VIEWER }

enum ScanStatus { PENDING, RUNNING, COMPLETED, FAILED, CANCELLED }

enum CRMType {
  SALESFORCE, HUBSPOT, PIPEDRIVE, DYNAMICS365
}

enum ExportFormat { CSV, JSON, XLSX, PDF }

enum AgentType {
  CIBLAGE, OSINT, ANALYSE, EMAIL_MATCHING, DATA_MANAGEMENT
}""", max_lines=30))
    E.append(sp(6))

    # 3.2 Core Types
    E.append(h2("3.2 Types principaux"))
    E.extend(code("""type Workspace {
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

type EmployeeRangeInput { min: Int, max: Int }

enum CompanyMaturityStage {
  STARTUP, GROWTH, MATURE, DECLINING
}""", max_lines=30))
    E.extend(code("""type TargetCompany {
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
  C_LEVEL, VP, DIRECTOR, MANAGER, SENIOR, JUNIOR
}""", max_lines=30))
    E.extend(code("""type OSINTProfile {
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

enum Sentiment { POSITIVE, NEUTRAL, NEGATIVE, MIXED }

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
}""", max_lines=30))
    E.extend(code("""type AnalysisReport {
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

type DataPoint { period: String!, value: Float! }

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

enum RiskLevel { LOW, MEDIUM, HIGH, CRITICAL }

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
}""", max_lines=30))
    E.extend(code("""type EmailSequence {
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
}""", max_lines=30))
    E.extend(code("""type KnowledgeGraph {
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
  COMPANY, PERSON, TECHNOLOGY, INDUSTRY,
  EVENT, LOCATION, PRODUCT, INVESTOR
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
}""", max_lines=30))
    E.extend(code("""type WorkspaceSettings {
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

type StatusCount { status: CompanyStatus!, count: Int! }
type StageValue { stage: PipelineStageEnum!, count: Int!, totalValue: Float! }
type TypeCount { type: SignalType!, count: Int! }
type ScanSummary {
  id: ID!, icpProfileName: String!, status: ScanStatus!,
  companiesFound: Int!, startedAt: DateTime!, duration: Int
}
type ICPPerformance {
  icpProfileId: ID!, name: String!, targetCount: Int!,
  qualifiedCount: Int!, conversionRate: Float!
}
type ActivityEvent {
  id: ID!, type: String!, description: String!,
  timestamp: DateTime!, userId: ID!
}""", max_lines=30))
    E.append(sp(6))

    # 3.3 Input Types
    E.append(h2("3.3 Types d'entree (Input)"))
    E.append(p(
        "Les types d'entree definissent la structure des donnees transmises aux mutations GraphQL. "
        "Ils assurent la validation des donnees cote serveur et facilitent la documentation de l'API."
    ))
    E.extend(code("""input CreateWorkspaceInput {
  name: String!
  slug: String!
}

input UpdateWorkspaceInput {
  name: String
  settings: WorkspaceSettingsInput
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
}""", max_lines=30))
    E.extend(code("""input TargetCompanyFilterInput {
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
}""", max_lines=30))
    E.append(sp(6))

    # 3.4 Pagination Types
    E.append(h2("3.4 Types de pagination"))
    E.append(p(
        "DealScope utilise une pagination basee sur des curseurs (cursor-based pagination) pour toutes les requetes "
        "retournant des listes. Cette approche offre plusieurs avantages par rapport a la pagination offset : "
        "elle est performante meme avec de grandes tables car elle utilise des index B-tree, elle reste coherente "
        "lorsque des elements sont ajoutes ou supprimes entre les pages, et elle evite les doublons."
    ))
    E.extend(code("""type PageInfo {
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

type ContactEdge { cursor: String!, node: Contact! }

type SignalConnection {
  edges: [SignalEdge!]!
  pageInfo: PageInfo!
}

type SignalEdge { cursor: String!, node: CompanySignal! }

type WorkspaceConnection {
  edges: [WorkspaceEdge!]!
  pageInfo: PageInfo!
}

type WorkspaceEdge { cursor: String!, node: Workspace! }

type ICPProfileConnection {
  edges: [ICPProfileEdge!]!
  pageInfo: PageInfo!
}

type ICPProfileEdge { cursor: String!, node: ICPProfile! }""", max_lines=30))
    E.append(sp(6))

    # 3.5 Queries
    E.append(h2("3.5 Requetes (Queries)"))
    E.append(p(
        "Les requetes GraphQL permettent de lire et filtrer les donnees de la plateforme. Chaque requete est scopee "
        "au workspace de l'utilisateur authentifie grace aux politiques RLS. Les requetes de liste supportent le filtrage, "
        "le tri et la pagination basee sur les curseurs."
    ))
    E.extend(code("""type Query {
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
  ): SignalConnection!""", max_lines=30))
    E.extend(code("""  # --- Contacts ---
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

  # --- Graphe de connaissances ---
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
  users(first: Int = 50, after: String): [User!]!
}""", max_lines=30))
    E.extend(code("""enum WorkspaceOrderBy {
  CREATED_AT_DESC, CREATED_AT_ASC, NAME_ASC, NAME_DESC
}

enum ICPProfileOrderBy {
  CREATED_AT_DESC, CREATED_AT_ASC, NAME_ASC, NAME_DESC
}

enum TargetCompanyOrderBy {
  MATCHED_AT_DESC, MATCHED_AT_ASC, NAME_ASC, NAME_DESC,
  REVENUE_DESC, REVENUE_ASC, UPDATED_AT_DESC
}

enum AnalyticsPeriod {
  LAST_7_DAYS, LAST_30_DAYS, LAST_90_DAYS,
  LAST_12_MONTHS, YEAR_TO_DATE
}

type SearchCompanyResult {
  company: TargetCompany!
  matchScore: Float!
  matchReasons: [String!]!
}""", max_lines=30))
    E.append(sp(6))

    # 3.6 Mutations
    E.append(h2("3.6 Mutations"))
    E.append(p(
        "Les mutations GraphQL permettent de modifier les donnees de la plateforme. Elles sont validees cote serveur "
        "et retournent les objets modifies. Les mutations sensibles requierent des permissions specifiques."
    ))
    E.extend(code("""type Mutation {
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
  addToPipeline(companyId: ID!, stageId: ID!): TargetCompany!
  removeFromPipeline(companyId: ID!): TargetCompany!
  bulkUpdateStatus(
    companyIds: [ID!]!, status: CompanyStatus!
  ): [TargetCompany!]!

  # --- Sequences email ---
  createEmailSequence(
    input: CreateEmailSequenceInput!
  ): EmailSequence!
  updateEmailSequence(
    input: UpdateEmailSequenceInput!
  ): EmailSequence!
  deleteEmailSequence(id: ID!): Boolean!
  sendEmail(sequenceId: ID!, contactId: ID!): EmailSendResult!

  # --- Export CRM ---
  exportToCRM(input: ExportConfigInput!): ExportResult!

  # --- Utilisateurs ---
  inviteUser(input: InviteUserInput!): User!
  updateUserRole(userId: ID!, role: UserRole!): User!
  removeUser(userId: ID!): Boolean!

  # --- Graphes de connaissances ---
  refreshKnowledgeGraph(companyId: ID!, depth: Int = 2): KnowledgeGraph!

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
}""", max_lines=30))
    E.append(sp(6))

    # 3.7 Subscriptions
    E.append(h2("3.7 Subscriptions (Temps reel)"))
    E.append(p(
        "Les subscriptions GraphQL permettent aux clients de recevoir des mises a jour en temps reel via WebSockets. "
        "DealScope les utilise pour les notifications de progression des scans d'agents IA, les alertes de signaux "
        "et les mises a jour du pipeline. Les subscriptions utilisent le protocol graphql-transport-ws."
    ))
    E.extend(code("""type Subscription {
  # Progression d'un scan d'agents IA
  scanProgress(scanId: ID!): ScanProgressEvent!

  # Nouveaux signaux pour une entreprise
  newSignal(companyId: ID!): CompanySignal!

  # Mises a jour du pipeline
  pipelineUpdates(workspaceId: ID): PipelineUpdateEvent!

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
  ADDED, MOVED, REMOVED, STATUS_CHANGED
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
  INFO, SUCCESS, WARNING, ERROR
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
  QUEUED, GENERATING, COMPLETED, FAILED
}""", max_lines=30))
    E.append(PageBreak())
    return E


# ===== SECTION 4: ERROR HANDLING =====
def sec_errors():
    E = []
    E.append(h1("4. Gestion des erreurs &amp; Format de reponse"))
    E.append(hr())

    E.append(h2("4.1 Format de reponse standard"))
    E.append(p(
        "DealScope retourne les erreurs GraphQL en suivant la specification officielle, enrichie avec des extensions "
        "personnalisees pour fournir des informations contextuelles. Chaque erreur inclut un code machine-readable, "
        "un message humain-readable en francais et en anglais, et des metadonnees de debug en mode developpement. "
        "Le format standard comprend le champ 'errors' avec un tableau d'objets contenant 'message', 'path', "
        "et 'extensions' (code, timestamp, requestId, details). En production, les champs 'details' et 'stack' "
        "sont omis pour la securite. Le 'requestId' permet le tracing distribue."
    ))
    E.extend(code(
        '// Exemple de reponse d\'erreur GraphQL\n'
        '{\n'
        '  "errors": [{\n'
        '    "message": "Ressource non trouvee",\n'
        '    "path": ["targetCompany"],\n'
        '    "extensions": {\n'
        '      "code": "NOT_FOUND",\n'
        '      "timestamp": "2026-03-15T10:30:00Z",\n'
        '      "requestId": "req_abc123",\n'
        '      "details": {\n'
        '        "resource": "TargetCompany",\n'
        '        "id": "non_existent_id"\n'
        '      }\n'
        '    }\n'
        '  }],\n'
        '  "data": { "targetCompany": null }\n'
        '}'
    ))
    E.append(sp(4))

    E.append(h2("4.2 Codes d'erreur"))
    E.append(p(
        "La liste complete des codes d'erreur est presentee ci-dessous. Chaque code est associe a un HTTP status code "
        "equivalent pour les cas de transport REST (bien que GraphQL utilise systematiquement HTTP 200 pour les erreurs applicatives)."
    ))
    E.append(sp(4))
    E.append(tbl([
        [TH('Code'), TH('Description'), TH('HTTP'), TH('Categorie')],
        [TD('AUTHENTICATION_REQUIRED'), TD('Token JWT manquant ou invalide'), TD('401', True), TD('Auth', True)],
        [TD('AUTHORIZATION_DENIED'), TD('Permissions insuffisantes'), TD('403', True), TD('Auth', True)],
        [TD('NOT_FOUND'), TD('Ressource introuvable'), TD('404', True), TD('Client', True)],
        [TD('VALIDATION_ERROR'), TD('Donnees de requete invalides'), TD('422', True), TD('Client', True)],
        [TD('RATE_LIMIT_EXCEEDED'), TD('Limite de debit atteinte'), TD('429', True), TD('Rate', True)],
        [TD('PLAN_LIMIT_REACHED'), TD('Limite du plan atteinte'), TD('403', True), TD('Billing', True)],
        [TD('QUERY_TOO_COMPLEX'), TD('Complexite de requete excessive'), TD('400', True), TD('Rate', True)],
        [TD('QUERY_DEPTH_EXCEEDED'), TD('Profondeur de requete excessive'), TD('400', True), TD('Rate', True)],
        [TD('INTERNAL_ERROR'), TD('Erreur interne du serveur'), TD('500', True), TD('Serveur', True)],
        [TD('SERVICE_UNAVAILABLE'), TD('Service temporairement indisponible'), TD('503', True), TD('Serveur', True)],
        [TD('SCAN_ALREADY_RUNNING'), TD('Un scan est deja en cours'), TD('409', True), TD('Client', True)],
        [TD('CRM_SYNC_FAILED'), TD('Echec de synchronisation CRM'), TD('502', True), TD('Integration', True)],
    ], [120, 160, 50, 70]))
    E.append(sp(4))

    E.append(h2("4.3 Extensions d'erreur GraphQL"))
    E.append(p(
        "Les extensions d'erreur suivantes sont incluses dans chaque objet erreur GraphQL. Elles fournissent des "
        "informations contextuelles pour faciliter le debug et le support. L'objet 'extensions' contient au minimum "
        "'code' et 'timestamp'. En mode developpement, 'details', 'stack' et 'suggestion' sont inclus."
    ))
    E.append(sp(4))
    E.append(tbl([
        [TH('Champ'), TH('Type'), TH('Description')],
        [TD('code'), TD('String', True), TD('Code d\'erreur machine-readable')],
        [TD('timestamp'), TD('DateTime', True), TD('Horodatage de l\'erreur (ISO 8601)')],
        [TD('requestId'), TD('String', True), TD('Identifiant unique pour tracing distribue')],
        [TD('details'), TD('JSON', True), TD('Details specifiques (champs invalides, etc.)')],
        [TD('retryAfter'), TD('Int', True), TD('Secondes d\'attente avant retry (rate limit)')],
    ], [90, 70, 260]))
    E.append(sp(4))

    E.append(h2("4.4 Strategies de reprise (Retry)"))
    E.append(p(
        "En cas d'erreur, les clients doivent implementer une strategie de reprise adaptee au type d'erreur. "
        "Pour les erreurs RATE_LIMIT_EXCEEDED, le client doit respecter le header 'Retry-After' et utiliser un "
        "backoff exponentiel avec jitter. Pour les erreurs INTERNAL_ERROR et SERVICE_UNAVAILABLE, un retry avec "
        "backoff exponentiel (base 2s, max 30s, 3 tentatives) est recommande. Les erreurs de validation (VALIDATION_ERROR) "
        "et d'autorisation (AUTHENTICATION_REQUIRED, AUTHORIZATION_DENIED) ne doivent pas etre relancees automatiquement "
        "car elles necessitent une correction de la requete. Les erreurs NOT_FOUND sont definitives. "
        "L'utilisation d'un SDK client avec retry automatique est recommandee."
    ))
    E.append(PageBreak())
    return E


# ===== SECTION 5: PAGINATION =====
def sec_pagination():
    E = []
    E.append(h1("5. Strategie de pagination"))
    E.append(hr())

    E.append(p(
        "DealScope utilise une pagination basee sur des curseurs (cursor-based) pour toutes les requetes retournant "
        "des listes. Cette strategie est preferee a la pagination offset pour plusieurs raisons techniques : "
        "elle est performante avec de grands volumes, coherente lors de modifications concurrentes, et evite les doublons."
    ))
    E.extend(code(
        'query GetTargetCompanies($first: Int, $after: String) {\n'
        '  targetCompanies(\n'
        '    first: $first\n'
        '    after: $after\n'
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
        '        id, name, domain, status, revenue\n'
        '      }\n'
        '    }\n'
        '  }\n'
        '}'
    ))
    E.append(sp(4))
    E.append(tbl([
        [TH('Champ'), TH('Type'), TH('Description')],
        [TD('hasNextPage'), TD('Boolean!', True), TD('Indique s\'il existe une page suivante')],
        [TD('hasPreviousPage'), TD('Boolean!', True), TD('Indique s\'il existe une page precedente')],
        [TD('startCursor'), TD('String', True), TD('Curseur du premier element de la page')],
        [TD('endCursor'), TD('String', True), TD('Curseur du dernier element de la page')],
        [TD('totalCount'), TD('Int!', True), TD('Nombre total d\'elements (toutes pages)')],
    ], [100, 80, 240]))
    E.append(sp(4))
    E.append(p(
        "Les curseurs sont des chaines opaques encodees en Base64 dont le format interne est sujet a changement. "
        "La valeur maximale de 'first' est de 100 elements par requete. Pour de grands ensembles de donnees, les "
        "clients doivent utiliser une boucle de pagination avec verification de 'hasNextPage'. Le compteur 'totalCount' "
        "est calcule via une requete COUNT optimisee et peut etre legerement imprecis en cas de modifications concurrentes."
    ))
    E.append(PageBreak())
    return E


# ===== SECTION 6: RATE LIMITING =====
def sec_rate_limiting():
    E = []
    E.append(h1("6. Politique de limitation de debit"))
    E.append(hr())

    E.append(h2("6.1 Limites par plan de souscription"))
    E.append(p(
        "La politique de limitation de debit est concue pour proteger l'infrastructure tout en offrant une experience fluide. "
        "Les limites sont definies par plan et appliquees par utilisateur et par workspace via Redis 7 avec une fenetre "
        "glissante. Chaque requete GraphQL est comptabilisee en fonction de sa complexite calculee, et non unitairement, "
        "afin de prevenir les requetes couteuses abusives."
    ))
    E.append(sp(4))
    E.append(tbl([
        [TH('Plan'), TH('Points/min'), TH('Points/heure'), TH('Batch max'), TH('Req. conc.')],
        [TD('Starter', True), TD('300', True), TD('3 000', True), TD('10', True), TD('3', True)],
        [TD('Professional', True), TD('1 000', True), TD('10 000', True), TD('25', True), TD('5', True)],
        [TD('Business', True), TD('3 000', True), TD('30 000', True), TD('50', True), TD('10', True)],
        [TD('Enterprise', True), TD('10 000', True), TD('100 000', True), TD('100', True), TD('25', True)],
    ], [80, 80, 90, 80, 90]))
    E.append(sp(4))

    E.append(h2("6.2 Headers de limitation de debit"))
    E.append(p(
        "Chaque reponse HTTP inclut des headers informant le client de son quota. Ils permettent d'implementer un "
        "comportement adaptatif (backoff, cache) pour optimiser l'utilisation."
    ))
    E.append(sp(4))
    E.append(tbl([
        [TH('Header'), TH('Exemple'), TH('Description')],
        [TD('X-RateLimit-Limit'), TD('300', True), TD('Maximum de points autorises dans la fenetre')],
        [TD('X-RateLimit-Remaining'), TD('247', True), TD('Points restants dans la fenetre courante')],
        [TD('X-RateLimit-Reset'), TD('1678890120', True), TD('Timestamp Unix de fin de fenetre')],
        [TD('X-RateLimit-Policy'), TD('sliding_window', True), TD('Algorithme de limitation utilise')],
        [TD('Retry-After'), TD('30', True), TD('Secondes d\'attente (si quota depasse)')],
    ], [120, 80, 220]))
    E.append(sp(4))

    E.append(h2("6.3 Analyse de complexite GraphQL"))
    E.append(p(
        "DealScope implemente une analyse de complexite des requetes GraphQL. Un champ scalaire coute 1 point, un champ "
        "objet coute 1 point plus ses sous-champs, et une liste multiplie le cout par la taille demandee. Les limites : "
        "profondeur max 7 niveaux, cout max 500 points (Starter), 1000 (Professional), 2000 (Business), personnalise "
        "(Enterprise). L'analyse est effectuee avant execution, rejetant les requetes couteuses sans consommer de ressources."
    ))
    E.append(p(
        "Exemple : 20 entreprises x 10 contacts + 20 entreprises x 20 signaux = 20 + 200 + 400 = 620 points. "
        "Rejetee pour Starter, acceptee pour Professional. Le client recoit QUERY_TOO_COMPLEX avec le cout calcule."
    ))
    E.append(PageBreak())
    return E


# ===== SECTION 7: API EXAMPLES =====
def sec_examples():
    E = []
    E.append(h1("7. Exemples d'utilisation de l'API"))
    E.append(hr())

    E.append(h2("7.1 Requete complete avec filtrage et pagination"))
    E.append(p(
        "L'exemple suivant illustre une requete typique pour recuperer les entreprises cibles d'un workspace, "
        "avec filtrage multi-criteres et pagination basee sur les curseurs."
    ))
    E.extend(code(
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
        '      hasNextPage, endCursor, totalCount\n'
        '    }\n'
        '    edges {\n'
        '      cursor\n'
        '      node {\n'
        '        id, name, domain, revenue\n'
        '        analysisReport {\n'
        '          strategicFit {\n'
        '            overallScore, recommendation\n'
        '          }\n'
        '        }\n'
        '      }\n'
        '    }\n'
        '  }\n'
        '}'
    ))
    E.append(sp(4))

    E.append(h2("7.2 Mutation : lancement d'un scan d'agents IA"))
    E.append(p(
        "Le lancement d'un scan declenche sequentiellement les agents Ciblage, OSINT, Analyse et Email Matching "
        "via l'orchestrateur LangGraph."
    ))
    E.extend(code(
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
    E.append(sp(4))
    E.append(p("Reponse attendue :"))
    E.extend(code(
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
    E.append(sp(4))

    E.append(h2("7.3 Subscription WebSocket : suivi de scan"))
    E.append(p(
        "Les subscriptions permettent le suivi temps reel via le protocole graphql-transport-ws."
    ))
    E.extend(code(
        '// Connexion WebSocket\n'
        'const ws = new WebSocket("wss://api.dealscope.io/graphql");\n\n'
        '// Initialisation avec JWT\n'
        'ws.send(JSON.stringify({\n'
        '  type: "connection_init",\n'
        '  payload: {\n'
        '    authorization: "Bearer eyJhbGci..."\n'
        '  }\n'
        '}));\n\n'
        '// Abonnement progression scan\n'
        'ws.send(JSON.stringify({\n'
        '  id: "sub_scan_1",\n'
        '  type: "subscribe",\n'
        '  payload: {\n'
        '    query: `\n'
        '      subscription {\n'
        '        scanProgress(scanId: "scan_xyz789") {\n'
        '          scanId, status, progress,\n'
        '          currentAgent, agentProgress,\n'
        '          companiesFound, message\n'
        '        }\n'
        '      }\n'
        '    `\n'
        '  }\n'
        '}));'
    ))
    E.append(sp(4))

    E.append(h2("7.4 Requete graphe de connaissances"))
    E.append(p(
        "Exploration du graphe Neo4j via l'API GraphQL avec profondeur 2 niveaux."
    ))
    E.extend(code(
        'query ExploreKnowledgeGraph {\n'
        '  knowledgeGraph(\n'
        '    entityId: "kg_company_abc"\n'
        '    depth: 2\n'
        '    relationTypes: ["INVESTED_IN", "ACQUIRED", "PARTNERED_WITH"]\n'
        '  ) {\n'
        '    totalEntities, totalRelations\n'
        '    entities {\n'
        '      id, name, type, properties\n'
        '    }\n'
        '    relations {\n'
        '      type, sourceId, targetId, weight\n'
        '    }\n'
        '  }\n'
        '}'
    ))
    E.append(sp(4))

    E.append(h2("7.5 Exemple de reponse d'erreur"))
    E.append(p("Reponse d'erreur complete pour limitation de debit :"))
    E.extend(code(
        '{\n'
        '  "errors": [{\n'
        '    "message": "Limite de debit depassee.",\n'
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
    E.append(PageBreak())
    return E


# ===== SECTION 8: WEBHOOKS =====
def sec_webhooks():
    E = []
    E.append(h1("8. Webhooks &amp; Integrations"))
    E.append(hr())

    E.append(h2("8.1 Webhooks de synchronisation CRM"))
    E.append(p(
        "DealScope supporte la synchronisation bidirectionnelle avec Salesforce, HubSpot, Pipedrive et Dynamics 365. "
        "Les webhooks sortants notifient le CRM lors d'evenements importants. Les webhooks entrants permettent au CRM "
        "de mettre a jour DealScope. La configuration se fait via IntegrationSettings ou la mutation exportToCRM. "
        "Chaque webhook entrant est valide par un secret partage (HMAC-SHA256) pour garantir l'authenticite."
    ))
    E.append(p(
        "Evenements declencheurs : 'target.created', 'target.status_changed', 'signal.detected', "
        "'pipeline.moved', 'analysis.completed', 'contact.validated'. Le payload inclut 'event', 'timestamp', "
        "'workspaceId', 'data' et 'signature'. Les echecs de livraison sont retires avec backoff exponentiel "
        "(3 tentatives sur 24h)."
    ))
    E.append(sp(4))

    E.append(h2("8.2 Webhooks de notification d'alertes"))
    E.append(p(
        "En complement des subscriptions GraphQL, DealScope propose des webhooks HTTP pour les integrations avec "
        "Slack, Microsoft Teams, email et SMS. Configures au niveau du workspace avec filtrage par type d'evenement "
        "et severite. Differents des webhooks CRM car orientes action humaine plutot que synchronisation systeme."
    ))
    E.append(sp(4))
    E.append(tbl([
        [TH('Evenement'), TH('Description'), TH('Severite')],
        [TD('signal.detected'), TD('Nouveau signal de marche pour une entreprise suivie'), TD('INFO', True)],
        [TD('scan.completed'), TD('Un scan d\'agents IA s\'est termine'), TD('SUCCESS', True)],
        [TD('scan.failed'), TD('Un scan d\'agents IA a echoue'), TD('ERROR', True)],
        [TD('pipeline.stage_change'), TD('Changement d\'etape de pipeline'), TD('INFO', True)],
        [TD('analysis.ready'), TD('Rapport d\'analyse pret'), TD('SUCCESS', True)],
        [TD('rate_limit.warning'), TD('Consommation proche de la limite'), TD('WARNING', True)],
        [TD('api.key.expiring'), TD('Cle API expire dans 7 jours'), TD('WARNING', True)],
    ], [110, 240, 70]))
    E.append(PageBreak())
    return E


# ===== SECTION 9: SECURITY =====
def sec_security():
    E = []
    E.append(h1("9. Considerations de securite"))
    E.append(hr())

    E.append(h2("9.1 Limitation de la profondeur de requete"))
    E.append(p(
        "DealScope limite la profondeur maximale des requetes GraphQL a 7 niveaux pour prevenir les attaques par "
        "requetes profondement imbriquees. Cette limite est appliquee avant l'analyse AST et rejette les requetes "
        "la depassant avec QUERY_DEPTH_EXCEEDED. La profondeur compte les niveaux d'imbrication de champs objet, "
        "fragments inclus. Elle protege contre l'exploitation des relations circulaires du graphe de connaissances. "
        "Les clients doivent concevoir des requetes plates plutot que profondes."
    ))
    E.append(sp(4))

    E.append(h2("9.2 Analyse de complexite des requetes"))
    E.append(p(
        "Chaque champ est annote avec un cout de base (1 pour scalaires, 5 pour objets, multiplicateur par taille "
        "de liste). Le cout total est la somme de tous les champs demandes. Les limites par plan sont appliquees "
        "globalement et par operation. En complement, un timeout d'execution de 30 secondes par requete protege "
        "contre les requetes couteuses. Les subscriptions ont un timeout de 5 minutes d'inactivite."
    ))
    E.append(sp(4))

    E.append(h2("9.3 Protection anti-DDoS"))
    E.append(p(
        "Defense multi-couches : Cloudflare en reseau contre attaques volumetriques et couche 7, limitation par "
        "utilisateur/IP au niveau applicatif, analyse de complexite GraphQL. Un systeme de detection d'anomalie "
        "surveille les patterns en temps reel et peut declencher un mode degrade (CAPTCHA, augmentation des limites). "
        "Les requetes d'introspection sont cachees statiquement et rate-limitees a 10/min par IP. "
        "L'introspection peut etre desactivee via GRAPHQL_ENABLE_INTROSPECTION=false."
    ))
    E.append(sp(4))

    E.append(h2("9.4 Protection des donnees sensibles"))
    E.append(p(
        "Les emails et numeros de telephone sont masques par defaut (j***@example.com) sauf pour les permissions "
        "'contacts:read_full'. Les cles API sont stockees en hash SHA-256 et jamais renvoyees en clair. "
        "Le logging exclut les valeurs sensibles. Les connexions sont chiffrees TLS 1.3 minimum avec HSTS. "
        "Les headers CSP, X-Frame-Options et X-Content-Type-Options sont configures sur toutes les reponses."
    ))
    E.append(PageBreak())
    return E


# ===== SECTION 10: APPENDIX =====
def sec_appendix():
    E = []
    E.append(h1("10. Annexe : Endpoints &amp; Configuration"))
    E.append(hr())

    E.append(h2("10.1 Endpoints de l'API"))
    E.append(sp(4))
    E.append(tbl([
        [TH('Environnement'), TH('URL GraphQL'), TH('WebSocket')],
        [TD('Production'), TD('https://api.dealscope.io/graphql'), TD('wss://api.dealscope.io/graphql')],
        [TD('Staging'), TD('https://api.staging.dealscope.io/graphql'), TD('wss://api.staging.dealscope.io/graphql')],
        [TD('Developpement'), TD('http://localhost:8000/graphql'), TD('ws://localhost:8000/graphql')],
    ], [100, 180, 150]))
    E.append(sp(6))

    E.append(h2("10.2 Stack technologique"))
    E.append(sp(4))
    E.append(tbl([
        [TH('Composant'), TH('Technologie'), TH('Version')],
        [TD('Backend API'), TD('FastAPI + Strawberry GraphQL'), TD('0.109+ / 0.230+', True)],
        [TD('Orchestrateur IA'), TD('LangGraph'), TD('0.2+', True)],
        [TD('Base de donnees'), TD('PostgreSQL'), TD('16', True)],
        [TD('Cache'), TD('Redis'), TD('7', True)],
        [TD('Graphe connaissances'), TD('Neo4j'), TD('5', True)],
        [TD('Base vectorielle'), TD('Weaviate'), TD('1.24+', True)],
        [TD('Authentification'), TD('Clerk.dev'), TD('SaaS', True)],
        [TD('Frontend'), TD('Next.js + React + shadcn/ui'), TD('14 / 18', True)],
    ], [120, 180, 100]))
    E.append(sp(6))

    E.append(h2("10.3 Variables d'environnement"))
    E.append(p("Variables requises pour le fonctionnement de l'API GraphQL :"))
    E.append(sp(4))
    E.append(tbl([
        [TH('Variable'), TH('Description'), TH('Obligatoire')],
        [TD('DATABASE_URL'), TD('URL de connexion PostgreSQL'), TD('Oui', True)],
        [TD('REDIS_URL'), TD('URL de connexion Redis'), TD('Oui', True)],
        [TD('NEO4J_URI'), TD('URI de connexion Neo4j'), TD('Oui', True)],
        [TD('WEAVIATE_URL'), TD('URL du cluster Weaviate'), TD('Oui', True)],
        [TD('CLERK_SECRET_KEY'), TD('Cle secrete Clerk pour validation JWT'), TD('Oui', True)],
        [TD('CLERK_JWKS_URL'), TD('URL des clefs publiques Clerk'), TD('Oui', True)],
        [TD('GRAPHQL_ENABLE_INTROSPECTION'), TD('Activer l\'introspection GraphQL'), TD('Non', True)],
        [TD('GRAPHQL_MAX_DEPTH'), TD('Profondeur max des requetes'), TD('Non', True)],
        [TD('GRAPHQL_MAX_COMPLEXITY'), TD('Complexite max par requete'), TD('Non', True)],
        [TD('WEBHOOK_SECRET'), TD('Secret pour signature HMAC'), TD('Oui', True)],
    ], [160, 210, 60]))
    E.append(sp(20))

    E.append(hr())
    E.append(sp(6))
    E.append(Paragraph(
        "<b>Fin du document</b> - DealScope Specifications API GraphQL v1.0 - Mars 2026",
        ParagraphStyle('End', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=10, leading=14, textColor=C_GRAY, alignment=TA_CENTER)
    ))
    E.append(sp(6))
    E.append(Paragraph(
        "Document confidentiel - Z.ai Equipe Technique - Tous droits reserves",
        ParagraphStyle('Copy', parent=sty['Normal'], fontName='TimesNewRoman', fontSize=9, leading=12, textColor=C_GRAY, alignment=TA_CENTER)
    ))
    return E


# ===== MAIN =====
def main():
    print("Generating DealScope GraphQL API Specifications PDF...")
    os.makedirs(os.path.dirname(OUT), exist_ok=True)

    doc = SimpleDocTemplate(
        OUT, pagesize=A4,
        leftMargin=1.0*inch, rightMargin=1.0*inch,
        topMargin=1.0*inch, bottomMargin=1.0*inch,
        title='DealScope_Specifications_API_GraphQL',
        author='Z.ai', creator='Z.ai',
        subject='Specifications API GraphQL - DealScope M&A Intelligence'
    )

    elements = []
    elements.extend(cover())
    elements.extend(toc())
    elements.extend(sec_intro())
    elements.extend(sec_auth())
    elements.extend(sec_schema())
    elements.extend(sec_errors())
    elements.extend(sec_pagination())
    elements.extend(sec_rate_limiting())
    elements.extend(sec_examples())
    elements.extend(sec_webhooks())
    elements.extend(sec_security())
    elements.extend(sec_appendix())

    # Flatten any nested lists (from code blocks)
    flat = []
    for item in elements:
        if isinstance(item, list):
            flat.extend(item)
        else:
            flat.append(item)

    doc.build(flat, onFirstPage=lambda c, d: None, onLaterPages=footer)
    print("PDF generated: %s" % OUT)


if __name__ == '__main__':
    main()
