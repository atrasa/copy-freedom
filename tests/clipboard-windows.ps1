Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
$originalClipboard = [Windows.Forms.Clipboard]::GetDataObject()
$testPath = Join-Path $env:TEMP ('CopyFreedom-clipboard-' + [DateTimeOffset]::Now.ToUnixTimeMilliseconds() + '-123.png')
try {
    $bmp = New-Object Drawing.Bitmap 8,6
    $bmp.SetPixel(2,3,[Drawing.Color]::FromArgb(255,10,130,220))
    $bmp.Save($testPath,[Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    & "$env:SystemRoot\System32\WindowsPowerShell\v1.0\powershell.exe" -NoProfile -NonInteractive -STA -ExecutionPolicy RemoteSigned -File clipboard-image.ps1 -ImagePath $testPath
    $report = Get-Content -LiteralPath ($testPath+'.json') -Raw | ConvertFrom-Json
    if (-not $report.ok) { throw $report.error }
    $check = [Windows.Forms.Clipboard]::GetDataObject()
    if (-not $check.GetDataPresent('PNG')) { throw 'PNG clipboard format missing' }
    $png = $check.GetData('PNG')
    $raw = $png.ToArray()
    if ($raw[0] -ne 137 -or $raw[1] -ne 80) { throw 'Invalid PNG clipboard bytes' }
    $imageCheck = [Windows.Forms.Clipboard]::GetImage()
    if ($imageCheck.Width -ne 8 -or $imageCheck.Height -ne 6) { throw 'Clipboard dimensions changed' }
    $imageCheck.Dispose()
    if (Test-Path -LiteralPath $testPath) { throw 'Temporary PNG was not removed' }
    Write-Output 'PASS: persistent Windows PNG + Bitmap clipboard, exact 8x6 dimensions, PNG signature and scratch cleanup'
} finally {
    if ($originalClipboard) { [Windows.Forms.Clipboard]::SetDataObject($originalClipboard,$true) }
}
