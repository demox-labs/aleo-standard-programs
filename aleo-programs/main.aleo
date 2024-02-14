import credits.aleo;

program aleo_credits_helper_v0_0_1.aleo;

function transfer_2_private:
  input r0 as address.private;
  input r1 as u64.private;
  input r2 as credits.aleo/credits.record;
  input r3 as credits.aleo/credits.record;
  
  call credits.aleo/join r2 r3 into r4;
  call credits.aleo/transfer_private r4 r0 r1 into r5 r6;
  
  output r5 as credits.aleo/credits.record;
  output r6 as credits.aleo/credits.record;
