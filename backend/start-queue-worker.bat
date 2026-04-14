@echo off
REM ─────────────────────────────────────────────────────────────────────────────
REM SERS Queue Worker — وSERS لمعالجة الإيميلات والإشعارات بشكل async
REM
REM Usage: في مجلد backend، شغّل: start-queue-worker.bat
REM
REM Options:
REM   --max-jobs=1000    restart worker بعد 1000 job لمنع memory leaks
REM   --memory=256       restart worker إذا تجاوز 256MB
REM   --timeout=90       max seconds per job (إيميلات قد تأخذ وقتاً)
REM   --tries=3          retry failed jobs 3 times before marking failed
REM   --backoff=5,15,30  wait 5s, 15s, 30s between retries (exponential)
REM   --sleep=3          poll db every 3 seconds if no jobs pending
REM ─────────────────────────────────────────────────────────────────────────────

echo Starting SERS Queue Worker...
echo Press Ctrl+C to stop.
echo.

cd /d %~dp0

php artisan queue:work ^
    --queue=default,emails,notifications ^
    --max-jobs=1000 ^
    --memory=256 ^
    --timeout=90 ^
    --tries=3 ^
    --backoff=5,15,30 ^
    --sleep=3 ^
    --verbose

pause
