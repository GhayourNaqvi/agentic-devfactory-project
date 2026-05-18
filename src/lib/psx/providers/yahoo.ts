import yahooFinance from "yahoo-finance2";
import type { PsxStockRecord, RetryConfig } from "../types";
import { BaseProvider } from "./base";
import { InvalidDataError, ProviderUnavailableError } from "../errors";
import { withRetry } from "../retry";
import { PSX_TOP_SYMBOLS } from "../types";

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
  FCIBL: "Modarabas and Leasing",
  NML: "Cement",
  DGKC: "Cement",
  MLCF: "Cement",
  CHCC: "Cement",
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
  TATV: "Technology & Communication",
  AVN: "Technology & Communication",
  ICT: "Technology & Communication",
  DAWH: "Pharmaceuticals",
  GLAXO: "Pharmaceuticals",
  AGP: "Pharmaceuticals",
  SCL: "Pharmaceuticals",
  FZCM: "Pharmaceuticals",
  HCAR: "Automobile Assembler",
  INDU: "Automobile Assembler",
  PAEL: "Automobile Parts & Accessories",
  NESTLE: "Food & Personal Care Products",
  COLG: "Food & Personal Care Products",
  ISL: "Sugar & Allied Industries",
  NINL: "Insurance",
  EFUG: "Insurance",
  TGL: "Textile Composite",
  NCL: "Textile Composite",
  SAPL: "Textile Weaving",
  SAZEW: "Textile Spinning",
  GGL: "Glass & Ceramics",
  KSBP: "Engineering",
  SIEMENS: "Engineering",
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

export class YahooFinanceProvider extends BaseProvider {
  readonly name = "yahoo-finance";
  private retryConfig: RetryConfig;

  constructor(retryConfig?: Partial<RetryConfig>) {
    super();
    this.retryConfig = {
      maxRetries: retryConfig?.maxRetries ?? 3,
      baseDelay: retryConfig?.baseDelay ?? 1000,
      timeoutMs: retryConfig?.timeoutMs ?? 10000,
    };
  }

  async fetchTopStocks(limit = 100): Promise<PsxStockRecord[]> {
    const symbols = PSX_TOP_SYMBOLS.slice(0, limit);
    const results: PsxStockRecord[] = [];

    for (const symbol of symbols) {
      try {
        const record = await this.fetchSingleStock(symbol);
        results.push(record);
      } catch {
        continue;
      }
    }

    if (results.length === 0) {
      throw new ProviderUnavailableError(this.name);
    }

    return results;
  }

  async fetchStock(ticker: string): Promise<PsxStockRecord> {
    const yahooTicker = this.toYahooTicker(ticker);
    return this.fetchSingleStock(yahooTicker);
  }

  private async fetchSingleStock(symbol: string): Promise<PsxStockRecord> {
    const quote = await withRetry(
      async () => {
        try {
          return await yahooFinance.quote(symbol);
        } catch (error) {
          throw new ProviderUnavailableError(
            this.name,
            error instanceof Error ? error : undefined,
          );
        }
      },
      this.retryConfig,
    );

    if (!quote || !quote.regularMarketPrice) {
      throw new InvalidDataError(this.name, `Missing price data for ${symbol}`);
    }

    const ticker = this.stripYahooSuffix(symbol);

    return {
      ticker,
      companyName: quote.longName ?? quote.shortName ?? ticker,
      sector: SECTOR_MAP[ticker] ?? "Other",
      ohlc: {
        open: quote.regularMarketOpen ?? quote.regularMarketPrice,
        high: quote.regularMarketDayHigh ?? quote.regularMarketPrice,
        low: quote.regularMarketDayLow ?? quote.regularMarketPrice,
        close: quote.regularMarketPrice,
        volume: quote.regularMarketVolume ?? 0,
      },
      currency: "PKR",
      fetchedAt: new Date(),
    };
  }
}
