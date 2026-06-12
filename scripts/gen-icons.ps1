# Generate TFP icon PNGs (green #197B55, white bold "TFP", "P" rotated 7 deg)
# Usage: powershell -ExecutionPolicy Bypass -File scripts\gen-icons.ps1
Add-Type -AssemblyName System.Drawing

function New-TfpIcon([int]$size, [string]$outPath) {
  $bmp = New-Object System.Drawing.Bitmap($size, $size)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAlias

  $green = [System.Drawing.Color]::FromArgb(255, 0x19, 0x7B, 0x55)
  $g.Clear($green)

  $scale = $size / 512.0
  $fontSize = [float](235 * $scale)
  $font = New-Object System.Drawing.Font("Arial", $fontSize, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
  $brush = [System.Drawing.Brushes]::White
  $sf = New-Object System.Drawing.StringFormat
  $sf.Alignment = [System.Drawing.StringAlignment]::Center
  $sf.LineAlignment = [System.Drawing.StringAlignment]::Center

  $cy = [float](256 * $scale)
  $g.DrawString("T", $font, $brush, [float](128 * $scale), $cy, $sf)
  $g.DrawString("F", $font, $brush, [float](264 * $scale), $cy, $sf)

  $g.TranslateTransform([float](396 * $scale), $cy)
  $g.RotateTransform(7)
  $g.DrawString("P", $font, $brush, 0, 0, $sf)
  $g.ResetTransform()

  $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose(); $bmp.Dispose()
  Write-Output "saved: $outPath ($size x $size)"
}

New-TfpIcon 512 "$PSScriptRoot\..\public\icon-512.png"
New-TfpIcon 192 "$PSScriptRoot\..\public\icon-192.png"
New-TfpIcon 180 "$PSScriptRoot\..\public\apple-touch-icon.png"
New-TfpIcon 64  "$PSScriptRoot\..\public\favicon.png"
