param([Parameter(Mandatory=$true)][string]$ImagePath)
$ErrorActionPreference = 'Stop'
$receipt = $ImagePath + '.json'
$image = $null
$stream = $null
try {
    if ([IO.Path]::GetFileName($ImagePath) -notmatch '^CopyFreedom-clipboard-[\d-]+\.png$') { throw 'Invalid clipboard scratch file.' }
    Add-Type -AssemblyName System.Windows.Forms
    Add-Type -AssemblyName System.Drawing
    $bytes = [IO.File]::ReadAllBytes($ImagePath)
    $stream = New-Object IO.MemoryStream(,$bytes)
    $image = [Drawing.Image]::FromStream($stream)
    $data = New-Object Windows.Forms.DataObject
    # PNG preserves alpha; Bitmap supports browser clipboard implementations using DIB.
    $data.SetData('PNG', $false, $stream)
    $data.SetData([Windows.Forms.DataFormats]::Bitmap, $true, $image)
    [Windows.Forms.Clipboard]::SetDataObject($data, $true, 10, 100)
    if (-not [Windows.Forms.Clipboard]::ContainsImage()) { throw 'Windows did not accept the clipboard image.' }
    $result = @{ok=$true} | ConvertTo-Json -Compress
} catch {
    $result = @{ok=$false;error=$_.Exception.Message} | ConvertTo-Json -Compress
} finally {
    if ($image) { $image.Dispose() }
    if ($stream) { $stream.Dispose() }
}
[IO.File]::WriteAllText($receipt, $result)
# Only remove the uniquely named PNG generated for this copy operation.
if ([IO.Path]::GetFileName($ImagePath) -match '^CopyFreedom-clipboard-[\d-]+\.png$') { Remove-Item -LiteralPath $ImagePath -ErrorAction SilentlyContinue }
