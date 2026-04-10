// ─── News Service Premium ─────────────────────────────────────────────────
// Real-time M&A news aggregation with multi-source enrichment
// Premium UI-ready data with sentiment analysis and smart categorization

// ── Types ────────────────────────────────────────────────────────
export interface NewsItem {
  id: string;
  title: string;
  snippet: string;
  summary?: string;
  url: string;
  hostName: string;
  favicon: string;
  date: string;
  publishedAt: string;
  category: string;
  source: 'premium' | 'verified' | 'standard';
  sourceName: string;
  sourceIcon?: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  dealValue?: string;
  dealCurrency?: string;
  companies?: string[];
  sectors?: string[];
  countries?: string[];
  isBreaking?: boolean;
  isPremium?: boolean;
  readTime?: number;
  imageUrl?: string;
  author?: string;
  tags?: string[];
  _demo?: boolean;
}

export interface NewsCategory {
  key: string;
  label: string;
  color: string;
  gradient: string;
  icon: string;
}

export interface FetchNewsResult {
  results: NewsItem[];
  total: number;
  category: string;
  cached?: boolean;
  demo?: boolean;
  lastUpdated: string;
  sources: string[];
}

// ── 8 Premium M&A categories ────────────────────────────────────────────
export const CATEGORIES: readonly NewsCategory[] = [
  { key: 'all', label: 'Tout', color: '#6366f1', gradient: 'from-indigo-500 to-purple-600', icon: 'Grid' },
  { key: 'deals_clos', label: 'Deals clos', color: '#10b981', gradient: 'from-emerald-500 to-teal-600', icon: 'CheckCircle' },
  { key: 'en_cours', label: 'En cours', color: '#f59e0b', gradient: 'from-amber-500 to-orange-600', icon: 'Clock' },
  { key: 'marche', label: 'Marché', color: '#3b82f6', gradient: 'from-blue-500 to-cyan-600', icon: 'TrendingUp' },
  { key: 'tech', label: 'Tech & Digital', color: '#8b5cf6', gradient: 'from-violet-500 to-purple-600', icon: 'Cpu' },
  { key: 'pe_lbo', label: 'LBO & PE', color: '#ec4899', gradient: 'from-pink-500 to-rose-600', icon: 'Briefcase' },
  { key: 'reglementaire', label: 'Réglementaire', color: '#ef4444', gradient: 'from-red-500 to-orange-600', icon: 'Scale' },
  { key: 'sectoriel', label: 'Sectoriel', color: '#14b8a6', gradient: 'from-teal-500 to-emerald-600', icon: 'Building2' },
];

// ── Premium News Sources ──────────────────────────────────────────────
const PREMIUM_SOURCES = {
  reuters: { name: 'Reuters', tier: 'premium', icon: 'newspaper' },
  bloomberg: { name: 'Bloomberg', tier: 'premium', icon: 'chart-bar' },
  ft: { name: 'Financial Times', tier: 'premium', icon: 'newspaper' },
  lesechos: { name: 'Les Échos', tier: 'premium', icon: 'newspaper' },
  handelsblatt: { name: 'Handelsblatt', tier: 'premium', icon: 'newspaper' },
  mergermarket: { name: 'Mergermarket', tier: 'premium', icon: 'trending-up' },
  pitchbook: { name: 'PitchBook', tier: 'verified', icon: 'database' },
  techcrunch: { name: 'TechCrunch', tier: 'verified', icon: 'cpu' },
  sifted: { name: 'Sifted', tier: 'verified', icon: 'globe' },
};

