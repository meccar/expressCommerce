import { UserClaimRepository } from '@modules/claims';
import { RoleRepository } from './role.repository';
import { RoleClaimRepository } from './roleClaim.repository';
import { UserRoleRepository } from './userRole.repository';
import { Transactional } from '@common/decorators';
import { Transaction } from '@sequelize/core';
import { Role } from './role.model';
import { BadRequestException, NotFoundException } from '@common/exceptions';

export class AuthorizationService {
  private roleRepository: RoleRepository = new RoleRepository();
  private userRoleRepository: UserRoleRepository = new UserRoleRepository();
  private roleClaimRepository: RoleClaimRepository = new RoleClaimRepository();
  private userClaimRepository: UserClaimRepository = new UserClaimRepository();
  constructor() {}

  @Transactional()
  public async createRole(roleData: { name: string }, transaction?: Transaction): Promise<Role> {
    const { name } = roleData;

    if (!name) throw new BadRequestException();

    const existingRole = await this.roleRepository.findByName(name);
    if (existingRole) throw new BadRequestException();

    return await this.roleRepository.createRole(name, transaction);
  }

  public async getDetailRole(roleCode: string): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { code: roleCode },
    });
    if (!role) throw new NotFoundException();
    return role;
  }

  public async getAllRoles(): Promise<Role[]> {
    return await this.roleRepository.findAll();
  }

  @Transactional()
  public async updateRole(
    roleCode: string,
    roleData: { name: string },
    transaction?: Transaction,
  ): Promise<Role> {
    const { name } = roleData;

    if (!name || !roleCode) throw new BadRequestException();

    const role = await this.roleRepository.findOne({
      where: { code: roleCode },
    });
    if (!role) throw new NotFoundException('Role not found');

    const existingRole = await this.roleRepository.findByName(name);
    if (existingRole && existingRole.code !== roleCode) {
      throw new BadRequestException('Role name has already existed');
    }

    await this.roleRepository.softDelete({ where: roleCode }, { transaction });

    return await this.roleRepository.create({ name, version: ++role.version }, { transaction });
  }

  @Transactional()
  public async deleteRole(roleCode: string, transaction?: Transaction): Promise<number> {
    if (!roleCode) throw new BadRequestException();

    const role = await this.roleRepository.findOne({
      where: { code: roleCode },
    });
    if (!role) throw new NotFoundException('Role not found');

    await this.userRoleRepository.softDelete({ where: roleCode }, { transaction });

    await this.roleClaimRepository.softDelete({ where: roleCode }, { transaction });

    return await this.roleRepository.softDelete({ where: roleCode }, { transaction });
  }
}
