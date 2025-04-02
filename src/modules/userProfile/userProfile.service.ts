import { Transactional } from '@common/decorators';
import { UserProfileRepository } from './userProfile.repository';
import { Transaction } from '@sequelize/core';
import { BadRequestException, NotFoundException } from '@common/exceptions';
import { UserAccountRepository } from '@modules/userAccount';
import { LogActivityRepository } from '@modules/log/logActivity.repository';
import { UserProfile } from './userProfile.model';
import { LogAction, TableNames } from '@common/index';

export class UserProfileSerivce {
  private userProfileRepository: UserProfileRepository = new UserProfileRepository();
  private userAccountRepository: UserAccountRepository = new UserAccountRepository();
  private logActivityRepository: LogActivityRepository = new LogActivityRepository();

  constructor() {}

  @Transactional()
  public async update(
    profileCode: string,
    userProfileData: any,
    user: any,
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

    const result = await this.userProfileRepository.update(userProfile, userProfileData, {
      transaction,
    });

    if (!result) throw new BadRequestException();

    await this.logActivityRepository.addLog(
      {
        userAccountCode: user.code,
        action: LogAction.Update,
        model: TableNames.UserProfile,
        newValue: result,
        oldValue: userProfile,
      },
      transaction,
    );

    return result;
  }
}
