#!/bin/bash

# Set the base directory dynamically based on the script location
BASE_DIR=$(dirname "$(realpath "$0")")

# Define paths using the base directory
TARGET_FOLDER="$BASE_DIR/public/assets"
TARGET_FILE="$BASE_DIR/public/index.html"
SOURCE_FOLDER="$BASE_DIR/frontend/dist/"

# Remove the target folder and file
rm -rf "$TARGET_FOLDER"
rm -f "$TARGET_FILE"

# Check if the removal was successful
if [ ! -d "$TARGET_FOLDER" ] && [ ! -f "$TARGET_FILE" ]; then
  echo "Target folder and file successfully removed."
else
  echo "Error: Target folder or file could not be removed."
  exit 1
fi

# Copy the source folder and its contents to the target location
cp -r "$SOURCE_FOLDER"* "$BASE_DIR/public/"

# Check if the copy was successful
if [ $? -eq 0 ]; then
  echo "Files successfully copied."
else
  echo "Error: Files could not be copied."
  exit 1
fi
