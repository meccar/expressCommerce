import { UserAccountService } from "./userAccount.service";
import express, { Request, Response, NextFunction } from 'express';

export class UserAccountRoute {
    private userAccountService: UserAccountService;
    
    constructor(private readonly router: express.Router) {
        this.userAccountService = new UserAccountService();
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        this.router.post('/register', this.register.bind(this));
        
        // this.router.get('/profile', this.getProfile.bind(this));
        // this.router.put('/profile', this.updateProfile.bind(this));
        // this.router.put('/password', this.changePassword.bind(this));
        // this.router.delete('/', this.deleteAccount.bind(this));
        // this.router.get('/accounts', this.getAccounts.bind(this));
    }

    private async register(req: Request, res: Response, next: NextFunction): Promise<void> {
        const userData = req.body;
        const result = await this.userAccountService.register(userData);
        res.status(201).json({
        success: true,
        message: 'User account created successfully',
        data: result
    })}

    // private async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    //     const userId = req.user.id; // Coming from auth middleware
    //     const profile = await this.userAccountService.getProfileById(userId);
    //     res.status(200).json({
    //     success: true,
    //     data: profile
    //     });
    // }

    // private async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    //     const userId = req.user.id; // Coming from auth middleware
    //     const profileData = req.body;
    //     const updatedProfile = await this.userAccountService.updateProfile(userId, profileData);
    //     res.status(200).json({
    //     success: true,
    //     message: 'Profile updated successfully',
    //     data: updatedProfile
    //     });

    // }

    // private async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    //     const userId = req.user.id; // Coming from auth middleware
    //     const { currentPassword, newPassword } = req.body;
    //     await this.userAccountService.changePassword(userId, currentPassword, newPassword);
    //     res.status(200).json({
    //     success: true,
    //     message: 'Password changed successfully'
    //     });

    // }

    // private async deleteAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
    //     const userId = req.user.id; // Coming from auth middleware
    //     await this.userAccountService.deleteAccount(userId);
    //     res.status(200).json({
    //     success: true,
    //     message: 'Account deleted successfully'
    //     });

    // }

    // private async getAccounts(req: Request, res: Response, next: NextFunction): Promise<void> {
    //     // Only admins should be able to access this route
    //     if (!req.user.isAdmin) {
    //     return res.status(403).json({
    //         success: false,
    //         message: 'Unauthorized access'
    //     });
    //     }
        
    //     const { page = 1, limit = 10, search } = req.query;
    //     const accounts = await this.userAccountService.getAccounts({
    //     page: Number(page),
    //     limit: Number(limit),
    //     search: search as string
    //     });
        
    //     res.status(200).json({
    //     success: true,
    //     data: accounts
    //     });

    // }
}