import { PsxService, YahooFinanceProvider } from "./psx";

const globalForPsx = globalThis as unknown as {
  psxService: PsxService | undefined;
};

export const psxService =
  globalForPsx.psxService ?? new PsxService({ providers: [new YahooFinanceProvider()] });

if (process.env.NODE_ENV !== "production") {
  globalForPsx.psxService = psxService;
}
