import React, { useCallback, useRef } from 'react';
import { Accordion } from './Accordion';
import StringTransformationComponent from '../components/programIdToAddress';

import { creditsProgram } from '../contracts/credits';
import { arc_0038Program } from '../contracts/arc_0038';

export const Simulator: React.FC = () => {
  const balanceRef = useRef<HTMLInputElement>(null);
  const pendingDepositsRef = useRef<HTMLInputElement>(null);
  const depositRef = useRef<HTMLInputElement>(null);
  const sharesRef = useRef<HTMLInputElement>(null);

  const calculateNewShares = useCallback(() => {
  }, [balanceRef, pendingDepositsRef, depositRef, sharesRef]);

  return (
    <div>
      {/* <Accordion title={'Params'}>
        <div>this is where i would put my params if i had any</div>
      </Accordion>
      <Accordion title={'Simulator'}>
        <div>this is where i would put my simulator if i had one</div>
      </Accordion>
      <Accordion title={'Program Addresses'}>
        <StringTransformationComponent />
      </Accordion> */}


      <input type="text" id="balance" ref={balanceRef} placeholder="Balance" />
      <input type="text" id="pending_deposits" ref={pendingDepositsRef} placeholder="Pending Deposits" />
      <input type="text" id="deposit" ref={depositRef} placeholder="Deposit" />
      <input type="text" id="total_shares" ref={sharesRef} placeholder="Total Shares" />
    </div>
  )
};



const args = process.argv.slice(2);
const [balance, pending, deposit, shares] = args.map(x => BigInt(x.replace(/[,_]/g, '')));
const program = new arc_0038Program(new creditsProgram());
const result = program.inline_calculate_new_shares(balance, pending, deposit, shares);
console.log(result.toLocaleString());