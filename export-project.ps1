$source = (Get-Location).Path
$desktop = [Environment]::GetFolderPath("Desktop")
$destination = Join-Path $desktop "SERS_Clean.zip"

Write-Host "Preparing to compress the project from: $source"
Write-Host "Destination will be: $destination"

Add-Type -AssemblyName System.IO.Compression.FileSystem
$compressionLevel = [System.IO.Compression.CompressionLevel]::Optimal

$tempDir = Join-Path ([System.IO.Path]::GetTempPath()) "SERS_TempExport"
if (Test-Path $tempDir) { Remove-Item $tempDir -Recurse -Force }
New-Item -ItemType Directory -Path $tempDir | Out-Null

$excludes = @('node_modules', 'vendor', '.next', '.git', '_archive', 'dist', 'build', '.vscode', 'stripe.exe')
$excludeRegex = ($excludes | ForEach-Object { [regex]::Escape($_) }) -join '|'

Write-Host "Copying files to temporary directory... This might take a minute."
Get-ChildItem -Path $source -Recurse | Where-Object { 
    $relPath = $_.FullName.Substring($source.Length + 1)
    -not ($relPath -match "(^|\\)($excludeRegex)(\\|$)") 
} | ForEach-Object {
    $target = Join-Path $tempDir $_.FullName.Substring($source.Length + 1)
    if ($_.PSIsContainer) {
        if (-not (Test-Path $target)) { New-Item -ItemType Directory -Path $target | Out-Null }
    } else {
        $parent = Split-Path $target
        if (-not (Test-Path $parent)) { New-Item -ItemType Directory -Path $parent -Force | Out-Null }
        Copy-Item -Path $_.FullName -Destination $target
    }
}

Write-Host "Compressing files... Please wait."
if (Test-Path $destination) { Remove-Item $destination -Force }
[System.IO.Compression.ZipFile]::CreateFromDirectory($tempDir, $destination, $compressionLevel, $false)

Remove-Item $tempDir -Recurse -Force
Write-Host "Done! Successfully created clean zip on your Desktop."
