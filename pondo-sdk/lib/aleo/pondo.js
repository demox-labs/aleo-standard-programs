import { pondoProgramToCode, pondoDependencyTree } from '../../../pondo-bot/src/compiledPrograms';


export async function pondoProgramResolver(programId) {
  return pondoProgramToCode[programId];
}

export async function pondoDependencyResolver(programId) {
  return pondoDependencyTree[programId];
}
