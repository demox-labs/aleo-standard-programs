export interface Members {
  [address: string]: [number, boolean, number];
}

export interface MemberData {
  id: string;
  starting_round: number;
  members: Members;
  total_stake: number;
}

interface Input {
  type: string;
  id: string;
  value: string;
}

interface Output {
  type: string;
  id: string;
  value: string;
}

interface Transition {
  id: string;
  program: string;
  function: string;
  inputs: Input[];
  outputs: Output[];
  tpk: string;
  tcm: string;
  scm: string;
}

interface Execution {
  transitions: Transition[];
  global_state_root: string;
  proof: string;
}

interface Transaction {
  type: string;
  id: string;
  execution: Execution;
  fee: any;
}

export interface ExecuteTransaction {
  status: string;
  type: string;
  index: number;
  transaction: Transaction;
  finalize: any[];
  finalizedAt: string;
}