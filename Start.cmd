@cd /d "%~dp0"
@powershell.exe -NoProfile -STA -Command "& (Get-ChildItem -LiteralPath . -Filter *.ps1 | Select-Object -First 1).FullName"

