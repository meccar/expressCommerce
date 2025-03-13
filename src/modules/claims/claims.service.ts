import { Transaction } from '@sequelize/core';
import { UserClaim } from './userClaim.model';
import { UserClaimRepository } from './userClaim.repository';

export class ClaimService {
  private userClaimRepository: UserClaimRepository;

  constructor(userClaimRepository: UserClaimRepository) {
    this.userClaimRepository = userClaimRepository;
  }
}
