// src/test/services/authentication.service.spec.ts

import { AuthenticationService } from '../../modules/authentication/authentication.service';

describe('AuthenticationService', () => {
  let authenticationService: AuthenticationService;

  beforeEach(() => {
    // Setup for each test
    authenticationService = new AuthenticationService();
  });

  it('should be defined', () => {
    expect(authenticationService).toBeDefined();
  });

  describe('login', () => {
    it('should return token and user data when credentials are valid', async () => {
      // Arrange
      const loginData = { email: 'test@example.com', password: 'password123' };

      // Mock any internal methods if needed
      jest.spyOn(authenticationService as any, 'validateUser').mockResolvedValue({
        id: '123',
        email: 'test@example.com',
      });

      jest.spyOn(authenticationService as any, 'generateToken').mockReturnValue('mock-token');

      // Act
      const result = await authenticationService.login(loginData);

      // Assert
      expect(result).toHaveProperty('token', 'mock-token');
      expect(result).toHaveProperty('user');
      expect(result.user).toHaveProperty('id', '123');
      expect(result.user).toHaveProperty('email', 'test@example.com');
    });

    it('should throw an error when credentials are invalid', async () => {
      // Arrange
      const loginData = { email: 'invalid@example.com', password: 'wrongpassword' };

      // Mock the validation to fail
      jest.spyOn(authenticationService as any, 'validateUser').mockResolvedValue(null);

      // Act & Assert
      await expect(authenticationService.login(loginData)).rejects.toThrow();
    });
  });
});
