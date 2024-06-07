import * as dotenv from 'dotenv';
import * as bip39 from 'bip39';
import { DirectSecp256k1HdWallet, OfflineSigner } from '@cosmjs/proto-signing';
import {
  assertIsDeliverTxSuccess,
  SigningStargateClient,
  GasPrice,
  coins,
} from '@cosmjs/stargate';

(async () => {
  dotenv.config();
  const wallets = await initWallets();
  console.log(banner());
  while (true) {
    for (const wallet of wallets) {
      await sendTransaction(wallet);
    }
    console.log('Sleeping for 30 seconds...');
    await sleep(30000);
  }
})();

async function initWallets(): Promise<OfflineSigner[]> {
  const mnemonics = [
    process.env.MNEMONIC1 ?? "",
    process.env.MNEMONIC2 ?? "",
    process.env.MNEMONIC3 ?? ""
  ].filter(mnemonic => mnemonic !== "");

  const wallets = await Promise.all(
    mnemonics.map(mnemonic => DirectSecp256k1HdWallet.fromMnemonic(mnemonic, { prefix: "nillion" }))
  );

  return wallets;
}

async function createReceiveAddress(): Promise<string> {
  const mnemonic = bip39.generateMnemonic();
  const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, { prefix: "nillion" });
  const [firstAccount] = await wallet.getAccounts();

  return firstAccount.address;
}

async function sendTransaction(wallet: OfflineSigner) {
  const rpcEndpoint = 'https://nillion-testnet-rpc.polkachu.com/';
  const client = await SigningStargateClient.connectWithSigner(
    rpcEndpoint,
    wallet,
    {
      gasPrice: GasPrice.fromString('0.000001unil'),
    }
  );

  const recipient = await createReceiveAddress();
  const amount = coins(1, 'unil');

  const [firstAccount] = await wallet.getAccounts();
  console.log(`Send $NIL from ${firstAccount.address} to ${recipient}`);

  const transaction = await client.sendTokens(
    firstAccount.address,
    recipient,
    amount,
    "auto"
  );
  assertIsDeliverTxSuccess(transaction);

  console.log('Successfully broadcasted:', transaction.transactionHash);
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function banner(): string {
  return `
===============================Winnode Project Bot  ===============================

By       : t.me/Winnodexx
Github   : @Winnode
Support  : 0xde260429ef7680c7a43e855b5fcf619948f34e2a
____________________________________________________________________________________________________
`;
}
