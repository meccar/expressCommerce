import { RootRepository } from "@infrastructure/repository/rootRepository";
import { UserAccount } from "./userAccount.model";
import { databaseService } from "@infrastructure/index";
import { BadRequestException } from "@common/index";
import { hash, compare } from 'bcrypt';
import { UserProfile } from "@modules/userProfile";
import { Op, Transaction } from "@sequelize/core";

export class UserAccountService extends RootRepository<UserAccount> {
    constructor() {
        super(UserAccount);
    }
    private sequelize = databaseService.sequelize;

    private async withTransaction<T>(
        callback: (transaction: Transaction) => Promise<T>
    ): Promise<T> {
        return this.sequelize.transaction(async transaction => {
            return callback(transaction);
        });
    }
    
    public async register(userData: any):  Promise<any> {
        const { email, username, password } = userData;

        if (!(email && username && password)) throw new BadRequestException("Please enter email, username and password");
        
        const existingUser = await this.findOne({ 
            where: {
                [Op.or]: [{ email }, { username }]            
            } 
        });

        if (existingUser) throw new BadRequestException('Email or username already in use');
        
        const hashedPassword = await hash(password, 10);

        return await this.withTransaction(async transaction => {
            const userAccount = await this.create({
                email,
                username,
                password: hashedPassword,
                isActive: true
            }, {transaction})

            const userProfile = await UserProfile.create({
                userAccountCode: userAccount.code,
            } as any, {transaction})

            const {password: _, ...userWithoutPassword } = userAccount.toJSON();
            
            return {
                ...userWithoutPassword,
                profile: userProfile.toJSON(),
            }
        });
    }

    public async login(loginData: any): Promise<any> {
        const { email, username, password } = loginData;
        if (!((email || username) && password)) throw new BadRequestException("Please enter email, username and password");

        const existingUser = await this.findOne({ 
            where: {
                [Op.or]: [{ email }, { username }]            
            } 
        });

        if (!existingUser) throw new BadRequestException('Email, username or password is not correct');

        if (await !compare(password, existingUser.password)) throw new BadRequestException('Email, username or password is not correct');

    }
}