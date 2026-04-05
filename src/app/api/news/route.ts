import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-guard';
import { safeErrorResponse, getClientIp, isRateLimited, rateLimitedResponse } from '@/lib/security';

// GET /api/news
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  // Rate limit news fetching
  const clientIp = getClientIp(request);
  if (isRateLimited(clientIp, 30, 60 * 1000)) {
    return rateLimitedResponse();
  }

  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') || 'all';
  const query = searchParams.get('query') || '';
  const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10) || 50, 50);
  const refresh = searchParams.get('refresh') === 'true';

  try {
    // ── Veille (custom search) ──
    if (query) {
      const ck = `q:${query}`;
      if (!refresh && cache.has(ck)) {
        const c = cache.get(ck)!;
        if (Date.now() - c.ts < TTL)
          return NextResponse.json({
            results: c.data,
            total: c.data.length,
            category: 'veille',
          });
      }

      let items = await searchViaSDK(
        `${query} fusion acquisition M&A Europe 2025`,
        15,
      );
      if (items.length === 0) {
        items = await searchViaRSS(query, [
          'https://news.google.com/rss/search?q=' +
            encodeURIComponent(`${query} fusion acquisition Europe`) +
            '&hl=en&gl=GB&ceid=GB:en',
        ]);
      }

      if (items.length > 0)
        cache.set(ck, { data: items, ts: Date.now() });
      return NextResponse.json({
        results: items,
        total: items.length,
        category: 'veille',
      });
    }

    // ── Cached ──
    const ck = `cat:${category}`;
    if (!refresh && cache.has(ck)) {
      const c = cache.get(ck)!;
      if (Date.now() - c.ts < TTL)
        return NextResponse.json({
          results: c.data.slice(0, limit),
          total: c.data.length,
          category,
          cached: true,
        });
    }

    // ── Build queries ──
    const catsToFetch =
      category === 'all' ? Object.keys(QUERIES) : [category];
    const allQueries = catsToFetch.flatMap((cat) =>
      (QUERIES[cat] || []).map((q) => ({ q, cat })),
    );

    // ── Try SDK first ──
    let items = await fetchNewsItems(allQueries, 'sdk');

    // ── Fallback to Google News RSS ──
    if (items.length === 0) {
      console.log(
        '[news] SDK returned no results, falling back to Google News RSS...',
      );
      items = await fetchNewsItems(allQueries, 'rss');
    }

    // ── Still empty? Return curated demo data ──
    if (items.length === 0) {
      items = getDemoNews();
    }

    // Sort: high credibility first, then by date
    const tierOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
    items.sort((a, b) => {
      const ta = tierOrder[a.source] ?? 2;
      const tb = tierOrder[b.source] ?? 2;
      if (ta !== tb) return ta - tb;
      const da = a.date ? new Date(a.date).getTime() : 0;
      const db2 = b.date ? new Date(b.date).getTime() : 0;
      return db2 - da;
    });

    cache.set(ck, { data: items, ts: Date.now() });
    return NextResponse.json({
      results: items.slice(0, limit),
      total: items.length,
      category,
      demo: items.length > 0 && items[0]?._demo,
      cached: false,
    });
  } catch (error) {
    console.error('News error:', error);
    return safeErrorResponse('Erreur de chargement', 500);
  }
}

// ── European M&A queries (FR, EN, DE, IT) ──────────────────────
const QUERIES: Record<string, string[]> = {
  deals_clos: [
    'M&A deal completed Europe 2025',
    'fusion acquisition France 2025 annonce',
    'acquisition closed Europe announced',
    'Unternehmenskauf Deutschland 2025',
    'operazione fusione Italia 2025',
    'buyout completed UK Europe 2025',
  ],
  en_cours: [
    'M&A deal pending Europe 2025',
    'due diligence acquisition France 2025',
    'takeover bid Europe 2025',
    'OPA offre publique Europe',
    'Fusion Verhandlung Deutschland 2025',
  ],
  marche: [
    'M&A market trends Europe 2025 statistics',
    'marché fusion acquisition France tendances 2025',
    'European M&A volume Q1 2025',
    'Fusionsmarkt Europa Trends 2025',
    'M&A multiples EV/EBITDA Europe 2025',
  ],
  tech: [
    'tech startup acquisition Europe 2025',
    'acquisition startup IA France Europe 2025',
    'M&A SaaS Europe 2025',
    'software buyout Europe 2025',
    'fintech merger acquisition Europe',
  ],
  pe_lbo: [
    'private equity deal Europe 2025',
    'LBO France Europe 2025',
    'leveraged buyout fund Europe 2025',
    'Private Equity Rekordjahr Europa 2025',
    'PE buyout UK mid-market 2025',
  ],
  reglementaire: [
    'EU merger regulation 2025',
    'réglementation fusion acquisition AMF Europe',
    'European competition authority merger 2025',
    'antitrust EU merger control 2025',
    'Fusionskontrolle Europa 2025',
  ],
  sectoriel: [
    'healthcare pharma M&A Europe 2025',
    'energy infrastructure merger Europe 2025',
    'industrial M&A Europe deal 2025',
    'retail acquisition Europe 2025',
    'banque assurance fusion Europe 2025',
  ],
};

