export const HTTP_STATUS = {
  SUCCESS: {
    OK: 200,
    CREATED: 201,
  },
  ERROR: {
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
  },
  SERVER_ERROR: {
    INTERNAL_SERVER: 500,
  },
} as const