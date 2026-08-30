import { describe, expect, test, vi } from 'vitest';

const { clerkMiddlewareMock } = vi.hoisted(() => ({
  clerkMiddlewareMock: vi.fn(() => vi.fn()),
}));

vi.mock('@clerk/nextjs/server', () => ({
  clerkMiddleware: clerkMiddlewareMock,
}));

import { config } from '../proxy';

describe('Clerk proxy configuration', () => {
  test('initializes Clerk middleware', () => {
    expect(clerkMiddlewareMock).toHaveBeenCalledTimes(1);
  });

  test('matches only the intended routes', () => {
    expect(config.matcher).toEqual([
      '/app/:path*',
      '/api/todos/:path*',
      '/__clerk/:path*',
    ]);
  });

  test('does not include the database health endpoint', () => {
    expect(config.matcher).not.toContain('/api/health/db');
  });
});