// ── Google News RSS feeds ──────────────────────────────────────
const RSS_FEEDS: Record<string, string[]> = {
  deals_clos: [
    'https://news.google.com/rss/search?q=M%26A+deals+completed+Europe+2025&hl=en&gl=GB&ceid=GB:en',
    'https://news.google.com/rss/search?q=fusion+acquisition+France+2025+annonc%C3%A9e&hl=fr&gl=FR&ceid=FR:fr',
    'https://news.google.com/rss/search?q=Unternehmenskauf+Deutschland+2025&hl=de&gl=DE&ceid=DE:de',
    'https://news.google.com/rss/search?q=fusione+acquisizione+Italia+2025&hl=it&gl=IT&ceid=IT:it',
  ],
  en_cours: [
    'https://news.google.com/rss/search?q=M%26A+deal+pending+Europe&hl=en&gl=GB&ceid=GB:en',
    'https://news.google.com/rss/search?q=OPA+offre+publique+achat+France&hl=fr&gl=FR&ceid=FR:fr',
    'https://news.google.com/rss/search?q=takeover+bid+UK+Europe&hl=en&gl=GB&ceid=GB:en',
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
    'https://news.google.com/rss/search?q=rachat+entreprise+industrie+France&hl=fr&gl=FR&ceid=FR:fr',
    'https://news.google.com/rss/search?q=pharma+M%26A+Europe+2025&hl=en&gl=GB&ceid=GB:en',
  ],
};

// ── Cache ─────────────────────────────────────────────────────────
const cache = new Map<string, { data: any[]; ts: number }>();
const TTL = 10 * 60 * 1000;
const MAX_CACHE_SIZE = 500;

// ── Helpers ──────────────────────────────────────────────────────
function categorize(title: string, snippet: string, fallback: string): string {
  const t = `${title} ${snippet}`.toLowerCase();
  if (
    /(?:deal|transaction|conclu|finalisé|achevé|completed|announced|geschlossen|completata|acquis|acquired|acquire|buys|bought|rachat|vend|sold|soldes).*?(?:fusion|acquisition|merger|buyout|kauf|fusione|acquisizione)/.test(t) ||
    /(?:fusion|acquisition|rachat|merger|buyout|kauf|fusione).*?(?:conclu|finalisé|completed|announced|acquired|geschlossen|completata)/.test(t)
  )
    return 'deals_clos';
  if (/due.diligence|négociation|en.cours|mandat|takeover|bid|pending|negoziazione|verhandlung|Übernahme|offerta/.test(t))
    return 'en_cours';
  if (/marché|volume|tendance|croissance|prévision|statistique|market|trend|multiples|ebitda|valuation|marktentwicklung|Prognose/.test(t))
    return 'marche';
  if (/tech|saas|ia|intelligence.artificielle|startup|digital|cybersécurité|fintech|software|biotech|healthtech|ki|künstliche.intelligenz/.test(t))
    return 'tech';
  if (/lbo|leveraged|buyout|private.equity|fonds|fund|venture|capital|beteiligung|kapitalgesellschaft/.test(t))
    return 'pe_lbo';
  if (/réglement|loi|amf|concurrence|fiscal|antitrust|regulation|directive|authority|regulierung|wettbewerb|fusione|autorisation/.test(t))
    return 'reglementaire';
  if (/industrie|santé|pharma|retail|commerce|énergie|btp|construction|industry|health|energy|gesundheit|pharma|einkauf|versorgung/.test(t))
    return 'sectoriel';
  return fallback || 'deals_clos';
}

function getSourceTier(host: string): string {
  const h = host.toLowerCase();
  if (/ft\.com|financialtimes|reuters\.com|bloomberg\.com|lesechos|handelsblatt|ilsole24ore|economist\.com|mergermarket/.test(h))
    return 'high';
  if (/latribune|bfmtv|businessinsider|lepoint|usine-digitale|techcrunch|sifted\.eu|pitchbook|challenges|capital|lesaffaires|expansion/.test(h))
    return 'medium';
  return 'low';
}

