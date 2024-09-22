#!/bin/bash

# Define the source, destination, and backup directories
SOURCE_DIR="frontend/localdeploy"
DEST_DIR="frontend"
BACKUP_DIR="frontend/productiondeploy"

# Check if the source directory exists
if [ ! -d "$SOURCE_DIR" ]; then
    echo "Source directory $SOURCE_DIR does not exist."
    exit 1
fi

# Create the backup directory if it doesn't exist
if [ ! -d "$BACKUP_DIR" ]; then
    echo "Creating backup directory $BACKUP_DIR..."
    mkdir -p "$BACKUP_DIR"
fi

# Function to copy files and folders recursively
copy_files() {
    local src=$1
    local dest=$2
    local backup=$3

    for item in "$src"/*; do
        local base_item=$(basename "$item")
        if [ -d "$item" ]; then
            if [ -d "$dest/$base_item" ]; then
                mkdir -p "$backup/$base_item"
                copy_files "$item" "$dest/$base_item" "$backup/$base_item"
            fi
        else
            if [ -f "$dest/$base_item" ]; then
                echo "Backing up $dest/$base_item to $backup/$base_item..."
                cp "$dest/$base_item" "$backup/$base_item"
            fi
        fi
    done
}

# Copy the current frontend files to the backup directory if they exist in the localdeploy directory
echo "Backing up current frontend files to $BACKUP_DIR..."
copy_files "$SOURCE_DIR" "$DEST_DIR" "$BACKUP_DIR"

# Copy files from localdeploy to the frontend directory
echo "Deploying local files from $SOURCE_DIR to $DEST_DIR..."
cp -r "$SOURCE_DIR"/* "$DEST_DIR"

echo "Deployment completed."
