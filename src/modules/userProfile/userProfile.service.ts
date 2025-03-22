import { Transactional } from '@common/decorators';
import { UserProfileRepository } from './userProfile.repository';
import { Transaction } from '@sequelize/core';
import { BadRequestException, NotFoundException } from '@common/exceptions';
import { UserAccountRepository } from '@modules/userAccount';

export class UserProfileSerivce {
  private userProfileRepository: UserProfileRepository = new UserProfileRepository();
  private userAccountRepository: UserAccountRepository = new UserAccountRepository();

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
