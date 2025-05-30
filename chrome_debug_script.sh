#!/bin/bash

# Chrome profile paths to check (in order of preference)
CHROME_PATHS=(
    "$HOME/.config/google-chrome/Default"
    "$HOME/.config/chromium/Default"
    "$HOME/.config/google-chrome-stable/Default"
)

# Create temp directory
mkdir -p ~/tmp/user-data-dir

# Find and copy Chrome profile
CHROME_PROFILE_FOUND=false
for chrome_path in "${CHROME_PATHS[@]}"; do
    if [ -d "$chrome_path" ]; then
        echo "Found Chrome profile at: $chrome_path"
        cp -r "$chrome_path" ~/tmp/user-data-dir/
        CHROME_PROFILE_FOUND=true
        break
    fi
done

if [ "$CHROME_PROFILE_FOUND" = false ]; then
    echo "Warning: No Chrome profile found at any of these locations:"
    for path in "${CHROME_PATHS[@]}"; do
        echo "  - $path"
    done
    echo "Creating empty profile directory..."
    mkdir -p ~/tmp/user-data-dir/Default
fi

# Check if Chrome executable exists
CHROME_EXECUTABLES=(
    "google-chrome"
    "google-chrome-stable"
    "chromium-browser"
    "/usr/bin/google-chrome"
    "/opt/google/chrome/google-chrome"
)

CHROME_CMD=""
for cmd in "${CHROME_EXECUTABLES[@]}"; do
    if command -v "$cmd" &> /dev/null; then
        CHROME_CMD="$cmd"
        echo "Found Chrome executable: $CHROME_CMD"
        break
    fi
done

if [ -z "$CHROME_CMD" ]; then
    echo "Error: Chrome executable not found. Please install Google Chrome or Chromium."
    echo "Tried looking for:"
    for cmd in "${CHROME_EXECUTABLES[@]}"; do
        echo "  - $cmd"
    done
    exit 1
fi

# Launch Chrome with remote debugging
echo "Starting Chrome with remote debugging on port 9222..."
"$CHROME_CMD" --remote-debugging-port=9222 --user-data-dir=~/tmp/user-data-dir/