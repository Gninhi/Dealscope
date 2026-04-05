# -*- coding: utf-8 -*-
import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from reportlab.lib import colors
from reportlab.lib.units import cm, inch
from reportlab.platypus import (
    Paragraph, Spacer, PageBreak, Table, TableStyle, Image
)
from reportlab.platypus.tableofcontents import TableOfContents
from reportlab.platypus import SimpleDocTemplate
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily

# ── Font Registration ───────────────────────────────
pdfmetrics.registerFont(TTFont('Microsoft YaHei', '/usr/share/fonts/truetype/chinese/msyh.ttf'))
pdfmetrics.registerFont(TTFont('SimHei', '/usr/share/fonts/truetype/chinese/SimHei.ttf'))
pdfmetrics.registerFont(TTFont('Times New Roman', '/usr/share/fonts/truetype/english/Times-New-Roman.ttf'))
pdfmetrics.registerFont(TTFont('DejaVuSans', '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'))

registerFontFamily('Times New Roman', normal='Times New Roman', bold='Times New Roman')
registerFontFamily('SimHei', normal='SimHei', bold='SimHei')
registerFontFamily('Microsoft YaHei', normal='Microsoft YaHei', bold='Microsoft YaHei')
registerFontFamily('DejaVuSans', normal='DejaVuSans', bold='DejaVuSans')

# ── Colors ──────────────────────────────────────────
DARK_BLUE = colors.HexColor('#1F4E79')
CRITICAL_RED = colors.HexColor('#D32F2F')
HIGH_ORANGE = colors.HexColor('#E65100')
MEDIUM_AMBER = colors.HexColor('#F9A825')
LOW_GREEN = colors.HexColor('#388E3C')
INFO_BLUE = colors.HexColor('#1976D2')
COVER_BG = colors.HexColor('#0D1B2A')
COVER_ACCENT = colors.HexColor('#00BCD4')
ROW_ODD = colors.HexColor('#F5F5F5')
ROW_EVEN = colors.white
DARK_TEXT = colors.HexColor('#212121')
LIGHT_TEXT = colors.HexColor('#616161')

# ── Styles ──────────────────────────────────────────
cover_title = ParagraphStyle(
    name='CoverTitle', fontName='Times New Roman', fontSize=36,
    leading=44, alignment=TA_CENTER, textColor=colors.white, spaceAfter=12
)
cover_subtitle = ParagraphStyle(
    name='CoverSubtitle', fontName='Times New Roman', fontSize=18,
    leading=24, alignment=TA_CENTER, textColor=COVER_ACCENT, spaceAfter=8
)
cover_meta = ParagraphStyle(
    name='CoverMeta', fontName='Times New Roman', fontSize=13,
    leading=20, alignment=TA_CENTER, textColor=colors.HexColor('#90A4AE'), spaceAfter=6
)
h1_style = ParagraphStyle(
    name='H1', fontName='Times New Roman', fontSize=20,
    leading=26, alignment=TA_LEFT, textColor=DARK_BLUE,
    spaceBefore=18, spaceAfter=10
)
h2_style = ParagraphStyle(
    name='H2', fontName='Times New Roman', fontSize=15,
    leading=20, alignment=TA_LEFT, textColor=DARK_BLUE,
    spaceBefore=14, spaceAfter=8
)
h3_style = ParagraphStyle(
    name='H3', fontName='Times New Roman', fontSize=12,
    leading=16, alignment=TA_LEFT, textColor=DARK_TEXT,
    spaceBefore=10, spaceAfter=6
)
body_style = ParagraphStyle(
    name='Body', fontName='Times New Roman', fontSize=10.5,
    leading=16, alignment=TA_JUSTIFY, textColor=DARK_TEXT,
    spaceAfter=6
)
body_left = ParagraphStyle(
    name='BodyLeft', fontName='Times New Roman', fontSize=10,
    leading=15, alignment=TA_LEFT, textColor=DARK_TEXT, spaceAfter=4
)
bullet_style = ParagraphStyle(
    name='Bullet', fontName='Times New Roman', fontSize=10.5,
    leading=16, alignment=TA_LEFT, textColor=DARK_TEXT,
    leftIndent=20, spaceAfter=4
)
code_style = ParagraphStyle(
    name='Code', fontName='DejaVuSans', fontSize=9,
    leading=13, alignment=TA_LEFT, textColor=DARK_TEXT,
    backColor=colors.HexColor('#F5F5F5'), leftIndent=10, rightIndent=10,
    spaceBefore=4, spaceAfter=4, borderPadding=6
)
caption_style = ParagraphStyle(
    name='Caption', fontName='Times New Roman', fontSize=9.5,
    leading=14, alignment=TA_CENTER, textColor=LIGHT_TEXT, spaceAfter=6
)

# Table styles
th_style = ParagraphStyle(
    name='TH', fontName='Times New Roman', fontSize=10,
    leading=14, alignment=TA_CENTER, textColor=colors.white
)
td_style = ParagraphStyle(
    name='TD', fontName='Times New Roman', fontSize=9.5,
    leading=14, alignment=TA_LEFT, textColor=DARK_TEXT
)
td_center = ParagraphStyle(
    name='TDCenter', fontName='Times New Roman', fontSize=9.5,
    leading=14, alignment=TA_CENTER, textColor=DARK_TEXT
)
td_left = ParagraphStyle(
    name='TDLeft', fontName='Times New Roman', fontSize=9,
    leading=13, alignment=TA_LEFT, textColor=DARK_TEXT, wordWrap='CJK'
)

# ── TOC Template ────────────────────────────────────
class TocDocTemplate(SimpleDocTemplate):
    def afterFlowable(self, flowable):
        if hasattr(flowable, 'bookmark_name'):
            level = getattr(flowable, 'bookmark_level', 0)
            text = getattr(flowable, 'bookmark_text', '')
            self.notify('TOCEntry', (level, text, self.page))

