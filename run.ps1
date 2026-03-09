param([string]$script)

# .env 로드
Get-Content test-scripts\performance\.env | ForEach-Object {
  if ($_ -match '^\s*[^#]') {
    $parts = $_ -split '=', 2
    if ($parts.Length -eq 2) {
      $key = $parts[0].Trim()
      $value = $parts[1].Trim().Trim("'").Trim('"')
      [Environment]::SetEnvironmentVariable($key, $value, "Process")
    }
  }
}

.\k6.exe run --out "xk6-influxdb=$env:K6_INFLUXDB_ADDR" $script