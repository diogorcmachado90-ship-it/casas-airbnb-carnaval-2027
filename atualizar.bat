@echo off
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0atualizar.ps1"
if errorlevel 1 (
    echo.
    echo A atualizacao falhou. Confira a mensagem acima e tente novamente.
)
echo.
pause