# ── Helpers ─────────────────────────────────────────
def heading(text, style, level=0):
    p = Paragraph(f'<b>{text}</b>', style)
    p.bookmark_name = text
    p.bookmark_level = level
    p.bookmark_text = text
    return p

def para(text):
    return Paragraph(text, body_style)

def bullet(text):
    return Paragraph(f'  -  {text}', bullet_style)

def severity_badge(level):
    mapping = {
        'CRITIQUE': CRITICAL_RED,
        'HAUTE': HIGH_ORANGE,
        'MOYENNE': MEDIUM_AMBER,
        'FAIBLE': LOW_GREEN,
        'INFO': INFO_BLUE,
    }
    c = mapping.get(level, colors.grey)
    s = ParagraphStyle(
        name=f'Badge_{level}', fontName='Times New Roman', fontSize=9,
        leading=13, alignment=TA_CENTER, textColor=colors.white
    )
    t = Table([[Paragraph(f'<b>{level}</b>', s)]], colWidths=[2.2*cm])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), c),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    return t

def make_table(headers, rows, col_widths):
    data = [[Paragraph(f'<b>{h}</b>', th_style) for h in headers]]
    for row in rows:
        data.append(row)
    t = Table(data, colWidths=col_widths, repeatRows=1)
    style_cmds = [
        ('BACKGROUND', (0,0), (-1,0), DARK_BLUE),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#BDBDBD')),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ]
    for i in range(1, len(data)):
        bg = ROW_EVEN if i % 2 == 1 else ROW_ODD
        style_cmds.append(('BACKGROUND', (0,i), (-1,i), bg))
    t.setStyle(TableStyle(style_cmds))
    return t

# ── Document ────────────────────────────────────────
output_path = '/home/z/my-project/download/DealScope_Audit_Securite.pdf'
doc = TocDocTemplate(
    output_path, pagesize=A4,
    leftMargin=2*cm, rightMargin=2*cm,
    topMargin=2*cm, bottomMargin=2*cm,
    title='DealScope_Audit_Securite',
    author='Z.ai', creator='Z.ai',
    subject='Audit de securite approfondi de la plateforme DealScope M&A SaaS'
)

story = []

# ════════════════════════════════════════════════════════
# COVER PAGE
# ════════════════════════════════════════════════════════
cover_bg = Table(
    [['']], colWidths=[17*cm], rowHeights=[25*cm]
)
cover_bg.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,-1), COVER_BG),
]))

story.append(Spacer(1, 140))
story.append(Paragraph('<b>RAPPORT D\'AUDIT DE SECURITE</b>', cover_title))
story.append(Spacer(1, 16))
story.append(Paragraph('<b>DealScope M&amp;A SaaS Platform</b>', cover_subtitle))
story.append(Spacer(1, 36))

# Summary box
summary_data = [[
    Paragraph(
        'Analyse exhaustive de l\'architecture de securite : authentification, '
        'autorisation, protection des API, injection, configuration, '
        'gestion des sessions et durcissement du perimetre.',
        ParagraphStyle(name='CoverDesc', fontName='Times New Roman', fontSize=11,
                       leading=17, alignment=TA_CENTER, textColor=colors.HexColor('#B0BEC5'))
    )
]]
summary_table = Table(summary_data, colWidths=[13*cm])
summary_table.setStyle(TableStyle([
    ('TOPPADDING', (0,0), (-1,-1), 12),
    ('BOTTOMPADDING', (0,0), (-1,-1), 12),
    ('LINEABOVE', (0,0), (-1,0), 1, COVER_ACCENT),
    ('LINEBELOW', (0,0), (-1,0), 1, COVER_ACCENT),
]))
story.append(summary_table)
story.append(Spacer(1, 60))

story.append(Paragraph('Date : 5 avril 2026', cover_meta))
story.append(Paragraph('Version : 1.0', cover_meta))
story.append(Paragraph('Classification : Confidentiel', cover_meta))
story.append(Paragraph('Realise par : Z.ai Security Audit', cover_meta))
story.append(PageBreak())

# ════════════════════════════════════════════════════════
# TABLE OF CONTENTS
# ════════════════════════════════════════════════════════
story.append(Paragraph('<b>Table des matieres</b>', h1_style))
story.append(Spacer(1, 12))
toc = TableOfContents()
toc.levelStyles = [
    ParagraphStyle(name='TOC1', fontName='Times New Roman', fontSize=12, leftIndent=20, leading=20, spaceBefore=6),
    ParagraphStyle(name='TOC2', fontName='Times New Roman', fontSize=10.5, leftIndent=40, leading=18, spaceBefore=3),
]
story.append(toc)
story.append(PageBreak())

# ════════════════════════════════════════════════════════
# 1. RESUME EXECUTIF
# ════════════════════════════════════════════════════════
story.append(heading('1. Resume executif', h1_style, 0))

story.append(para(
    'Cet audit de securite approfondi a ete realise sur la plateforme DealScope, '
    'une application SaaS de deal sourcing M&amp;A construite avec Next.js 16, Prisma ORM, '
    'SQLite, et NextAuth v5. L\'objectif est d\'identifier toutes les vulnerabilites '
    'techniques, les failles de configuration et les faiblesses architecturales '
    'pouvant compromettre la confidentialite, l\'integrite et la disponibilite de la plateforme.'
))
story.append(para(
    'L\'audit a couvert l\'ensemble de la surface d\'attaque : authentification, '
    'gestion des sessions, protection des routes API, validation des entrees, '
    'securite du reverse proxy, protection contre les injections, politiques CSP, '
    'durcissement des headers HTTP, gestion des secrets et isolation des donnees.'
))

story.append(Spacer(1, 10))
story.append(heading('1.1 Chiffres cles', h2_style, 1))

