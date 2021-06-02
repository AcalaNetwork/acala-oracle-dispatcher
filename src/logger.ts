import { inspect } from 'util';
import { LoggerOutput, consoleOutput } from '@open-web3/util/logger';

const jsonOutput: LoggerOutput = (payload) => {
  consoleOutput({
    ...payload,
    args: [inspect(payload.args, { depth: 5, colors: false, breakLength: Infinity, compact: Infinity })]
  });
};

export default jsonOutput;
