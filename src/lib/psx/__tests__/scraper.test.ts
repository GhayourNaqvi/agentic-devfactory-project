import { describe, it, expect, vi, beforeEach } from "vitest";
import { PsxScraperAdapter } from "../adapters/scraper";

const SAMPLE_MARKET_HTML = `
<html>
<body>
<table class="company-list table">
  <thead>
    <tr><th>Symbol</th><th>Company</th><th>Open</th><th>High</th><th>Low</th><th>Close</th><th>Volume</th></tr>
  </thead>
  <tbody>
    <tr>
      <td><a href="/company/ogdc">OGDC</a></td>
      <td>Oil & Gas Development Company Ltd</td>
      <td>142.50</td>
      <td>145.20</td>
      <td>141.90</td>
      <td>144.80</td>
      <td>12,500,000</td>
    </tr>
    <tr>
      <td><a href="/company/trg">TRG</a></td>
      <td>TRG Pakistan Limited</td>
      <td>85.00</td>
      <td>87.50</td>
      <td>84.20</td>
      <td>86.30</td>
      <td>8,200,000</td>
    </tr>
    <tr>
      <td><a href="/company/luck">LUCK</a></td>
      <td>Lucky Cement Limited</td>
      <td>520.00</td>
      <td>525.00</td>
      <td>518.00</td>
      <td>522.50</td>
      <td>3,100,000</td>
    </tr>
  </tbody>
</table>
</body>
</html>
`;

const SAMPLE_COMPANY_HTML = `
<html>
<head><title>OGDC - Oil & Gas Development Company Ltd | PSX</title></head>
<body>
<script>
  var companyData = {
    "lastPrice": "144.80",
    "open": "142.50",
    "high": "145.20",
    "low": "141.90",
    "volume": "12500000"
  };
</script>
</body>
</html>
`;

const MALFORMED_HTML = `
<html>
<body>
<div>No table here</div>
<p>Just some text</p>
</body>
</html>
`;

const EMPTY_TABLE_HTML = `
<html>
<body>
<table class="company-list">
  <thead>
    <tr><th>Symbol</th><th>Company</th><th>Open</th><th>High</th><th>Low</th><th>Close</th><th>Volume</th></tr>
  </thead>
  <tbody>
  </tbody>
</table>
</body>
</html>
`;

describe("PsxScraperAdapter", () => {
  let adapter: PsxScraperAdapter;

  beforeEach(() => {
    adapter = new PsxScraperAdapter({
      retryConfig: { maxRetries: 1, baseDelay: 10, maxDelay: 100, timeoutMs: 1000 },
    });
  });

  describe("parseMarketTable", () => {
    it("parses valid market table HTML into ScrapedRow[]", () => {
      const rows = adapter.parseMarketTable(SAMPLE_MARKET_HTML);

      expect(rows).toHaveLength(3);
      expect(rows[0]).toEqual({
        ticker: "OGDC",
        companyName: "Oil & Gas Development Company Ltd",
        open: 142.5,
        high: 145.2,
        low: 141.9,
        close: 144.8,
        volume: 12500000,
      });
      expect(rows[1].ticker).toBe("TRG");
      expect(rows[2].ticker).toBe("LUCK");
    });

    it("returns empty array for HTML without market table", () => {
      const rows = adapter.parseMarketTable(MALFORMED_HTML);
      expect(rows).toHaveLength(0);
    });

    it("returns empty array for empty table", () => {
      const rows = adapter.parseMarketTable(EMPTY_TABLE_HTML);
      expect(rows).toHaveLength(0);
    });

    it("handles missing numeric values by using close as fallback", () => {
      const htmlWithMissingData = `
        <table class="company-list">
          <tr>
            <td>TEST</td>
            <td>Test Company</td>
            <td>-</td>
            <td>-</td>
            <td>-</td>
            <td>100.00</td>
            <td>-</td>
          </tr>
        </table>
      `;

      const rows = adapter.parseMarketTable(htmlWithMissingData);
      expect(rows).toHaveLength(1);
      expect(rows[0].ticker).toBe("TEST");
      expect(rows[0].open).toBe(100);
      expect(rows[0].high).toBe(100);
      expect(rows[0].low).toBe(100);
      expect(rows[0].close).toBe(100);
      expect(rows[0].volume).toBe(0);
    });

    it("skips rows without ticker or close price", () => {
      const htmlWithBadRows = `
        <table class="company-list">
          <tr><td></td><td>No Ticker</td><td>100</td><td>100</td><td>100</td><td>100</td><td>1000</td></tr>
          <tr><td>VALID</td><td>Valid Co</td><td>50</td><td>55</td><td>48</td><td>52</td><td>5000</td></tr>
        </table>
      `;

      const rows = adapter.parseMarketTable(htmlWithBadRows);
      expect(rows).toHaveLength(1);
      expect(rows[0].ticker).toBe("VALID");
    });

    it("parses volume with comma separators", () => {
      const rows = adapter.parseMarketTable(SAMPLE_MARKET_HTML);
      expect(rows[0].volume).toBe(12500000);
    });
  });

  describe("parseCompanyPage", () => {
    it("parses company page HTML into PsxStockRecord", () => {
      const record = adapter.parseCompanyPage(SAMPLE_COMPANY_HTML, "OGDC");

      expect(record).not.toBeNull();
      expect(record!.ticker).toBe("OGDC");
      expect(record!.companyName).toBe("OGDC");
      expect(record!.ohlc.close).toBe(144.8);
      expect(record!.ohlc.open).toBe(142.5);
      expect(record!.ohlc.high).toBe(145.2);
      expect(record!.ohlc.low).toBe(141.9);
      expect(record!.ohlc.volume).toBe(12500000);
      expect(record!.currency).toBe("PKR");
    });

    it("returns null when price data is missing", () => {
      const record = adapter.parseCompanyPage(MALFORMED_HTML, "OGDC");
      expect(record).toBeNull();
    });

    it("maps known tickers to correct sectors", () => {
      const record = adapter.parseCompanyPage(SAMPLE_COMPANY_HTML, "OGDC");
      expect(record!.sector).toBe("Oil & Gas Exploration");
    });

    it("defaults sector to Other for unknown tickers", () => {
      const record = adapter.parseCompanyPage(SAMPLE_COMPANY_HTML, "UNKNOWN");
      expect(record!.sector).toBe("Other");
    });
  });

  describe("fetchTopStocks", () => {
    it("throws InvalidDataError when no rows parsed", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(MALFORMED_HTML),
      });

      await expect(adapter.fetchTopStocks()).rejects.toThrow("Invalid data from psx-scraper");
    });

    it("returns stocks from scraped HTML", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(SAMPLE_MARKET_HTML),
      });

      const stocks = await adapter.fetchTopStocks();

      expect(stocks.length).toBe(3);
      expect(stocks[0].ticker).toBe("OGDC");
      expect(stocks[0].sector).toBe("Oil & Gas Exploration");
    });

    it("respects limit parameter", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(SAMPLE_MARKET_HTML),
      });

      const stocks = await adapter.fetchTopStocks(2);
      expect(stocks.length).toBe(2);
    });
  });

  describe("fetchStock", () => {
    it("throws StockNotFoundError when company page has no price", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(MALFORMED_HTML),
      });

      await expect(adapter.fetchStock("OGDC")).rejects.toThrow("Stock not found: OGDC");
    });

    it("returns stock from company page", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(SAMPLE_COMPANY_HTML),
      });

      const stock = await adapter.fetchStock("OGDC");

      expect(stock.ticker).toBe("OGDC");
      expect(stock.ohlc.close).toBe(144.8);
    });
  });
});
