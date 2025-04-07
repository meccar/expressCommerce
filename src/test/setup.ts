// src/test/setup.ts
import 'reflect-metadata';

jest.mock('@infrastructure/index', () => ({
  databaseService: {
    transaction: jest.fn(callback => callback()),
    // Add other methods as needed
  },
}));
