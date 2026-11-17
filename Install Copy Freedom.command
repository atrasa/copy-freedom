#!/bin/bash
set -euo pipefail
trap 'printf "\nInstallation failed. Read the error above.\n" >&2; read -r -p "Press Return to close..." || true' ERR
source_dir="$(cd "$(dirname "$0")" && pwd)"
files=(index.html style.css panel.js clipboard-image-mac.js CSXS host)
for file in "${files[@]}"; do
    [[ -e "$source_dir/$file" ]] || { printf 'Extract the entire ZIP before running this installer.\n' >&2; exit 1; }
done
extensions="$HOME/Library/Application Support/Adobe/CEP/extensions"
target="$extensions/com.finex.copyfreedom"
mkdir -p "$extensions/_backup"
backup="$(mktemp -d "$extensions/_backup/CopyFreedom-XXXXXXXX")"
if [[ -e "$target" || -L "$target" ]]; then
    [[ ! -L "$target" && -d "$target" ]] || { printf 'Install target must be a regular folder.\n' >&2; exit 1; }
    cp -R "$target" "$backup/com.finex.copyfreedom"
    # Refuse redirected installed files instead of writing through symbolic links.
    [[ -z "$(find "$target" -type l -print -quit)" ]] || { printf 'Existing install contains a symbolic link; no files changed.\n' >&2; exit 1; }
fi
for version in 11 12; do
    domain="com.adobe.CSXS.$version"
    if defaults read "$domain" >/dev/null 2>&1; then
        defaults export "$domain" "$backup/$domain.plist"
    else
        printf 'Preference domain did not exist before installation.\n' > "$backup/$domain.absent.txt"
    fi
    defaults write "$domain" PlayerDebugMode -string 1
done
mkdir -p "$target"
for file in "${files[@]}"; do cp -R "$source_dir/$file" "$target/"; done
# Unblock only this installed plugin, never other downloads or system security settings.
if xattr -r "$target" 2>/dev/null | grep -q com.apple.quarantine; then
    xattr -dr com.apple.quarantine "$target"
fi
printf '\nCopy Freedom installed. Restart Photoshop when convenient.\nOpen Window > Extensions (Legacy) > Copy Freedom.\nBackup: %s\n' "$backup"
read -r -p "Press Return to close..." || true
