#!/bin/bash

cd /Users/gokhangokova/Developments/web/FakeSocialMessage

echo "📦 Adding changes..."
git add .

echo "💾 Committing..."
git commit -m "feat: add font family selector and battery level indicator

- Add FontFamily type with 13 fonts (SF Pro, Roboto, Inter, Comic Sans, etc.)
- Add font selector dropdown in Settings > Appearance
- Add battery level slider (0-100%) in Settings > Appearance
- Battery indicator turns red below 20%
- Add translations for font and battery settings (EN/TR)
- Propagate fontFamily and batteryLevel through component tree
- Update iOS status bar to show dynamic battery level"

echo "🚀 Pushing to remote..."
git push

echo "✅ Done!"
