#!/bin/bash
# Creates Refbox.app on your Desktop. It opens the Refbox extension in its own Chrome window.
# Run once from Terminal:  bash "path/to/Create Desktop Shortcut.command"

ID="pfedhfmnnknbjndfmojjligmkdappcjl"
HERE="$(cd "$(dirname "$0")" && pwd)"
APP="$HOME/Desktop/Refbox.app"

rm -rf "$APP"
osacompile -o "$APP" -e "do shell script \"open -na 'Google Chrome' --args --app=chrome-extension://$ID/app.html\"" || { echo "Could not create the shortcut."; exit 1; }

if [ -f "$HERE/icons/refbox.icns" ]; then
  cp "$HERE/icons/refbox.icns" "$APP/Contents/Resources/applet.icns"
  touch "$APP"
fi

echo "Done: Refbox is on your Desktop."
