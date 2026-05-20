import type { PsxStockRecord, RetryConfig } from "../types";
import { BaseProvider } from "../providers/base";
import { InvalidDataError, ProviderUnavailableError, StockNotFoundError } from "../errors";
import { withRetry } from "../retry";

const PSX_MARKETS_URL = "https://dps.psx.com.pk/company-list";
const PSX_COMPANY_URL = "https://dps.psx.com.pk/company/";

const SECTOR_MAP: Record<string, string> = {
  OGDC: "Oil & Gas Exploration",
  PPL: "Oil & Gas Exploration",
  TRG: "Technology & Communication",
  LUCK: "Cement",
  ENGRO: "Fertilizer",
  HUBC: "Power Generation & Distribution",
  MEBL: "Commercial Banks",
  MCB: "Commercial Banks",
  UBL: "Commercial Banks",
  HBL: "Commercial Banks",
  FFC: "Fertilizer",
  EFERT: "Fertilizer",
  FATIMA: "Fertilizer",
  SYS: "Technology & Communication",
  NETSOL: "Technology & Communication",
  ATRL: "Oil & Gas Marketing",
  PSO: "Oil & Gas Marketing",
  SNGP: "Oil & Gas Marketing",
  SSGC: "Oil & Gas Marketing",
  NBP: "Commercial Banks",
  BAFL: "Commercial Banks",
  BAHL: "Commercial Banks",
  BOP: "Commercial Banks",
  SCBPL: "Commercial Banks",
  JSBL: "Commercial Banks",
  JSGBL: "Commercial Banks",
  FABL: "Commercial Banks",
  NML: "Cement",
  DGKC: "Cement",
  MLCF: "Cement",
  DCL: "Cement",
  KOHC: "Cement",
  FCEPL: "Power Generation & Distribution",
  KAPCO: "Power Generation & Distribution",
  KEL: "Power Generation & Distribution",
  CNERGY: "Oil & Gas Marketing",
  BYCO: "Oil & Gas Marketing",
  HASCOL: "Oil & Gas Marketing",
  APL: "Oil & Gas Exploration",
  MARI: "Oil & Gas Exploration",
  SEARL: "Oil & Gas Exploration",
  PRL: "Oil & Gas Exploration",
  POLYM: "Chemical",
  LOTCHEM: "Chemical",
  LPL: "Commercial Banks",
  TPL: "Technology & Communication",
  TPLP: "Technology & Communication",
  AIRLINK: "Technology & Communication",
  TELE: "Technology & Communication",
  DAWH: "Pharmaceuticals",
  GLAXO: "Pharmaceuticals",
  AGP: "Pharmaceuticals",
  SCL: "Pharmaceuticals",
  HCAR: "Automobile Assembler",
  INDU: "Automobile Assembler",
  PAEL: "Automobile Parts & Accessories",
  NESTLE: "Food & Personal Care Products",
  COLG: "Food & Personal Care Products",
  ISL: "Sugar & Allied Industries",
  TGL: "Textile Composite",
  NCL: "Textile Composite",
  SAPL: "Textile Weaving",
  SAZEW: "Textile Spinning",
  GGL: "Glass & Ceramics",
  KSBP: "Engineering",
  PTC: "Power Generation & Distribution",
  KOSM: "Sugar & Allied Industries",
  HUMNL: "Sugar & Allied Industries",
  PSX: "Inv. Banks / Inv. Cos. / Securities Cos.",
  IGIHL: "Insurance",
  TRIPF: "Food & Personal Care Products",
  MAPLE: "Food & Personal Care Products",
  WTL: "Technology & Communication",
  SHEL: "Oil & Gas Marketing",
};

