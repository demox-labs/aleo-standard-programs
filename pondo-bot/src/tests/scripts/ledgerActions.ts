import { UserAction, UserActions, ValidatorActions } from "../../utils/ledgerCreator";

const user1 = 'aleo15sqqdq6tnt96krc9zlfpaxg33xs0nxmkwpn5lzjnug6z6r68uqps0qcvey';
const userAction1: UserAction = {
    privateKey: 'APrivateKey1zkpAoWnzpRMuuSjfiC4MncBPULhG17PCbmdGwLNR3QFCAQK',
    microcredits: BigInt(150_000_000_000),
    deposits: [ { microcredits: BigInt(125_000_000_000), blockHeight: 270 } ],
    withdraws: []
  };

const validatorActions: ValidatorActions = [ { action: 'distributeDeposits', blockHeight: 285 } ];
const userActions: UserActions = new Map();
userActions.set(user1, userAction1);

export const getWithdrawTestUserActions = (): UserActions => {
  let testUserActions: UserActions = new Map();
  const depositUser1 = 'aleo1ljmstpa72uzaqk3l76rtc6ltlm3r43rc0dypft02sk67n2s82yzse0jqj0';
  const depositUserPK1 = 'APrivateKey1zkp2nBamyqaXD6hSwJjcs6ocMD3ZnuBbSX8PSLiWHFA1Xgo';
  const depositUser2 = 'aleo1why72udqq3f4z7s0xgnxkcqun0kxe0wjsmg9d9aahl7s2dr0nsysx6x7dc';
  const depositUserPK2 = 'APrivateKey1zkpJbi2v9d9waFe1ZDL3A4CxMhbFkF9uNXYBz5ZxbdG5b1t';
  const depositUser3 = 'aleo18uxpr8m5x2vmvk7rltkjfq5zlmqv8mfqur7aarunj26h8j8jwqfq88xcwm';
  const depositUserPK3 = 'APrivateKey1zkpC3BEAcruaUpCMgz3fm83rBKZUkfy6Uo3z8gZ2TV2Jz96';

  const userAction1: UserAction = {
    privateKey: depositUserPK1,
    microcredits: BigInt(150_000_000_000),
    deposits: [ { microcredits: BigInt(10_000_000), blockHeight: 310 } ],
    withdraws: [ { micropaleo: BigInt(1_000_000), blockHeight: 340 } ]
  };
  const userAction2: UserAction = {
    privateKey: depositUserPK2,
    microcredits: BigInt(150_000_000_000),
    deposits: [ { microcredits: BigInt(47_000_000), blockHeight: 310 } ],
    withdraws: []
  };
  const userAction3: UserAction = {
    privateKey: depositUserPK3,
    microcredits: BigInt(150_000_000_000),
    deposits: [ { microcredits: BigInt(38_000_000), blockHeight: 310 } ],
    withdraws: []
  };

  testUserActions.set(depositUser1, userAction1);
  testUserActions.set(depositUser2, userAction2);
  testUserActions.set(depositUser3, userAction3);
  return testUserActions;
};