summary_rows = [
    [Paragraph('Vulnerabilites totales identifiees', td_left), Paragraph('<b>20</b>', td_center)],
    [Paragraph('Critiques', td_left), Paragraph('<b>0</b>', td_center)],
    [Paragraph('Hautes', td_left), Paragraph('<b>6</b>', td_center)],
    [Paragraph('Moyennes', td_left), Paragraph('<b>8</b>', td_center)],
    [Paragraph('Faibles', td_left), Paragraph('<b>4</b>', td_center)],
    [Paragraph('Informations', td_left), Paragraph('<b>3</b>', td_center)],
    [Paragraph('Routes API auditees', td_left), Paragraph('<b>17</b>', td_center)],
    [Paragraph('Modeles de donnees verifies', td_left), Paragraph('<b>12</b>', td_center)],
]
story.append(Spacer(1, 8))
story.append(make_table(['Metrique', 'Valeur'], summary_rows, [11*cm, 5*cm]))
story.append(Spacer(1, 6))
story.append(Paragraph('<b>Tableau 1.</b> Synthese des resultats de l\'audit', caption_style))
story.append(Spacer(1, 14))

story.append(para(
    'L\'application possede une base solide de securite avec l\'implementation de NextAuth v5, '
    'le hachage bcrypt a 12 rounds, la validation Zod sur la plupart des endpoints, la protection '
    'CSRF par double-submit cookie, le rate limiting memoire, et les headers de securite (CSP, HSTS, '
    'X-Frame-Options). Cependant, des vulnerabilites significatives persistent, notamment un '
    'redirect ouvert sur la page de connexion, un endpoint d\'enregistrement sans restriction, '
    'un secret JWT trop faible, et une configuration Caddy permettant le balayage de ports internes.'
))

# ════════════════════════════════════════════════════════
# 2. MATRICE DES VULNERABILITES
# ════════════════════════════════════════════════════════
story.append(heading('2. Matrice des vulnerabilites', h1_style, 0))
story.append(para(
    'Le tableau ci-dessous presente l\'ensemble des 20 vulnerabilites identifiees, '
    'classees par niveau de severite et par categorie. Chaque vulnerabilite est '
    'accompagnee de sa localisation precise dans le code source et d\'une evaluation '
    'de son impact potentiel sur la securite de la plateforme.'
))

story.append(Spacer(1, 10))
story.append(heading('2.1 Vue d\'ensemble par severite', h2_style, 1))

vuln_rows = [
    [Paragraph('V-01', td_center), Paragraph('Redirect ouvert (callbackUrl non valide)', td_left),
     Paragraph('src/app/login/page.tsx:21', td_left), Paragraph('HAUTE', td_center), Paragraph('Authentification', td_center)],
    [Paragraph('V-02', td_center), Paragraph('Enregistrement ouvert sans restriction', td_left),
     Paragraph('src/app/api/auth/register/route.ts:19', td_left), Paragraph('HAUTE', td_center), Paragraph('Authentification', td_center)],
    [Paragraph('V-03', td_center), Paragraph('Fuite de user.id et user.role dans la reponse 201', td_left),
     Paragraph('src/app/api/auth/register/route.ts:91-97', td_left), Paragraph('HAUTE', td_center), Paragraph('API Route', td_center)],
    [Paragraph('V-04', td_center), Paragraph('NEXTAUTH_SECRET faible et previsible', td_left),
     Paragraph('.env:2', td_left), Paragraph('HAUTE', td_center), Paragraph('Configuration', td_center)],
    [Paragraph('V-05', td_center), Paragraph('SSRF via Caddy XTransformPort (balayage de ports)', td_left),
     Paragraph('Caddyfile:2-13', td_left), Paragraph('HAUTE', td_center), Paragraph('Infrastructure', td_center)],
    [Paragraph('V-06', td_center), Paragraph('Repertoire db/ non exclu du .gitignore', td_left),
     Paragraph('.gitignore', td_left), Paragraph('HAUTE', td_center), Paragraph('Configuration', td_center)],
    [Paragraph('V-07', td_center), Paragraph('Statut d\'installation publiquement queryable', td_left),
     Paragraph('src/app/api/auth/setup/route.ts:21', td_left), Paragraph('MOYENNE', td_center), Paragraph('API Route', td_center)],
    [Paragraph('V-08', td_center), Paragraph('Aucune verification email apres inscription', td_left),
     Paragraph('src/app/api/auth/register/route.ts', td_left), Paragraph('MOYENNE', td_center), Paragraph('Authentification', td_center)],
    [Paragraph('V-09', td_center), Paragraph('Reset token expose en mode developpement', td_left),
     Paragraph('src/app/api/auth/forgot-password/route.ts:56', td_left), Paragraph('MOYENNE', td_center), Paragraph('Authentification', td_center)],
    [Paragraph('V-10', td_center), Paragraph('Injection partielle dans les parametres InfoGreffe', td_left),
     Paragraph('src/lib/infogreffe.ts:62-108', td_left), Paragraph('MOYENNE', td_center), Paragraph('Injection', td_center)],
    [Paragraph('V-11', td_center), Paragraph('Requete utilisateur non sanitissee vers API Gouv', td_left),
     Paragraph('src/lib/api-gouv.ts:12', td_left), Paragraph('MOYENNE', td_center), Paragraph('Injection', td_center)],
    [Paragraph('V-12', td_center), Paragraph('Pas de configuration TLS sur le reverse proxy', td_left),
     Paragraph('Caddyfile:1', td_left), Paragraph('MOYENNE', td_center), Paragraph('Infrastructure', td_center)],
    [Paragraph('V-13', td_center), Paragraph('Pas de headers securite au niveau du reverse proxy', td_left),
     Paragraph('Caddyfile', td_left), Paragraph('MOYENNE', td_center), Paragraph('Infrastructure', td_center)],
    [Paragraph('V-14', td_center), Paragraph('Assignation de masse dans POST /api/companies', td_left),
     Paragraph('src/app/api/companies/route.ts:89-101', td_left), Paragraph('MOYENNE', td_center), Paragraph('API Route', td_center)],
    [Paragraph('V-15', td_center), Paragraph('Validation Zod absente sur PATCH alerts (isActive)', td_left),
     Paragraph('src/app/api/news/alerts/route.ts:108', td_left), Paragraph('MOYENNE', td_center), Paragraph('API Route', td_center)],
    [Paragraph('V-16', td_center), Paragraph('Details d\'erreur exposes dans les reponses 500', td_left),
     Paragraph('Plusieurs routes API', td_left), Paragraph('FAIBLE', td_center), Paragraph('API Route', td_center)],
    [Paragraph('V-17', td_center), Paragraph('Siren non valide avant utilisation dans URL', td_left),
     Paragraph('src/lib/infogreffe.ts:99', td_left), Paragraph('FAIBLE', td_center), Paragraph('Validation', td_center)],
    [Paragraph('V-18', td_center), Paragraph('Enrichissement batch via requete interne (Host spoofing)', td_left),
     Paragraph('src/app/api/companies/enrich/route.ts:149', td_left), Paragraph('FAIBLE', td_center), Paragraph('API Route', td_center)],
    [Paragraph('V-19', td_center), Paragraph('dangerouslySetInnerHTML dans chart.tsx (shadcn)', td_left),
     Paragraph('src/components/ui/chart.tsx', td_left), Paragraph('FAIBLE', td_center), Paragraph('Client-side', td_center)],
    [Paragraph('V-20', td_center), Paragraph('CSP affaiblie par unsafe-inline et unsafe-eval', td_left),
     Paragraph('src/middleware.ts:19', td_left), Paragraph('INFO', td_center), Paragraph('Headers', td_center)],
]
story.append(Spacer(1, 8))
story.append(make_table(
    ['ID', 'Vulnerabilite', 'Localisation', 'Severite', 'Categorie'],
    vuln_rows,
    [1.1*cm, 5.5*cm, 4.5*cm, 2*cm, 2.8*cm]
))
story.append(Spacer(1, 6))
story.append(Paragraph('<b>Tableau 2.</b> Matrice complete des vulnerabilites identifiees', caption_style))

