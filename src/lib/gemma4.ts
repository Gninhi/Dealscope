/**
 * Gemma 4 AI Service Module for DealScope
 *
 * Wraps the z-ai-web-dev-sdk with specialized prompts for French M&A operations.
 * All system prompts are in French, tailored for M&A analysts working on the French market.
 *
 * Architecture: Singleton pattern ensures a single ZAI client instance per server process,
 * avoiding connection overhead and enabling efficient resource management.
 */

import ZAI from 'z-ai-web-dev-sdk';

// ─── Types ─────────────────────────────────────────────────────────────────

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatOptions {
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export interface CompanyData {
  name?: string;
  siren?: string;
  sector?: string;
  nafCode?: string;
  nafLabel?: string;
  revenue?: number | null;
  employeeCount?: number | string | null;
  city?: string;
  region?: string;
  dateImmatriculation?: string;
  natureJuridique?: string;
  categorieEntreprise?: string;
  trancheCA?: string;
  status?: string;
  notes?: string;
  [key: string]: unknown;
}

export interface SearchCriteria {
  query?: string;
  sector?: string;
  region?: string;
  employeeRange?: string;
  revenueRange?: string;
  legalForms?: string[];
  nafCodes?: string[];
  keywords?: string[];
}

export interface DealSummary {
  id?: string;
  companyName?: string;
  stage?: string;
  revenue?: number;
  sector?: string;
  notes?: string;
  [key: string]: unknown;
}

export interface ICPProfile {
  id?: string;
  name?: string;
  criteria?: Record<string, unknown>;
  weights?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface ICPScoreResult {
  score: number;
  breakdown: {
    sector: { match: boolean; weight: number; detail: string };
    size: { match: boolean; weight: number; detail: string };
    revenue: { match: boolean; weight: number; detail: string };
    location: { match: boolean; weight: number; detail: string };
    maturity: { match: boolean; weight: number; detail: string };
  };
  summary: string;
  strengths: string[];
  weaknesses: string[];
}

export interface OutreachEmail {
  subject: string;
  body: string;
  tone: string;
  keyPoints: string[];
}

export interface Gemma4Response {
  content: string;
  model: string;
  timestamp: string;
}

// ─── Error Handling ────────────────────────────────────────────────────────

export class Gemma4Error extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500,
  ) {
    super(message);
    this.name = 'Gemma4Error';
  }
}

// ─── Core Service ──────────────────────────────────────────────────────────

export class Gemma4Service {
  private static instance: Gemma4Service | null = null;
  private zai: Awaited<ReturnType<typeof ZAI.create>> | null = null;
  private readonly modelIdentifier = 'GEMMA_4';

  private constructor() {}

  /**
   * Singleton access — ensures a single ZAI client instance per server process.
   */
  public static getInstance(): Gemma4Service {
    if (!Gemma4Service.instance) {
      Gemma4Service.instance = new Gemma4Service();
    }
    return Gemma4Service.instance;
  }

  /**
   * Lazily initializes the ZAI SDK client.
   */
  private async getClient() {
    if (!this.zai) {
      try {
        this.zai = await ZAI.create();
      } catch (error) {
        throw new Gemma4Error(
          'Impossible d\'initialiser le client IA. Vérifiez la configuration.',
          'INIT_FAILED',
          503,
        );
      }
    }
    return this.zai;
  }

