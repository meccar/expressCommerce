import { Transactional } from '@common/decorators';
import { BadRequestException } from '@common/exceptions';
import { Roles } from '@common/index';
import { RoleRepository } from '@modules/authorization';
import { RoleClaimRepository } from '@modules/authorization/roleClaim.repository';
import { Transaction } from '@sequelize/core';

export class SeedService {
  private roleRepository: RoleRepository = new RoleRepository();
  private roleClaimRepository: RoleClaimRepository = new RoleClaimRepository();

  constructor() {}

  @Transactional()
  public async seedRole(roleData: { role?: string } = {}, transaction?: Transaction): Promise<any> {
    const { role = Roles.User } = roleData;
    const roleExisted = await this.roleRepository.findByName(role);
    if (roleExisted) throw new BadRequestException('Role already existed');

    if (role === Roles.Admin) {
    }
    return await this.roleRepository.createRole(role, transaction);
  }
}
