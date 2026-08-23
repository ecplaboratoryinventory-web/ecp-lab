@echo off
setlocal EnableDelayedExpansion

cd /d "%~dp0mobile"

cls
echo.
echo ====================================================
echo             ECP Lab Mobile Build Pipeline           
echo ====================================================
echo.

:: Step 1: Type Checking
echo Progress: [###........] 25%%
echo [*] Step 1/4: Running TypeScript Type Checker...
call npx tsc --noEmit
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Type checking failed! Please fix the TypeScript errors above.
    pause
    exit /b 1
)
echo [OK] TypeScript check passed!
echo.
echo ----------------------------------------------------

:: Step 2: Sync native config from app.json
echo.
echo Progress: [#####......] 50%%
echo [*] Step 2/4: Syncing native project configuration...
call npx expo prebuild --clean
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Native project sync failed!
    pause
    exit /b 1
)
echo [OK] Native configuration synced!
echo.
echo ----------------------------------------------------

:: Step 3: Compiling APK
echo.
echo Progress: [#######....] 75%%
echo [*] Step 3/4: Building Android Release APK (This may take a few minutes)...
cd android
call gradlew assembleRelease
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Gradle compilation failed!
    pause
    exit /b 1
)
cd ..
echo [OK] Release APK built successfully!
echo.
echo ----------------------------------------------------

:: Step 4: Copy APK to project root for easy access
echo.
echo Progress: [#########..] 90%%
echo [*] Step 4/4: Copying APK to project root...
copy "android\app\build\outputs\apk\release\app-release.apk" "..\ecp-lab.apk" >nul
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Could not copy APK to root.
) else (
    echo [OK] APK copied to project root!
)
echo.
echo ----------------------------------------------------

:: Completion
cls
echo.
echo ====================================================
echo             ECP Lab Mobile Build Pipeline           
echo ====================================================
echo.
echo Progress: [##########] 100%%
echo.
echo [SUCCESS] Pipeline Completed Successfully!
echo.
echo The new APK is located at:
echo   mobile\android\app\build\outputs\apk\release\app-release.apk
echo   (also copied to ecp-lab.apk in project root)
echo.
echo Auto-closing in:
for /l %%i in (5,-1,1) do (
    echo %%i...
    ping -n 2 127.0.0.1 >nul
)
exit /b 0
