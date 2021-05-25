import dotenv from 'dotenv';

dotenv.config();

const config = () => {
  // parse api_keys
  const cryptoCompareApiKey = process.env.CRYPTO_COMPARE_API_KEY;
  if (!cryptoCompareApiKey) {
    throw new Error('Missing CRYPTO_COMPARE_API_KEY');
  }

  // parse symbols
  const SYMBOLS = process.env.SYMBOLS;
  if (!SYMBOLS) {
    throw new Error('Missing SYMBOLS');
  }
  const symbols = SYMBOLS.split(',');

  // parse exchanges
  const exchanges = symbols
    .map((symbol) => {
      const [base, quote] = symbol.split('/');
      const EXCHANGES = process.env[`EXCHANGES_${base}_${quote}`];
      if (!EXCHANGES) {
        throw new Error(`Missing EXCHANGES_${base}_${quote}`);
      }
      const exchanges = EXCHANGES.split(',');
      return [symbol, exchanges] as [string, string[]];
    })
    .reduce((acc, [symbol, exchanges]) => {
      return { ...acc, [symbol]: exchanges };
    }, {} as Record<string, string[]>);

  const config = {
    wsUrl: process.env.WS_URL as string,
    seed: process.env.SEED as string,
    interval: Number(process.env.INTERVAL || 1000 * 60 * 5), // default to 5 mins
    env: process.env.NODE_ENV || 'development',
    logFilter: process.env.LOG_FILTER,
    logLevel: process.env.LOG_LEVEL,
    oracleName: process.env.ORACLE_NAME as string,
    port: process.env.PORT || 3000,
    tradeDex: process.env.TRADE_DEX === 'true',
    priceSourceCount: Number(process.env.PRICE_SOURCE_COUNT) || 2,
    cryptoCompareApiKey,
    symbols,
    exchanges
  };

  if (!config.wsUrl) {
    throw new Error('Missing WS_URL');
  }
  if (!config.seed) {
    throw new Error('Missing SEED');
  }
  if (!config.oracleName) {
    throw new Error('Missing ORACLE_NAME');
  }

  return config;
};

export default config();
