@echo off
title Discord Bot Online

cd /d "%~dp0.."

echo ============================
echo Starting Discord Bot...
echo ============================

node index.js

echo.
echo Bot stopped.
pause
