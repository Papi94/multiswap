import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as promptly from "promptly";
import yargs from "yargs/yargs";
import { hideBin } from "yargs/helpers";
import { Coins, LCDClient, LocalTerra } from "@terra-money/terra.js";
import * as keystore from "./keystore";
import * as market from "./market";

function makeConfigDir() {
  const configDir = path.join(os.homedir(), ".multiswap");
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
}

async function addKey(name: string) {
  const mnemonic = await promptly.prompt("Enter your BIP-39 mnemonic phrase:");

  const password = await promptly.password("Enter a password to encrypt your key:");
  const repeat = await promptly.password("Repeat the password:");
  if (password != repeat) {
    throw new Error("passwords don't match!");
  }

  await keystore.save(name, mnemonic, password);
  console.log("successfully added key!");
}

async function removeKey(name: string) {
  await keystore.remove(name);
  console.log("successfully removed key!");
}

async function swap(keyName: string, network: string, withholdStr: string, lcd?: string) {
  if (!["mainnet", "testnet", "localterra"].includes(network)) {
    throw new Error(`network must be mainnet|testnet|localterra. your input: ${network}`);
  }
  const terra =
    network === "mainnet"
      ? new LCDClient({
          URL: lcd ? lcd : "https://lcd.terra.dev",
          chainID: "columbus-5",
          gasPrices: "0.15uusd",
          gasAdjustment: 1.4,
        })
      : network === "testnet"
      ? new LCDClient({
          URL: lcd ? lcd : "https://bombay-lcd.terra.dev",
          chainID: "bombay-12",
          gasPrices: "0.155uusd",
          gasAdjustment: 1.4,
        })
      : new LocalTerra();

  const withhold = Coins.fromString(withholdStr);

  const password = await promptly.password("Enter the password used to encrypt the key:");
  const rawKey = keystore.load(keyName, password);
  const signer = terra.wallet(rawKey);

  const txhash = await market.executeSwaps(terra, signer, withhold);
  console.log("successfully broadcasted tx! txhash:", txhash);
}

(async () => {
  makeConfigDir();
  await yargs(hideBin(process.argv))
    .command(
      "add-key [key-name]",
      "Add a key with the given name",
      (yargs) => {
        return yargs.positional("key-name", {
          type: "string",
          describe: "name of the key",
          demandOption: true,
        });
      },
      (argv) => addKey(argv["key-name"]).catch((e) => console.log(e)),
    )
    .command(
      "remove-key [key-name]",
      "Remove a key of the given name",
      (yargs) => {
        return yargs.positional("key-name", {
          type: "string",
          describe: "name of the key",
          demandOption: true,
        });
      },
      (argv) => removeKey(argv["key-name"]).catch((e) => console.log(e)),
    )
    .command(
      "swap [key-name] [--network [network]] [--lcd [url]] [--withhold [coins]]",
      "Swap an account's Terra stablecoins into Luna",
      (yargs) => {
        return yargs
          .positional("key-name", {
            type: "string",
            describe: "name of the account whose coins are to be swapped",
            demandOption: true,
          })
          .option("network", {
            type: "string",
            describe: "network to broadcast the tx",
            default: "mainnet",
            demandOption: false,
          })
          .option("lcd", {
            type: "string",
            describe: "URL of a Terra LCD node for broadcasting the tx",
            demandOption: false,
          })
          .option("withhold", {
            type: "string",
            describe: "list of coins to retain",
            default: "",
            demandOption: false,
          });
      },
      (argv) => {
        swap(argv["key-name"], argv.network, argv.withhold, argv.lcd).catch((e) => console.log(e));
      },
    )
    .wrap(100)
    .parse();
})();
