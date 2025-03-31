import { Transactional } from '@common/decorators';
import { UserProfileRepository } from './userProfile.repository';
import { Transaction } from '@sequelize/core';
import { BadRequestException, NotFoundException } from '@common/exceptions';
import { UserAccountRepository } from '@modules/userAccount';
import { LogActivityRepository } from '@modules/log/logActivity.repository';
import { UserProfile } from './userProfile.model';

export class UserProfileSerivce {
  private userProfileRepository: UserProfileRepository = new UserProfileRepository();
  private userAccountRepository: UserAccountRepository = new UserAccountRepository();
  private logActivityRepository: LogActivityRepository = new LogActivityRepository();

  constructor() {}

  @Transactional()
  public async update(
    profileCode: string,
    userProfileData: any,
    transaction?: Transaction,
  ): Promise<any> {
    if (!profileCode) throw new BadRequestException();

    const userProfile = await this.userProfileRepository.findOne({
      where: { code: profileCode },
      transaction,
    });

    if (!userProfile) throw new NotFoundException('User profile not found');

    const isUserActive = await this.userAccountRepository.isUserActive(userProfile.userAccountCode);

    if (!isUserActive) throw new NotFoundException('User is not active');

    return this.userProfileRepository.update(userProfile, userProfileData, { transaction });
  }
}

export const LogAction = {
  ViewDetail: 1,
  ViewField: 2,
  GetOTP: 3,
  Copy: 4,
  Create: 5,
  Update: 6,
  Delete: 7,
  Restore: 8,
};
export type LogAction = (typeof LogAction)[keyof typeof LogAction];
