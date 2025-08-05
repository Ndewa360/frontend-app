@echo off
echo 🔧 Configuration Java 21 pour Android
echo =====================================

REM Définir JAVA_HOME pour Java 21
set JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-21.0.8.9-hotspot
set PATH=%JAVA_HOME%\bin;%PATH%

echo ✅ JAVA_HOME configuré: %JAVA_HOME%
echo ✅ PATH mis à jour

REM Vérifier la version Java
echo.
echo 📋 Vérification de Java:
java -version

echo.
echo 🚀 Configuration terminée!
echo Vous pouvez maintenant lancer: npm run ionic-live

pause
