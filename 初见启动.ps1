$ErrorActionPreference = 'Stop'
$mutex = New-Object Threading.Mutex($false,'Local\FirstSightCodexStartup')
if (-not $mutex.WaitOne(0)) { $mutex.Dispose(); exit }
try {
    Start-Process -FilePath (Join-Path $PSScriptRoot '初见-原启动入口.lnk')
    "Started: $([DateTimeOffset]::Now.ToString('o'))" | Set-Content -LiteralPath (Join-Path $PSScriptRoot 'first-sight-last-run.log') -Encoding UTF8
    & 'C:\Program Files\nodejs\node.exe' (Join-Path $PSScriptRoot 'first-sight.mjs') 2>&1 | Out-File -LiteralPath (Join-Path $PSScriptRoot 'first-sight-last-run.log') -Append -Encoding UTF8
    if ($LASTEXITCODE -ne 0) { throw '动画接入失败，Codex 原启动入口已执行。' }
} finally {
    $mutex.ReleaseMutex()
    $mutex.Dispose()
}
