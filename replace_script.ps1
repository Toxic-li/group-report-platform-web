chcp 65001
$vueFile = "E:\Projects\" + [char]25253 + [char]34920 + "\ReportCenter\src\views\ReportDesigner\index.vue"
$tempFile = "E:\Projects\" + [char]25253 + [char]34920 + "\ReportCenter\temp_replacement.txt"
$outFile = "E:\Projects\" + [char]25253 + [char]34920 + "\ReportCenter\src\views\ReportDesigner\index_new.vue"

$lines = Get-Content $vueFile -Encoding UTF8 -ReadCount 0
Write-Host "Original line count: $($lines.Count)"

$replacement = Get-Content $tempFile -Encoding UTF8 -ReadCount 0
Write-Host "Replacement line count: $($replacement.Count)"

$before = $lines[0..800]
$after = $lines[3249..($lines.Count - 1)]

$result = @() + $before + $replacement + $after

# Write to new file first
$result | Out-File -FilePath $outFile -Encoding UTF8
Write-Host "New file written with $($result.Count) lines"

# Now replace original
Start-Sleep -Milliseconds 500
Copy-Item -Path $outFile -Destination $vueFile -Force
Remove-Item -Path $outFile -Force
Write-Host "Original file replaced. Done!"