interface ScrapedRow {
  ticker: string;
  companyName: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export class PsxScraperAdapter extends BaseProvider {
  readonly name = "psx-scraper";
  private retryConfig: RetryConfig;
  private baseUrl: string;

  constructor(options?: { retryConfig?: Partial<RetryConfig>; baseUrl?: string }) {
    super();
    this.retryConfig = {
      maxRetries: options?.retryConfig?.maxRetries ?? 3,
      baseDelay: options?.retryConfig?.baseDelay ?? 1000,
      maxDelay: options?.retryConfig?.maxDelay ?? 8000,
      timeoutMs: options?.retryConfig?.timeoutMs ?? 10000,
    };
    this.baseUrl = options?.baseUrl ?? PSX_MARKETS_URL;
  }

  async fetchTopStocks(limit = 100): Promise<PsxStockRecord[]> {
    const html = await this.fetchHtml(this.baseUrl);
    const rows = this.parseMarketTable(html);

    if (rows.length === 0) {
      throw new InvalidDataError(this.name, "No rows parsed from PSX market table");
    }

    const stocks = rows.slice(0, limit).map((row) => this.toStockRecord(row));

    if (stocks.length === 0) {
      throw new ProviderUnavailableError(this.name);
    }

    return stocks;
  }

  async fetchStock(ticker: string): Promise<PsxStockRecord> {
    const normalizedTicker = this.stripYahooSuffix(ticker);
    const url = `${PSX_COMPANY_URL}${normalizedTicker.toLowerCase()}`;

    const html = await this.fetchHtml(url);
    const record = this.parseCompanyPage(html, normalizedTicker);

    if (!record) {
      throw new StockNotFoundError(ticker);
    }

    return record;
  }

  private async fetchHtml(url: string): Promise<string> {
    return withRetry(
      async () => {
        const response = await fetch(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; PSXDataService/1.0)",
            Accept: "text/html,application/xhtml+xml",
          },
          signal: AbortSignal.timeout(this.retryConfig.timeoutMs),
        });

        if (!response.ok) {
          if (response.status === 429) {
            throw new InvalidDataError(this.name, `Rate limited: ${response.status}`);
          }
          if (response.status >= 500) {
            throw new ProviderUnavailableError(this.name, new Error(`Server error: ${response.status}`));
          }
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return response.text();
      },
      this.retryConfig,
    );
  }

  parseMarketTable(html: string): ScrapedRow[] {
    const rows: ScrapedRow[] = [];

    const tableRegex = /<table[^>]*class="[^"]*company[^"]*"[^>]*>([\s\S]*?)<\/table>/i;
    const tableMatch = html.match(tableRegex);
    const tableContent = tableMatch?.[1] ?? html;

    const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    let rowMatch: RegExpExecArray | null;

    while ((rowMatch = rowRegex.exec(tableContent)) !== null) {
      const rowContent = rowMatch[1];
      const cells = this.extractCells(rowContent);

      if (cells.length < 7) continue;

      const ticker = this.cleanText(cells[0]);
      const companyName = this.cleanText(cells[1]);
      const open = this.parseNumber(cells[2]);
      const high = this.parseNumber(cells[3]);
      const low = this.parseNumber(cells[4]);
      const close = this.parseNumber(cells[5]);
      const volume = this.parseNumber(cells[6]);

      if (!ticker || close === null) continue;

      rows.push({
        ticker: ticker.toUpperCase(),
        companyName: companyName || ticker,
        open: open ?? close,
        high: high ?? close,
        low: low ?? close,
        close,
        volume: volume ?? 0,
      });
    }

    return rows;
  }

  parseCompanyPage(html: string, ticker: string): PsxStockRecord | null {
    const priceMatch = html.match(/["']lastPrice["']\s*:\s*["']?([\d,.]+)["']?/i)
      ?? html.match(/Current Price[^<>]*<\/[^>]*>\s*[^<>]*([\d,.]+)/i);

    const close = priceMatch ? this.parseNumber(priceMatch[1]) : null;
    if (close === null) return null;

    const nameMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const companyName = nameMatch
      ? this.cleanText(nameMatch[1]).replace(/[-|].*$/, "").trim()
      : ticker;

    const openMatch = html.match(/["']open["']\s*:\s*["']?([\d,.]+)["']?/i);
    const highMatch = html.match(/["']high["']\s*:\s*["']?([\d,.]+)["']?/i);
    const lowMatch = html.match(/["']low["']\s*:\s*["']?([\d,.]+)["']?/i);
    const volumeMatch = html.match(/["']volume["']\s*:\s*["']?([\d,.]+)["']?/i);

    return {
      ticker,
      companyName,
      sector: SECTOR_MAP[ticker] ?? "Other",
      ohlc: {
        open: openMatch ? this.parseNumber(openMatch[1]) ?? close : close,
        high: highMatch ? this.parseNumber(highMatch[1]) ?? close : close,
        low: lowMatch ? this.parseNumber(lowMatch[1]) ?? close : close,
        close,
        volume: volumeMatch ? this.parseNumber(volumeMatch[1]) ?? 0 : 0,
      },
      currency: "PKR",
      fetchedAt: new Date(),
    };
  }

  private extractCells(rowHtml: string): string[] {
    const cells: string[] = [];
    const cellRegex = /<(td|th)[^>]*>([\s\S]*?)<\/\1>/gi;
    let cellMatch: RegExpExecArray | null;

    while ((cellMatch = cellRegex.exec(rowHtml)) !== null) {
      cells.push(cellMatch[2]);
    }

    return cells;
  }

  private cleanText(html: string): string {
    return html
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/\s+/g, " ")
      .trim();
  }

  private parseNumber(value: string): number | null {
    const cleaned = value.replace(/[,$]/g, "").trim();
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
  }

  private toStockRecord(row: ScrapedRow): PsxStockRecord {
    return {
      ticker: row.ticker,
      companyName: row.companyName,
      sector: SECTOR_MAP[row.ticker] ?? "Other",
      ohlc: {
        open: row.open,
        high: row.high,
        low: row.low,
        close: row.close,
        volume: row.volume,
      },
      currency: "PKR",
      fetchedAt: new Date(),
    };
  }
}
