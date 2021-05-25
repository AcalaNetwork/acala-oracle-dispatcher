import { CombinedFetcher, CCXTFetcher, CryptoCompareFetcher, FetcherInterface } from '@open-web3/fetcher';
import config from './config';

const CURRENCIES: { [key: string]: string[] } = {
  BTC: ['RENBTC']
};

const createFetcher = (exchange: string): FetcherInterface => {
  if (exchange === 'CryptoCompare') {
    return new CryptoCompareFetcher('CCCAGG', config.cryptoCompareApiKey);
  }

  if (exchange.startsWith('CCXT')) {
    const [, exchangeName] = exchange.split(':');
    return new CCXTFetcher(exchangeName);
  }

  throw Error('Unknown exchange');
};

export default class PriceFetcher {
  private readonly fetchers: { [key: string]: FetcherInterface };
  private readonly symbols: string[];

  constructor() {
    this.symbols = config.symbols;

    this.fetchers = this.symbols
      .map((symbol) => {
        const fetchers = config.exchanges[symbol].map((exchange) => createFetcher(exchange));
        return { [symbol]: new CombinedFetcher(fetchers, config.priceSourceCount) };
      })
      .reduce((acc, x) => {
        const key = Object.keys(x)[0];
        return { ...acc, [key]: x[key] };
      });
  }

  async fetchPrices(): Promise<{ currency: any; price: string }[]> {
    const res = await Promise.all(
      this.symbols.map((symbol) =>
        this.fetchers[symbol].getPrice(symbol).then((price) => {
          const [base] = symbol.split('/');
          return (CURRENCIES[base] || [base]).map((currency) => ({ currency, price }));
        })
      )
    );
    return res.reduce((acc, val) => acc.concat(val), []);
  }
}
