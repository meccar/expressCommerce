import { BadRequestException, Transactional, UnauthorizedException } from "@common/index";
import { CONFIG } from "@config/index";
import { Transaction } from "@sequelize/core";
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

export class MfaService {
    @Transactional()
        public async generateSecret(user: any, transaction?: Transaction): Promise<any> {
        if (!user) throw new UnauthorizedException();
        if (user.twoFactorEnabled) throw new BadRequestException();

        const secret = speakeasy.generateSecret({
            name: `${CONFIG.SYSTEM.APP_NAME}:${user.code}`,
            length: 20
        });

        user.twoFactorSecret = secret.base32;
        await user.save({ transaction });

        return new Promise((resolve, reject) => {
            QRCode.toDataURL(secret.otpauth_url || '', (err, dataUrl) => {
                if (err) {
                reject(new BadRequestException("Failed to generate QR code"));
                } else {
                resolve({
                    otpauth_url: secret.otpauth_url,
                    qrCode: dataUrl,
                    secret: secret.base32
                });
                }
            });
        });
    }
    
    @Transactional()
    public async verifySecret(twoFactorSecretData: any, user: any, transaction?: Transaction): Promise<any> {
        const {token} = twoFactorSecretData
        if (!user || !token) throw new UnauthorizedException();
        if (!user.twoFactorEnabled) throw new BadRequestException();

        const verified = this.verifyToken(token, user.twoFactorSecret);

        if (!verified) throw new UnauthorizedException();
        user.isTwoFactorVerified = true;
        user.twoFactorEnabled = true;
        await user.save({ transaction });
        
        return { message: '2FA is verified' }
    }

    @Transactional()
    public async validateToken(twoFactorSecretData: any, user: any, transaction?: Transaction): Promise<any> {
        const {token} = twoFactorSecretData
        if (!user || !token) throw new UnauthorizedException();
        if (!user.twoFactorEnabled || !user.isTwoFactorVerified) throw new BadRequestException();

        const verified = this.verifyToken(token, user.twoFactorSecret);

        if (!verified) throw new UnauthorizedException();

        return { message: '2FA is valid' }
    }

    @Transactional()
    public async disableSecret(twoFactorSecretData: any, user: any, transaction?: Transaction): Promise<any> {
        const {token} = twoFactorSecretData
        if (!user || !token) throw new UnauthorizedException();
        if (!user.twoFactorEnabled || !user.isTwoFactorVerified) throw new BadRequestException();
    
        const verified = this.verifyToken(token, user.twoFactorSecret);

    
        if (!verified) throw new UnauthorizedException();
        user.twoFactorEnabled = false;
        user.isTwoFactorVerified = false;
        user.twoFactorSecret = '';
        await user.save({ transaction });
        
        return { message: '2FA disabled successfully' }
    }

    private verifyToken(token: string, secret: string, window: number = 0): boolean {
        return speakeasy.totp.verify({
            secret: secret,
            encoding: 'base32',
            token: token,
            window: window
        });
    }
}