  /**
   * Execute a chat completion with the ZAI SDK.
   */
  async complete(
    messages: ChatMessage[],
    options: ChatOptions = {},
  ): Promise<Gemma4Response> {
    const client = await this.getClient();

    const { temperature = 0.7, systemPrompt, maxTokens } = options;

    const systemMessage = systemPrompt
      ? { role: 'system' as const, content: systemPrompt }
      : undefined;

    const allMessages = [
      systemMessage,
      ...messages.filter(m => m.role !== 'system'),
    ].filter(Boolean);

    try {
      const payload: Record<string, unknown> = {
        messages: allMessages,
      };

      if (temperature !== undefined && temperature !== null) {
        payload.temperature = temperature;
      }
      if (maxTokens !== undefined && maxTokens !== null) {
        payload.max_tokens = maxTokens;
      }

      const completion = await client.chat.completions.create(
        payload as Parameters<typeof client.chat.completions.create>[0],
      );

      const content = completion.choices?.[0]?.message?.content;

      if (!content) {
        throw new Gemma4Error(
          'Aucune réponse générée par le modèle.',
          'EMPTY_RESPONSE',
          502,
        );
      }

      return {
        content,
        model: this.modelIdentifier,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof Gemma4Error) throw error;

      const message =
        error instanceof Error ? error.message : 'Erreur interne du service IA';
      throw new Gemma4Error(
        `Erreur lors de la génération: ${message}`,
        'COMPLETION_FAILED',
        502,
      );
    }
  }

