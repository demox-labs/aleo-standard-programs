## Summary

The pondo bot is a utility to automatically run the pondo protocol.
As most calls in the pondo protocol are permissionless, the private key used to run this bot can be arbitrary as long as it has sufficient funds to call the protocol cranks.

## Setup

1. Download and install snarkOS then run: `./devnet.sh`
2. Download and install the Aleo RPC (pondo-bot branch) and run: `yarn` && `yarn local-db-up` && `yarn start:prover` && `yarn start:dev`
3. Create the `.env` file
4. Install and run the pondo bot: `yarn` && `yarn start:dev`

Optionally, run Haruka's explorer:
1. Clone https://github.com/demox-labs/haruka-aleo-explorer/tree/pondo-bot
2. Run `docker compose up`
3. From within the redis container created: `redis-cli` && then `ACL SETUSER username on >password ~* +@all` && then restart the container
4. Navigate to `http://localhost:8800/` to see the explorer

## Reset the network:
1. Kill the `./devnet.sh` by `tmux kill-session -t devnet`
2. Reset the RPC by `yarn rollback-all && yarn migrate && yarn start:dev` (you may need to run `yarn stop:prover && yarn start:prover`)
3. Run pondo bot: `yarn start:dev`
4. (Optionally restart haruka's explorer): `docker compose down -v` and then setup as before


## After updating a leo program
1. Make sure to run: `yarn copyFiles`