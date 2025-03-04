import { ServiceBase, decrypt, encrypt, messages } from "@common/index";
import { logger } from "@infrastructure/config";
import { databaseService } from "@infrastructure/index";
import { vaultService } from "@infrastructure/vault/vault.service";
import { Transaction } from "@sequelize/core";
import { Model, ModelStatic } from "sequelize-typescript";

interface EncryptedModel extends Model {
  getDataValue(key: string): any;
  update(
    values: Record<string, any>,
    options?: { transaction?: Transaction }
  ): Promise<this>;
}

export interface EncryptableModelStatic extends ModelStatic<EncryptedModel> {
  count(options?: { transaction?: Transaction }): Promise<number>;
  findAll(options?: {
    limit?: number;
    offset?: number;
    transaction?: Transaction;
  }): Promise<EncryptedModel[]>;
  name?: string;
}

interface EncryptedFieldMapping {
  model: EncryptableModelStatic;
  fields: string[];
}

class KeyRotationService extends ServiceBase {
  private configured: boolean = false;
  private keyPath: string | null = null;
  private transitPath: string | null = null;
  private keyName: string | null = null;
  private useTransitEngine: boolean = false;

  private async withTransaction<T>(
    callback: (transaction: Transaction) => Promise<T>
  ): Promise<T> {
    return databaseService.sequelize.transaction(async (transaction) => {
      return callback(transaction);
    });
  }

  constructor() {
    super(KeyRotationService.name);
  }

  public async configure(
    keyPath: string,
    options: {
      useTransitEngine?: boolean;
      transitPath?: string;
      keyName?: string;
    } = {}
  ): Promise<void> {
    this.keyPath = keyPath;
    this.useTransitEngine = options.useTransitEngine || false;

    if (this.useTransitEngine) {
      this.transitPath = options.transitPath || "transit";
      this.keyName = options.keyName || "database-encryption";

      await vaultService.setupTransitEngine(this.transitPath, this.keyName);
    }

    this.configured = true;
    logger.info(messages.service.configured(KeyRotationService.name));
  }

  public isConfigured(): boolean {
    return this.configured && vaultService.isConfigured();
  }

  public async rotateKeys(
    modelFieldMap: EncryptedFieldMapping[],
    options: { batchSize?: number; noIV?: boolean } = {}
  ): Promise<void> {
    if (!this.isConfigured())
      throw new Error(`${KeyRotationService.name} is not configured`);

    const batchSize = options.batchSize || 100;
    const noIV = options.noIV || false;

    if (this.useTransitEngine) {
      await vaultService.rotateTransitKey(this.transitPath!, this.keyName!);
      logger.info(`Successfully rotated transit key ${this.keyName}`);
      return;
    }

    const oldKeyPath = `${this.keyPath}_previous`;
    const oldKeyText = await vaultService.getKey(this.keyPath!);
    const newKeyText = await vaultService.rotateKey(this.keyPath!);

    await this.withTransaction(async (transaction) => {
      for (const { model, fields } of modelFieldMap) {
        const tableName = model.name || "unknown";

        logger.info(`Starting key rotation for table: ${tableName}`);

        const totalCount = await model.count({ transaction });
        let processedCount = 0;

        let offset = 0;
        let hasMoreRecords = true;

        while (hasMoreRecords) {
          const records = await model.findAll({
            limit: batchSize,
            offset,
            transaction,
          });

          if (records.length === 0) {
            hasMoreRecords = false;
            continue;
          }

          for (const record of records) {
            const updates: Record<string, any> = {};

            for (const field of fields) {
              const encryptedValue = record.getDataValue(field);

              if (encryptedValue) {
                const decryptedValue = await decrypt(
                  encryptedValue,
                  oldKeyText,
                  noIV
                );

                const newEncryptedValue = await encrypt(
                  decryptedValue,
                  newKeyText,
                  noIV
                );

                updates[field] = newEncryptedValue;
              }
            }

            if (Object.keys(updates).length > 0) {
              await record.update(updates, { transaction });
            }
          }

          processedCount += records.length;
          logger.info(
            `Processed ${processedCount}/${totalCount} records in ${tableName}`
          );

          offset += batchSize;
        }

        logger.info(`Completed key rotation for table: ${tableName}`);
      }

      logger.info("Key rotation completed successfully");
    });
  }
}

export const keyRotationService = KeyRotationService.getInstance();
