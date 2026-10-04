import { getOwnerWorkspace } from "./db";
import { getMarketAnalysisBatch } from "./market";
import { invokeLLM } from "./_core/llm";

export type LowStockMarketInsight = {
  productName: string;
  stockOnHand: number;
  reorderLevel: number;
  unit: string;
  marketSample: number;
  currencyCode: string;
  marketSource: "live_web_snapshot" | "benchmark_fallback";
  trend: "rising" | "stable" | "softening";
  priority: "high" | "medium" | "low";
  reason: string;
};

export type AiMarketInsights = {
  headline: string;
  summary: string;
  action: string;
  generatedAt: string;
  sourceLabel: string;
  items: LowStockMarketInsight[];
};

export function selectLowStockProducts(inventory: Array<{ name: string; stockOnHand: number; reorderLevel: number; unit: string; category: string }>) {
  return inventory
    .filter((product) => product.stockOnHand <= product.reorderLevel)
    .sort((a, b) => (a.stockOnHand / Math.max(1, a.reorderLevel)) - (b.stockOnHand / Math.max(1, b.reorderLevel)))
    .slice(0, 8);
}

function fallbackInsights(items: LowStockMarketInsight[], currencyCode: string): AiMarketInsights {
  const rising = items.filter((item) => item.trend === "rising");
  const lead = rising[0] ?? items[0];
  return {
    headline: lead ? `${lead.productName} needs attention first` : "Inventory is in a healthy range",
    summary: lead ? `${rising.length} low-stock item${rising.length === 1 ? " is" : "s are"} showing positive market momentum. Prioritize replenishment where demand is rising fastest.` : "No products are currently below their reorder levels.",
    action: lead ? `Review ${lead.productName} with your supplier and compare the current shop price against the ${currencyCode} market benchmark.` : "Keep monitoring reorder levels as new sales are logged.",
    generatedAt: new Date().toISOString(),
    sourceLabel: items.some((item) => item.marketSource === "live_web_snapshot") ? "AI summary · live market signals" : "AI summary · benchmark guidance",
    items,
  };
}

export async function getOwnerAiMarketInsights(ownerUserId: number): Promise<AiMarketInsights | null> {
  const workspace = await getOwnerWorkspace(ownerUserId, "Shop owner");
  if (!workspace) return null;
  const lowStock = selectLowStockProducts(workspace.inventory);
  if (lowStock.length === 0) return fallbackInsights([], workspace.shop.currencyCode);

  const marketResults = await getMarketAnalysisBatch({
    items: lowStock.map((product) => ({ productName: product.name, category: product.category })),
    countryCode: workspace.shop.countryCode,
    currencyCode: workspace.shop.currencyCode,
  });
  const items: LowStockMarketInsight[] = lowStock.map((product) => {
    const market = marketResults.find((result) => result.productName === product.name)?.analysis;
    const currentPrice = Number((workspace.inventory.find((entry) => entry.name === product.name)?.salePriceCents ?? 0) / 100);
    const marketRatio = market && currentPrice > 0 ? currentPrice / market.sample : 1;
    const trend = market?.sourceType === "live_web_snapshot" && marketRatio <= 1.05 ? "rising" : marketRatio >= 1.2 ? "softening" : "stable";
    const stockRatio = product.stockOnHand / Math.max(1, product.reorderLevel);
    return {
      productName: product.name,
      stockOnHand: product.stockOnHand,
      reorderLevel: product.reorderLevel,
      unit: product.unit,
      marketSample: market?.sample ?? 0,
      currencyCode: workspace.shop.currencyCode,
      marketSource: market?.sourceType ?? "benchmark_fallback",
      trend,
      priority: stockRatio <= 0.5 && trend === "rising" ? "high" : stockRatio <= 1 ? "medium" : "low",
      reason: trend === "rising" ? "Market signal is positive while stock is below its reorder point." : trend === "softening" ? "Demand signal is softer; replenish carefully and review pricing." : "Stock is below target; monitor the next sales cycle.",
    };
  });

  const deterministic = fallbackInsights(items, workspace.shop.currencyCode);
  try {
    const response = await invokeLLM({
      model: "gpt-5-mini",
      maxTokens: 700,
      messages: [
        { role: "system", content: "You are Stockwise, a concise retail inventory analyst. Summarize only the supplied low-stock and market data. Never invent products, prices, or certainty. Return JSON matching the schema." },
        { role: "user", content: JSON.stringify({ shop: workspace.shop.name, currency: workspace.shop.currencyCode, lowStockMarketItems: items }) },
      ],
      responseFormat: {
        type: "json_schema",
        json_schema: {
          name: "stockwise_market_insights",
          strict: true,
          schema: {
            type: "object",
            properties: { headline: { type: "string" }, summary: { type: "string" }, action: { type: "string" } },
            required: ["headline", "summary", "action"],
            additionalProperties: false,
          },
        },
      },
    });
    const content = response.choices[0]?.message.content;
    const parsed = typeof content === "string" ? JSON.parse(content) as { headline?: string; summary?: string; action?: string } : {};
    return { ...deterministic, headline: parsed.headline || deterministic.headline, summary: parsed.summary || deterministic.summary, action: parsed.action || deterministic.action, sourceLabel: `AI summary · ${items.some((item) => item.marketSource === "live_web_snapshot") ? "live market signals" : "benchmark guidance"}` };
  } catch (error) {
    console.warn("[Insights] AI summary unavailable; using deterministic market summary.", error);
    return deterministic;
  }
}
