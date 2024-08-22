#!/bin/bash

total_validators=20
network_id=1

# rpc has a couple of passthrough methods, we need to add one for the history endpoint 

# Create a new tmux session named "devnet"
tmux new-session -d -s "devnet" -n "window0"

echo "Starting devnet with $total_validators validators"

# Create a timestamp-based directory for log files
log_dir=".logs-$(date +"%Y%m%d%H%M%S")"
mkdir -p "$log_dir"

# Get the tmux's base-index for windows
# we have to create all windows with index offset by this much
index_offset="$(tmux show-option -gv base-index)"
if [ -z "$index_offset" ]; then
  index_offset=0
fi

# Generate validator indices from 0 to (total_validators - 1)
validator_indices=($(seq 0 $((total_validators - 1))))

# Loop through the list of validator indices and create a new window for each
for validator_index in "${validator_indices[@]}"; do
  # Generate a unique and incrementing log file name based on the validator index
  log_file="$log_dir/validator-$validator_index.log"

  # Send the command to start the validator to the new window and capture output to the log file
  if [ "$validator_index" -eq 0 ]; then
    tmux send-keys -t "devnet:window$validator_index" "snarkos start --nodisplay --network $network_id --dev $validator_index --allow-external-peers --dev-num-validators $total_validators --validator --logfile $log_file --rest-rps 1000 --metrics" C-m
  else
    # Create a new window with a unique name
    window_index=$((validator_index + index_offset))
    tmux new-window -t "devnet:$window_index" -n "window$validator_index"
    tmux send-keys -t "devnet:window$validator_index" "snarkos start --nodisplay --network $network_id --dev $validator_index --allow-external-peers --dev-num-validators $total_validators --validator --logfile $log_file --rest-rps 1000" C-m
  fi
done

# Attach to the tmux session to view and interact with the windows
# tmux attach-session -t "devnet"