# ════════════════════════════════════════════════════════
# 3. ANALYSE DETAILLEE PAR CATEGORIE
# ════════════════════════════════════════════════════════
story.append(heading('3. Analyse detaillee par categorie', h1_style, 0))

# ── 3.1 AUTHENTIFICATION ──────────────────────────────
story.append(heading('3.1 Authentification et sessions', h2_style, 1))

story.append(para(
    '<b>V-01 : Redirect ouvert sur la page de connexion (HAUTE)</b><br/>'
    'Le fichier <font name="DejaVuSans">src/app/login/page.tsx</font> (ligne 21) lit le parametre '
    '<font name="DejaVuSans">callbackUrl</font> depuis l\'URL sans aucune validation. '
    'Un attaquant peut construire un lien du type '
    '<font name="DejaVuSans">/login?callbackUrl=https://evil.com</font>. Apres '
    'authentification reussie, l\'utilisateur est redirige vers le site de l\'attaquant '
    'avec son token de session actif, permettant le vol de credentials. La correction '
    'consiste a valider que <font name="DejaVuSans">callbackUrl</font> commence par '
    '<font name="DejaVuSans">/</font> ou est une URL relative connue avant de l\'utiliser '
    'dans <font name="DejaVuSans">router.push()</font>.'
))

story.append(para(
    '<b>V-02 : Enregistrement ouvert sans restriction (HAUTE)</b><br/>'
    'Le endpoint <font name="DejaVuSans">POST /api/auth/register</font> (route.ts:19-108) '
    'est accessible sans aucune forme de controle d\'acces. Toute personne peut creer un '
    'compte avec le role "member" et acceder immediatement a toutes les donnees du workspace '
    '(entreprises, pipeline, historique de chat, alertes). Il n\'existe ni code d\'invitation, '
    'ni validation d\'email, ni approbation par un administrateur. Un attaquant peut creer '
    'autant de comptes que necessaire (malgre le rate limiting de 5 req/min par IP) et '
    'exfiltrer les donnees de la plateforme.'
))

story.append(para(
    '<b>V-03 : Fuite de user.id et user.role dans la reponse (HAUTE)</b><br/>'
    'La reponse HTTP 201 du endpoint d\'inscription retourne explicitement '
    '<font name="DejaVuSans">user.id</font>, <font name="DejaVuSans">user.email</font> '
    'et <font name="DejaVuSans">user.role</font>. Ces identifiants internes peuvent etre '
    'utilises pour l\'enumeration des comptes et des attaques ciblees. La reponse devrait '
    'etre limitee a un accusse de reception generique sans exposer les identifiants techniques.'
))

story.append(para(
    '<b>V-07 : Statut d\'installation publiquement queryable (MOYENNE)</b><br/>'
    'Le endpoint <font name="DejaVuSans">GET /api/auth/setup</font> retourne '
    '<font name="DejaVuSans">isFirstSetup</font> sans aucune authentification. '
    'Cette information permet a un attaquant de determiner si le systeme a deja ete '
    'configure, facilitant la reconnaissance avant une attaque plus ciblée.'
))

story.append(para(
    '<b>V-08 : Aucune verification email (MOYENNE)</b><br/>'
    'Les utilisateurs inscrits via le endpoint d\'enregistrement ne sont pas tenus de '
    'verifier la propriete de leur adresse email. Le champ <font name="DejaVuSans">emailVerified</font> '
    'est par defaut <font name="DejaVuSans">false</font>, mais aucune logique n\'empeche '
    'l\'utilisateur d\'acceder a l\'application. L\'admin initial du setup obtient '
    'automatiquement <font name="DejaVuSans">emailVerified: true</font>.'
))

