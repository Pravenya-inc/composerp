#!/bin/bash
# Script to update all HTML files to use dynamic navigation

for file in *.html; do
    if [ "$file" != "login.html" ] && [ "$file" != "navigation-template.html" ]; then
        # Check if file has sidebar-nav
        if grep -q "sidebar-nav" "$file"; then
            echo "Updating $file..."
            # This is a placeholder - manual update needed for each file
        fi
    fi
done
