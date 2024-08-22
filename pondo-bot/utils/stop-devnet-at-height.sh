#!/bin/bash

# URL to check the height
URL="http://localhost:3030/testnet/latest/height"

# Check if a threshold parameter was provided
if [ -z "$1" ]; then
  echo "Usage: $0 <threshold>"
  exit 1
fi

# Set the threshold from the first argument
THRESHOLD=$1

# Function to check the height
check_height() {
  height=$(curl -s $URL)

  # Ensure we get a valid height
  if [[ $height =~ ^[0-9]+$ ]]; then
    echo "Current height: $height"
    if [ "$height" -gt "$THRESHOLD" ]; then
      echo "Height is greater than $THRESHOLD, stopping devnet..."
      yarn stopDevnet
      exit 0  # Exit after stopping the devnet
    else
      echo "Height is not greater than $THRESHOLD. No action needed."
    fi
  else
    echo "Failed to retrieve height or height is not a number: $height"
  fi
}

# Infinite loop to run the check every 15 seconds
while true; do
  check_height
  sleep 15
done