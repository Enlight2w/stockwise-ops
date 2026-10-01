const FALLBACK_MARKET_DATA: Record<string, { low: number; high: number; sample: number; source: string }> = {
  pantry: { low: 12, high: 26, sample: 18.5, source: "Regional specialty grocery benchmark" },
  beverages: { low: 8, high: 19, sample: 12.5, source: "Regional beverage benchmark" },
  chilled: { low: 15, high: 34, sample: 23, source: "Regional chilled goods benchmark" },
  merch: { low: 18, high: 48, sample: 29, source: "Regional retail merchandise benchmark" },
  default: { low: 10, high: 40, sample: 22, source: "General retail benchmark" },
};

function parsePrice(value: string) {
  const normalized = value.replace(/,/g, "");
  const match = normalized.match(/(?:US\$|A\$|C\$|R\$|[$€£₹₦¥])\s*(\d+(?:\.\d{1,2})?)/);
  return match ? Number(match[1]) : null;
}

function stripHtml(value: string) {
  return value.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim();
}

export async function getMarketAnalysis(input: { productName: string; category?: string; countryCode: string; currencyCode: string }) {
  const query = `${input.productName} ${input.category ?? "retail product"} average price ${input.countryCode}`;
  const fallback = FALLBACK_MARKET_DATA[(input.category ?? "").toLowerCase()] ?? FALLBACK_MARKET_DATA.default;
  try {
    const response = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
      headers: { "user-agent": "Stockwise Ops market research bot/1.0" },
      signal: AbortSignal.timeout(7000),
    });
    if (!response.ok) throw new Error(`Market search failed with ${response.status}`);
    const html = await response.text();
    const resultBlocks = Array.from(html.matchAll(/<a[^>]+class="result__a"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<a[^>]+class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g)).slice(0, 5);
    const sources = resultBlocks.map((match) => {
      const title = stripHtml(match[1]);
      const snippet = stripHtml(match[2]);
      const prices = Array.from(snippet.matchAll(/(?:US\$|A\$|C\$|R\$|[$€£₹₦¥])\s*\d+(?:[,.]\d{1,2})?/g)).map((price) => parsePrice(price[0])).filter((price): price is number => price !== null);
      return { title, snippet, prices };
    }).filter((source) => source.prices.length > 0);
    const samples = sources.flatMap((source) => source.prices).filter((price) => price > 0 && price < 10000).slice(0, 12);
    if (samples.length >= 2) {
      const sorted = [...samples].sort((a, b) => a - b);
      return {
        query,
        sourceType: "live_web_snapshot" as const,
        currencyCode: input.currencyCode,
        low: sorted[0],
        high: sorted[sorted.length - 1],
        sample: Math.round((sorted.reduce((sum, price) => sum + price, 0) / sorted.length) * 100) / 100,
        sources: sources.map(({ title, snippet }) => ({ title, snippet })),
        checkedAt: new Date().toISOString(),
      };
    }
  } catch (error) {
    console.warn("[Market] Live web snapshot unavailable; using benchmark fallback.", error);
  }
  return {
    query,
    sourceType: "benchmark_fallback" as const,
    currencyCode: input.currencyCode,
    low: fallback.low,
    high: fallback.high,
    sample: fallback.sample,
    sources: [{ title: fallback.source, snippet: "Use this as directional guidance until enough local product sales are captured." }],
    checkedAt: new Date().toISOString(),
  };
}
