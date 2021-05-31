import { inspect } from "util";
import { LoggerOutput } from "@open-web3/util/logger";

const jsonOutput: LoggerOutput = (payload) => {
  console.log(
    inspect(payload, { depth: 6, colors: false, breakLength: Infinity })
  );
};

export default jsonOutput;
