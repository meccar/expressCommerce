// src/test/routes/authentication.route.spec.ts
import { Request, Response } from 'express';
import { AuthenticationRoute } from '../../modules/authentication/authentication.route';
import { statusCodes } from '@common/index';

// Mock the authentication service
jest.mock('../../modules/authentication/authentication.service');

describe('AuthenticationRoute', () => {
  let authenticationRoute: AuthenticationRoute;
  let mockRouter: any;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Create mock router with necessary methods
    mockRouter = {
      post: jest.fn().mockReturnThis(),
      get: jest.fn().mockReturnThis(),
      use: jest.fn().mockReturnThis(),
    };

    // Create the route instance with mocked router
    authenticationRoute = new AuthenticationRoute(mockRouter);

    // Mock auth service login method
    const mockAuthService = (authenticationRoute as any).authenticationService;
    mockAuthService.login = jest.fn();

    // Setup mock request and response objects
    mockRequest = {
      body: {
        email: 'test@example.com',
        password: 'password123',
      },
    };

    mockResponse = {
      success: jest.fn(),
    };
  });

  describe('login', () => {
    it('should call authentication service and return success response', async () => {
      // Arrange
      const loginData = { email: 'test@example.com', password: 'password123' };
      const mockLoginResult = {
        token: 'test-token',
        user: { id: '123', email: 'test@example.com' },
      };

      const mockAuthService = (authenticationRoute as any).authenticationService;
      mockAuthService.login.mockResolvedValue(mockLoginResult);

      // Act
      await (authenticationRoute as any).login(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockAuthService.login).toHaveBeenCalledWith(loginData);
      expect(mockResponse.success).toHaveBeenCalledWith(mockLoginResult, statusCodes.OK);
    });

    it('should handle login errors properly', async () => {
      // Arrange
      const mockAuthService = (authenticationRoute as any).authenticationService;
      mockAuthService.login.mockRejectedValue(new Error('Invalid credentials'));

      let errorCaught = null;

      // Act
      try {
        await (authenticationRoute as any).login(mockRequest as Request, mockResponse as Response);
      } catch (error) {
        errorCaught = error;
      }

      // Assert
      expect(errorCaught).toBeInstanceOf(Error);
      expect(mockAuthService.login).toHaveBeenCalled();
      expect(mockResponse.success).not.toHaveBeenCalled();
    });
  });
});
