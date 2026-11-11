$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$localRoot = Join-Path $repoRoot '.local'
$pidPath = Join-Path $localRoot 'app-processes.json'
if (Test-Path -LiteralPath $pidPath) {
    foreach ($record in @(Get-Content -Raw -LiteralPath $pidPath | ConvertFrom-Json)) {
        $process = Get-CimInstance Win32_Process -Filter "ProcessId=$($record.id)" -ErrorAction SilentlyContinue
        if ($process -and $process.CommandLine -and $process.CommandLine.Contains($record.script)) { Stop-Process -Id $record.id }
    }
    Remove-Item -LiteralPath $pidPath
}
$mysqlExe = Join-Path $localRoot 'mysql-8.4.13-winx64/bin/mysqladmin.exe'
if ((Test-Path -LiteralPath $mysqlExe) -and (Get-NetTCPConnection -State Listen -LocalPort 3306 -ErrorAction SilentlyContinue)) {
    $previousPassword = $env:MYSQL_PWD
    try {
        $env:MYSQL_PWD = (Get-Content -Raw -LiteralPath (Join-Path $localRoot 'mysql-admin.json') | ConvertFrom-Json).password
        & $mysqlExe --host=127.0.0.1 --port=3306 --user=root shutdown
        if ($LASTEXITCODE -ne 0) { throw 'MySQL belum berhenti.' }
    } finally { $env:MYSQL_PWD = $previousPassword }
}
Write-Output 'Proses lokal proyek dihentikan.'
