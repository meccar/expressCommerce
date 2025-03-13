import { BadRequestException, messages } from '@common/index';
import { ServiceBase } from '@common/utils';
import { logger } from '@infrastructure/config';
import vault from 'node-vault';

class VaultService extends ServiceBase {
  private client: vault.client | null = null;

  constructor() {
    super(VaultService.name);
  }

  public async configure(vaultAddress: string, vaultToken: string): Promise<void> {
    this.client = vault({
      apiVersion: 'v1',
      endpoint: vaultAddress,
      token: vaultToken,
    });

    logger.info(messages.service.configured(VaultService.name));
  }

  public isConfigured(): boolean {
    return this.client !== null;
  }

  public async getKey(keyPath: string): Promise<string> {
    if (!this.isConfigured) throw new BadRequestException();

    const { data } = await this.client!.read(keyPath);
    return data.value;
  }

  public async rotateKey(keyPath: string): Promise<string> {
    if (!this.isConfigured) throw new BadRequestException();

    const currentKey = await this.getKey(keyPath);
    const newKey = require('crypto').randomBytes(32).toString('hex');

    await this.client!.write(keyPath, { value: newKey });

    await this.client!.write(`${keyPath}_previous`, { value: currentKey });
    logger.info(`Successfully rotated key at ${keyPath}`);
    return newKey;
  }

  public async setupTransitEngine(
    transitPath: string = 'transit',
    keyName: string = 'database-encryption',
  ): Promise<void> {
    if (!this.isConfigured) throw new BadRequestException();

    const mounts = await this.client!.mounts();

    if (!mounts[`${transitPath}/`]) {
      await this.client!.mount({ mount_point: transitPath, type: 'transit' });
      logger.info(`Transit engine mounted at ${transitPath}/`);
    }

    await this.client!.write(`${transitPath}/keys/${keyName}`, {});
    logger.info(`Created encryption key ${keyName}`);
  }

  public async rotateTransitKey(transitPath: string, keyName: string): Promise<void> {
    if (!this.isConfigured) throw new BadRequestException();

    await this.client!.write(`${transitPath}/keys/${keyName}/rotate`, {});
    logger.info(`Successfully rotated transit key ${keyName}`);
  }

  public async encryptWithTransit(
    plainText: string,
    transitPath: string,
    keyName: string,
  ): Promise<string> {
    if (!this.isConfigured) throw new BadRequestException();

    const { data } = await this.client!.write(`${transitPath}/encrypt/${keyName}`, {
      plaintext: Buffer.from(plainText).toString('base64'),
    });

    return data.ciphertext;
  }

  public async decryptWithTransit(
    ciphertext: string,
    transitPath: string,
    keyName: string,
  ): Promise<string> {
    if (!this.isConfigured) throw new BadRequestException();
    const { data } = await this.client!.write(`${transitPath}/decrypt/${keyName}`, {
      ciphertext,
    });
    return Buffer.from(data.plaintext, 'base64').toString('utf8');
  }
}

export const vaultService = VaultService.getInstance();
