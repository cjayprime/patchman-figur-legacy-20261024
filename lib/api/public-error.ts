export const ERROR_CODES = Object.freeze({
  configuration: {
    code: '680001',
    message: 'This feature is not set up correctly yet. Please contact support. Code 680001.',
  },
  internal: {
    code: '680003',
    message: 'An unexpected problem prevented this action. Try again, or contact support. Code 680003.',
  },
  provider: {
    code: '680002',
    message: 'A required service could not complete this action. Try again shortly. Code 680002.',
  },
  quota: {
    code: '680004',
    message: 'The service is busy or its allowance has been reached. Try again later. Code 680004.',
  },
});
// Only exact, reviewed backend messages may expose a detailed public explanation.
const PUBLIC_EXPLANATIONS: Readonly<Record<string, { code: string; message: string }>> = Object.freeze({
  'Account connection requires HTTPS.': {
    code: '680001',
    message: 'The connection to Patchman Account is not ready. Please contact support. Code 680001.',
  },
  'Account could not verify your subscription.': {
    code: '680002',
    message: 'We could not verify your Account access. Keep your work open and try again shortly. Code 680002.',
  },
  'Account requires HTTPS.': {
    code: '680001',
    message: 'The connection to Patchman Account is not ready. Please contact support. Code 680001.',
  },
  'Account returned an invalid response.': {
    code: '680002',
    message: 'We could not confirm your Account access. Try signing in again shortly. Code 680002.',
  },
  'Account returned an invalid subscription response.': {
    code: '680002',
    message: 'We could not confirm your Account access. Try signing in again shortly. Code 680002.',
  },
  'Account service is unavailable. Try again shortly.': {
    code: '680002',
    message: 'Patchman Account is unavailable, so we could not verify your access. Try again shortly. Code 680002.',
  },
  'Account verification is unavailable.': {
    code: '680002',
    message: 'We could not verify your Account access. Keep your work open and try again shortly. Code 680002.',
  },
});

export function publicFailure(status: number, message: string) {
  const known = Object.values(ERROR_CODES).find((item) => item.message === message);
  if (known) {
    return known;
  }
  if (status >= 500 && Object.prototype.hasOwnProperty.call(PUBLIC_EXPLANATIONS, message)) {
    return PUBLIC_EXPLANATIONS[message];
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
