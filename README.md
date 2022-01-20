# multiswap

Compose a transaction that swaps the account's Terra stablecoins all into Luna. Useful for reinvesting validator rewards/commissions.

## Usage

#### Clone this repository

```bash
git clone https://github.com/larry0x/multiswap
cd multiswap
npm install
```

#### Add keys

```bash
npm start -- add-key yourname
```

You will be prompted to enter your BIP-39 mnemonic phrase and a password to encrypt the key, which will be stored encrypted at `$HOME/.multiswap/key_{yourname}.json`.

#### Remove keys

Simply delete the corresponding JSON file in the `keys` directory, or run:

```bash
npm start -- remove-key yourname
```

#### Execute the multiswap

```bash
npm start -- swap yourname \
  --network {mainnet|testnet|localterra} \
  --lcd https://lcd.terra.dev \
  --withhold 5000000uusd,100000000ukrw
```

You will be prompted to enter the password used the encrypt the key, and confirm the transaction:

Two notable flags:

* `lcd` specifies a Terra node for submitting transactions. Default to `http://localhost:1317`.
* `withhold` specifies coins that should be left alone and _not_ swapped, in the form of `{amount}{denom}` separated by commas.

## Acknowledgement

This repository reuses code from [terra-money/oracle-feeder](https://github.com/terra-money/oracle-feeder). Thank you!

## License

TBD