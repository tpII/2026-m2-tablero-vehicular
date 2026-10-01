param(
    [string]$Profile = "Barcala 5.8G",
    [string]$Example = "firmware\TableroVehicular\config.example.h",
    [string]$Target  = "firmware\TableroVehicular\config.h"
)

$raw = (netsh wlan show profile name="$Profile" key=clear 2>&1 | Out-String)

# La etiqueta cambia segun el idioma de Windows: "Contenido de la clave" (es),
# "Key Content" (en). Solo el perfil de la interfaz conectada la muestra.
$m = [regex]::Match($raw, '(?im)^\s*(?:contenido\s+de\s+la\s+clave|clave\s+de\s+red|key\s+content)\s*:\s*(.+?)\s*$')
if (-not $m.Success) { throw "No se encontro la clave en el perfil '$Profile'." }

$password = $m.Groups[1].Value
if ($password -match '^\s*$') { throw "La clave del perfil '$Profile' esta vacia." }

# Escapa para literal de cadena C
$escaped = $password.Replace('\', '\\').Replace('"', '\"')
if ($escaped -ne $password) { Write-Host "AVISO: la clave contenia caracteres escapados." }

$content = Get-Content -Raw -LiteralPath $Example
$content = $content.Replace('"TU_SSID"', "`"$Profile`"")
$content = $content.Replace('"TU_CLAVE"', "`"$escaped`"")

if ($content -match 'TU_SSID|TU_CLAVE') { throw "Quedaron marcadores sin reemplazar." }

Set-Content -LiteralPath $Target -Value $content -Encoding UTF8 -NoNewline

$masked = if ($escaped.Length -le 2) { '*' * $escaped.Length } else { $escaped.Substring(0, 1) + ('*' * ($escaped.Length - 2)) + $escaped.Substring($escaped.Length - 1, 1) }

Write-Host "OK  $Target"
Write-Host "    SSID  : $Profile"
Write-Host "    Clave : $masked  ($($escaped.Length) caracteres)"
Write-Host "    Broker: $([regex]::Match($content, 'MQTT_HOST\s+\"([^\"]+)\"').Groups[1].Value)"
