import { UserClaimRepository } from './userClaim.repository';

export class ClaimService {
  private userClaimRepository: UserClaimRepository;

  constructor(userClaimRepository: UserClaimRepository) {
    this.userClaimRepository = userClaimRepository;
  }
}
