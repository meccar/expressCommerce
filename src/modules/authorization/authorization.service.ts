import { RoleRepository } from './role.repository';
import { RoleClaimRepository } from './roleClaim.repository';
import { UserRoleRepository } from './userRole.repository';
import { Transactional } from '@common/decorators';
import { Op, Transaction } from '@sequelize/core';
import { Role } from './role.model';
import { BadRequestException, NotFoundException, UnauthorizedException } from '@common/exceptions';
import { IAuthenticatedUser, Permission, Permissions } from '@infrastructure/interfaces';
import { HttpMethod, LogAction, LogStatus, Roles, TableNames } from '@common/constants';
import { AbilityBuilder, AbilityClass, FieldMatcher, PureAbility } from '@casl/ability';
import { LogAuditRepository } from '@modules/log/logAudit.repository';
import { LogActivityRepository } from '@modules/log/logActivity.repository';

type Subjects = string;
type AppAbility = PureAbility<[HttpMethod | 'manage', Subjects]>;
const fieldMatcher: FieldMatcher = fields => field =>
  fields.includes(field) || fields.includes('*' as any);

export class AuthorizationService {
  private roleRepository: RoleRepository = new RoleRepository();
  private userRoleRepository: UserRoleRepository = new UserRoleRepository();
  private roleClaimRepository: RoleClaimRepository = new RoleClaimRepository();
  private logAuditRepository: LogAuditRepository = new LogAuditRepository();
  private logActivityRepository: LogActivityRepository = new LogActivityRepository();

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
    user: any,
    transaction?: Transaction,
  ): Promise<Role> {
    const { name, permissions } = roleData || {};

    if (!name?.trim() || !Array.isArray(permissions) || permissions.length === 0)
      throw new BadRequestException();

    const audit = await this.logAuditRepository.addLog(
      {
        userAccountCode: user.code,
        action: LogAction.Update,
        model: TableNames.Role,
        resourceName: TableNames.Role,
      },
      transaction,
    );

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

    await audit.log(LogStatus.Success);

    return role;
  }

  @Transactional()
  public async updateRole(
    roleCode: string,
    roleData: { name: string },
    user: any,
    transaction?: Transaction,
  ): Promise<Role> {
    const { name } = roleData || {};

    if (!name?.trim() || !roleCode) throw new BadRequestException();

    const audit = await this.logAuditRepository.addLog(
      {
        userAccountCode: user.code,
        action: LogAction.Update,
        model: TableNames.Role,
        resourceName: TableNames.Role,
      },
      transaction,
    );

    const role = await this.roleRepository.findOne({
      where: {
        [Op.and]: [
          {
            [Op.not]: { name: name },
          },
          { code: roleCode },
        ],
      },
    });
    if (!role) {
      await audit.log(LogStatus.NotFound);
      throw new NotFoundException('Role not found');
    }

    const result = await this.roleRepository.update(
      role,
      { name, version: ++role.version },
      { transaction },
    );

    if (!result) throw new BadRequestException();

    await this.logActivityRepository.addLog(
      {
        userAccountCode: user.code,
        action: LogAction.Update,
        model: TableNames.Role,
        newValue: result,
        oldValue: role,
      },
      transaction,
    );

    await audit.log(LogStatus.Success);

    return result;
  }

  @Transactional()
  public async deleteRole(roleCode: string, user: any, transaction?: Transaction): Promise<number> {
    if (!roleCode) throw new BadRequestException();

    const audit = await this.logAuditRepository.addLog(
      {
        userAccountCode: user.code,
        action: LogAction.Update,
        model: TableNames.Role,
        resourceName: TableNames.Role,
      },
      transaction,
    );

    const role = await this.roleRepository.findOne({
      where: { code: roleCode },
    });
    if (!role) throw new NotFoundException('Role Pnot found');

    const deleteResults = await Promise.all([
      this.userRoleRepository.softDelete({ where: { roleCode } }, { transaction }),
      this.roleClaimRepository.softDelete({ where: { roleCode } }, { transaction }),
      this.roleRepository.softDelete({ where: { roleCode } }, { transaction }),
    ]);

    const totalDeleted = deleteResults.reduce((sum, result) => sum + result, 0);

    if (totalDeleted < 3) throw new BadRequestException();

    await audit.log(LogStatus.Success);

    return totalDeleted;
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
