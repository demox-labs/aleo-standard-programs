import assert from "assert";

import { arc_0038Program } from "../src/contracts/arc_0038";
import { MICROCREDITS_TO_CREDITS } from "../src/contracts/credits";
import { blockEvent, StateMachine } from "../src/ARC-0038/StateMachine";
import {
  admin,
  bondAll,
  bondDeposits,
  claimCommission,
  claimUnbond,
  claimWithdrawPublic,
  createWithdrawClaim,
  deposit,
  initialDeposit,
  initialize,
  protocol,
  setNextValidator,
  testValidator,
  unbondAll,
  user0,
  user1,
  user2,
  user3,
  user4,
  withdrawPublic,
} from "../src/ARC-0038/transition-definitions";
import { set } from "idb-keyval";

const jestConsole = console;
const oneMillionCredits = 1000000 * MICROCREDITS_TO_CREDITS;

describe("ARC0038", () => {
  let stateMachine: StateMachine;
  let program: arc_0038Program;

  const setup = () => {
    stateMachine = new StateMachine();
    program = stateMachine.arc0038;
    initializeBalances();
  };

  const initializeBalances = () => {
    program.credits.account.set(admin, BigInt(oneMillionCredits * 1500));
    program.credits.account.set(user0, BigInt(oneMillionCredits));
    program.credits.account.set(user1, BigInt(oneMillionCredits));
    program.credits.account.set(user2, BigInt(oneMillionCredits));
    program.credits.account.set(user3, BigInt(oneMillionCredits));
    program.credits.account.set(user4, BigInt(oneMillionCredits));
  };

  beforeEach(() => {
    setup();
    global.console = require("console");
  });

  afterEach(() => {
    global.console = jestConsole;
  });

  const initializeUsers = (
    start: number,
    end: number
  ): { block: number; user: string }[] => {
    const users: { block: number; user: string }[] = [];
    for (let i = start; i <= end; i++) {
      const user = `user${i}`;
      program.credits.account.set(user, BigInt(oneMillionCredits));
      users.push({ block: i, user });
    }

    return users;
  };

  it("changing validator", () => {
    const transitions = [
      initialDeposit(
        1,
        10000 * MICROCREDITS_TO_CREDITS,
        admin,
        testValidator,
        true
      ), // not initialized
      initialize(1, 0.9, testValidator, admin, true), // commission too high
      initialize(1, 0.05, testValidator, user0, true), // not admin
      initialize(),
      deposit(1, 5 * MICROCREDITS_TO_CREDITS, user0, true), // before initial deposit
      initialDeposit(
        2,
        10000 * MICROCREDITS_TO_CREDITS,
        user0,
        testValidator,
        true
      ), // not admin
      initialDeposit(2),
      initialDeposit(
        2,
        10000 * MICROCREDITS_TO_CREDITS,
        admin,
        testValidator,
        true
      ), // already initialized
      initialize(3, 0.05, testValidator, admin, true), // already initialized
      deposit(3, 5 * MICROCREDITS_TO_CREDITS, user0),
      withdrawPublic(4, user0, 1.1, 2505683, true), // not enough shares
      withdrawPublic(4, user0, 0.5, 2505683),
      setNextValidator(4, "new-validator", admin, false),
      unbondAll(5, user0, 2505683, true), // doesn't fully unbond
      unbondAll(5, user1, 10060000000, false),
      withdrawPublic(6, user0, 0.1, 250, true), // already withdrawing
      deposit(7, 50 * MICROCREDITS_TO_CREDITS, user1),
      withdrawPublic(8, user1, 0.5, 2505683, true), // can't withdraw during unbond all
      bondAll(365, 10090000000, "new-validator", user1, true), // can't bond before claimUnbond
      claimUnbond(365, user0),
      createWithdrawClaim(366, user1, 0.5),
      claimWithdrawPublic(366, user0, 2505683, user0, true), // too early
      bondDeposits(
        367,
        55 * MICROCREDITS_TO_CREDITS,
        "new-validator",
        user1,
        true
      ), // switching validators
      bondAll(367, 11000000000, "new-validator", user1, true), // too much
      bondAll(367, 10060000000, testValidator, user1, true), // wrong validator
      deposit(367, 100 * MICROCREDITS_TO_CREDITS, user2),
      bondAll(367, 10090000000, "new-validator", user1),
      claimWithdrawPublic(1000, user0, 2505682, user0, true), // wrong amount
      claimWithdrawPublic(1000, user0, 2505683, user0),
      claimWithdrawPublic(1000, admin, 24999999, user1, false),
    ];

    stateMachine.runTransitions(transitions, "changing validator");
  });

  it("deposit every block to minimize commission", () => {
    const smallDeposit = 10;
    let adminBalanceMultipleDeposits: bigint;
    let adminBalanceOneDeposit: bigint;
    let depositorBalanceMultipleDeposits: bigint;
    let depositorBalanceOneDeposit: bigint;
    const transitions = [
      initialize(1, 0.01, testValidator, admin),
      initialDeposit(2, 2000012 * MICROCREDITS_TO_CREDITS),
      deposit(2, 2000012 * MICROCREDITS_TO_CREDITS, user0),
      deposit(3, smallDeposit, user0),
      deposit(4, smallDeposit, user0),
      deposit(5, smallDeposit, user0),
      deposit(6, smallDeposit, user0),
      deposit(7, smallDeposit, user0),
      deposit(8, smallDeposit, user0),
      deposit(9, smallDeposit, user0),
      deposit(10, smallDeposit, user0),
      deposit(11, smallDeposit, user0),
      deposit(12, smallDeposit, user0),
      deposit(13, smallDeposit, user0),
      deposit(14, smallDeposit, user0),
      deposit(15, smallDeposit, user0),
      deposit(16, smallDeposit, user0),
      deposit(17, smallDeposit, user0),
      deposit(18, smallDeposit, user0),
      deposit(19, smallDeposit, user0),
      deposit(20, smallDeposit, user0),
      deposit(21, smallDeposit, user0),
      deposit(22, smallDeposit, user0),
      deposit(23, smallDeposit, user0),
      deposit(24, smallDeposit, user0),
      deposit(25, smallDeposit, user0, false, (stateMachine) => {
        let totalBalance = stateMachine.arc0038.total_balance.get(BigInt(0));
        let pendingDeposits = stateMachine.arc0038.pending_deposits.get(
          BigInt(0)
        );
        let fullPool = totalBalance! + pendingDeposits!;
        let totalShares = stateMachine.arc0038.total_shares.get(BigInt(0));
        let adminShares = stateMachine.arc0038.delegator_shares.get(admin)!;
        adminBalanceMultipleDeposits =
          (adminShares * fullPool * program.PRECISION_UNSIGNED) /
          (totalShares! * program.PRECISION_UNSIGNED);
        depositorBalanceMultipleDeposits =
          (stateMachine.arc0038.delegator_shares.get(user0)! *
            fullPool *
            program.PRECISION_UNSIGNED) /
          (totalShares! * program.PRECISION_UNSIGNED);
      }),
    ];

    //stateMachine.arc0038.SHARES_TO_MICROCREDITS = BigInt(1);
    stateMachine.credits.account.set(user0, BigInt(oneMillionCredits * 3));
    stateMachine.runTransitions(
      transitions,
      "deposit every block to minimize commission"
    );

    const transitions2 = [
      initialize(),
      initialDeposit(2, 2000012 * MICROCREDITS_TO_CREDITS),
      deposit(2, 2000012 * MICROCREDITS_TO_CREDITS, user0),
      deposit(3, smallDeposit * 23, user0),
      claimCommission(25, admin, false, (stateMachine) => {
        let totalBalance = stateMachine.arc0038.total_balance.get(BigInt(0));
        let pendingDeposits = stateMachine.arc0038.pending_deposits.get(
          BigInt(0)
        );
        let fullPool = totalBalance! + pendingDeposits!;
        let totalShares = stateMachine.arc0038.total_shares.get(BigInt(0));
        let adminShares = stateMachine.arc0038.delegator_shares.get(admin)!;
        adminBalanceOneDeposit =
          (adminShares * fullPool * program.PRECISION_UNSIGNED) /
          (totalShares! * program.PRECISION_UNSIGNED);
        depositorBalanceOneDeposit =
          (stateMachine.arc0038.delegator_shares.get(user0)! *
            fullPool *
            program.PRECISION_UNSIGNED) /
          (totalShares! * program.PRECISION_UNSIGNED);
      }),
    ];

    setup(); // reset state machine
    //stateMachine.arc0038.SHARES_TO_MICROCREDITS = BigInt(1);
    stateMachine.credits.account.set(user0, BigInt(oneMillionCredits * 3));
    stateMachine.runTransitions(transitions2, "deposit once");

    // console.log(`${adminBalanceMultipleDeposits!.toLocaleString()} multiple deposits`);
    // console.log(`${adminBalanceOneDeposit!.toLocaleString()} one deposit`);
    // console.log(`${(adminBalanceMultipleDeposits! - adminBalanceOneDeposit!).toLocaleString()} delta`);
    // console.log('depositor');
    // console.log(`${depositorBalanceMultipleDeposits!.toLocaleString()} multiple deposits`);
    // console.log(`${depositorBalanceOneDeposit!.toLocaleString()} one deposit`);
    // console.log(`${(depositorBalanceMultipleDeposits! - depositorBalanceOneDeposit!).toLocaleString()} delta`);
  });

  it("withdraw batching", () => {
    const users = initializeUsers(590, 650);
    const depositsAndWithdrawals = users
      .map((user) => {
        const depositBlock = user.block;
        const withdrawBlock = user.block + 1;
        const shouldFail = withdrawBlock > 640;
        return [
          deposit(depositBlock, 100 * MICROCREDITS_TO_CREDITS, user.user),
          withdrawPublic(
            withdrawBlock,
            user.user,
            1,
            99.999999 * MICROCREDITS_TO_CREDITS,
            shouldFail
          ),
        ];
      })
      .reduce((acc, val) => acc.concat(val), []);
    const transitions = [
      // initialize and start first withdrawal batch
      initialize(),
      initialDeposit(1, 1000000 * MICROCREDITS_TO_CREDITS),
      deposit(1, 100 * MICROCREDITS_TO_CREDITS, user0),
      withdrawPublic(2, user0, 1, 99.999999 * MICROCREDITS_TO_CREDITS, false),
      // try to fit more withdrawals in the batch
      ...depositsAndWithdrawals,
      // withdraw from first batch
      claimUnbond(999, user0, true), // too early
      claimUnbond(1000),
      claimWithdrawPublic(
        1000,
        user0,
        99.999999 * MICROCREDITS_TO_CREDITS,
        user0,
        false
      ),
      claimWithdrawPublic(
        1000,
        users[0].user,
        99.999999 * MICROCREDITS_TO_CREDITS,
        users[0].user,
        false
      ),
      // users who couldn't fit in the first batch can start a new one
      withdrawPublic(
        1000,
        users[users.length - 1].user,
        1,
        99.999999 * MICROCREDITS_TO_CREDITS,
        false
      ),
    ];

    stateMachine.runTransitions(transitions, "withdraw batching");
  });

  it("clearing out program", () => {
    const transtions = [
      initialize(),
      initialDeposit(),
      deposit(2, 10000 * MICROCREDITS_TO_CREDITS, user0),
      bondDeposits(3, 10000 * MICROCREDITS_TO_CREDITS),
      deposit(3, 10 * MICROCREDITS_TO_CREDITS, user1),
      deposit(4, 0.5 * MICROCREDITS_TO_CREDITS, user2),
      withdrawPublic(5, admin, 1, 10060631369),
      bondDeposits(6, 10.5 * MICROCREDITS_TO_CREDITS),
      withdrawPublic(7, user1, 1, 10 * MICROCREDITS_TO_CREDITS),
      withdrawPublic(7, user2, 1, 0.5 * MICROCREDITS_TO_CREDITS),
      claimUnbond(400),
      claimCommission(401, admin),
      withdrawPublic(401, user0, 0.50368, 9600 * MICROCREDITS_TO_CREDITS),
      claimUnbond(761),
      claimWithdrawPublic(1000, admin, 10060631369, admin),
      claimWithdrawPublic(1000, user0, 9600 * MICROCREDITS_TO_CREDITS, user0),
      claimWithdrawPublic(1000, user1, 10 * MICROCREDITS_TO_CREDITS, user1),
      claimWithdrawPublic(1000, user2, 0.5 * MICROCREDITS_TO_CREDITS, user2),
      withdrawPublic(1001, user0, 1, 9459750325, true),
      createWithdrawClaim(1001, user0, 1),
      createWithdrawClaim(1001, admin, 1),
      claimWithdrawPublic(1002, user0, 9459750325, user0),
      claimWithdrawPublic(1002, admin, 479618306, admin),
      initialDeposit(1003),
    ];

    stateMachine.runTransitions(transtions, "clearing out program");
  });

  it("too small deposit", () => {
    const transtions = [
      initialize(),
      initialDeposit(1, oneMillionCredits * 200),
      deposit(2, 10, user0),
      withdrawPublic(900, user0, 1, 10),
    ];

    stateMachine.runTransitions(transtions, "too small deposit");
  });

  it("forced unbond", () => {
    const transtions = [
      initialize(),
      initialDeposit(),
      deposit(
        2,
        100 * MICROCREDITS_TO_CREDITS,
        user0,
        false,
        (stateMachine) => {
          stateMachine.credits.caller = protocol;
          stateMachine.credits.unbond_public(
            protocol,
            BigInt(10000 * MICROCREDITS_TO_CREDITS)
          );
        }
      ),
      claimUnbond(362, user0),
      createWithdrawClaim(362, user0, 1),
    ];

    stateMachine.runTransitions(transtions, "forced unbond");
  });

  it("transfer and bond_all without using initial_deposit", () => {
    const transtions = [
      initialize(1, 0.01, testValidator, admin, false, (stateMachine) => {
        stateMachine.credits.caller = admin;
        stateMachine.credits.transfer_public(
          protocol,
          BigInt(10000 * MICROCREDITS_TO_CREDITS)
        );
      }),
      setNextValidator(1, testValidator, admin, false),
      bondAll(1, 10000 * MICROCREDITS_TO_CREDITS, testValidator, admin, true),
      initialDeposit(2),
      bondDeposits(
        2,
        10000 * MICROCREDITS_TO_CREDITS,
        testValidator,
        admin,
        true
      ),
      setNextValidator(2, testValidator, admin, false),
      unbondAll(2, admin, 10000 * MICROCREDITS_TO_CREDITS),
      claimUnbond(362, admin),
      bondAll(362, 20000 * MICROCREDITS_TO_CREDITS, testValidator, admin, true),
      bondAll(362, 10000 * MICROCREDITS_TO_CREDITS, testValidator, admin),
    ];

    stateMachine.runTransitions(
      transtions,
      "transfer and bond_all without using initial_deposit"
    );
  });

  it("transfer and bond_deposits using initial_deposit", () => {
    const transtions = [
      initialize(1, 0.01, testValidator, admin, false, (stateMachine) => {
        stateMachine.credits.caller = admin;
        stateMachine.credits.transfer_public(
          protocol,
          BigInt(10000 * MICROCREDITS_TO_CREDITS)
        );
      }),
      bondDeposits(
        1,
        10000 * MICROCREDITS_TO_CREDITS,
        testValidator,
        admin,
        true
      ),
      initialDeposit(2),
      bondDeposits(
        2,
        10000 * MICROCREDITS_TO_CREDITS,
        testValidator,
        admin,
        true
      ),
    ];

    stateMachine.runTransitions(
      transtions,
      "transfer and bond_deposits without using initial_deposit"
    );
  });
});
