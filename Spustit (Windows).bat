@echo off
cd /d "%~dp0"
where py >nul 2>nul && (py server.py & goto :eof)
where python >nul 2>nul && (python server.py & goto :eof)
echo Python neni nainstalovany. Stahni ho z https://www.python.org/downloads/ (pri instalaci zaskrtni "Add python.exe to PATH").
pause
