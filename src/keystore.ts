import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as crypto from "crypto";
import { MnemonicKey, RawKey } from "@terra-money/terra.js";

const KEY_SIZE = 256;
const ITERATIONS = 100;
const getFilePath = (name: string) => path.join(os.homedir(), `.multiswap/key_${name}.json`);

function encrypt(plainText: string, password: string): string {
  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(16);
  const key = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_SIZE / 8, "sha1");

  const cipher = crypto.createCipheriv("AES-256-CBC", key, iv);
  const encryptedText = Buffer.concat([cipher.update(plainText), cipher.final()]);

  return salt.toString("hex") + iv.toString("hex") + encryptedText.toString("base64");
}

function decrypt(cipherText: string, password: string): string {
  const salt = Buffer.from(cipherText.slice(0, 32), "hex");
  const iv = Buffer.from(cipherText.slice(32, 64), "hex");
  const key = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_SIZE / 8, "sha1");

  const encrypedText = cipherText.slice(64);
  const cipher = crypto.createDecipheriv("AES-256-CBC", key, iv);
  const decryptedText = Buffer.concat([cipher.update(encrypedText, "base64"), cipher.final()]);

  return decryptedText.toString();
}

export function load(name: string, password: string): RawKey {
  const filePath = getFilePath(name);
  if (!fs.existsSync(filePath)) {
    throw new Error(`file ${filePath} does not exist!`);
  }

  const cipherText = fs.readFileSync(filePath, "utf8");
  const privateKey = decrypt(cipherText, password);
  const rawKey = new RawKey(Buffer.from(privateKey, "hex"));

  return rawKey;
}

export function save(name: string, mnemonic: string, password: string) {
  const filePath = getFilePath(name);
  if (fs.existsSync(filePath)) {
    throw new Error(`file ${filePath} already exists!`);
  }

  const mnemonicKey = new MnemonicKey({ mnemonic });
  const privateKey = mnemonicKey.privateKey.toString("hex");
  const cipherText = encrypt(privateKey, password);

  fs.writeFileSync(filePath, cipherText);
}

export function remove(name: string) {
  const filePath = getFilePath(name);
  if (!fs.existsSync(filePath)) {
    throw new Error(`file ${filePath} does not exist!`);
  }

  fs.unlinkSync(filePath);
}
