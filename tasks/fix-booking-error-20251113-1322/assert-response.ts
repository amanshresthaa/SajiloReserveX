export function assertResponse(res: Response | undefined): asserts res is Response {
  if (!res) {
    throw new Error('No response received');
  }
}