function dedup(items: any[]): any[] {
  const seen = new Set<string>();
  return items.filter((i) => {
    if (!i.url || seen.has(i.url)) return false;
    seen.add(i.url);
    return true;
  });
}

async function searchViaSDK(_query: string, _num: number): Promise<any[]> {
  return [];
}

async function searchViaRSS(_query: string, feeds: string[]): Promise<any[]> {
  for (const feedUrl of feeds) {
    try {
      const url = feedUrl;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { 'User-Agent': 'DealScope-M&A-Bot/1.0' },
      });
      clearTimeout(timeout);

      if (!res.ok) continue;
      const text = await res.text();

      const items: any[] = [];
      const itemRegex = /<item>([\s\S]*?)<\/item>/g;
      let match;
      while ((match = itemRegex.exec(text)) !== null) {
        const xml = match[1];
        const title =
          xml.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/)?.[1] ||
          xml.match(/<title>([\s\S]*?)<\/title>/)?.[1] ||
          '';
        const link =
          xml.match(/<link[^>]*href="([^"]+)"/)?.[1] ||
          xml.match(/<link>([\s\S]*?)<\/link>/)?.[1] ||
          '';
        const desc =
          xml.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/)?.[1] ||
          xml.match(/<description>([\s\S]*?)<\/description>/)?.[1] ||
          '';
        const pubDate = xml.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] || '';
        const source = xml.match(/<source>([\s\S]*?)<\/source>/)?.[1] || '';

        const cleanDesc = desc
          .replace(/<[^>]+>/g, '')
          .replace(/&quot;/g, '"')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .trim();

        if (title && link) {
          try {
            const hostname = new URL(link).hostname;
            items.push({
              title,
              snippet: cleanDesc.slice(0, 300),
              url: link,
              hostName: hostname,
              favicon: `https://www.google.com/s2/favicons?domain=${hostname}`,
              date: pubDate,
              category: categorize(title, cleanDesc, ''),
              source: getSourceTier(hostname),
              sourceName: source || hostname,
            });
          } catch {
            // skip malformed URLs
          }
        }
      }
      if (items.length > 0) return items;
    } catch {
      continue;
    }
  }
  return [];
}

async function fetchNewsItems(
  queriesWithCat: { q: string; cat: string }[],
  method: 'sdk' | 'rss' = 'sdk',
): Promise<any[]> {
  const allItems: any[] = [];
  const BATCH = 2;

  for (let i = 0; i < queriesWithCat.length; i += BATCH) {
    const batch = queriesWithCat.slice(i, i + BATCH);
    const results = await Promise.all(
      batch.map(async ({ q, cat }) => {
        const items =
          method === 'sdk'
            ? await searchViaSDK(q, 5)
            : await searchViaRSS(q, RSS_FEEDS[cat] || []);
        return items.map((r: any) => ({
          title: r.title || '',
          snippet: r.snippet || '',
          url: r.url || '',
          hostName: r.hostName || '',
          favicon: r.favicon || r.date || '',
          date: r.date || '',
          category: categorize(r.title || '', r.snippet || '', cat),
          source: getSourceTier(r.hostName || ''),
          sourceName: r.sourceName || r.hostName || '',
        }));
      }),
    );
    for (const group of results) allItems.push(...group);
  }

  // Prevent cache from growing unbounded
  if (cache.size >= MAX_CACHE_SIZE) {
    const entries = Array.from(cache.entries());
    entries.sort((a, b) => a[1].ts - b[1].ts);
    const toDelete = entries.slice(0, Math.floor(MAX_CACHE_SIZE * 0.2));
    for (const [key] of toDelete) {
      cache.delete(key);
    }
  }

  return dedup(allItems);
}

