import * as promptly from "promptly";
import { Coins, isTxError, LCDClient, Msg, MsgSwap, Wallet } from "@terra-money/terra.js";

const denoms = [
  "usdr",
  "uusd",
  "ukrw",
  "umnt",
  "ueur",
  "ucny",
  "ujpy",
  "ugbp",
  "uinr",
  "ucad",
  "uchf",
  "uaud",
  "usgd",
  "uthb",
  "usek",
  "unok",
  "udkk",
  "uidr",
  "uphp",
  "uhkd",
  "umyr",
  "utwd",
];

async function sendTransaction(terra: LCDClient, signer: Wallet, msgs: Msg[]) {
  const tx = await signer.createAndSignTx({ msgs });
  console.log("\n" + JSON.stringify(tx) + "\n");

  await promptly.confirm("Confirm transaction before signing and broadcasting [y/N]:");
  const result = await terra.tx.broadcast(tx);

  if (isTxError(result)) {
    throw new Error(`tx failed! raw log: ${result.raw_log}`);
  }
  return result.txhash;
}

export async function executeSwaps(terra: LCDClient, signer: Wallet, withholds: Coins) {
  const [coins] = await terra.bank.balance(signer.key.accAddress);

  withholds.toArray().forEach((withhold) => {
    const coin = coins.get(withhold.denom);
    if (coin) {
      coins.set(coin.denom, coin.amount.gt(withhold.amount) ? coin.amount.sub(withhold.amount) : 0);
    }
  });

  const msgs: Msg[] = [];
  coins.toArray().forEach((coin) => {
    if (denoms.includes(coin.denom)) {
      msgs.push(new MsgSwap(signer.key.accAddress, coin, "uluna"));
    }
  });

  return await sendTransaction(terra, signer, msgs);
}
