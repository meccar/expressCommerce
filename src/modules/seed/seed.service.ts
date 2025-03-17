import { Transactional } from '@common/decorators';
import { BadRequestException } from '@common/exceptions';
import { Roles } from '@common/index';
import { RoleRepository } from '@modules/authorization';
import { Transaction } from '@sequelize/core';

export class SeedService {
  private roleRepository: RoleRepository = new RoleRepository();

  constructor() {}

  @Transactional()
  public async seedRole(roleData: { role?: string } = {}, transaction?: Transaction): Promise<any> {
    const { role = Roles.User } = roleData;
    const roleExisted = await this.roleRepository.findByName(role);
    if (roleExisted) throw new BadRequestException('Role already existed');
    return await this.roleRepository.createRole(role, transaction);
  }
}