function getDemoNews(): any[] {
  const now = new Date();
  const d = (daysAgo: number) =>
    new Date(now.getTime() - daysAgo * 86400000).toISOString().split('T')[0];
  return [
    { title: 'Deutsche Telekom completes acquisition of Telefónica Germany for €8.5bn', snippet: 'Deutsche Telekom finalises the landmark acquisition of Telefónica\'s German unit.', url: '#', hostName: 'reuters.com', favicon: '', date: d(1), category: 'deals_clos', source: 'high', sourceName: 'Reuters' },
    { title: 'BNP Paribas rachète AXA Investment Managers pour 5,2 Md€', snippet: 'BNP Paribas annonce la finalisation de l\'acquisition d\'AXA Investment Managers.', url: '#', hostName: 'lesechos.fr', favicon: '', date: d(2), category: 'deals_clos', source: 'high', sourceName: 'Les Échos' },
    { title: 'Unilever acquires Italian nutraceutical startup Alma for €1.1bn', snippet: 'UK-based Unilever closes the acquisition of Alma, a Milan-headquartered nutraceutical company.', url: '#', hostName: 'ft.com', favicon: '', date: d(3), category: 'deals_clos', source: 'high', sourceName: 'Financial Times' },
    { title: 'BASF completes purchase of Dutch chemicals group LyondellBasell', snippet: 'German chemical giant BASF finalises the €4.3 billion acquisition.', url: '#', hostName: 'handelsblatt.com', favicon: '', date: d(4), category: 'deals_clos', source: 'high', sourceName: 'Handelsblatt' },
    { title: 'PAI Partners et Tikehau en négociation exclusive pour Descartes Underwriting', snippet: 'Les fonds PAI Partners et Tikehau sont en négociation exclusive.', url: '#', hostName: 'bfmtv.com', favicon: '', date: d(2), category: 'en_cours', source: 'high', sourceName: 'BFM Business' },
    { title: 'KKR enters exclusive talks to acquire Danish logistics giant DFDS', snippet: 'US private equity firm KKR has entered exclusive negotiations to acquire DFDS.', url: '#', hostName: 'reuters.com', favicon: '', date: d(3), category: 'en_cours', source: 'high', sourceName: 'Reuters' },
    { title: 'European M&A volume surges 24% in Q1 2025', snippet: 'According to Mergermarket data, European M&A activity reached €385 billion in Q1 2025.', url: '#', hostName: 'ft.com', favicon: '', date: d(5), category: 'marche', source: 'high', sourceName: 'Financial Times' },
    { title: 'Le marché M&A français en hausse de 18% au T1 2025', snippet: 'Le volume des fusions et acquisitions en France a progressé de 18%.', url: '#', hostName: 'lesechos.fr', favicon: '', date: d(6), category: 'marche', source: 'high', sourceName: 'Les Échos' },
    { title: 'UiPath acquires French AI process monitoring startup ThoughtTraceur for €100m', snippet: 'UiPath announces the acquisition of ThoughtTraceur, a French AI-native startup.', url: '#', hostName: 'usine-digitale.fr', favicon: '', date: d(4), category: 'tech', source: 'medium', sourceName: 'L\'Usine Digitale' },
    { title: 'Spotify finalises €650m acquisition of German AI music platform SoundAI', snippet: 'Spotify completes the €650 million acquisition of SoundAI, a Berlin-based AI platform.', url: '#', hostName: 'techcrunch.com', favicon: '', date: d(3), category: 'tech', source: 'medium', sourceName: 'TechCrunch' },
    { title: 'Blackstone completes €950m buyout of UK business services group Garland', snippet: 'Blackstone finalises the €950 million acquisition of Garland.', url: '#', hostName: 'reuters.com', favicon: '', date: d(4), category: 'pe_lbo', source: 'high', sourceName: 'Reuters' },
    { title: 'CVC Capital acquiert une participation majoritaire dans Datacraft pour 200 M€', snippet: 'CVC Capital finalise l\'acquisition d\'une participation majoritaire dans Datacraft.', url: '#', hostName: 'latribune.fr', favicon: '', date: d(2), category: 'pe_lbo', source: 'high', sourceName: 'La Tribune' },
    { title: 'European Commission clears Tencent\'s €9bn Ubisoft acquisition', snippet: 'The European Commission grants unconditional approval to Tencent\'s acquisition.', url: '#', hostName: 'reuters.com', favicon: '', date: d(3), category: 'reglementaire', source: 'high', sourceName: 'Reuters' },
    { title: 'L\'AMF renforce les règles de déclaration pré-OPA', snippet: 'L\'Autorité des marchés financiers publie de nouvelles directives.', url: '#', hostName: 'latribune.fr', favicon: '', date: d(4), category: 'reglementaire', source: 'high', sourceName: 'La Tribune' },
    { title: 'Roche acquires German oncology startup Carmot Therapeutics for €2.8bn', snippet: 'Swiss pharma giant Roche announces the acquisition of Carmot Therapeutics.', url: '#', hostName: 'ft.com', favicon: '', date: d(2), category: 'sectoriel', source: 'high', sourceName: 'Financial Times' },
    { title: 'Veolia et Suez en discussion pour une fusion', snippet: 'Veolia Environnement et Suez confirment être en discussions avancées pour une fusion.', url: '#', hostName: 'bfmtv.com', favicon: '', date: d(1), category: 'sectoriel', source: 'high', sourceName: 'BFM Business' },
  ];
}
