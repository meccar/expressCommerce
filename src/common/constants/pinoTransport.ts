export const PinoTransport = {
  File: 'pino/file',
  Pretty: 'pino-pretty',
} as const;

export type PinoTransport = (typeof PinoTransport)[keyof typeof PinoTransport];
