# **Aleo Workshop: Compliant Token Challenge – Earn $100!**  

## **Overview**  
This workshop is focused on exploring compliance mechanisms within the Aleo ecosystem. Participants can earn **$100 USD** by deploying a new Aleo program that introduces a **compliance rule, mechanism, or example** related to compliant tokens. The best use of pAleo/Pondo tokens will earn an additional **$150 USD** worth of the pondo token.

## **How to Participate**  
### 1. Develop & Deploy  
- Build and deploy an **Aleo program** that demonstrates a **new** compliance rule, enforcement mechanism, or regulatory example.  
- Examples include, but are not limited to:
  - KYC/AML enforcement.
  - Transfer restrictions (e.g., jurisdiction-based, whitelist/blacklist).  
  - Time-locked transactions or permissions.  
  - Privacy-preserving compliance reporting.  
  - On-chain attestations or proof-of-compliance mechanisms.

### 2. Publish Your Work  
- Push your Aleo program code to a **public GitHub repository**.  
- Include a `README.md` with:  
  - A description of the compliance feature.  
  - How it works and its intended use case.  
  - Deployment instructions.

### 3. Submit Your Entry  
- Share your project link (GitHub + deployed program) via a form we will share after this event.  
- Provide a short explanation of your compliance mechanism.  

### 4. Get Rewarded!  
- The **eligible submissions** will receive **$100 USD each**.  
- Submissions will be reviewed for originality, correctness, and adherence to the rules.

## **Rules & Eligibility**  
- Your program **must introduce a new compliance feature** (not just a fork of an existing one).  
- The program should be **functional and deployable** on Aleo.  
- Code must be **open-source** and properly documented.  
- Only **one reward per participant**.  
- We reserve the right to reject submissions that are incomplete, plagiarized, or non-functional.

## **Deadline**  
- Submissions are open from 2/27/25 to 3/1/25  

## **Questions?**  
Join our [**Discord**](https://link.leo.app/discord) or contact @coralrelief for any questions.

## Installation

1. Ensure [Leo is installed](https://github.com/ProvableHQ/leo)
2. Ensure the ADMIN_ADDRESS is set to an address you have

That's it!

## Building

1. `leo build`

## Deploying

1. `leo deploy` - Need some credits first

## Execution

- Initialize: `leo run initialize`
```
➡️  Output
 • {
  program_id: compliant_token.aleo,
  function_name: initialize,
  arguments: [
    {
      program_id: token_registry.aleo,
      function_name: register_token,
      arguments: [
        {
  token_id: 71619063553950105623552field,
  name: 71619063553950105623552u128,
  symbol: 71619063553950105623552u128,
  decimals: 6u8,
  supply: 0u128,
  max_supply: 10000000000000000u128,
  admin: aleo19fv0hv9d995qpd7py6w98gvxrv2u0d9jwf5ny0reuuyy8rxv8cpqml732r,
  external_authorization_required: true,
  external_authorization_party: aleo19fv0hv9d995qpd7py6w98gvxrv2u0d9jwf5ny0reuuyy8rxv8cpqml732r
}
      ]
    }
  
  ]
}
```
- Private Mint: `leo run mint_private`
```
{
  owner: aleo10047h9c9efxz3d0u69xn7alclvsvt96ysuhts80p7h2eh57kh5zsjwsp8f.private,
  amount: 1000000000000000u128.private,
  token_id: 71619063553950105623552field.private,
  external_authorization_required: true.private,
  authorized_until: 4294967295u32.private,
  _nonce: 1947228332053897687176514533585132592618722886193791087359240091568212528963group.public
}
```
- Issue limit: `leo run issue_limit aleo10047h9c9efxz3d0u69xn7alclvsvt96ysuhts80p7h2eh57kh5zsjwsp8f`
```
{
  owner: aleo10047h9c9efxz3d0u69xn7alclvsvt96ysuhts80p7h2eh57kh5zsjwsp8f.private,
  amount_spent: 0u128.private,
  epoch_spent: 0u32.private,
  _nonce: 5457890332111693987443858230183603396495345403904206965949394662294101138924group.public
}
```
- Transfer private: `leo run transfer_private "{
  owner: aleo10047h9c9efxz3d0u69xn7alclvsvt96ysuhts80p7h2eh57kh5zsjwsp8f.private,
  amount: 1000000000000000u128.private,
  token_id: 71619063553950105623552field.private,
  external_authorization_required: true.private,
  authorized_until: 4294967295u32.private,
  _nonce: 1947228332053897687176514533585132592618722886193791087359240091568212528963group.public
}" "{
  owner: aleo10047h9c9efxz3d0u69xn7alclvsvt96ysuhts80p7h2eh57kh5zsjwsp8f.private,
  amount_spent: 0u128.private,
  epoch_spent: 0u32.private,
  _nonce: 5457890332111693987443858230183603396495345403904206965949394662294101138924group.public
}" "100_000_000u128" "aleo1q5taq9mdcq7cvv4mq67fmvum2my3z2qzszgwm9ju70eplprx0sfqnszn4m" "1u32"`
```

 • {
  owner: aleo10047h9c9efxz3d0u69xn7alclvsvt96ysuhts80p7h2eh57kh5zsjwsp8f.private,
  amount_spent: 100000000u128.private,
  epoch_spent: 1u32.private,
  _nonce: 103970167760473194475602697292120469226135377511623325786694609620537314099group.public
}
 • {
  owner: aleo10047h9c9efxz3d0u69xn7alclvsvt96ysuhts80p7h2eh57kh5zsjwsp8f.private,
  amount: 999999900000000u128.private,
  token_id: 71619063553950105623552field.private,
  external_authorization_required: true.private,
  authorized_until: 4294967295u32.private,
  _nonce: 7531324207295988379970859583113533077408191011318507997296676768787084560635group.public
}
 • {
  owner: aleo10047h9c9efxz3d0u69xn7alclvsvt96ysuhts80p7h2eh57kh5zsjwsp8f.private,
  amount: 0u128.private,
  token_id: 71619063553950105623552field.private,
  external_authorization_required: true.private,
  authorized_until: 4294967295u32.private,
  _nonce: 6350658894139185176134490376248984504100505273885638653431612073584429192106group.public
}
 • {
  owner: aleo1q5taq9mdcq7cvv4mq67fmvum2my3z2qzszgwm9ju70eplprx0sfqnszn4m.private,
  amount: 100000000u128.private,
  token_id: 71619063553950105623552field.private,
  external_authorization_required: true.private,
  authorized_until: 0u32.private,
  _nonce: 8156769831253401298192458900264819181153382878956997690890969032012879084482group.public
}
 • {
  program_id: compliant_token.aleo,
  function_name: transfer_private,
  arguments: [
    {
      program_id: token_registry.aleo,
      function_name: prehook_private,
      arguments: [
        71619063553950105623552field,
        aleo19fv0hv9d995qpd7py6w98gvxrv2u0d9jwf5ny0reuuyy8rxv8cpqml732r
      ]
    },
    {
      program_id: token_registry.aleo,
      function_name: transfer_private,
      arguments: [
        true,
        4294967295u32
      ]
    },
    1u32
  ]
}
```