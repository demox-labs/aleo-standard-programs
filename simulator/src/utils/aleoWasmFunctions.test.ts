import { programToAddress } from "./aleoWasmFunctions";

describe('wasmFunctions', () => {
  describe('programToAddress', () => {
    it.each([
      ["credits.aleo", "aleo1something"],
      ["validator.aleo", "aleo1something"],
      ["ale.aleo", "aleo1something"],
    ])('returns the address of a program', async (programId: string, expectedAddress: string) => {
      const address = await programToAddress(programId);

      expect(address).toBe(expectedAddress);
    });
  });
});
