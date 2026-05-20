export interface Ohlcv {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type Ohlc = Ohlcv;

export interface PsxStockRecord {
  ticker: string;
  companyName: string;
  sector: string;
  ohlc: Ohlcv;
  currency: "PKR";
  fetchedAt: Date;
}

export interface CacheEntry<T> {
  data: T;
  fetchedAt: Date;
  source: string;
}

export interface PsxDataProvider {
  name: string;
  fetchTopStocks(limit?: number): Promise<PsxStockRecord[]>;
  fetchStock(ticker: string): Promise<PsxStockRecord>;
  healthCheck(): Promise<boolean>;
}

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  timeoutMs: number;
}

export interface GetTopStocksOptions {
  forceRefresh?: boolean;
  sector?: string;
}

export interface GetStockOptions {
  forceRefresh?: boolean;
}

export interface PsxApiResponse<T> {
  data: T;
  meta: {
    count?: number;
    source: string;
    cached: boolean;
    cacheAge?: number;
  };
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 8000,
  timeoutMs: 10000,
};

export const DEFAULT_CACHE_TTL_MS = 5 * 60 * 1000;

export const PSX_TOP_SYMBOLS: string[] = [
  "OGDC.KAR",
  "PPL.KAR",
  "TRG.KAR",
  "LUCK.KAR",
  "ENGRO.KAR",
  "HUBC.KAR",
  "MEBL.KAR",
  "MCB.KAR",
  "UBL.KAR",
  "HBL.KAR",
  "FFC.KAR",
  "EFERT.KAR",
  "FATIMA.KAR",
  "SYS.KAR",
  "NETSOL.KAR",
  "AIRLINK.KAR",
  "INDU.KAR",
  "KOHC.KAR",
  "KAPCO.KAR",
  "ATRL.KAR",
  "BYCO.KAR",
  "CNERGY.KAR",
  "DAWH.KAR",
  "GLAXO.KAR",
  "HASCOL.KAR",
  "HCAR.KAR",
  "HINOON.KAR",
  "HUMNL.KAR",
  "IBFL.KAR",
  "ICL.KAR",
  "ISIL.KAR",
  "KEL.KAR",
  "KHYT.KAR",
  "KOHE.KAR",
  "KOSM.KAR",
  "LPL.KAR",
  "LSECL.KAR",
  "MAPLE.KAR",
  "MCBIF.KAR",
  "MARI.KAR",
  "MEHT.KAR",
  "MIRKS.KAR",
  "NAGC.KAR",
  "NBP.KAR",
  "NESTLE.KAR",
  "NML.KAR",
  "PAEL.KAR",
  "PIA.KAR",
  "PIBTL.KAR",
  "POLYM.KAR",
  "PPL.KAR",
  "PREMA.KAR",
  "PSO.KAR",
  "PSX.KAR",
  "PTC.KAR",
  "SEARL.KAR",
  "SCL.KAR",
  "SNGP.KAR",
  "SPL.KAR",
  "SSGC.KAR",
  "SSML.KAR",
  "TGL.KAR",
  "TOMCL.KAR",
  "TPL.KAR",
  "TRIPF.KAR",
  "UGL.KAR",
  "UNITY.KAR",
  "WHL.KAR",
  "YOBL.KAR",
  "ZBL.KAR",
  "AGP.KAR",
  "AGL.KAR",
  "ALGI.KAR",
  "ALNRS.KAR",
  "ANL.KAR",
  "APL.KAR",
  "ASKL.KAR",
  "AVN.KAR",
  "BAFL.KAR",
  "BAHL.KAR",
  "BOP.KAR",
  "BWCL.KAR",
  "BWHL.KAR",
  "CAL.KAR",
  "CCL.KAR",
  "CENTR.KAR",
  "COLG.KAR",
  "CPHL.KAR",
  "DCL.KAR",
  "DGKC.KAR",
  "DOL.KAR",
  "DSCL.KAR",
  "ELCM.KAR",
  "ELSM.KAR",
  "FABL.KAR",
  "FCEPL.KAR",
  "FCIBL.KAR",
  "FCONM.KAR",
  "FFLM.KAR",
  "FHBM.KAR",
  "GAIL.KAR",
  "GATM.KAR",
  "GGL.KAR",
  "GHGL.KAR",
  "GHNI.KAR",
  "GIL.KAR",
  "GLAT.KAR",
  "GOC.KAR",
  "GOCM.KAR",
  "HBLM.KAR",
  "HISCL.KAR",
  "HONL.KAR",
  "HUBC.KAR",
  "IBLHL.KAR",
  "IDRT.KAR",
  "IGIHL.KAR",
  "ILM.KAR",
  "INIL.KAR",
  "INSY.KAR",
  "ISL.KAR",
  "JDC.KAR",
  "JDWS.KAR",
  "JJSCL.KAR",
  "JSBL.KAR",
  "JSCL.KAR",
  "JSGBL.KAR",
  "JSIL.KAR",
  "KCL.KAR",
  "KEBE.KAR",
  "KHTC.KAR",
  "KIHL.KAR",
  "KML.KAR",
  "KRMPL.KAR",
  "KSBP.KAR",
  "LHVL.KAR",
  "LOTCHEM.KAR",
  "MCBAH.KAR",
  "MDC.KAR",
  "MERIT.KAR",
  "MFL.KAR",
  "MLCF.KAR",
  "MODAM.KAR",
  "MPL.KAR",
  "MRNS.KAR",
  "MSCL.KAR",
  "NCL.KAR",
  "NDC.KAR",
  "NINL.KAR",
  "NRL.KAR",
  "NSRM.KAR",
  "OCTOPUS.KAR",
  "OLPL.KAR",
  "OLPM.KAR",
  "PAKA.KAR",
  "PAKDATA.KAR",
  "PGLC.KAR",
  "POWER.KAR",
  "PNCB.KAR",
  "PNCM.KAR",
  "PRG.KAR",
  "PRL.KAR",
  "QUET.KAR",
  "RPL.KAR",
  "SALM.KAR",
  "SANSM.KAR",
  "SAPL.KAR",
  "SAZEW.KAR",
  "SBL.KAR",
  "SCBPL.KAR",
  "SCL.KAR",
  "SHEL.KAR",
  "SIPL.KAR",
  "SMCPL.KAR",
  "SPWL.KAR",
  "SRVI.KAR",
  "STJT.KAR",
  "SYL.KAR",
  "TATV.KAR",
  "TCORP.KAR",
  "TELE.KAR",
  "THALL.KAR",
  "THCCL.KAR",
  "TOWL.KAR",
  "TPLI.KAR",
  "TPLP.KAR",
  "TPLT.KAR",
  "TRSM.KAR",
  "TSCL.KAR",
  "TSMF.KAR",
  "UDPL.KAR",
  "UNIC.KAR",
  "UNOP.KAR",
  "UPFL.KAR",
  "VETX.KAR",
  "WAVV.KAR",
  "WTL.KAR",
];
