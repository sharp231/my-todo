import { getAuth } from '@clerk/nextjs/server';
import type { NextApiRequest } from 'next';

import { ApiError, ERROR_CODES } from '../utils/errorHandler';

export const requireAuthenticatedUserId = (
  request: NextApiRequest,
): string => {
  const { userId } = getAuth(request);

  if (!userId) {
    throw new ApiError(
      ERROR_CODES.UNAUTHORIZED,
      'Authentication required',
    );
  }

  return userId;
};