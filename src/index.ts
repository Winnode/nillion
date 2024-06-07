import * as dotenv from 'dotenv';
import * as bip39 from 'bip39';
import { DirectSecp256k1HdWallet, OfflineSigner } from '@cosmjs/proto-signing';
import {
  assertIsDeliverTxSuccess,
  SigningStargateClient,
  GasPrice,
  coins,
} from '@cosmjs/stargate';


console.log(`===============================Winnode Project Bot  ===============================

By       : t.me/Winnodexx
Github   : @Winnode
Support  : 0xde260429ef7680c7a43e855b5fcf619948f34e2a
________________________________________________________________________________________________
`);

dotenv.config();

const MNEMONICS = [
  process.env.MNEMONIC1,
  process.env.MNEMONIC2,
  process.env.MNEMONIC3,
  process.env.MNEMONIC4,
  process.env.MNEMONIC5,
].filter((mnemonic): mnemonic is string => typeof mnemonic === 'string'); 

(async () => {
  const wallets = await initWallets(MNEMONICS);
  while (true) {
    await Promise.all(wallets.map(wallet => sendTransaction(wallet)));
    console.log('Sleeping for 60 seconds...');
    await sleep(60000);
  }
})();

async function initWallets(mnemonics: string[]): Promise<OfflineSigner[]> {
  const wallets = [];
  for (const mnemonic of mnemonics) {
    const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, { prefix: "nillion" });
    wallets.push(wallet);
  }
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

  console.log(`Send $NIL to ${recipient}`);

  const [firstAccount] = await wallet.getAccounts();

  const transaction = await client.sendTokens(
    firstAccount.address,
    recipient,
    amount,
    "auto",
  );
  assertIsDeliverTxSuccess(transaction);

  console.log(`Successfully broadcasted: ${transaction.transactionHash}`);
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
