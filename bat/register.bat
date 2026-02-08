@echo off
title Discord Command Register

cd /d "%~dp0.."

echo ============================
echo Registering slash commands
echo ============================

node deploy.js

echo.
pause
