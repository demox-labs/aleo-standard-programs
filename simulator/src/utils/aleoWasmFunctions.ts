import * as Aleo from '@demox-labs/aleo-sdk-web';

export const programToAddress = async (programId: string): Promise<string> => {
  return await Aleo.Program.programIdToAddress(programId);
  // return '5';
};