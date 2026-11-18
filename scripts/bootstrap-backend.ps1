# AH-POS development-only bootstrap. Never create/migrate a database automatically.
# Run from repo root: powershell -ExecutionPolicy Bypass -File .\scripts\bootstrap-backend.ps1
$ErrorActionPreference = 'Stop'
Set-Location (Resolve-Path (Join-Path $PSScriptRoot '..')).Path

if (Test-Path 'backend') {
    throw 'backend already exists; refusing to overwrite. Do not rerun this script for an existing installation.'
}
foreach ($cmd in @('php', 'composer')) {
    if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
        throw "Required executable not found: $cmd"
    }
}
$phpVersion = & php -r 'echo PHP_VERSION_ID;'
if ($LASTEXITCODE -ne 0 -or [int]$phpVersion -lt 80300) {
    throw 'Laravel 13 needs PHP 8.3 or newer.'
}
# Laravel skeleton Composer post-create scripts otherwise run SQLite migrations automatically.
& composer create-project laravel/laravel backend '^13.0' --no-interaction --no-scripts
if ($LASTEXITCODE -ne 0) { throw 'Composer create-project failed. Inspect backend/ before retrying.' }

if (-not (Test-Path 'backend/.env') -and (Test-Path 'backend/.env.example')) {
    Copy-Item 'backend/.env.example' 'backend/.env'
}
Push-Location 'backend'
try {
    & php artisan key:generate --force
    if ($LASTEXITCODE -ne 0) { throw 'Laravel APP_KEY generation failed.' }
} finally {
    Pop-Location
}
Write-Host 'Backend created without Composer setup scripts or migrations.'
Write-Host 'Configure a NEW PostgreSQL test database in backend/.env, review configuration, and explicitly run migrations only when approved.'
Write-Host 'Never point AH-POS at DBSmilePOS or DBSmilePOS_LAB.'
