import { programToAddress } from "../src/utils/aleoWasmFunctions";

const programs = ['credits.aleo'];
programs.forEach((program) => {
  programToAddress(program).then((address) => {
    console.log(`${program} address: ${address}`);
  });
});