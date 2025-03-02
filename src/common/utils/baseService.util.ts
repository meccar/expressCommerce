import { BadRequestException } from "@common/exceptions";

export abstract class ServiceBase {
  private static instances: Map<string, ServiceBase> = new Map();

  protected serviceName: string;

  protected constructor(serviceName: string) {
    this.serviceName = serviceName;
    if (ServiceBase.instances.has(serviceName)) throw new BadRequestException();

    ServiceBase.instances.set(serviceName, this);
  }

  public static getInstance<T extends ServiceBase>(this: new () => T): T {
    const serviceName = new this().serviceName;
    if (!ServiceBase.instances.has(serviceName)) {
      new this();
    }
    return ServiceBase.instances.get(serviceName) as T;
  }

  public abstract configure(...args: any[]): void;
  public abstract isConfigured(): boolean;
}
