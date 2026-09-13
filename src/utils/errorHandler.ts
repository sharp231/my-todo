import type { NextApiResponse } from 'next';
// APIで使用するエラーコードを固定し、フロントやテストが機械的に判定できるようにする。
export const ERROR_CODES = {
  BAD_REQUEST: 'BAD_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  PAYLOAD_TOO_LARGE: 'PAYLOAD_TOO_LARGE',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  METHOD_NOT_ALLOWED: 'METHOD_NOT_ALLOWED',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
} as const;
export type ApiErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

export type ApiErrorDetails = Readonly<Record<string, unknown>>;

export type ApiErrorResponse = {
  error: {
    code: ApiErrorCode;
    message: string;
    details?: ApiErrorDetails;
  };
};
type ApiErrorOptions = {
  status?: number;
  details?: ApiErrorDetails;
  cause?: unknown;
};

const STATUS_BY_CODE = {
  [ERROR_CODES.BAD_REQUEST]: 400,
  [ERROR_CODES.UNAUTHORIZED]: 401,
  [ERROR_CODES.VALIDATION_ERROR]: 422,
  [ERROR_CODES.NOT_FOUND]: 404,
  [ERROR_CODES.CONFLICT]: 409,
  [ERROR_CODES.PAYLOAD_TOO_LARGE]: 413,
  [ERROR_CODES.METHOD_NOT_ALLOWED]: 405,
  [ERROR_CODES.INTERNAL_ERROR]: 500,
  [ERROR_CODES.SERVICE_UNAVAILABLE]: 503,
} satisfies Record<ApiErrorCode, number>;

const SAFE_INTERNAL_ERROR_CODE_PATTERN = /^[A-Z0-9_]{1,20}$/;

const readErrorCode = (error: unknown): string | undefined => {
  if (typeof error !== 'object' || error === null || !('code' in error)) {
    return undefined;
  }

  return typeof error.code === 'string' ? error.code : undefined;
};
const getSafeInternalErrorCode = (error: unknown): string | undefined => {
  const code = readErrorCode(error);

  if (code && SAFE_INTERNAL_ERROR_CODE_PATTERN.test(code)) {
    return code;
  }

  return undefined;
};

// ApiError にHTTPステータス・code・detailsを持たせ、レスポンス形式を統一する。
export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;
  readonly details?: ApiErrorDetails;
  override readonly cause?: unknown;

  constructor(
    code: ApiErrorCode,
    message: string,
    options: ApiErrorOptions = {},
  ) {
    super(message);

    this.name = 'ApiError';
    this.code = code;
    this.status = options.status ?? STATUS_BY_CODE[code];
    this.details = options.details;
    this.cause = options.cause;
  }
}

const normalizeError = (error: unknown): ApiError => {
  if (error instanceof ApiError) {
    return error;
  }
  //PostgreSQL unique_violation
  // constraint名、detail、SQLなどは公開しない
  if (readErrorCode(error) === '23505') {
    return new ApiError(ERROR_CODES.CONFLICT, 'resource conflict', {
      cause: error,
    });
  }
  return new ApiError(ERROR_CODES.INTERNAL_ERROR, 'Internal Server Error', {
    cause: error,
  });
};

const logInternalError = (
  normalizedError: ApiError,
  originError: unknown,
): void => {
  const cause = normalizedError.cause ?? originError;
  const internalCode = getSafeInternalErrorCode(cause);

  //message、stack、SQL、接続情報はログへ渡さない
  console.error(`API request failed`, {
    code: normalizedError.code,
    status: normalizedError.status,
    ...(internalCode ? { internalCode } : {}),
  });
};
// 例外を統一フォーマット { error: { code, message, details } } に変換して返す。
export const handleError = (
  response: NextApiResponse<ApiErrorResponse>,
  error: unknown,
): void => {
  const normalizedError = normalizeError(error);
  if (normalizedError.status >= 500) {
    logInternalError(normalizedError, error);
  }
  response.status(normalizedError.status).json({
    error: {
      code: normalizedError.code,
      message: normalizedError.message,
      ...(normalizedError.details ? { details: normalizedError.details } : {}),
    },
  });
};
