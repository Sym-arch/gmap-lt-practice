# Generate TFP icon PNGs (League Spartan bold, green #197B55 background).
# Layout rules:
#   - "TFP" group is centered both horizontally and vertically.
#   - "P" is rotated -14 deg (top leans left, bottom leans right).
#   - All three letters share the SAME bottom baseline (P bottom aligns with TF bottom).
# Method: render each glyph on its own transparent canvas, measure its opaque
# pixel bounds with LockBits, then composite with aligned bottoms + centered group.
# Usage: powershell -ExecutionPolicy Bypass -File scripts\gen-icons.ps1

Add-Type -AssemblyName System.Drawing

$ttf = Join-Path $env:TEMP "LeagueSpartan-Bold.ttf"
if (-not (Test-Path $ttf)) {
  Invoke-WebRequest -Uri "https://github.com/google/fonts/raw/main/ofl/leaguespartan/LeagueSpartan%5Bwght%5D.ttf" -OutFile $ttf -UseBasicParsing
}
$pfc = New-Object System.Drawing.Text.PrivateFontCollection
$pfc.AddFontFile($ttf)
$fam = $pfc.Families[0]

# Render a single glyph (optionally rotated) on a transparent square canvas.
# Returns a hashtable with the Bitmap and the opaque pixel bounds.
function Render-Glyph([string]$ch, [float]$fontPx, [float]$angle) {
  $W = 640
  $bmp = New-Object System.Drawing.Bitmap($W, $W, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
  $g.Clear([System.Drawing.Color]::FromArgb(0, 0, 0, 0))
  $font = New-Object System.Drawing.Font($fam, $fontPx, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
  $sf = New-Object System.Drawing.StringFormat
  $sf.Alignment = [System.Drawing.StringAlignment]::Center
  $sf.LineAlignment = [System.Drawing.StringAlignment]::Center
  $c = [float]($W / 2)
  if ($angle -ne 0) {
    $g.TranslateTransform($c, $c)
    $g.RotateTransform($angle)
    $g.DrawString($ch, $font, [System.Drawing.Brushes]::White, 0, 0, $sf)
    $g.ResetTransform()
  } else {
    $g.DrawString($ch, $font, [System.Drawing.Brushes]::White, $c, $c, $sf)
  }
  $g.Dispose()

  # Measure opaque bounds via LockBits (alpha channel).
  $rect = New-Object System.Drawing.Rectangle(0, 0, $W, $W)
  $data = $bmp.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::ReadOnly, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $bytes = New-Object byte[] ($data.Stride * $W)
  [System.Runtime.InteropServices.Marshal]::Copy($data.Scan0, $bytes, 0, $bytes.Length)
  $bmp.UnlockBits($data)
  $minX = $W; $minY = $W; $maxX = -1; $maxY = -1
  for ($y = 0; $y -lt $W; $y++) {
    $row = $y * $data.Stride
    for ($x = 0; $x -lt $W; $x++) {
      $a = $bytes[$row + $x * 4 + 3]
      if ($a -gt 40) {
        if ($x -lt $minX) { $minX = $x }
        if ($x -gt $maxX) { $maxX = $x }
        if ($y -lt $minY) { $minY = $y }
        if ($y -gt $maxY) { $maxY = $y }
      }
    }
  }
  return @{ Bmp = $bmp; MinX = $minX; MinY = $minY; MaxX = $maxX; MaxY = $maxY }
}

# Pre-render the three glyphs once at a reference size; reuse (scaled) per icon size.
$REF = 300.0
$gT = Render-Glyph "T" $REF 0
$gF = Render-Glyph "F" $REF 0
$gP = Render-Glyph "P" $REF -14

function New-TfpIcon([int]$size, [string]$outPath) {
  $scale = $size / 512.0
  $gap = 18.0 * $scale  # spacing between letters

  $bmp = New-Object System.Drawing.Bitmap($size, $size)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.Clear([System.Drawing.Color]::FromArgb(255, 0x19, 0x7B, 0x55))

  $s = ($size / 512.0) * (235.0 / $REF)  # final glyph scale vs reference render

  $letters = @($gT, $gF, $gP)
  $w = @(); $h = @()
  foreach ($gl in $letters) {
    $w += (($gl.MaxX - $gl.MinX + 1) * $s)
    $h += (($gl.MaxY - $gl.MinY + 1) * $s)
  }
  $totalW = $w[0] + $w[1] + $w[2] + 2 * $gap
  $maxH = [Math]::Max([Math]::Max($h[0], $h[1]), $h[2])

  $startX = ($size - $totalW) / 2.0
  $baseline = ($size + $maxH) / 2.0  # common bottom; group vertically centered

  $curX = $startX
  for ($i = 0; $i -lt 3; $i++) {
    $gl = $letters[$i]
    $srcW = $gl.MaxX - $gl.MinX + 1
    $srcH = $gl.MaxY - $gl.MinY + 1
    $destX = $curX
    $destY = $baseline - $h[$i]   # align bottoms to the common baseline
    $srcRect = New-Object System.Drawing.Rectangle($gl.MinX, $gl.MinY, $srcW, $srcH)
    $destRect = New-Object System.Drawing.RectangleF($destX, $destY, $w[$i], $h[$i])
    $g.DrawImage($gl.Bmp, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
    $curX += $w[$i] + $gap
  }

  $g.Dispose()
  $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
  Write-Output "saved: $outPath ($size x $size)"
}

$base = Join-Path $PSScriptRoot "..\public"
New-TfpIcon 512 (Join-Path $base "icon-512.png")
New-TfpIcon 192 (Join-Path $base "icon-192.png")
New-TfpIcon 180 (Join-Path $base "apple-touch-icon.png")
New-TfpIcon 64  (Join-Path $base "favicon.png")

$gT.Bmp.Dispose(); $gF.Bmp.Dispose(); $gP.Bmp.Dispose()
