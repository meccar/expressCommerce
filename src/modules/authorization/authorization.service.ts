import { RoleRepository } from './role.repository';
import { RoleClaimRepository } from './roleClaim.repository';
import { UserRoleRepository } from './userRole.repository';
import { Transactional } from '@common/decorators';
import { Transaction } from '@sequelize/core';
import { Role } from './role.model';
import { BadRequestException, NotFoundException, UnauthorizedException } from '@common/exceptions';
import { IAuthenticatedUser, Permission, Permissions } from '@infrastructure/interfaces';
import { HttpMethod, Roles } from '@common/constants';
import { AbilityBuilder, AbilityClass, FieldMatcher, PureAbility } from '@casl/ability';

type Subjects = string;
type AppAbility = PureAbility<[HttpMethod | 'manage', Subjects]>;
const fieldMatcher: FieldMatcher = fields => field =>
  fields.includes(field) || fields.includes('*' as any);

export class AuthorizationService {
  private roleRepository: RoleRepository = new RoleRepository();
  private userRoleRepository: UserRoleRepository = new UserRoleRepository();
  private roleClaimRepository: RoleClaimRepository = new RoleClaimRepository();

  private user?: IAuthenticatedUser;
  private permissions: Permission[] = [];
  private abilities!: AppAbility;

  constructor(user?: IAuthenticatedUser) {
    if (user) this.user = user;
  }

  public async configure() {
    const claimValue = await this.getClaimValueByUserCode(this.user?.code as string);

    if (!claimValue) throw new UnauthorizedException();

    this.permissions = claimValue;

    const { can, build } = new AbilityBuilder(PureAbility as AbilityClass<AppAbility>);
    can('manage', 'all');
    this.abilities = build({ fieldMatcher });
  }

  @Transactional()
  public async createRole(
    roleData: { name: string; permissions: Permission[] },
    transaction?: Transaction,
  ): Promise<Role> {
    const { name, permissions } = roleData || {};

    if (!name?.trim() || !Array.isArray(permissions) || permissions.length === 0)
      throw new BadRequestException();

    const updatedPermissions =
      name === Roles.Admin ? [{ action: '*' as any, subject: '*', fields: ['*'] }] : permissions;

    const roleExist = await this.roleRepository.findByName(name);
    if (roleExist) throw new BadRequestException();

    const role = await this.roleRepository.createRole(name, transaction);

    for (const permission of updatedPermissions) {
      await this.roleClaimRepository.addClaim(
        role.code,
        permission.action === permission.subject
          ? `${permission.action}`
          : `${permission.action}${permission.subject}`,
        permission,
        transaction,
      );
    }

    return role;
  }

  @Transactional()
  public async updateRole(
    roleCode: string,
    roleData: { name: string },
    transaction?: Transaction,
  ): Promise<Role> {
    const { name } = roleData || {};

    if (!name?.trim() || !roleCode) throw new BadRequestException();

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

  public async getClaimValueByUserCode(userAccountCode: string): Promise<Permission[] | null> {
    const role = await this.userRoleRepository.findOneByUser(userAccountCode);

    if (!role) return null;

    const roleClaims = await this.roleClaimRepository.findManyByRole(role.roleCode);

    if (!roleClaims || roleClaims.length === 0) return null;

    return roleClaims.map(claim => claim.claimValue);
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
}
