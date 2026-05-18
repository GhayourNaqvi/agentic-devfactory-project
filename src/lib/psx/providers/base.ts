import type { PsxDataProvider, PsxStockRecord } from "../types";

export abstract class BaseProvider implements PsxDataProvider {
  abstract readonly name: string;

  abstract fetchTopStocks(limit?: number): Promise<PsxStockRecord[]>;
  abstract fetchStock(ticker: string): Promise<PsxStockRecord>;

  async healthCheck(): Promise<boolean> {
    try {
      await this.fetchTopStocks(1);
      return true;
    } catch {
      return false;
    }
  }

  protected normalizeTicker(ticker: string): string {
    const upper = ticker.toUpperCase().trim();
    if (upper.includes(".KAR")) return upper;
    return `${upper}.KAR`;
  }

  protected toYahooTicker(ticker: string): string {
    return this.normalizeTicker(ticker);
  }

  protected stripYahooSuffix(ticker: string): string {
    return ticker.replace(/\.KAR$/, "");
  }
}
