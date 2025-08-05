@echo off
echo 🧪 TEST DE L'APPLICATION MOBILE
echo ================================

echo 🔧 Configuration Java 21...
set JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-21.0.8.9-hotspot
set PATH=%JAVA_HOME%\bin;%PATH%

echo 📱 Test de compilation...
call npm run build
if %ERRORLEVEL% neq 0 (
    echo ❌ Erreur de compilation
    pause
    exit /b 1
)

echo ✅ Compilation réussie

echo 📱 Synchronisation Capacitor...
call npx cap sync android

echo 🚀 Lancement de l'application mobile...
call npm run ionic-live

pause