// ── European M&A queries (FR, EN, DE, IT) ──────────────────────────────
export const QUERIES: Record<string, string[]> = {
  deals_clos: [
    'M&A deal completed Europe 2025',
    'fusion acquisition France 2025 annonce finalisée',
    'acquisition closed Europe announced',
    'Unternehmenskauf Deutschland 2025 abgeschlossen',
    'operazione fusione Italia 2025 completata',
    'buyout completed UK Europe 2025',
  ],
  en_cours: [
    'M&A deal pending Europe 2025',
    'due diligence acquisition France 2025',
    'takeover bid Europe 2025',
    'OPA offre publique Europe',
    'Fusion Verhandlung Deutschland 2025',
    'exclusive talks acquisition Europe',
  ],
  marche: [
    'M&A market trends Europe 2025 statistics',
    'marché fusion acquisition France tendances 2025',
    'European M&A volume Q1 2025',
    'Fusionsmarkt Europa Trends 2025',
    'M&A multiples EV/EBITDA Europe 2025',
    'private equity market outlook Europe',
  ],
  tech: [
    'tech startup acquisition Europe 2025',
    'acquisition startup IA France Europe 2025',
    'M&A SaaS Europe 2025',
    'software buyout Europe 2025',
    'fintech merger acquisition Europe',
    'AI company acquisition Europe 2025',
  ],
  pe_lbo: [
    'private equity deal Europe 2025',
    'LBO France Europe 2025',
    'leveraged buyout fund Europe 2025',
    'Private Equity Rekordjahr Europa 2025',
    'PE buyout UK mid-market 2025',
    'fundraising private equity Europe 2025',
  ],
  reglementaire: [
    'EU merger regulation 2025',
    'réglementation fusion acquisition AMF Europe',
    'European competition authority merger 2025',
    'antitrust EU merger control 2025',
    'Fusionskontrolle Europa 2025',
    'CMA merger clearance UK 2025',
  ],
  sectoriel: [
    'healthcare pharma M&A Europe 2025',
    'energy infrastructure merger Europe 2025',
    'industrial M&A Europe deal 2025',
    'retail acquisition Europe 2025',
    'banque assurance fusion Europe 2025',
    'automotive M&A Europe 2025',
  ],
};

// ── RSS Feeds Premium ────────────────────────────────────────────────────
export const RSS_FEEDS: Record<string, string[]> = {
  deals_clos: [
    'https://news.google.com/rss/search?q=M%26A+deals+completed+Europe+2025&hl=en&gl=GB&ceid=GB:en',
    'https://news.google.com/rss/search?q=fusion+acquisition+France+2025+annonc%C3%A9e&hl=fr&gl=FR&ceid=FR:fr',
    'https://news.google.com/rss/search?q=Unternehmenskauf+Deutschland+2025&hl=de&gl=DE&ceid=DE:de',
    'https://news.google.com/rss/search?q=fusione+acquisizione+Italia+2025&hl=it&gl=IT&ceid=IT:it',
  ],
  en_cours: [
    'https://news.google.com/rss/search?q=M%26A+deal+pending+Europe+2025&hl=en&gl=GB&ceid=GB:en',
    'https://news.google.com/rss/search?q=OPA+offre+publique+achat+France&hl=fr&gl=FR&ceid=FR:fr',
    'https://news.google.com/rss/search?q=takeover+bid+UK+Europe+2025&hl=en&gl=GB&ceid=GB:en',
  ],
  marche: [
    'https://news.google.com/rss/search?q=M%26A+market+trends+Europe+2025&hl=en&gl=GB&ceid=GB:en',
    'https://news.google.com/rss/search?q=march%C3%A9+fusions+acquisitions+tendances+2025&hl=fr&gl=FR&ceid=FR:fr',
    'https://news.google.com/rss/search?q=Fusionsmarkt+Europa+2025&hl=de&gl=DE&ceid=DE:de',
  ],
  tech: [
    'https://news.google.com/rss/search?q=tech+startup+acquisition+Europe+2025&hl=en&gl=GB&ceid=GB:en',
    'https://news.google.com/rss/search?q=acquisition+startup+IA+France+2025&hl=fr&gl=FR&ceid=FR:fr',
    'https://news.google.com/rss/search?q=SaaS+buyout+Europe+2025&hl=en&gl=GB&ceid=GB:en',
  ],
  pe_lbo: [
    'https://news.google.com/rss/search?q=private+equity+deal+Europe+2025&hl=en&gl=GB&ceid=GB:en',
    'https://news.google.com/rss/search?q=LBO+France+2025&hl=fr&gl=FR&ceid=FR:fr',
    'https://news.google.com/rss/search?q=Leveraged+Buyout+Deutschland+2025&hl=de&gl=DE&ceid=DE:de',
  ],
  reglementaire: [
    'https://news.google.com/rss/search?q=EU+merger+regulation+2025&hl=en&gl=GB&ceid=GB:en',
    'https://news.google.com/rss/search?q=r%C3%A9glementation+AMF+fusions&hl=fr&gl=FR&ceid=FR:fr',
    'https://news.google.com/rss/search?q=EU+antitrust+merger+2025&hl=en&gl=GB&ceid=GB:en',
  ],
  sectoriel: [
    'https://news.google.com/rss/search?q=healthcare+M%26A+Europe+2025&hl=en&gl=GB&ceid=GB:en',
    'https://news.google.com/rss/search?q=energy+merger+acquisition+Europe&hl=en&gl=GB&ceid=GB:en',
    'https://news.google.com/rss/search?q=pharma+M%26A+Europe+2025&hl=en&gl=GB&ceid=GB:en',
  ],
};

