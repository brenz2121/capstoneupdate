$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$localRoot = Join-Path $repoRoot '.local'
function Wait-LocalPort([int]$port) {
    for ($attempt = 0; $attempt -lt 60; $attempt++) {
        $client = [System.Net.Sockets.TcpClient]::new()
        try {
            $connection = $client.ConnectAsync('127.0.0.1', $port)
            if ($connection.Wait(250) -and $client.Connected) { return }
        } catch {} finally { $client.Dispose() }
        Start-Sleep -Milliseconds 250
    }
    throw "Port $port belum siap. Periksa log di .local."
}
if (-not (Test-Path -LiteralPath (Join-Path $localRoot 'my.ini'))) { throw 'Jalankan scripts/install-mysql.ps1 terlebih dahulu.' }
if (-not (Get-NetTCPConnection -State Listen -LocalPort 3306 -ErrorAction SilentlyContinue)) {
    $mysqlExe = Join-Path $localRoot 'mysql-8.4.13-winx64/bin/mysqld.exe'
    Start-Process -FilePath $mysqlExe -ArgumentList "--defaults-file=`"$localRoot/my.ini`"" -WindowStyle Hidden | Out-Null
}
Wait-LocalPort 3306
$nodeExe = (Get-Command node).Source
$processes = @()
foreach ($service in @(
    @{ name = 'api'; port = 5000; script = (Join-Path $repoRoot 'server.js'); cwd = $repoRoot },
    @{ name = 'web'; port = 5173; script = (Join-Path $repoRoot 'client/node_modules/vite/bin/vite.js'); cwd = (Join-Path $repoRoot 'client') }
)) {
    if (Get-NetTCPConnection -State Listen -LocalPort $service.port -ErrorAction SilentlyContinue) {
        Write-Output "Port $($service.port) sudah digunakan; proses yang ada dibiarkan berjalan."
        continue
    }
    $process = Start-Process -FilePath $nodeExe -ArgumentList "`"$($service.script)`"" -WorkingDirectory $service.cwd -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $localRoot "$($service.name).log") -RedirectStandardError (Join-Path $localRoot "$($service.name)-error.log")
    $processes += @{ id = $process.Id; script = $service.script }
}
$pidPath = Join-Path $localRoot 'app-processes.json'
if (Test-Path -LiteralPath $pidPath) {
    $processes += @(Get-Content -Raw -LiteralPath $pidPath | ConvertFrom-Json | Where-Object { Get-Process -Id $_.id -ErrorAction SilentlyContinue })
}
ConvertTo-Json -InputObject @($processes) | Set-Content -LiteralPath $pidPath
Wait-LocalPort 5000
Wait-LocalPort 5173
Write-Output 'Web: http://127.0.0.1:5173/ | API: http://127.0.0.1:5000/'
