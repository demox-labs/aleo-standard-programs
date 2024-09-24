import assert from "node:assert";
import * as Aleo from '@demox-labs/aleo-sdk';
import { getMappingValue, getMTSPBalance, getProgram } from "../../aleo/client"
import { formatAleoString } from "../../util";

const [grant_num, programId] = process.argv.slice(2);
assert(grant_num, "grant_num is required");
assert(programId, "programId is required");
const network = process.env.NETWORK || "TestnetV0";
assert(network === "MainnetV0" || network === "TestnetV0", "env.network must be MainnetV0 or TestnetV0");
const rpcUrl = process.env.RPC_URL || "http://localhost:3030";
assert(rpcUrl, "env.RPC_URL is required");
assert(rpcUrl === "https://testnetbeta.aleorpc.com" || rpcUrl === "https://mainnet.aleorpc.com", "env.RPC_URL must be https://testnetbeta.aleorpc.com or https://mainnetbeta.aleorpc.com");
let tokenRegistryProgramId = "token_registry.aleo";
let pondoProtocolProgramId = "pondo_protocol.aleo";
if (network === "TestnetV0") {
  tokenRegistryProgramId = "multi_token_support_programv1.aleo";
  pondoProtocolProgramId = "pondo_core_protocolv1.aleo";
}
const paleoTokenId = "1751493913335802797273486270793650302076377624243810059080883537084141842600field";
const pondoProgram = await getProgram(pondoProtocolProgramId);
const pondoProgramAddress = Aleo.Program.fromString(network, pondoProgram).toAddress();

function convertToNumber(value: string) {
  return parseInt(value.substring(0, value.indexOf("u")));
}

async function calculateGDPWithdraw(
  grant_num: number,
  programId: string
) {
  let grant = await getMappingValue(`${grant_num}u8`, programId, "grants");
  let formattedGrantJson = JSON.parse(formatAleoString(grant));
  console.log("grant", formattedGrantJson);
  let registeredPaleo = await getMappingValue(paleoTokenId, tokenRegistryProgramId, "registered_tokens"); 
  let formattedRegisteredPaleo = JSON.parse(formatAleoString(registeredPaleo));
  let mintedPaleou64 = formattedRegisteredPaleo.supply as string;
  let mintedPaleo = convertToNumber(mintedPaleou64);
  let paleoCommissionu64 = await getMappingValue("0u8", pondoProtocolProgramId, "owed_commission");
  let paleoCommission = convertToNumber(paleoCommissionu64);
  let totalPaleoPool = mintedPaleo + paleoCommission;
  let delegated_creditsu64 = await getMappingValue("0u8", pondoProtocolProgramId, "balances");
  let delegatedCredits = convertToNumber(delegated_creditsu64);
  let core_protocol_account = await getMappingValue(pondoProgramAddress, "credits.aleo", "account");
  let coreProtocolAccount = convertToNumber(core_protocol_account);
  let reserved_for_withdrawal = await getMappingValue("2u8", pondoProtocolProgramId, "balances");
  let reservedForWithdrawal = convertToNumber(reserved_for_withdrawal);
  let totalCreditsPool = delegatedCredits + coreProtocolAccount - reservedForWithdrawal;
  let grantee_credits_balance = formattedGrantJson.credits_amount;
  let granteeCreditsBalance = convertToNumber(grantee_credits_balance);
  let grantee_paleo_balance = formattedGrantJson.paleo_amount;
  let granteePaleoBalance = convertToNumber(grantee_paleo_balance);

  let maxWithdrawablePaleo = granteePaleoBalance - (granteeCreditsBalance * totalPaleoPool / totalCreditsPool);
  console.log("maxWithdrawablePaleo", maxWithdrawablePaleo);
}

calculateGDPWithdraw(parseInt(grant_num), programId);