// ── Cache ─────────────────────────────────────────────────────────
const cache = new Map<string, { data: NewsItem[]; ts: number; sources: string[] }>();
const TTL = 5 * 60 * 1000; // 5 minutes for real-time feel

// ── Safety limits ───────────────────────────────────────────────
const MAX_TITLE_LENGTH = 200;
const MAX_SNIPPET_LENGTH = 500;
const RSS_FETCH_TIMEOUT_MS = 15_000;

// ── Generate unique ID ───────────────────────────────────────────
let idCounter = 0;
function generateId(url: string, title: string): string {
  idCounter++;
  const hash = Buffer.from(`${url}:${title.slice(0, 50)}`).toString('base64').replace(/[+/=]/g, '').slice(0, 12);
  return `news_${hash}_${idCounter}_${Date.now()}`;
}

// ── Extract deal value from text ───────────────────────────────────
function extractDealValue(text: string): { value: string; currency: string } | null {
  const patterns = [
    /€(\d+(?:[.,]\d+)?)\s*(?:billion|bn|milliards?|Md)/i,
    /\$(\d+(?:[.,]\d+)?)\s*(?:billion|bn)/i,
    /£(\d+(?:[.,]\d+)?)\s*(?:billion|bn)/i,
    /(\d+(?:[.,]\d+)?)\s*(?:millions?|m|M€|M\$)/i,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const value = match[1].replace(',', '.');
      if (text.includes('€') || text.includes('EUR') || text.includes('milliard')) {
        return { value, currency: 'EUR' };
      }
      if (text.includes('$') || text.includes('USD')) {
        return { value, currency: 'USD' };
      }
      if (text.includes('£') || text.includes('GBP')) {
        return { value, currency: 'GBP' };
      }
      return { value, currency: 'EUR' };
    }
  }
  return null;
}

// ── Extract companies from text ───────────────────────────────────
function extractCompanies(text: string): string[] {
  const companyPatterns = [
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:\s+(?:Group|SA|SAS|GmbH|AG|Ltd|Inc|Corp|LLC))?)/g,
  ];
  
  const companies: string[] = [];
  for (const pattern of companyPatterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const company = match[1].trim();
      if (company.length > 3 && company.length < 50 && !/^(The|This|That|These|Those|When|Where|Which|While)$/.test(company)) {
        companies.push(company);
      }
    }
  }
  return [...new Set(companies)].slice(0, 5);
}

// ── Analyze sentiment ─────────────────────────────────────────────
function analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
  const positive = /success|growth|surge|record|strong|expansion|launch|complete|acquire|win|boost|rise|gain/i;
  const negative = /fail|loss|decline|drop|cut|concern|risk|warn|fall|struggle|threat|challenge/i;
  
  const t = text.toLowerCase();
  if (positive.test(t)) return 'positive';
  if (negative.test(t)) return 'negative';
  return 'neutral';
}

