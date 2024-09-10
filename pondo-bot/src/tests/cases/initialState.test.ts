import assert from "node:assert";
import { describe, it } from "node:test";
import { NETWORK, PALEO_TOKEN_ID, PONDO_TOKEN_ID } from "../../constants";
import { getMappingValue } from "../../aleo/client";
import * as Aleo from "@demox-labs/aleo-sdk";
import { pondoProgramToCode } from "../../compiledPrograms";
import { getAddressFromProgram, getTokenOwnerHash } from "../../util";

describe("initialState", async () => {
  const coreProtocolAddress = getAddressFromProgram(
    NETWORK!,
    pondoProgramToCode["pondo_protocol.aleo"]
  );

  const oracleAddress = getAddressFromProgram(
    NETWORK!,
    pondoProgramToCode["validator_oracle.aleo"]
  );

  it("core protocol should be in rebalancing state", async () => {
    const state = await getMappingValue(
      "0u8",
      "pondo_protocol.aleo",
      "protocol_state"
    );

    assert(state === "2u8");
  });

  it("delegators should all be in terminal state", async () => {
    for (let i = 1; i <= 5; i++) {
      const state = await getMappingValue(
        "0u8",
        `delegator${i}.aleo`,
        "state_mapping"
      );

      assert(state === "4u8");
    }
  });

  it("control addresses should have the delegators", async () => {
    for (let i = 1; i <= 5; i++) {
      const programAddress = Aleo.Program.fromString(
        NETWORK!,
        pondoProgramToCode[`delegator${i}.aleo`]
      ).toAddress();

      const value = await getMappingValue(
        programAddress,
        `validator_oracle.aleo`,
        "control_addresses"
      );

      // This is to say that they are not admins in the control_addresses
      // The failure point would be if there was no mapping / null state
      assert(value === "false");
    }
  });

  it("top validators should all be the oracle", async () => {
    const topValidators = await getMappingValue(
      "0u8",
      `validator_oracle.aleo`,
      "top_validators"
    );

    // String representation of the aleo list
    let expectedTopValidators =
      "[\n" + Array(10).fill(`  ${oracleAddress}`).join(",\n") + "\n]";

    assert(topValidators === expectedTopValidators);
  });

  it("core protocol should have expected funds", async () => {
    const expectedFunds = "100000000000u64";

    const funds = await getMappingValue(
      coreProtocolAddress,
      "credits.aleo",
      "account"
    );

    assert(funds === expectedFunds);
  });

  it("pALEO and PNDO should be registered in the MTSP", async () => {
    const pondo = await getMappingValue(
      PONDO_TOKEN_ID,
      "token_registry.aleo",
      "registered_tokens"
    );

    const paleo = await getMappingValue(
      PALEO_TOKEN_ID,
      "token_registry.aleo",
      "registered_tokens"
    );

    // Check that they exist
    assert(pondo);
    assert(paleo);
  });

  it("core protocol should have the correct amount of pALEO to start", async () => {
    const balanceKey = getTokenOwnerHash(coreProtocolAddress, PALEO_TOKEN_ID);
    const expectedBalance = "100000000000u128";

    const result = await getMappingValue(
      balanceKey,
      "token_registry.aleo",
      "authorized_balances"
    );

    const balanceRegex = /balance:\s(\d+u128)/;
    const balance = result.match(balanceRegex)![1];

    assert(balance === expectedBalance);
  });
});