story.append(para(
    '<b>Points positifs de l\'authentification :</b> La politique de mot de passe est robuste '
    '(8 caracteres minimum, 1 majuscule, 1 minuscule, 1 chiffre). Le hachage bcrypt utilise '
    '12 rounds de sel. Le rate limiting par email limite les tentatives de brute-force a '
    '10 pour 5 minutes. La strategie JWT avec un maxAge de 24 heures est appropriee. '
    'Le callback de session injecte correctement id, role, workspaceId et workspaceSlug '
    'dans le token JWT. L\'AuthProvider SessionProvider est correctement installe dans '
    'le layout racine.'
))

# ── 3.2 API ROUTES & DONNEES ─────────────────────────
story.append(heading('3.2 Protection des routes API et donnees', h2_style, 1))

story.append(para(
    '<b>V-14 : Assignation de masse dans POST /api/companies (MOYENNE)</b><br/>'
    'Bien que <font name="DejaVuSans">createCompanySchema</font> valide les champs '
    'principaux via Zod, 11 champs supplementaires sont lus directement depuis '
    '<font name="DejaVuSans">body</font> sans validation (lignes 90-101) : '
    '<font name="DejaVuSans">notes</font>, <font name="DejaVuSans">icpProfileId</font>, '
    '<font name="DejaVuSans">natureJuridique</font>, <font name="DejaVuSans">categorieEntreprise</font>, '
    '<font name="DejaVuSans">nafLabel</font>, <font name="DejaVuSans">dateImmatriculation</font>, '
    '<font name="DejaVuSans">statutEntreprise</font>, <font name="DejaVuSans">greffe</font>, '
    '<font name="DejaVuSans">trancheCA</font>, <font name="DejaVuSans">dateClotureExercice</font>, '
    '<font name="DejaVuSans">adresseComplete</font> et <font name="DejaVuSans">sizeRange</font>. '
    'Un attaquant pourrait injecter des valeurs arbitraires dans ces champs. '
    'La correction consiste a etendre le schema Zod pour inclure tous les champs.'
))

story.append(para(
    '<b>V-15 : Validation Zod absente sur PATCH /api/news/alerts (MOYENNE)</b><br/>'
    'Le handler PATCH des alertes news destructure directement '
    '<font name="DejaVuSans">{ id, isActive } = body</font> sans passer par un schema '
    'Zod. La valeur de <font name="DejaVuSans">isActive</font> pourrait etre de n\'importe '
    'quel type (string, array, objet) au lieu d\'un booleen, provoquant un comportement '
    'imprevisible dans la base de donnees.'
))

story.append(para(
    '<b>Points positifs des API :</b> Toutes les 17 routes API sont protegees par '
    '<font name="DejaVuSans">requireAuth()</font>. L\'isolation multi-tenant par workspaceId '
    'est correctement enforcee sur toutes les operations CRUD. Les verifications d\'appartenance '
    'au workspace sont effectuees avant chaque DELETE/PATCH. Le schema PUT de '
    '<font name="DejaVuSans">/api/companies/[id]</font> utilise correctement '
    '<font name="DejaVuSans">ALLOWED_COMPANY_UPDATE_FIELDS</font>. La protection CSRF par '
    'double-submit cookie est appliquee sur toutes les operations de mutation. Les schemas Zod '
    'sont utilises pour la majorite des entrees.'
))

# ── 3.3 INFRASTRUCTURE & CONFIGURATION ────────────────
story.append(heading('3.3 Infrastructure et configuration', h2_style, 1))

story.append(para(
    '<b>V-04 : NEXTAUTH_SECRET faible et previsible (HAUTE)</b><br/>'
    'La valeur actuelle du secret JWT est '
    '<font name="DejaVuSans">ds-k3y-s3cur3-r4nd0m-str1ng-f0r-d3alsc0p3-2025</font>, '
    'une chaine lisible et previsible. Ce secret signe tous les tokens de session JWT. '
    'S\'il est compromis, un attaquant peut forger des sessions avec n\'importe quel role, '
    'y compris admin, et prendre le controle total de la plateforme. En production, ce secret '
    'doit etre une chaine cryptographiquement aleatoire d\'au moins 32 octets, generee via '
    '<font name="DejaVuSans">openssl rand -base64 32</font> ou un equivalent securise.'
))

story.append(para(
    '<b>V-05 : SSRF et balayage de ports via Caddy (HAUTE)</b><br/>'
    'Le Caddyfile contient une fonctionnalite <font name="DejaVuSans">XTransformPort</font> '
    '(lignes 2-13) qui permet a quiconque de demander '
    '<font name="DejaVuSans">:81?XTransformPort=22</font> pour que le proxy reverse '
    'redirige la requete vers <font name="DejaVuSans">localhost:22</font> (SSH). Cette '
    'fonctionnalite est un vecteur d\'attaque SSRF permettant le balayage de ports internes, '
    'la detection de services (PostgreSQL, Redis, etc.) et potentiellement l\'acces non '
    'autorise a des services d\'administration internes. La correction est de supprimer '
    'completement cette fonctionnalite du Caddyfile.'
))

story.append(para(
    '<b>V-06 : Repertoire db/ non exclu du .gitignore (HAUTE)</b><br/>'
    'Le fichier <font name="DejaVuSans">.gitignore</font> exclut bien <font name="DejaVuSans">.env*</font> '
    'et <font name="DejaVuSans">node_modules</font>, mais le repertoire <font name="DejaVuSans">db/</font> '
    'contenant le fichier SQLite <font name="DejaVuSans">custom.db</font> n\'est pas exclu. '
    'Ce fichier contient tous les mots de passe haches, les donnees utilisateur, les entreprises '
    'cibles et tout l\'historique de la plateforme. Un commit accidentel exposerait '
    'l\'integralite des donnees de production.'
))

