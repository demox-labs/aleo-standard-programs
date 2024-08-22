## Summary

The pondo bot is a utility to automatically run the pondo protocol.
As most calls in the pondo protocol are permissionless, the private key used to run this bot can be arbitrary as long as it has sufficient funds to call the protocol cranks.

## Setup

1. Clone [snarkOS](https://github.com/AleoNet/snarkOS) then run: `cargo install --locked --path . --features history` in the snarkOS directory
2. Clone & setup the [Aleo RPC](https://github.com/demox-labs/aleo-rpc) and run: `yarn` && `yarn local-db-up` && `yarn start:prover` && `yarn start:dev`
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

## Testing:
Testing pondo uses a couple of different states preloaded for unit tests.
1. In order to work with the aleo SDK, we have to build our test scripts with webpack. Make sure your test script is included in webpack (named `TEST_NAME.test.ts`), and then run `yarn build:dev`
2. Make sure snarkos is installed.
3. You can either create a saved ledger + rpc state yourself, or download prebuilt ones from s3. This is a manual process, but if you are creating the ledger state yourself, run snarkos with `yarn startDevnet`, run the rpc. Get the ledger and rpc into the state you want, then run `yarn stopDevnet` to kill the devnet. Then run `yarn snapshotLedger THE_NAME_OF_THE_STATE`, and run `yarn snapshotRpcDb THE_NAME_OF_THE_STATE`. These will save both the sql and ledger files into the saved-states directory. If you want other people to be able to use this saved state, you need to zip the saved-state subfolder and upload it to s3.
4. Run `yarn test TEST_NAME SAVED_STATE_NAME`. (Note, the testRunner appends the `test` suffix automatically.) This will set up the ledger and rpc states, and start the devnet process. Once the rpc begins to advance (this can take up to a few minutes), your test suite will begin.
Troubleshooting:
1. Tests hanging? You probably need to add `await killAuthorizePool()` to kill the pool of webworkers that authorize transactions that are then delegated. This process pool will not autoterminate.

## Reset the network:

1. Kill the `./devnet.sh` by `tmux kill-session -t devnet`
2. Reset the RPC by `yarn rollback-all && yarn migrate && yarn start:dev` (you may need to run `yarn stop:prover && yarn start:prover`)
3. Run pondo bot: `yarn start:dev`
4. (Optionally restart haruka's explorer): `docker compose down -v` and then setup as before

## Save a ledger:

1. Once the ledger is a in a state you want to save for hot reloading later, kill `/.devnet.sh` by `tmux kill-session -t devnet`.
2. Make sure `SNARKOS_PATH` and `LEDGER_BACKUPS_PATH` are set in your `.env`. `SNARKOS_PATH` is the absolute path to the snarkOS directory on your machine, where the ledgers are stored. `LEDGER_BACKUPS_PATH` can refer to the local folder: `./saved-states`.
3. Run `yarn build:dev` to make sure all the test scripts are built.
4. Run `yarn snapshotLedger your_ledger_name`.

## Hot swap a ledger:

1. Kill `/.devnet.sh` by `tmux kill-session -t devnet`.
2. Make sure `SNARKOS_PATH` and `LEDGER_BACKUPS_PATH` are set in your `.env`. `SNARKOS_PATH` is the absolute path to the snarkOS directory on your machine, where the ledgers are stored. `LEDGER_BACKUPS_PATH` can refer to the local folder: `./saved-states`.
3. Run `yarn build:dev` to make sure all the test scripts are built.
4. Run `yarn swapLedger your_ledger_name`.

## Save RPC DB state

1. Once the RPC is a in a state you want to save for hot reloading later:
   1. Kill `/.devnet.sh` by `tmux kill-session -t devnet`.
   1. Spin down RPC task by `crtl+C` on relevant terminal
1. Make sure `RPC_PATH` is set in your `.env` . `RPC_PATH` is the path to your `aleo-rpc` local repo.
1. Run `yarn build:dev` to make sure all the test scripts are built.
1. Run `yarn rpcBackupDb your_backup_name`

## Hot swap DB state

1. Kill `/.devnet.sh` by `tmux kill-session -t devnet`.
1. Make sure `RPC_PATH` is set in your `.env` . `RPC_PATH` is the path to your `aleo-rpc` local repo.
1. Run `yarn build:dev` to make sure all the test scripts are built.
1. Run `yarn swapRpcDb your_backup_name`.

## Retrieving / uploading common saved states
We use an S3 bucket to store common states: [pondo-test-states](https://us-west-2.console.aws.amazon.com/s3/buckets/pondo-test-states)

### Downloading
1. Ensure you have AWS S3 retrieve access 
1. Navigate to the above S3 bucket on the console, and download any relevant zips 
1. Unzip into the saved-states/ directory 

### Uploading 
1. After snapshotting, zip the saved state i.e. `zip -r programsDeployed.zip programsDeployed` 
1. Ensure you have AWS S3 upload access 
1. Navigate to the above S3 bucket on the console, and upload the zips with default settings

## After updating a leo program

1. Make sure to run: `yarn copyFiles`

## Troubleshooting

1. Ensure docker is installed and running
1. Make sure rpc and pondo-bot node versions are in sync
1. Increase file descriptors if having trouble running the devnet from snarkOS: `ulimit -n` to check.
1. `snarkos clean` doesn't work but within the snarkOS folder: `rm -rf .ledger-* && rm -rf .logs*` does.
1. Use node: v18.15.0 or v20.16.0
1. In the case of the prover, sometimes docker caches the build causing issues. Use `docker system prune -a --volumes` to fully reset docker build cache. (Unlikely cause, but including for posterity)
