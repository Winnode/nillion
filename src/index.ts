import * as dotenv from 'dotenv';
import * as bip39 from 'bip39';
import { DirectSecp256k1HdWallet, OfflineSigner } from '@cosmjs/proto-signing';
import {
  assertIsDeliverTxSuccess,
  SigningStargateClient,
  GasPrice,
  coins,
} from '@cosmjs/stargate';
import * as fs from 'fs';
import * as readline from 'readline';

(async () => {
  dotenv.config();
  const wallets = await initWallets();
  console.log(banner());

  const choice = await getUserChoice();

  while (true) {
    for (const wallet of wallets) {
      if (choice === '1') {
        await sendTransaction(wallet, await createReceiveAddress());
      } else if (choice === '2') {
        const recipients = await getRecipientsFromFile('recipients.txt');
        for (const recipient of recipients) {
          await sendTransaction(wallet, recipient);
        }
      }
    }
    console.log('Sleeping for 30 seconds...');
    await sleep(30000);
  }
})();

async function getUserChoice(): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    rl.question('Choose recipient method:\n1. Generate automatically\n2. Read from recipients.txt\n', answer => {
      rl.close();
      resolve(answer);
    });
  });
}

async function initWallets(): Promise<OfflineSigner[]> {
  const mnemonics = getMnemonicsFromEnv();
  
  const wallets = await Promise.all(
    mnemonics.map(mnemonic => DirectSecp256k1HdWallet.fromMnemonic(mnemonic, { prefix: "nillion" }))
  );

  return wallets;
}

function getMnemonicsFromEnv(): string[] {
  return Object.keys(process.env)
    .filter(key => key.startsWith('MNEMONIC'))
    .map(key => process.env[key] ?? "")
    .filter(mnemonic => mnemonic !== "");
}

async function createReceiveAddress(): Promise<string> {
  const mnemonic = bip39.generateMnemonic();
  const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, { prefix: "nillion" });
  const [firstAccount] = await wallet.getAccounts();

  return firstAccount.address;
}

async function getRecipientsFromFile(filePath: string): Promise<string[]> {
  const data = await fs.promises.readFile(filePath, 'utf-8');
  return data.split('\n').filter(line => line.trim() !== '');
}

async function sendTransaction(wallet: OfflineSigner, recipient: string) {
  const rpcEndpoint = 'https://nillion-testnet-rpc.polkachu.com/';
  const client = await SigningStargateClient.connectWithSigner(
    rpcEndpoint,
    wallet,
    {
      gasPrice: GasPrice.fromString('0.000002unil'),
    }
  );

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