story.append(para(
    '<b>V-12 : Absence de TLS sur le reverse proxy (MOYENNE)</b><br/>'
    'Le Caddyfile ecoute sur le port HTTP 81 sans directive TLS. Caddy est capable de '
    'provisionner automatiquement des certificats TLS via Let\'s Encrypt, mais la '
    'configuration actuelle ne l\'utilise pas. Sans HTTPS, les tokens de session, les mots '
    'de passe et toutes les donnees sensibles transitent en clair sur le reseau, '
    'exposes a l\'ecoute (sniffing) par tout acteur du reseau.'
))

# ── 3.4 INJECTION ────────────────────────────────────
story.append(heading('3.4 Injection et validation des entrees', h2_style, 1))

story.append(para(
    '<b>V-10 : Injection partielle dans les parametres InfoGreffe (MOYENNE)</b><br/>'
    'La fonction <font name="DejaVuSans">sanitizeInput()</font> dans '
    '<font name="DejaVuSans">src/lib/infogreffe.ts</font> n\'est appliquee qu\'a '
    '<font name="DejaVuSans">query</font>, <font name="DejaVuSans">commune</font> et '
    '<font name="DejaVuSans">natureJuridique</font>. Les parametres '
    '<font name="DejaVuSans">codePostal</font>, <font name="DejaVuSans">departement</font>, '
    '<font name="DejaVuSans">region</font>, <font name="DejaVuSans">dateImmatBefore</font> '
    'et <font name="DejaVuSans">dateImmatAfter</font> sont interpolés directement dans '
    'les requetes vers l\'API InfoGreffe. Bien qu\'il ne s\'agisse pas d\'injection SQL '
    '(Prisma gere les requetes SQL de maniere parametree), cela pourrait permettre la '
    'manipulation des requetes de l\'API InfoGreffe et l\'exfiltration de donnees.'
))

story.append(para(
    '<b>V-11 : Requete non sanitissee vers API Gouv (MOYENNE)</b><br/>'
    'Dans <font name="DejaVuSans">src/lib/api-gouv.ts</font> (ligne 12), le parametre '
    '<font name="DejaVuSans">filters.query</font> est injecte directement dans le parametre '
    '<font name="DejaVuSans">q</font> de l\'URL de recherche. Un attaquant pourrait utiliser '
    'la syntaxe Elasticsearch-like (guillemets, operateurs AND/OR/NOT, parentheses) pour '
    'manipuler les resultats de recherche et potentiellement extraire des donnees au-dela '
    'du perimetre prevu.'
))

# ── 3.5 CLIENT-SIDE ─────────────────────────────────
story.append(heading('3.5 Securite cote client', h2_style, 1))

story.append(para(
    '<b>V-19 : dangerouslySetInnerHTML dans chart.tsx (FAIBLE)</b><br/>'
    'Le composant shadcn/ui <font name="DejaVuSans">chart.tsx</font> utilise '
    '<font name="DejaVuSans">dangerouslySetInnerHTML</font> pour injecter des styles CSS '
    'dans une balise <font name="DejaVuSans">&lt;style&gt;</font>. Le contenu est construit '
    'a partir d\'une constante statique (<font name="DejaVuSans">THEMES</font>) et de props '
    '(<font name="DejaVuSans">id</font> et <font name="DejaVuSans">colorConfig</font>). '
    'Le risque est faible car ces valeurs sont generalement statiques dans le contexte de '
    'DealScope, mais une utilisation malveillante du composant avec des props controlees par '
    'l\'utilisateur pourrait creer un vecteur XSS.'
))

story.append(para(
    '<b>V-20 : CSP affaiblie par unsafe-inline et unsafe-eval (INFO)</b><br/>'
    'La politique Content-Security-Policy dans le middleware (ligne 19) autorise '
    '<font name="DejaVuSans">\'unsafe-inline\'</font> et <font name="DejaVuSans">\'unsafe-eval\'</font> '
    'dans <font name="DejaVuSans">script-src</font>. Bien que ces directives soient '
    'necessaires pour le fonctionnement de Next.js (RSC, hot reload), elles affaiblissent '
    'significativement la protection contre les attaques XSS. En production, des nonce-based '
    'CSP ou des hash stricts pourraient etre envisages pour durcir cette politique.'
))

story.append(para(
    '<b>Points positifs client-side :</b> Aucune utilisation de <font name="DejaVuSans">eval()</font>, '
    '<font name="DejaVuSans">new Function()</font>, <font name="DejaVuSans">innerHTML=</font> ou '
    '<font name="DejaVuSans">document.write()</font> n\'a ete trouvee dans le code. Aucune '
    'utilisation de localStorage n\'a ete detectee (les donnees de session sont entierement '
    'gerées par les cookies JWT httpOnly). Le composant react-markdown n\'est pas actuellement '
    'utilise dans le code et aucun plugin rehype-raw n\'est configure.'
))

# ════════════════════════════════════════════════════════
# 4. PLAN DE REMEDIATION PRIORITAIRE
# ════════════════════════════════════════════════════════
story.append(heading('4. Plan de remédiation prioritaire', h1_style, 0))

story.append(para(
    'Les actions correctives sont classees en trois phases selon leur criticite. '
    'La Phase 1 (immediate) traite les vulnerabilites hautes pouvant etre exploitees '
    'de maniere directe. La Phase 2 (court terme) corrige les failles moyennes '
    'requérant des modifications plus substantielles. La Phase 3 (moyen terme) '
    'durecit l\'infrastructure et ameliore les mecanismes de defense en profondeur.'
))

story.append(Spacer(1, 10))
story.append(heading('4.1 Phase 1 - Actions immediates (0-24h)', h2_style, 1))

