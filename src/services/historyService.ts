import { ShoppingProduct, PriceTrendData, HistoricalPricePoint, DealGrade } from '../types';

/**
 * Deterministic pseudo-random generator based on a string seed
 */
function createSeededRandom(seedStr: string) {
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = (hash << 5) - hash + seedStr.charCodeAt(i);
    hash |= 0;
  }
  return function () {
    hash = (hash * 9301 + 49297) % 233280;
    return hash / 233280;
  };
}

/**
 * Generates and fetches 30-day historical price trends for a product.
 * Returns realistic historical price shifts anchored around the current live price.
 */
export async function fetchProductPriceTrend(product: ShoppingProduct): Promise<PriceTrendData> {
  // Simulate network latency for mock historical data service
  await new Promise((resolve) => setTimeout(resolve, 180));

  const currentPrice = product.priceNumber && product.priceNumber > 0 ? product.priceNumber : 99.99;
  const rand = createSeededRandom(`${product.id}-${product.source}-${currentPrice.toFixed(0)}`);

  // Target baseline average is usually slightly above or around current price
  const varianceFactor = 0.05 + rand() * 0.12; // 5% to 17% overall band
  const baseline = currentPrice * (1 + (rand() - 0.35) * varianceFactor);

  const history: HistoricalPricePoint[] = [];
  const now = new Date();

  // Generate 30 days of data ending today
  let runningPrice = baseline;
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);

    if (i === 0) {
      // Day 0 is today - exact current live price
      runningPrice = currentPrice;
    } else {
      // Gentle random walk
      const delta = (rand() - 0.48) * (baseline * 0.04);
      runningPrice = Math.max(baseline * 0.78, Math.min(baseline * 1.25, runningPrice + delta));
    }

    const roundedPrice = Math.round(runningPrice * 100) / 100;
    const month = d.toLocaleDateString('en-US', { month: 'short' });
    const day = d.getDate();

    history.push({
      date: `${month} ${day}`,
      fullDate: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      price: roundedPrice,
    });
  }

  // Calculate 30-day stats
  const allPrices = history.map((h) => h.price);
  const thirtyDayLow = Math.min(...allPrices);
  const thirtyDayHigh = Math.max(...allPrices);
  const sum = allPrices.reduce((acc, p) => acc + p, 0);
  const thirtyDayAvg = Math.round((sum / allPrices.length) * 100) / 100;

  // Mark points that hit lowest
  history.forEach((h) => {
    if (h.price === thirtyDayLow) {
      h.isLowest = true;
    }
  });

  const diffFromAvg = Math.round((currentPrice - thirtyDayAvg) * 100) / 100;
  const diffFromAvgPercent = Math.round(((currentPrice - thirtyDayAvg) / thirtyDayAvg) * 1000) / 10;

  // Determine deal rating
  let dealGrade: DealGrade = 'fair';
  let dealVerdict = 'Fair Market Price';
  let recommendation = 'Standard market rate. Safe to purchase if you need it now.';

  if (currentPrice <= thirtyDayLow * 1.01 || diffFromAvgPercent <= -8) {
    dealGrade = 'steal';
    dealVerdict = 'Lowest Price in 30 Days';
    recommendation = `Exceptional timing! Current price is $${Math.abs(diffFromAvg).toFixed(2)} (${Math.abs(diffFromAvgPercent)}%) lower than the 30-day average.`;
  } else if (diffFromAvgPercent <= -2.5) {
    dealGrade = 'good';
    dealVerdict = 'Good Deal — Below 30-Day Average';
    recommendation = `Solid price! You're saving ~$${Math.abs(diffFromAvg).toFixed(2)} compared to what shoppers paid recently.`;
  } else if (diffFromAvgPercent >= 6) {
    dealGrade = 'pricey';
    dealVerdict = 'Higher Than Usual';
    recommendation = `This item recently sold for as low as $${thirtyDayLow.toFixed(2)}. Consider setting a price alert or waiting for a dip.`;
  } else {
    dealGrade = 'fair';
    dealVerdict = 'Typical 30-Day Price';
    recommendation = `Price is within $${Math.abs(diffFromAvg).toFixed(2)} of typical 30-day fluctuations.`;
  }

  return {
    productId: product.id,
    thirtyDayAvg,
    thirtyDayLow,
    thirtyDayHigh,
    currentPrice,
    diffFromAvg,
    diffFromAvgPercent,
    dealGrade,
    dealVerdict,
    recommendation,
    history,
  };
}
