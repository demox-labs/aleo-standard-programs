#!/bin/bash

# Path to the source file
SOURCE_FILE="pondo/delegators/pondo_delegator1/src/main.leo"

# List of target delegators
DELEGATORS=("delegator2" "delegator3" "delegator4" "delegator5")

# Copy and modify the file for each delegator
for DELEGATOR in "${DELEGATORS[@]}"; do
    TARGET_FILE="pondo/delegators/pondo_$DELEGATOR/src/main.leo"
    cp "$SOURCE_FILE" "$TARGET_FILE"
    sed -i '' "s/pondo_delegator1.aleo/pondo_${DELEGATOR}.aleo/g" "$TARGET_FILE"
done

# Run "leo build" for each delegator in the pondo/delegators folder
for DELEGATOR in "delegator1" "${DELEGATORS[@]}"; do
    pushd "pondo/delegators/pondo_$DELEGATOR" > /dev/null
    leo build --network testnet --endpoint "https://api.explorer.aleo.org/v1"
    popd > /dev/null
done

# Run "leo build" for reference_delegator and oracle in the pondo folder
pushd "pondo/reference_delegator" > /dev/null
leo build --network testnet --endpoint "https://api.explorer.aleo.org/v1"
popd > /dev/null

pushd "pondo/pondo_oracle" > /dev/null
leo build --network testnet --endpoint "https://api.explorer.aleo.org/v1"
popd > /dev/null

# Run "leo build" for pondo_core_protocol in the pondo folder
pushd "pondo/pondo_core_protocol" > /dev/null
leo build --network testnet --endpoint "https://api.explorer.aleo.org/v1"
popd > /dev/null

exit 0

exit 0