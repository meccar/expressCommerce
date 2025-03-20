import { RoleRepository } from './role.repository';
import { RoleClaimRepository } from './roleClaim.repository';
import { UserRoleRepository } from './userRole.repository';
import { Transactional } from '@common/decorators';
import { Transaction } from '@sequelize/core';
import { Role } from './role.model';
import { BadRequestException, NotFoundException } from '@common/exceptions';
import { Permission } from '@infrastructure/interfaces';
import { HttpMethod, Roles } from '@common/constants';

export class AuthorizationService {
  private roleRepository: RoleRepository = new RoleRepository();
  private userRoleRepository: UserRoleRepository = new UserRoleRepository();
  private roleClaimRepository: RoleClaimRepository = new RoleClaimRepository();
  constructor() {}

  @Transactional()
  public async createRole(
    roleData: { name: string; permissions: Permission[] },
    transaction?: Transaction,
  ): Promise<Role> {
    const { name, permissions } = roleData;

    if (!name || !Array.isArray(permissions) || permissions.length === 0)
      throw new BadRequestException();

    const updatedPermissions =
      name === Roles.Admin ? [{ action: '*' as any, subject: '*', fields: ['*'] }] : permissions;

    const roleExist = await this.roleRepository.findByName(name);
    if (roleExist) throw new BadRequestException();

    const role = await this.roleRepository.createRole(name, transaction);

    for (const permission of updatedPermissions) {
      await this.roleClaimRepository.addClaim(
        role.code,
        `${permission.action}${permission.subject}`,
        permission,
        transaction,
      );
    }

    return role;
  }

  public async getRoleNameByUserCode(userAccountCode: string): Promise<string | null> {
    const role = await this.userRoleRepository.findOneByUser(userAccountCode);

    if (!role) return null;

    const foundRole = await this.roleRepository.findOne({
      attributes: ['name'],
      where: { code: role.code },
      raw: true,
    });

    return foundRole?.name || null;
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
    if (!role) throw new NotFoundException('Role Pnot found');

    await this.userRoleRepository.softDelete({ where: roleCode }, { transaction });

    await this.roleClaimRepository.softDelete({ where: roleCode }, { transaction });

    return await this.roleRepository.softDelete({ where: roleCode }, { transaction });
  }
}
