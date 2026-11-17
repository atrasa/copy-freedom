$ErrorActionPreference = 'Stop'
try {
 $files = @('index.html','style.css','panel.js','clipboard-image.ps1','CSXS','host')
 foreach ($file in $files) { if (-not (Test-Path -LiteralPath (Join-Path $PSScriptRoot $file))) { throw 'Extract the entire ZIP before running this installer.' } }
 $extensions = Join-Path $env:APPDATA 'Adobe\CEP\extensions'
 $target = Join-Path $extensions 'com.finex.copyfreedom'
 $backup = Join-Path $extensions ('_backup\CopyFreedom-' + [DateTime]::Now.ToString('yyyyMMdd-HHmmss-ffff'))
 New-Item -ItemType Directory -Path $backup -Force | Out-Null
 if (Test-Path -LiteralPath $target) { Copy-Item -LiteralPath $target -Destination (Join-Path $backup 'com.finex.copyfreedom') -Recurse }
 foreach ($version in @(11,12)) {
  $key = "HKCU:\Software\Adobe\CSXS.$version"
  $old = if (Test-Path -LiteralPath $key) { Get-ItemProperty -LiteralPath $key -Name PlayerDebugMode -ErrorAction SilentlyContinue } else { $null }
  @{key=$key; existed=($null -ne $old); value=if($old){$old.PlayerDebugMode}else{$null}} | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $backup "CSXS.$version.json")
  New-Item -Path $key -Force | Out-Null
  New-ItemProperty -LiteralPath $key -Name PlayerDebugMode -Value '1' -PropertyType String -Force | Out-Null
 }
 New-Item -ItemType Directory -Path $target -Force | Out-Null
 foreach ($file in $files) { Copy-Item -LiteralPath (Join-Path $PSScriptRoot $file) -Destination $target -Recurse -Force }
 Get-ChildItem -LiteralPath $target -Recurse -File | Unblock-File
 Write-Host 'Copy Freedom installed. Restart Photoshop when convenient, then open Window > Extensions (Legacy) > Copy Freedom.' -ForegroundColor Green
 Write-Host "Backup: $backup"
} catch { Write-Error $_; exit 1 }
