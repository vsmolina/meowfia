import "server-only";

/** Cart lives in Phase 3. Returns 0 until then. */
export async function getCartCount(): Promise<number> {
  return 0;
}
