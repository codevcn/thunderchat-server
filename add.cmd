@echo off
:: install-package.cmd
:: Script để cài package bằng pnpm mà không cần nhớ cú pháp

if "%~1"=="" (
  echo.
  echo [Usage] add package-name
  echo.
  echo Example:
  echo     add express
  echo     add lodash
  exit /b 1
)

echo Installing package "%~1" with pnpm...
pnpm add %~1

if %errorlevel%==0 (
  echo.
  echo Package "%~1" installed successfully!
) else (
  echo.
  echo Failed to install package "%~1".
)
