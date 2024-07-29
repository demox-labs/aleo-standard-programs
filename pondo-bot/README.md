## Summary

The pondo bot is a utility to automatically run the pondo protocol.
As most calls in the pondo protocol are permissionless, the private key used to run this bot can be arbitrary as long as it has sufficient funds to call the protocol cranks.

## Setup

1. Clone snarkOS then run: `./devnet.sh` (requires tmux)
2. Clone & setup the Aleo RPC and run: `yarn` && `yarn local-db-up` && `yarn start:prover` && `yarn start:dev`
   1. Update `endpoints.ts`
    ```
    export const ALEO_URL_BASE = 'http://127.0.0.1:3030';
    export const VALIDATOR_URL_BASE = 'http://127.0.0.1:3030';
    ```
3. Create the `.env` file
4. Install and run the pondo bot: `yarn` && `yarn start:dev`

Optionally, run Haruka's explorer:
1. Clone https://github.com/demox-labs/haruka-aleo-explorer/tree/pondo-bot
2. Run `docker compose up`
3. If redis is failing to connect, from within the redis container created: `redis-cli` && then `ACL SETUSER username on >password ~* +@all` && then restart the container
4. Navigate to `http://localhost:8800/` to see the explorer

## Reset the network:
1. Kill the `./devnet.sh` by `tmux kill-session -t devnet`
2. Reset the RPC by `yarn rollback-all && yarn migrate && yarn start:dev` (you may need to run `yarn stop:prover && yarn start:prover`)
3. Run pondo bot: `yarn start:dev`
4. (Optionally restart haruka's explorer): `docker compose down -v` and then setup as before


## After updating a leo program
1. Make sure to run: `yarn copyFiles`

## Troubleshooting
1. Ensure docker is installed and running
1. Increase file descriptors if having trouble running the devnet from snarkOS: `ulimit -n` to check. 
2. `snarkos clean` doesn't work but within the snarkOS folder: `rm -rf .ledger-* && rm -rf .logs*` does. 