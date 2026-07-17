// APIで使用するエラーコードを固定し、フロントやテストが機械的に判定できるようにする。
export const ERROR_CODES = Object.freeze({
  BAD_REQUEST: 'BAD_REQUEST',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  METHOD_NOT_ALLOWED: 'METHOD_NOT_ALLOWED',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
});

const STATUS_BY_CODE = {
  [ERROR_CODES.BAD_REQUEST]: 400,
  [ERROR_CODES.VALIDATION_ERROR]: 422,
  [ERROR_CODES.NOT_FOUND]: 404,
  [ERROR_CODES.CONFLICT]: 409,
  [ERROR_CODES.METHOD_NOT_ALLOWED]: 405,
  [ERROR_CODES.INTERNAL_ERROR]: 500,
  [ERROR_CODES.SERVICE_UNAVAILABLE]: 503,
};
// ApiError にHTTPステータス・code・detailsを持たせ、レスポンス形式を統一する。
export class ApiError extends Error {
  constructor(code, message, options = {}) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = options.status ?? STATUS_BY_CODE[code] ?? 500;
    this.details = options.details;
    this.cause = options.cause;
  }
}

const normalizeError = (error) => {
  if (error instanceof ApiError) return error;

  if (error?.code === '23505') {
    return new ApiError(ERROR_CODES.CONFLICT, 'resource conflict', {
      details: { constraint: error.constraint },
      cause: error,
    });
  }
  return new ApiError(ERROR_CODES.INTERNAL_ERROR, 'Internal Server Error', {
    cause: error,
  });
};
// 例外を統一フォーマット { error: { code, message, details } } に変換して返す。
export const handleError = (res, error) => {
  const normalized = normalizeError(error);
  if (normalized.status >= 500) {
    console.error(normalized.message, normalized.cause ?? error);
  }
  return res.status(normalized.status).json({
    error: {
      code: normalized.code,
      message: normalized.message,
      ...(normalized.details ? { details: normalized.details } : {}),
    }
  });

};