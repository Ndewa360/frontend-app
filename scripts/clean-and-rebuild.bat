@echo off
echo 🧹 NETTOYAGE COMPLET ET REBUILD
echo ================================

echo 🔧 Configuration Java 21...
set JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-21.0.8.9-hotspot
set PATH=%JAVA_HOME%\bin;%PATH%

echo 📁 Nettoyage des dossiers...
if exist "android\build" rmdir /s /q "android\build"
if exist "android\app\build" rmdir /s /q "android\app\build"
if exist "android\.gradle" rmdir /s /q "android\.gradle"
if exist "dist" rmdir /s /q "dist"

echo 🅰️ Build Angular...
call npm run build

echo ⚡ Synchronisation Capacitor...
call npx cap sync android

echo 📱 Configuration vérifiée:
echo   - ionic.config.json: host=192.168.1.5, port=4200
echo   - angular.json: host=192.168.1.5, port=4200
echo   - capacitor.config.ts: url=http://192.168.1.5:4200

echo.
echo ✅ Prêt pour le test!
echo Lancez maintenant: npm run ionic-live

pause