phase1_rows = [
    [Paragraph('V-04', td_center), Paragraph('Generer un secret JWT cryptographique', td_left),
     Paragraph('.env', td_left), Paragraph('HAUTE', td_center)],
    [Paragraph('V-05', td_center), Paragraph('Supprimer XTransformPort du Caddyfile', td_left),
     Paragraph('Caddyfile', td_left), Paragraph('HAUTE', td_center)],
    [Paragraph('V-06', td_center), Paragraph('Ajouter db/ au .gitignore', td_left),
     Paragraph('.gitignore', td_left), Paragraph('HAUTE', td_center)],
    [Paragraph('V-01', td_center), Paragraph('Valider callbackUrl (commence par /)', td_left),
     Paragraph('login/page.tsx:21', td_left), Paragraph('HAUTE', td_center)],
    [Paragraph('V-03', td_center), Paragraph('Ne pas retourner user.id/role dans la reponse', td_left),
     Paragraph('register/route.ts:88', td_left), Paragraph('HAUTE', td_center)],
]
story.append(Spacer(1, 8))
story.append(make_table(
    ['ID', 'Action', 'Fichier', 'Severite'],
    phase1_rows,
    [1.1*cm, 6.5*cm, 5*cm, 2.3*cm]
))
story.append(Spacer(1, 6))
story.append(Paragraph('<b>Tableau 3.</b> Actions correctives immediates', caption_style))

story.append(Spacer(1, 14))
story.append(heading('4.2 Phase 2 - Actions court terme (1-7 jours)', h2_style, 1))

phase2_rows = [
    [Paragraph('V-02', td_center), Paragraph('Ajouter code d\'invitation ou approbation admin pour inscription', td_left),
     Paragraph('register/route.ts', td_left), Paragraph('HAUTE', td_center)],
    [Paragraph('V-07', td_center), Paragraph('Exiger authentification pour GET /api/auth/setup', td_left),
     Paragraph('setup/route.ts', td_left), Paragraph('MOYENNE', td_center)],
    [Paragraph('V-08', td_center), Paragraph('Implementer envoi email de verification', td_left),
     Paragraph('register/page.tsx, register/route.ts', td_left), Paragraph('MOYENNE', td_center)],
    [Paragraph('V-12', td_center), Paragraph('Configurer TLS via Caddy (Let\'s Encrypt)', td_left),
     Paragraph('Caddyfile', td_left), Paragraph('MOYENNE', td_center)],
    [Paragraph('V-14', td_center), Paragraph('Etendre createCompanySchema pour tous les champs body', td_left),
     Paragraph('companies/route.ts', td_left), Paragraph('MOYENNE', td_center)],
    [Paragraph('V-15', td_center), Paragraph('Ajouter schema Zod pour PATCH /api/news/alerts', td_left),
     Paragraph('news/alerts/route.ts', td_left), Paragraph('MOYENNE', td_center)],
    [Paragraph('V-10', td_center), Paragraph('Appliquer sanitizeInput a tous les params InfoGreffe', td_left),
     Paragraph('infogreffe.ts', td_left), Paragraph('MOYENNE', td_center)],
    [Paragraph('V-11', td_center), Paragraph('Sanitiser/restrict query avant envoi API Gouv', td_left),
     Paragraph('api-gouv.ts', td_left), Paragraph('MOYENNE', td_center)],
]
story.append(Spacer(1, 8))
story.append(make_table(
    ['ID', 'Action', 'Fichier', 'Severite'],
    phase2_rows,
    [1.1*cm, 6.5*cm, 5*cm, 2.3*cm]
))
story.append(Spacer(1, 6))
story.append(Paragraph('<b>Tableau 4.</b> Actions correctives court terme', caption_style))

story.append(Spacer(1, 14))
story.append(heading('4.3 Phase 3 - Actions moyen terme (1-4 semaines)', h2_style, 1))

phase3_rows = [
    [Paragraph('V-13', td_center), Paragraph('Ajouter headers securite au niveau Caddy (defense en profondeur)', td_left),
     Paragraph('Caddyfile', td_left), Paragraph('MOYENNE', td_center)],
    [Paragraph('V-09', td_center), Paragraph('Utiliser un secret dedie pour les reset tokens', td_left),
     Paragraph('forgot-password/route.ts', td_left), Paragraph('MOYENNE', td_center)],
    [Paragraph('V-16', td_center), Paragraph('Remplacer details: String(error) par des messages generiques', td_left),
     Paragraph('Toutes les routes API', td_left), Paragraph('FAIBLE', td_center)],
    [Paragraph('V-17', td_center), Paragraph('Valider le format du SIREN (9 chiffres) avant utilisation', td_left),
     Paragraph('infogreffe.ts:99', td_left), Paragraph('FAIBLE', td_center)],
    [Paragraph('V-18', td_center), Paragraph('Securiser le batch enrich contre le Host spoofing', td_left),
     Paragraph('enrich/route.ts:149', td_left), Paragraph('FAIBLE', td_center)],
    [Paragraph('V-20', td_center), Paragraph('Migrer vers nonce-based CSP en production', td_left),
     Paragraph('middleware.ts', td_left), Paragraph('INFO', td_center)],
]
story.append(Spacer(1, 8))
story.append(make_table(
    ['ID', 'Action', 'Fichier', 'Severite'],
    phase3_rows,
    [1.1*cm, 6.5*cm, 5*cm, 2.3*cm]
))
story.append(Spacer(1, 6))
story.append(Paragraph('<b>Tableau 5.</b> Actions correctives moyen terme', caption_style))

# ════════════════════════════════════════════════════════
# 5. POSTURE DE SECURITE ACTUELLE
# ════════════════════════════════════════════════════════
story.append(heading('5. Posture de securite actuelle', h1_style, 0))

