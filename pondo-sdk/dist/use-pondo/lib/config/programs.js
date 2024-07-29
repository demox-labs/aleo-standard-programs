export const PROGRAMS = {
    credits: { id: "credits.aleo", address: "aleo1lqmly7ez2k48ajf5hs92ulphaqr05qm4n8qwzj8v0yprmasgpqgsez59gg" },
    coreProtocol: { id: "pondo_core_protocol.aleo", address: "aleo1a6rhakcgjqcfr869z9pznktnghpd7swc47pz884c3zup2xa8guzsmfhxeq" },
    delegator1: { id: "pondo_delegator1.aleo", address: "aleo1wjgkfxahkpk6u48eu084dwnyenlamuw6k2vvfzxds786pdzntu9s4r9ds4" },
    delegator2: { id: "pondo_delegator2.aleo", address: "aleo16954qfpx6jrtm7u094tz2jqm986w520j6ewe6xeju6ptyer6k5ysyknyxc" },
    delegator3: { id: "pondo_delegator3.aleo", address: "aleo1hhf39eql5d4gvfwyga0trnzrj0cssvlyzt24w9eaczppvya05u9q695djt" },
    delegator4: { id: "pondo_delegator4.aleo", address: "aleo1zmpnd8p29h0296uxpnmn4qqu9hukr6p4glwk6cpwln8huvdn7q9sl4vr7k" },
    delegator5: { id: "pondo_delegator5.aleo", address: "aleo1xwa8pc6v9zypyaeqe4v65v8kw7mmstq54vnjnc8lwn874nt455rsus6d8n" },
    mtsp: { id: "multi_token_support_program_v1.aleo", address: "aleo129xmhqrxf63e774q7pq2k4ulcleped8hcdkxz7phuky97q9w4cxqqjmcln" },
    pndo: { id: "pondo_token.aleo", address: "aleo1z7m9qvmpkdwpwe465j5hae7mgcfcp36mnguf7qe2r8qnjnch6crqt34tsk" },
    paleo: { id: "pondo_staked_aleo_token.aleo", address: "aleo19pk6q22kk5vdwpkuh3ag8lmrvallu5kqpsm0t4f3ul6je3ec0gyqkvnycl" },
    oracle: { id: "pondo_oracle.aleo", address: "aleo1uz3hqa3yj6d09dapg2kqlu56jvnc86sxdx7vc9nljcng7a0k4srqa4lxq5" }
};
export const programIdToAddress = Object.fromEntries(Object
    .entries(PROGRAMS)
    .map(([programKey, program]) => ([program.id, program.address])));
export const programAddressToId = Object.fromEntries(Object
    .entries(PROGRAMS)
    .map(([programKey, program]) => ([program.address, program.id,])));
