/* eslint-disable */

import BigNumber from 'big.js';
import { ApiManager } from '@open-web3/api';
import { defaultLogger, HeartbeatGroup } from '@open-web3/util';

const logger = defaultLogger.createLogger('dex');

const BASE_CURRENCY_ID = { Token: 'AUSD' };

// if more than `ARBITRAGE_RATIO`, do swap; 3%
const ARBITRAGE_RATIO = 0.03;

// expect less target amount to cover exchange fee (0.3%) and other slippage (0.7%)
const SLIPPAGE_RATIO = 0.01;

const tradeOne = async (api: ApiManager, currency: string, price: number, heartbeat: HeartbeatGroup) => {
  const pool: any = await api.api.query.dex.liquidityPool({ Token: currency });
  const [listingAmount, baseAmount]: [number, number] = pool.map((x: any) => +x.toString()); // this is a lossy conversion but it is fine
  if (!listingAmount) {
    logger.debug('Skip, zero listing amount', { currency });
    return;
  }

  const dexPrice = baseAmount / listingAmount;

  const gapRatio = Math.abs((price - dexPrice) / price);
  if (gapRatio < ARBITRAGE_RATIO) {
    heartbeat.markAlive(currency);

    logger.log('Skip, price close', { currency, price, dexPrice });
    return;
  }

  const constProduct = listingAmount * baseAmount;

  const newListingAmount = Math.sqrt(constProduct / price);
  const newBaseAmount = constProduct / newListingAmount;

  logger.log('Swap', {
    currency,
    price,
    dexPrice,
    newBaseAmount,
    newListingAmount,
    baseAmount,
    listingAmount
  });

  if (dexPrice < price) {
    // buy
    const supplyAmount = newBaseAmount - baseAmount;
    const targetAmount = (listingAmount - newListingAmount) * (1 - SLIPPAGE_RATIO);
    return api.api.tx.dex.swapWithExactSupply(
      [BASE_CURRENCY_ID, { Token: currency }],
      new BigNumber(supplyAmount).toFixed(),
      new BigNumber(targetAmount).toFixed()
    );
  } else {
    // sell
    const supplyAmount = newListingAmount - listingAmount;
    const targetAmount = (baseAmount - newBaseAmount) * (1 - SLIPPAGE_RATIO);
    return api.api.tx.dex.swapWithExactSupply(
      [BASE_CURRENCY_ID, { Token: currency }],
      new BigNumber(supplyAmount).toFixed(),
      new BigNumber(targetAmount).toFixed()
    );
  }
};

const tradeDex = async (
  api: ApiManager,
  data: Array<{ currency: string; price: string }>,
  heartbeat: HeartbeatGroup
) => {
  const txs: any[] = [];
  const currencies: string[] = [];

  for (const { currency, price } of data) {
    const tx = await tradeOne(api, currency, +price, heartbeat);
    if (tx) {
      txs.push(tx);
      currencies.push(currency);
    }
  }

  if (txs.length) {
    const sendResult = api.signAndSend(txs);
    await sendResult.send;
    const events = await sendResult.inBlock;

    for (const currency of currencies) {
      heartbeat.markAlive(currency);
    }

    logger.info('Swap done', {
      txHash: events.txHash,
      blockHash: events.blockHash
    });
  }
};

export default tradeDex;
