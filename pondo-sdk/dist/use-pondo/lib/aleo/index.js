import { authorizeTransaction } from './sdk.js';
export async function delegateTransaction(rpcProvider, { privateKey, programId, functionName, inputs, feeCredits, }, programResolver, dependencyResolver) {
    programResolver = programResolver || rpcProvider.getProgramCode;
    const programCode = await programResolver(programId);
    const imports = await getProgramImports(programId, programResolver, dependencyResolver);
    const { authorization, feeAuthorization } = await authorizeTransaction(privateKey, programCode, functionName, inputs, feeCredits, null, imports);
    const response = await rpcProvider.generateTransaction(authorization, programCode, feeAuthorization, functionName, true, imports);
    return response;
}
async function getProgramImports(programId, programResolver, dependencyResolver) {
    return Object.fromEntries(await Promise.all((await dependencyResolver(programId)).map(async (subProgramId) => [
        subProgramId,
        await programResolver(subProgramId)
    ])));
}
