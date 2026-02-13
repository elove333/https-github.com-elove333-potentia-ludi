/**
 * Extract a single value from a parameter that might be an array
 * This handles Express.js parameters that can be either a single value or an array
 * @param param - The parameter to extract
 * @returns The first value if array, otherwise the value itself
 */
export function extractParam(param: string | string[] | undefined): string | undefined {
  if (Array.isArray(param)) {
    return param[0];
  }
  return param;
}