  /**
   * Parse a JSON response from the AI model, with fallback handling.
   */
  private parseJSONResponse<T>(content: string, fallback: T): T {
    try {
      return JSON.parse(content) as T;
    } catch {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch?.[1]) {
        try {
          return JSON.parse(jsonMatch[1].trim()) as T;
        } catch {
          // Fall through
        }
      }

      const braceMatch = content.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
      if (braceMatch?.[1]) {
        try {
          return JSON.parse(braceMatch[1]) as T;
        } catch {
          // Fall through
        }
      }

      console.warn('[Gemma4Service] Failed to parse JSON from AI response, using fallback');
      return fallback;
    }
  }

  // ─── Public API Methods ──────────────────────────────────────────────────

  /**
   * General chat completion.
   * Uses the default M&A assistant system prompt unless overridden.
   */
  async chat(
    messages: ChatMessage[],
    options: ChatOptions = {},
  ): Promise<Gemma4Response> {
    const defaultSystemPrompt = this.buildBaseSystemPrompt();
    const systemPrompt = options.systemPrompt || defaultSystemPrompt;

    return this.complete(messages, { ...options, systemPrompt });
  }

  /**
   * Analyze a company for M&A relevance.
   */
  async analyzeCompany(companyData: CompanyData): Promise<Gemma4Response> {
    const systemPrompt = `Tu es GEMMA_4, un moteur d'analyse IA spécialisé dans les fusions et acquisitions (M&A) en France.

Tu analyses des entreprises pour évaluer leur pertinence en tant que cible M&A. Tu fournis une analyse structurée et approfondie.

Pour chaque analyse, tu dois fournir:
1. **Profil de l'entreprise** — Résumé des informations clés
2. **Forces M&A** — Atouts pour une acquisition (taille, croissance, positionnement, etc.)
3. **Signaux d'opportunité** — Éléments suggérant une ouverture à une transaction
4. **Risques identifiés** — Points de vigilance (litiges, dépendances, marché, etc.)
5. **Note de pertinence** — Score de 1 à 10 avec justification
6. **Recommandations** — Actions suggérées pour l'équipe M&A

Réponds toujours en français. Sois précis et professionnel. Utilise des données chiffrées quand disponibles.
Format de réponse en JSON valide avec les clés: profile, strengths, opportunities, risks, relevanceScore, recommendations.`;

    const userMessage = `Analyse cette entreprise pour une perspective M&A:

${JSON.stringify(companyData, null, 2)}

Fournis une analyse complète et structurée au format JSON.`;

    return this.complete(
      [{ role: 'user', content: userMessage }],
      { systemPrompt, temperature: 0.4 },
    );
  }

  /**
   * Convert natural language description to structured search criteria.
   */
  async generateSearchCriteria(description: string): Promise<Gemma4Response> {
    const systemPrompt = `Tu es GEMMA_4, un assistant IA spécialisé dans la recherche de cibles M&A en France.

Tu convertis des descriptions en langage naturel en critères de recherche structurés pour la base de données française des entreprises (SIRENE, INPI, etc.).

Tu dois retourner un objet JSON avec les champs suivants:
- "query": string — Requête de recherche principale
- "sector": string — Secteur d'activité (NAF/APE code ou nom de secteur)
- "region": string — Région ou département français
- "employeeRange": string — Tranche d'effectif
- "revenueRange": string — Fourchette de chiffre d'affaires
- "legalForms": string[] — Formes juridiques pertinentes
- "nafCodes": string[] — Codes NAF/APE pertinents
- "keywords": string[] — Mots-clés additionnels

Réponds UNIQUEMENT en JSON valide, sans texte additionnel. Tout en français.`;

    const userMessage = `Convertis cette description en critères de recherche structurés pour trouver des cibles M&A:

"${description}"

Retourne les critères au format JSON.`;

    return this.complete(
      [{ role: 'user', content: userMessage }],
      { systemPrompt, temperature: 0.3 },
    );
  }

  /**
   * Summarize a list of pipeline deals.
   */
  async summarizeDeals(deals: DealSummary[]): Promise<Gemma4Response> {
    const systemPrompt = `Tu es GEMMA_4, un assistant IA spécialisé dans l'analyse de pipeline M&A en France.

Tu résumes et analyses un ensemble de deals en cours pour donner une vision claire à l'équipe M&A. Tu identifies:
1. Les tendances sectorielles
2. Les deals prioritaires
3. Les goulets d'étranglement
4. Les statistiques clés du pipeline

Tu parles français et tu es concis. Utilise des données chiffrées. Structure ta réponse clairement avec des sections.`;

    const dealData = deals
      .map((d, i) => `${i + 1}. ${d.companyName || 'Entreprise'} — Étape: ${d.stage || 'N/A'}, CA: ${d.revenue ? `${d.revenue}€` : 'N/A'}, Secteur: ${d.sector || 'N/A'}${d.notes ? `\n   Notes: ${d.notes}` : ''}`)
      .join('\n');

    const userMessage = `Voici les deals en cours du pipeline M&A:

${dealData}

Fournis un résumé analytique du pipeline avec:
- Vue d'ensemble (nombre de deals, répartition par étape, CA total estimé)
- Tendances sectorielles
- Top 3 deals prioritaires avec justification
- Points de vigilance et recommandations`;

    return this.complete(
      [{ role: 'user', content: userMessage }],
      { systemPrompt, temperature: 0.5 },
    );
  }

  /**
   * Score a company against an ICP (Ideal Customer Profile).
   */
  async scoreICP(
    companyData: CompanyData,
    profileCriteria: ICPProfile,
  ): Promise<Gemma4Response> {
    const systemPrompt = `Tu es GEMMA_4, un moteur de scoring IA pour l'évaluation de cibles M&A en France.

Tu compares une entreprise à un profil ICP (Ideal Customer Profile) et calcules un score de pertinence de 0 à 100.

Tu dois analyser les dimensions suivantes:
1. **Secteur** — Correspondance du secteur d'activité
2. **Taille** — Adéquation de la taille de l'entreprise (effectif)
3. **Chiffre d'affaires** — Alignement du CA avec les attentes
4. **Localisation** — Pertinence géographique
5. **Maturité** — Adéquation de la maturité de l'entreprise

Tu retournes un objet JSON avec:
- "score": number (0-100)
- "breakdown": { sector: {match, weight, detail}, size: {match, weight, detail}, revenue: {match, weight, detail}, location: {match, weight, detail}, maturity: {match, weight, detail} }
- "summary": string
- "strengths": string[]
- "weaknesses": string[]

Réponds UNIQUEMENT en JSON valide.`;

    const userMessage = `Évalue cette entreprise par rapport au profil ICP:

**Entreprise:**
${JSON.stringify(companyData, null, 2)}

**Profil ICP: "${profileCriteria.name || 'Profil par défaut'}"**
${JSON.stringify(profileCriteria.criteria || {}, null, 2)}

**Pondérations:**
${JSON.stringify(profileCriteria.weights || {}, null, 2)}

Fournis le score ICP au format JSON.`;

    return this.complete(
      [{ role: 'user', content: userMessage }],
      { systemPrompt, temperature: 0.3 },
    );
  }

  /**
   * Score a company as an M&A target using AI (0-100).
   * Lightweight scoring used by the scan pipeline.
   */
  async scoreCompanyMA(
    companyName: string,
    sector: string,
    category: string,
    legalForm: string,
  ): Promise<number | null> {
    try {
      const response = await this.complete(
        [{
          role: 'user',
          content: `Évalue cette entreprise comme cible M&A (score 0-100) : ${companyName}, Secteur: ${sector}, Catégorie: ${category}, Forme juridique: ${legalForm}. Réponds UNIQUEMENT avec un nombre entre 0 et 100.`,
        }],
        {
          systemPrompt: 'Tu es un assistant de scoring M&A. Évalue les entreprises de 0 à 100 selon leur attractivité comme cible d\'acquisition. Réponds UNIQUEMENT avec un nombre entre 0 et 100.',
          temperature: 0.2,
        },
      );

      const parsed = parseInt(response.content.trim(), 10);
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) {
        return parsed;
      }
      return null;
    } catch (error) {
      console.error('[Gemma4Service] AI scoring failed:', error);
      return null;
    }
  }

  /**
   * Generate a personalized outreach email for M&A prospecting.
   */
  async generateOutreachEmail(
    companyData: CompanyData,
    context: {
      senderName?: string;
      senderCompany?: string;
      objective?: string;
      tone?: string;
      previousInteraction?: string;
      highlights?: string[];
    } = {},
  ): Promise<Gemma4Response> {
    const systemPrompt = `Tu es GEMMA_4, un assistant IA spécialisé dans la rédaction d'emails de prospection M&A en France.

Tu rédiges des emails professionnels, personnalisés et convaincants. Tes emails sont:
- Concis (200-300 mots maximum)
- Personnalisés avec des données réelles
- Professionnels mais chaleureux
- Orientés vers un objectif clair
- Conformes aux bonnes pratiques B2B en France

Tu retournes un objet JSON avec:
- "subject": string (max 80 caractères)
- "body": string (corps de l'email)
- "tone": string
- "keyPoints": string[]

Réponds UNIQUEMENT en JSON valide. Tout en français.`;

    const highlights = context.highlights
      ? context.highlights.join('\n  - ')
      : 'Non spécifiés';

    const userMessage = `Rédige un email de prospection M&A personnalisé.

**Entreprise cible:**
- Nom: ${companyData.name || 'Non renseigné'}
- Secteur: ${companyData.sector || 'Non renseigné'}
- Ville: ${companyData.city || 'Non renseigné'}
- Effectif: ${companyData.employeeCount ?? 'Non renseigné'}
- CA: ${companyData.revenue ? `${companyData.revenue}€` : 'Non renseigné'}

**Contexte:**
- Expéditeur: ${context.senderName || 'Non renseigné'} (${context.senderCompany || 'Non renseigné'})
- Objectif: ${context.objective || 'Prendre contact'}
- Ton: ${context.tone || 'Professionnel et chaleureux'}

Rédige l'email au format JSON.`;

    return this.complete(
      [{ role: 'user', content: userMessage }],
      { systemPrompt, temperature: 0.7 },
    );
  }

  // ─── Helper Methods ──────────────────────────────────────────────────────

  /**
   * Build the base system prompt for the chat assistant.
   */
  private buildBaseSystemPrompt(): string {
    return `Tu es DealScope AI, propulsé par GEMMA_4, un assistant intelligent spécialisé dans les fusions et acquisitions (M&A) en France.

Tu aides les analystes M&A à:
1. Analyser des entreprises cibles potentielles
2. Évaluer la pertinence des cibles par rapport aux profils ICP
3. Identifier des signaux d'opportunité
4. Fournir des insights sur les secteurs d'activité français
5. Aider à la qualification de cibles
6. Générer des critères de recherche structurés
7. Rédiger des emails de prospection personnalisés

Tu parles français et tu es concis et professionnel. Quand on te donne des données financières, analyse-les avec rigueur.
Réponds toujours en français.`;
  }
}

// ─── Convenience Export ─────────────────────────────────────────────────────

export function getGemma4(): Gemma4Service {
  return Gemma4Service.getInstance();
}

export default Gemma4Service;