// ── Calculate read time ───────────────────────────────────────────
function calculateReadTime(text: string): number {
  const words = text.split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

// ── Categorize article ────────────────────────────────────────────
export function categorize(title: string, snippet: string, fallback: string): string {
  const t = `${title} ${snippet}`.toLowerCase();
  
  if (/(?:deal|transaction|conclu|finalisé|achevé|completed|announced|geschlossen|completata|acquis|acquired|acquire|buys|bought|rachat|vend|sold)/.test(t) &&
      /(?:fusion|acquisition|merger|buyout|kauf|fusione|acquisizione)/.test(t))
    return 'deals_clos';
  
  if (/due.diligence|négociation|en.cours|mandat|takeover|bid|pending|negoziazione|verhandlung|Übernahme|offerta|exclusive.talks/.test(t))
    return 'en_cours';
  
  if (/marché|volume|tendance|croissance|prévision|statistique|market|trend|multiples|ebitda|valuation|marktentwicklung|Prognose|outlook/.test(t))
    return 'marche';
  
  if (/tech|saas|ia|intelligence.artificielle|startup|digital|cybersécurité|fintech|software|biotech|healthtech|ki|künstliche.intelligenz|AI|machine.learning/.test(t))
    return 'tech';
  
  if (/lbo|leveraged|buyout|private.equity|fonds|fund|venture|capital|beteiligung|kapitalgesellschaft|PE|fundraising/.test(t))
    return 'pe_lbo';
  
  if (/réglement|loi|amf|concurrence|fiscal|antitrust|regulation|directive|authority|regulierung|wettbewerb|fusione|autorisation|CMA|competition/.test(t))
    return 'reglementaire';
  
  if (/industrie|santé|pharma|retail|commerce|énergie|btp|construction|industry|health|energy|gesundheit|pharma|einkauf|versorgung|healthcare|automotive/.test(t))
    return 'sectoriel';
  
  return fallback || 'deals_clos';
}

// ── Get source tier ───────────────────────────────────────────────
export function getSourceTier(host: string): 'premium' | 'verified' | 'standard' {
  const h = host.toLowerCase();
  
  if (/ft\.com|financialtimes|reuters\.com|bloomberg\.com|lesechos|handelsblatt|ilsole24ore|economist\.com|mergermarket|wsj\.com/.test(h))
    return 'premium';
  
  if (/latribune|bfmtv|businessinsider|lepoint|usine-digitale|techcrunch|sifted\.eu|pitchbook|challenges|capital|lesaffaires|expansion|forbes|cnbc/.test(h))
    return 'verified';
  
  return 'standard';
}

// ── Get source icon ───────────────────────────────────────────────
function getSourceIcon(host: string): string {
  return `https://www.google.com/s2/favicons?domain=${host}&sz=64`;
}

// ── Dedup ─────────────────────────────────────────────────────────
export function dedup(items: NewsItem[]): NewsItem[] {
  const seen = new Set<string>();
  return items.filter((i) => {
    if (!i.url || seen.has(i.url)) return false;
    seen.add(i.url);
    return true;
  });
}

// ── Decode HTML entities ────────────────────────────────────────────
const HTML_ENTITIES: Record<string, string> = {
  '&nbsp;': ' ', '&amp;': '&', '&lt;': '<', '&gt;': '>',
  '&quot;': '"', '&apos;': "'", '&#39;': "'", '&#x27;': "'",
  '&#x2F;': '/', '&#x60;': '`', '&#x3D;': '=', '&ndash;': '\u2013',
  '&mdash;': '\u2014', '&lsquo;': '\u2018', '&rsquo;': '\u2019', '&sbquo;': '\u201A',
  '&ldquo;': '\u201C', '&rdquo;': '\u201D', '&bdquo;': '\u201E', '&hellip;': '\u2026',
  '&euro;': '\u20AC', '&pound;': '\u00A3', '&yen;': '\u00A5', '&cent;': '\u00A2',
  '&copy;': '\u00A9', '&reg;': '\u00AE', '&trade;': '\u2122', '&deg;': '\u00B0',
  '&plusmn;': '\u00B1', '&times;': '\u00D7', '&divide;': '\u00F7',
  '&laquo;': '\u00AB', '&raquo;': '\u00BB', '&bull;': '\u2022', '&middot;': '\u00B7',
};

function decodeHtmlEntities(text: string): string {
  let result = text;
  
  // Named entities
  for (const [entity, char] of Object.entries(HTML_ENTITIES)) {
    result = result.split(entity).join(char);
  }
  
  // Numeric entities (decimal)
  result = result.replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num, 10)));
  
  // Numeric entities (hex)
  result = result.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
  
  return result;
}

