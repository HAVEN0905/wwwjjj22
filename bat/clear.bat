@echo off
title Discord Command Clear

cd /d "%~dp0.."

echo ============================
echo Clearing slash commands
echo ============================

node clearCommands.js

echo.
pause
