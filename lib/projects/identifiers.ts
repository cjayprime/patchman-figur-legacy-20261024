import { ApiError } from '../api/response';
const MAXIMUM = 18446744073709551615n;
/** Relational identifiers must never pass through a JavaScript number. */
export function identifier(value: unknown, label = 'resource'): string {
  if (typeof value !== 'string' || !/^[1-9][0-9]{0,19}$/.test(value) || BigInt(value) > MAXIMUM) {
    throw new ApiError(400, `Choose a valid ${label}.`);
  }
  return value;
}
