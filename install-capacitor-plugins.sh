#!/bin/bash

echo "🔧 Installation des plugins Capacitor essentiels pour Android/iOS..."

# Plugins de base
npm install @capacitor/splash-screen
npm install @capacitor/push-notifications
npm install @capacitor/local-notifications
npm install @capacitor/network
npm install @capacitor/storage
npm install @capacitor/filesystem
npm install @capacitor/geolocation
npm install @capacitor/camera
npm install @capacitor/share
npm install @capacitor/browser
npm install @capacitor/toast

# Plugin Ionic Storage pour le stockage sécurisé
npm install @ionic/storage-angular

echo "✅ Tous les plugins Capacitor ont été installés !"
echo ""
echo "📱 Prochaines étapes :"
echo "1. npx cap sync"
echo "2. npx cap open android"
echo "3. npx cap open ios"