// ── Sanitize HTML ─────────────────────────────────────────────────
export function sanitizeDecodedHtml(text: string): string {
  return decodeHtmlEntities(text)
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<script[\s\S]*?>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/javascript\s*:/gi, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    .replace(/<iframe[\s\S]*?>/gi, '')
    .replace(/<object[\s\S]*?<\/object>/gi, '')
    .replace(/<embed[\s\S]*?>/gi, '')
    .replace(/<img[^>]*>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// ── Clean title (remove source suffix) ──────────────────────────────
function cleanTitle(title: string): string {
  // Remove common patterns like " - SourceName", " | SourceName", " — SourceName"
  return title
    .replace(/\s*[-–—|]\s*[A-Za-z0-9.\-]+\s*$/i, '')
    .replace(/\s*\|\s*[A-Za-z0-9.\-]+\s*$/i, '')
    .replace(/\s+\.\.\.\s*$/, '')
    .trim();
}

// ── Web search via DuckDuckGo ──────────────────────────────────────
async function searchViaWeb(query: string, num: number): Promise<NewsItem[]> {
  try {
    const searchUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query + ' M&A Europe 2025')}&format=json&no_html=1`;
    const res = await fetch(searchUrl, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(10000),
    });
    
    if (!res.ok) return [];
    const data = await res.json();
    const results = data.RelatedTopics || [];
    
  return results.slice(0, num).map((topic: any): NewsItem => {
    const url = topic.FirstURL || topic.url || '';
    const rawTitle = topic.Text?.split(' - ')[0] || topic.title || '';
    const snippet = topic.Text || topic.snippet || '';
    const host = url ? new URL(url).hostname : '';
    const cleanTitleText = cleanTitle(sanitizeDecodedHtml(rawTitle));
    const cleanSnippetText = sanitizeDecodedHtml(snippet);

    return {
      id: generateId(url, rawTitle),
      title: cleanTitleText.slice(0, MAX_TITLE_LENGTH),
      snippet: cleanSnippetText.slice(0, MAX_SNIPPET_LENGTH),
      url,
      hostName: host,
      favicon: getSourceIcon(host),
      date: new Date().toISOString(),
      publishedAt: new Date().toISOString(),
      category: categorize(cleanTitleText, cleanSnippetText, 'deals_clos'),
      source: getSourceTier(host),
      sourceName: host.replace('www.', '').split('.')[0],
      sourceIcon: getSourceIcon(host),
      sentiment: analyzeSentiment(cleanSnippetText),
      dealValue: extractDealValue(cleanSnippetText)?.value,
      dealCurrency: extractDealValue(cleanSnippetText)?.currency,
      companies: extractCompanies(`${cleanTitleText} ${cleanSnippetText}`),
      readTime: calculateReadTime(cleanSnippetText),
    };
  });
  } catch {
    return [];
  }
}

// ── RSS Feed Parser ────────────────────────────────────────────────────
async function searchViaRSS(_query: string, feeds: string[]): Promise<NewsItem[]> {
  const allItems: NewsItem[] = [];
  
  for (const feedUrl of feeds) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), RSS_FETCH_TIMEOUT_MS);
      const res = await fetch(feedUrl, {
        signal: controller.signal,
        headers: { 'User-Agent': 'DealScope-MA-Bot/2.0 Premium' },
      });
      clearTimeout(timeout);

      if (!res.ok) continue;
      const text = await res.text();

      const itemRegex = /<item>([\s\S]*?)<\/item>/g;
      let match;
      
      while ((match = itemRegex.exec(text)) !== null) {
        const xml = match[1];
        
        const rawTitle = 
          xml.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/)?.[1] ||
          xml.match(/<title>([\s\S]*?)<\/title>/)?.[1] || '';
        
        const link = 
          xml.match(/<link[^>]*href="([^"]+)"/)?.[1] ||
          xml.match(/<link>([\s\S]*?)<\/link>/)?.[1] || '';
        
        const desc = 
          xml.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/)?.[1] ||
          xml.match(/<description>([\s\S]*?)<\/description>/)?.[1] || '';
        
        const pubDate = xml.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] || '';
        const source = xml.match(/<source[^>]*>([\s\S]*?)<\/source>/)?.[1] || '';
        const creator = xml.match(/<dc:creator>([\s\S]*?)<\/dc:creator>/)?.[1] || '';

        const cleanDesc = sanitizeDecodedHtml(desc);
        const safeTitle = cleanTitle(sanitizeDecodedHtml(rawTitle)).slice(0, MAX_TITLE_LENGTH);
        const safeDesc = cleanDesc.slice(0, MAX_SNIPPET_LENGTH);

        if (safeTitle && link) {
          try {
            const hostname = new URL(link).hostname;
            const fullText = `${safeTitle} ${safeDesc}`;

            allItems.push({
              id: generateId(link, safeTitle),
              title: safeTitle,
              snippet: safeDesc,
              summary: safeDesc.length > 150 ? safeDesc.slice(0, 150) + '...' : safeDesc,
              url: link,
              hostName: hostname,
              favicon: getSourceIcon(hostname),
              date: pubDate || new Date().toISOString(),
              publishedAt: pubDate || new Date().toISOString(),
              category: categorize(safeTitle, safeDesc, 'deals_clos'),
              source: getSourceTier(hostname),
              sourceName: source || hostname.replace('www.', '').split('.')[0],
              sourceIcon: getSourceIcon(hostname),
              sentiment: analyzeSentiment(fullText),
              dealValue: extractDealValue(fullText)?.value,
              dealCurrency: extractDealValue(fullText)?.currency,
              companies: extractCompanies(fullText),
              readTime: calculateReadTime(safeDesc),
              author: creator || undefined,
              isBreaking: /breaking|urgent|exclusive/i.test(safeTitle),
              isPremium: getSourceTier(hostname) === 'premium',
            });
          } catch {
            // skip malformed URLs
          }
        }
      }
      
      if (allItems.length > 0) break;
    } catch {
      continue;
    }
  }
  
  return allItems;
}

// ── Fetch news for a given set of queries ────────────────────────
async function fetchNewsItems(
  queriesWithCat: { q: string; cat: string }[],
  method: 'web' | 'rss' = 'rss',
): Promise<NewsItem[]> {
  const allItems: NewsItem[] = [];
  const BATCH = 3;

  for (let i = 0; i < queriesWithCat.length; i += BATCH) {
    const batch = queriesWithCat.slice(i, i + BATCH);
    const results = await Promise.all(
      batch.map(async ({ q, cat }) => {
        const items =
          method === 'web'
            ? await searchViaWeb(q, 8)
            : await searchViaRSS(q, RSS_FEEDS[cat] || []);
        return items.map((r) => ({
          ...r,
          category: categorize(r.title, r.snippet, cat),
        }));
      }),
    );
    for (const group of results) allItems.push(...group);
  }

  return dedup(allItems);
}

// ── Premium Demo Data ────────────────────────────────────────────
export function getDemoNews(): NewsItem[] {
  const now = new Date();
  const d = (daysAgo: number) =>
    new Date(now.getTime() - daysAgo * 86400000).toISOString();

  return [
    // ── BREAKING NEWS ──
    {
      id: 'demo_1',
      title: '🚨 BREAKING: Deutsche Telekom completes €8.5bn acquisition of Telefónica Germany',
      snippet: 'Deutsche Telekom finalises the landmark acquisition of Telefónica\'s German unit in the largest domestic telecom deal in European M&A this year. The transaction creates a dominant player in the German mobile market.',
      summary: 'Largest European telecom deal of 2025 creates market leader with 50M+ subscribers.',
      url: '#',
      hostName: 'reuters.com',
      favicon: getSourceIcon('reuters.com'),
      date: d(0.5),
      publishedAt: d(0.5),
      category: 'deals_clos',
      source: 'premium',
      sourceName: 'Reuters',
      sourceIcon: getSourceIcon('reuters.com'),
      sentiment: 'positive',
      dealValue: '8.5',
      dealCurrency: 'EUR',
      companies: ['Deutsche Telekom', 'Telefónica'],
      readTime: 3,
      isBreaking: true,
      isPremium: true,
    },
    {
      id: 'demo_2',
      title: 'BNP Paribas rachète AXA Investment Managers pour 5,2 Md€',
      snippet: 'BNP Paribas annonce la finalisation de l\'acquisition d\'AXA Investment Managers pour 5,2 milliards d\'euros, créant le premier gestionnaire d\'actifs en Europe avec plus de 2 000 milliards d\'euros sous gestion.',
      summary: 'Création du leader européen de la gestion d\'actifs.',
      url: '#',
      hostName: 'lesechos.fr',
      favicon: getSourceIcon('lesechos.fr'),
      date: d(1),
      publishedAt: d(1),
      category: 'deals_clos',
      source: 'premium',
      sourceName: 'Les Échos',
      sourceIcon: getSourceIcon('lesechos.fr'),
      sentiment: 'positive',
      dealValue: '5.2',
      dealCurrency: 'EUR',
      companies: ['BNP Paribas', 'AXA Investment Managers'],
      readTime: 4,
      isPremium: true,
    },
    {
      id: 'demo_3',
      title: 'KKR enters exclusive talks to acquire Danish logistics giant DFDS for €3.2bn',
      snippet: 'US private equity firm KKR has entered exclusive negotiations to acquire DFDS, Denmark\'s largest ferry and logistics operator. Due diligence expected to complete by Q3 2025.',
      summary: 'Major PE-backed logistics acquisition in Northern Europe.',
      url: '#',
      hostName: 'ft.com',
      favicon: getSourceIcon('ft.com'),
      date: d(0.8),
      publishedAt: d(0.8),
      category: 'en_cours',
      source: 'premium',
      sourceName: 'Financial Times',
      sourceIcon: getSourceIcon('ft.com'),
      sentiment: 'neutral',
      dealValue: '3.2',
      dealCurrency: 'EUR',
      companies: ['KKR', 'DFDS'],
      sectors: ['Logistics', 'Transportation'],
      countries: ['Denmark', 'UK'],
      readTime: 3,
      isPremium: true,
    },
    {
      id: 'demo_4',
      title: 'European M&A volume surges 24% in Q1 2025',
      snippet: 'According to Mergermarket data, European M&A activity reached €385 billion in Q1 2025, a 24% increase year-over-year. Cross-border deals accounted for 62% of total volume.',
      summary: 'Strong start to 2025 with cross-border activity leading.',
      url: '#',
      hostName: 'ft.com',
      favicon: getSourceIcon('ft.com'),
      date: d(2),
      publishedAt: d(2),
      category: 'marche',
      source: 'premium',
      sourceName: 'Financial Times',
      sourceIcon: getSourceIcon('ft.com'),
      sentiment: 'positive',
      dealValue: '385',
      dealCurrency: 'EUR',
      readTime: 5,
      isPremium: true,
    },
    {
      id: 'demo_5',
      title: 'Spotify finalises €650m acquisition of German AI music platform SoundAI',
      snippet: 'Swedish streaming giant Spotify completes the €650 million acquisition of SoundAI, a Berlin-based AI music generation platform. One of the largest European tech acquisitions of 2025.',
      summary: 'Major AI acquisition in European tech landscape.',
      url: '#',
      hostName: 'techcrunch.com',
      favicon: getSourceIcon('techcrunch.com'),
      date: d(1.5),
      publishedAt: d(1.5),
      category: 'tech',
      source: 'verified',
      sourceName: 'TechCrunch',
      sourceIcon: getSourceIcon('techcrunch.com'),
      sentiment: 'positive',
      dealValue: '650',
      dealCurrency: 'EUR',
      companies: ['Spotify', 'SoundAI'],
      sectors: ['AI', 'Music Tech'],
      countries: ['Sweden', 'Germany'],
      readTime: 3,
    },
    {
      id: 'demo_6',
      title: 'Blackstone completes €950m buyout of UK business services group',
      snippet: 'Blackstone finalises the €950 million acquisition of a British business services company. One of the largest LBO deals in Europe in 2025, targeting 3x return over 5-year holding period.',
      summary: 'Major PE buyout in UK business services sector.',
      url: '#',
      hostName: 'reuters.com',
      favicon: getSourceIcon('reuters.com'),
      date: d(2.5),
      publishedAt: d(2.5),
      category: 'pe_lbo',
      source: 'premium',
      sourceName: 'Reuters',
      sourceIcon: getSourceIcon('reuters.com'),
      sentiment: 'positive',
      dealValue: '950',
      dealCurrency: 'EUR',
      companies: ['Blackstone'],
      sectors: ['Business Services'],
      countries: ['UK'],
      readTime: 3,
      isPremium: true,
    },
    {
      id: 'demo_7',
      title: 'European Commission clears Tencent\'s €9bn Ubisoft acquisition',
      snippet: 'The European Commission grants unconditional approval to Tencent\'s €9 billion acquisition of Ubisoft. The Commission found no competition concerns in the European Economic Area.',
      summary: 'Major regulatory clearance for landmark tech deal.',
      url: '#',
      hostName: 'reuters.com',
      favicon: getSourceIcon('reuters.com'),
      date: d(1.2),
      publishedAt: d(1.2),
      category: 'reglementaire',
      source: 'premium',
      sourceName: 'Reuters',
      sourceIcon: getSourceIcon('reuters.com'),
      sentiment: 'positive',
      dealValue: '9',
      dealCurrency: 'EUR',
      companies: ['Tencent', 'Ubisoft'],
      readTime: 3,
      isPremium: true,
    },
    {
      id: 'demo_8',
      title: 'Roche acquires German oncology startup for €2.8bn',
      snippet: 'Swiss pharma giant Roche announces the acquisition of Carmot Therapeutics, a German biotech specialising in innovative cancer therapies. The largest pharma M&A transaction in Europe since early 2025.',
      summary: 'Major healthcare acquisition in oncology space.',
      url: '#',
      hostName: 'ft.com',
      favicon: getSourceIcon('ft.com'),
      date: d(0.3),
      publishedAt: d(0.3),
      category: 'sectoriel',
      source: 'premium',
      sourceName: 'Financial Times',
      sourceIcon: getSourceIcon('ft.com'),
      sentiment: 'positive',
      dealValue: '2.8',
      dealCurrency: 'EUR',
      companies: ['Roche', 'Carmot Therapeutics'],
      sectors: ['Healthcare', 'Pharma', 'Biotech'],
      countries: ['Switzerland', 'Germany'],
      readTime: 3,
      isBreaking: true,
      isPremium: true,
    },
  ];
}

// ── Main fetch function ──────────────────────────────────────────
export async function fetchNews(
  category: string = 'all',
  query: string = '',
  limit: number = 50,
  refresh: boolean = false,
): Promise<FetchNewsResult> {
  const sources: string[] = [];

  // ── Veille (custom search) ──
  if (query) {
    const ck = `q:${query}`;
    if (!refresh && cache.has(ck)) {
      const c = cache.get(ck)!;
      if (Date.now() - c.ts < TTL) {
        return { 
          results: c.data.slice(0, limit), 
          total: c.data.length, 
          category: 'veille',
          cached: true,
          lastUpdated: new Date(c.ts).toISOString(),
          sources: c.sources,
        };
      }
    }

    let items = await searchViaWeb(`${query} fusion acquisition M&A Europe`, 15);
    sources.push('DuckDuckGo');
    
    if (items.length === 0) {
      items = await searchViaRSS(query, [
        'https://news.google.com/rss/search?q=' +
        encodeURIComponent(`${query} fusion acquisition Europe`) +
        '&hl=en&gl=GB&ceid=GB:en',
      ]);
      sources.push('Google News');
    }

    if (items.length > 0) {
      cache.set(ck, { data: items, ts: Date.now(), sources });
    }
    
    return { 
      results: items.slice(0, limit), 
      total: items.length, 
      category: 'veille',
      lastUpdated: new Date().toISOString(),
      sources,
    };
  }

  // ── Cached category ──
  const ck = `cat:${category}`;
  if (!refresh && cache.has(ck)) {
    const c = cache.get(ck)!;
    if (Date.now() - c.ts < TTL) {
      return {
        results: c.data.slice(0, limit),
        total: c.data.length,
        category,
        cached: true,
        lastUpdated: new Date(c.ts).toISOString(),
        sources: c.sources,
      };
    }
  }

  // ── Build queries ──
  const catsToFetch = category === 'all' ? Object.keys(QUERIES) : [category];
  const allQueries = catsToFetch.flatMap((cat) =>
    (QUERIES[cat] || []).map((q) => ({ q, cat })),
  );

  // ── Try RSS first (better quality) ──
  let items = await fetchNewsItems(allQueries, 'rss');
  sources.push('Google News RSS');

  // ── Fallback to web search ──
  if (items.length < 5) {
    const webItems = await fetchNewsItems(allQueries.slice(0, 3), 'web');
    items = dedup([...items, ...webItems]);
    sources.push('DuckDuckGo');
  }

  // ── Still empty? Return premium demo data ──
  if (items.length === 0) {
    items = getDemoNews();
    sources.push('Demo Data');
  }

  // ── Sort: breaking first, then by source tier, then by date ──
  const tierOrder: Record<string, number> = { premium: 0, verified: 1, standard: 2 };
  items.sort((a, b) => {
    if (a.isBreaking && !b.isBreaking) return -1;
    if (!a.isBreaking && b.isBreaking) return 1;
    const ta = tierOrder[a.source] ?? 2;
    const tb = tierOrder[b.source] ?? 2;
    if (ta !== tb) return ta - tb;
    const da = a.date ? new Date(a.date).getTime() : 0;
    const db = b.date ? new Date(b.date).getTime() : 0;
    return db - da;
  });

  cache.set(ck, { data: items, ts: Date.now(), sources });

  return {
    results: items.slice(0, limit),
    total: items.length,
    category,
    lastUpdated: new Date().toISOString(),
    sources,
    demo: items.length > 0 && items[0]?._demo,
  };
}
