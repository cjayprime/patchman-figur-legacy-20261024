export const ERROR_CODES = Object.freeze({
  configuration: {
    code: '680001',
    message: 'Configure the necessary settings. Code 680001.',
  },
  internal: {
    code: '680003',
    message: 'This action could not be completed. Try again or contact support. Code 680003.',
  },
  provider: {
    code: '680002',
    message: 'The service could not complete this action. Try again shortly. Code 680002.',
  },
  quota: {
    code: '680004',
    message: 'The service is busy or its allowance has been reached. Try again later. Code 680004.',
  },
});
export function publicFailure(status: number, message: string) {
  const known = Object.values(ERROR_CODES).find((item) => item.message === message);
  if (known) {
    return known;
  }
  const internal =
    /\b[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)+\b/.test(message) ||
    /\b(?:api[ -]?key|credentials?|secret|configuration|configure|sequelize|ffmpeg|ffprobe|sqlstate)\b/i.test(message);
  if (internal && /(?:configur|credential|api[ _-]?key|secret|\bSet\b)/i.test(message)) {
    return ERROR_CODES.configuration;
  }
  if (status === 429) {
    return ERROR_CODES.quota;
  }
  if (status === 502 || status === 503 || status === 504) {
    return ERROR_CODES.provider;
  }
  if (
    status >= 500 ||
    internal ||
    /[A-Za-z]:[\\/]|\/(?:home|var|usr|private|tmp)\/|traceback|stack trace|SELECT .+ FROM|INSERT INTO/i.test(message)
  ) {
    return ERROR_CODES.internal;
  }
  return { code: undefined, message };
}
