import { ethers } from 'ethers';
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const SALT_LENGTH = 64;
const ITERATIONS = 100000;
const KEY_LENGTH = 32;

export class WalletService {
  private encryptionKey: string;

  constructor() {
    if (!process.env.WALLET_ENCRYPTION_KEY) {
      throw new Error('WALLET_ENCRYPTION_KEY not set in environment');
    }
    this.encryptionKey = process.env.WALLET_ENCRYPTION_KEY;
  }

  /**
   * Generate a new Ethereum wallet
   */
  generateWallet(): { address: string; privateKey: string } {
    const wallet = ethers.Wallet.createRandom();
    return {
      address: wallet.address,
      privateKey: wallet.privateKey
    };
  }

  /**
   * Encrypt a private key
   */
  encryptPrivateKey(privateKey: string): string {
    const salt = crypto.randomBytes(SALT_LENGTH);
    const key = crypto.pbkdf2Sync(this.encryptionKey, salt, ITERATIONS, KEY_LENGTH, 'sha256');
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    const encrypted = Buffer.concat([
      cipher.update(privateKey, 'utf8'),
      cipher.final()
    ]);
    
    const tag = cipher.getAuthTag();
    
    return Buffer.concat([salt, iv, tag, encrypted]).toString('base64');
  }

  /**
   * Decrypt a private key
   */
  decryptPrivateKey(encryptedPrivateKey: string): string {
    const bData = Buffer.from(encryptedPrivateKey, 'base64');
    
    const salt = bData.slice(0, SALT_LENGTH);
    const iv = bData.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const tag = bData.slice(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
    const encrypted = bData.slice(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
    
    const key = crypto.pbkdf2Sync(this.encryptionKey, salt, ITERATIONS, KEY_LENGTH, 'sha256');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    
    return decipher.update(encrypted) + decipher.final('utf8');
  }

  /**
   * Get wallet instance from encrypted private key
   */
  getWallet(encryptedPrivateKey: string, provider: ethers.Provider): ethers.Wallet {
    const privateKey = this.decryptPrivateKey(encryptedPrivateKey);
    return new ethers.Wallet(privateKey, provider);
  }

  /**
   * Validate Ethereum address
   */
  isValidAddress(address: string): boolean {
    return ethers.isAddress(address);
  }
}