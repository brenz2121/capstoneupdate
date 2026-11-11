$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$localRoot = Join-Path $repoRoot '.local'
$mysqlRoot = Join-Path $localRoot 'mysql-8.4.13-winx64'
$archive = Join-Path $localRoot 'mysql-8.4.13-winx64.zip'
New-Item -ItemType Directory -Force -Path $localRoot | Out-Null
if (-not (Test-Path -LiteralPath (Join-Path $mysqlRoot 'bin/mysqld.exe'))) {
    if (-not (Test-Path -LiteralPath $archive)) {
        & curl.exe --fail --location --retry 2 --output $archive 'https://dev.mysql.com/get/Downloads/MySQL-8.4/mysql-8.4.13-winx64.zip'
        if ($LASTEXITCODE -ne 0) { throw 'Download MySQL gagal.' }
    }
    if ((Get-FileHash -LiteralPath $archive -Algorithm MD5).Hash.ToLowerInvariant() -ne '7b94489d5524dea9b27097068bea25a8') { throw 'Checksum arsip MySQL tidak sesuai.' }
    & tar.exe -xf $archive -C $localRoot
    if ($LASTEXITCODE -ne 0) { throw 'Ekstraksi MySQL gagal.' }
}
$mysqlData = Join-Path $localRoot 'mysql-data'
$configPath = Join-Path $localRoot 'my.ini'
$mysqlForward = $mysqlRoot.Replace('\', '/')
$dataForward = $mysqlData.Replace('\', '/')
@"
[mysqld]
basedir=$mysqlForward
datadir=$dataForward
port=3306
bind-address=127.0.0.1
mysqlx=0
local-infile=0
secure-file-priv=NULL
character-set-server=utf8mb4
collation-server=utf8mb4_unicode_ci
log-error=$($localRoot.Replace('\', '/'))/mysql-error.log
"@ | Set-Content -LiteralPath $configPath -Encoding utf8
if (-not (Test-Path -LiteralPath (Join-Path $mysqlData 'mysql'))) {
    & (Join-Path $mysqlRoot 'bin/mysqld.exe') "--defaults-file=$configPath" --initialize-insecure --console
    if ($LASTEXITCODE -ne 0) { throw 'Inisialisasi MySQL gagal.' }
    $adminPassword = [Convert]::ToHexString([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32)).ToLowerInvariant()
    @{ password = $adminPassword } | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $localRoot 'mysql-admin.json')
    "ALTER USER 'root'@'localhost' IDENTIFIED BY '$adminPassword';" | Set-Content -LiteralPath (Join-Path $localRoot 'mysql-bootstrap.sql') -Encoding utf8
}
if (-not (Get-NetTCPConnection -State Listen -LocalPort 3306 -ErrorAction SilentlyContinue)) {
    $mysqlArgs = @("--defaults-file=$configPath")
    $bootstrap = Join-Path $localRoot 'mysql-bootstrap.sql'
    if (Test-Path -LiteralPath $bootstrap) { $mysqlArgs += "--init-file=$($bootstrap.Replace('\', '/'))" }
    Start-Process -FilePath (Join-Path $mysqlRoot 'bin/mysqld.exe') -ArgumentList $mysqlArgs -WindowStyle Hidden | Out-Null
}
$ready = $false
for ($attempt = 0; $attempt -lt 30; $attempt++) {
    if (Get-NetTCPConnection -State Listen -LocalPort 3306 -ErrorAction SilentlyContinue) { $ready = $true; break }
    Start-Sleep -Milliseconds 500
}
if (-not $ready) { throw 'MySQL belum siap. Periksa .local/mysql-error.log.' }
& node (Join-Path $PSScriptRoot 'setup-db.js')
if ($LASTEXITCODE -ne 0) { throw 'Setup database gagal.' }
$bootstrapPath = Join-Path $localRoot 'mysql-bootstrap.sql'
if (Test-Path -LiteralPath $bootstrapPath) { Remove-Item -LiteralPath $bootstrapPath }
Write-Output 'MySQL lokal siap di 127.0.0.1:3306.'