story.append(para(
    'Malgre les vulnerabilites identifiees, la plateforme DealScope possede une base de '
    'securite solide dans plusieurs domaines critiques. Le tableau suivant resume les '
    'mesures de protection actuellement en place et leur niveau d\'efficacite.'
))

story.append(Spacer(1, 10))

posture_rows = [
    [Paragraph('Authentification', td_left), Paragraph('NextAuth v5 + Credentials + JWT 24h', td_left),
     Paragraph('<b>Operationnel</b>', td_center)],
    [Paragraph('Hachage mots de passe', td_left), Paragraph('bcryptjs, 12 rounds de sel', td_left),
     Paragraph('<b>Fort</b>', td_center)],
    [Paragraph('Protection brute-force', td_left), Paragraph('Rate limiting 10 req/5min par email', td_left),
     Paragraph('<b>Moyen</b>', td_center)],
    [Paragraph('Politique de mot de passe', td_left), Paragraph('8+ chars, majuscule, minuscule, chiffre', td_left),
     Paragraph('<b>Fort</b>', td_center)],
    [Paragraph('CSRF', td_left), Paragraph('Double-submit cookie (x-csrf-token)', td_left),
     Paragraph('<b>Operationnel</b>', td_center)],
    [Paragraph('Rate limiting API', td_left), Paragraph('In-memory, 10-20 req/min selon endpoints', td_left),
     Paragraph('<b>Moyen</b>', td_center)],
    [Paragraph('Headers securite', td_left), Paragraph('CSP, HSTS, X-Frame-Options, X-Content-Type-Options', td_left),
     Paragraph('<b>Operationnel</b>', td_center)],
    [Paragraph('Isolation multi-tenant', td_left), Paragraph('workspaceId sur toutes les requetes', td_left),
     Paragraph('<b>Operationnel</b>', td_center)],
    [Paragraph('Validation des entrees', td_left), Paragraph('Zod v4 sur la plupart des endpoints', td_left),
     Paragraph('<b>Bon</b>', td_center)],
    [Paragraph('Protection injections SQL', td_left), Paragraph('Prisma ORM (requetes parametrees)', td_left),
     Paragraph('<b>Fort</b>', td_center)],
    [Paragraph('Donnees sensibles cote client', td_left), Paragraph('Aucune utilisation de localStorage', td_left),
     Paragraph('<b>Fort</b>', td_center)],
    [Paragraph('Indices de performance DB', td_left), Paragraph('14 index composites sur les tables principales', td_left),
     Paragraph('<b>Bon</b>', td_center)],
    [Paragraph('Migrations de schema', td_left), Paragraph('Prisma migrations versionnees (0_init)', td_left),
     Paragraph('<b>Bon</b>', td_center)],
    [Paragraph('Secret JWT', td_left), Paragraph('Chaine previsible, non cryptographique', td_left),
     Paragraph('<b>Faible</b>', td_center)],
    [Paragraph('Chiffrement en transit', td_left), Paragraph('HTTP uniquement (pas de TLS)', td_left),
     Paragraph('<b>Faible</b>', td_center)],
    [Paragraph('Controle d\'acces registration', td_left), Paragraph('Ouvert sans verification ni approbation', td_left),
     Paragraph('<b>Faible</b>', td_center)],
    [Paragraph('Verification email', td_left), Paragraph('Non implementee', td_left),
     Paragraph('<b>Absent</b>', td_center)],
    [Paragraph('Audit logging', td_left), Paragraph('Non implemente', td_left),
     Paragraph('<b>Absent</b>', td_center)],
]
story.append(make_table(
    ['Controle', 'Implementation actuelle', 'Niveau'],
    posture_rows,
    [4.5*cm, 7.5*cm, 3.5*cm]
))
story.append(Spacer(1, 6))
story.append(Paragraph('<b>Tableau 6.</b> Matrice de posture de securite', caption_style))

# ════════════════════════════════════════════════════════
# 6. METHODOLOGIE ET PERIMETRE
# ════════════════════════════════════════════════════════
story.append(heading('6. Methodologie et perimetre d\'audit', h1_style, 0))

story.append(para(
    'Cet audit a ete realise par analyse statique du code source complet de la plateforme '
    'DealScope. L\'ensemble des fichiers source (plus de 80 fichiers), des configurations '
    'd\'infrastructure, des dependances et des variables d\'environnement ont ete examines '
    'systematiquement. L\'audit a suivi la methodologie OWASP Application Security '
    'Verification Standard (ASVS) avec un focus sur les 10 categories OWASP Top 10 (2021) : '
    'controle d\'acces casse, echecs cryptographiques, injection, conception insecurise, '
    'misconfiguration de securite, composants vulnerables, authentification et gestion '
    'des sessions identifiees de maniere incorrecte, integrite et confidentialite des donnees, '
    'et logging/monitoring insuffisant.'
))

story.append(para(
    '<b>Perimetre couvert :</b> L\'ensemble du code source de l\'application (80+ fichiers), '
    'le schema Prisma (12 modeles, 225 lignes), les 17 routes API, les 5 pages d\'authentification, '
    'le middleware Next.js, la configuration Caddy, les variables d\'environnement, '
    'le fichier <font name="DejaVuSans">.gitignore</font>, les 82 dependances npm, '
    'et les 8 composants principaux de l\'interface utilisateur.'
))

story.append(para(
    '<b>Perimetre exclu :</b> Tests de peneration reseau (l\'audit est purement statique), '
    'analyse de vulnerabilites des dependances via Snyk/NPM audit, tests de charge/stress, '
    'analyse du code compile en production (bundle JavaScript), revue des permissions '
    'du systeme de fichiers du serveur, et audit de la chaine CI/CD.'
))

# ── Build ────────────────────────────────────────────
doc.multiBuild(story)
print(f'PDF genere : {output_path}')
