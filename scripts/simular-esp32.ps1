param(
    [string]$Host_      = "10.0.22.205",
    [int]$Port          = 1883,
    [string]$Topic      = "vehiculo/m2/telemetria",
    [int]$Segundos      = 0,
    [int]$MaxRpm        = 8000
)

$pub = "C:\Program Files\mosquitto\mosquitto_pub.exe"
if (-not (Test-Path $pub)) { throw "No se encontro mosquitto_pub.exe" }

# Los numeros van al JSON con punto decimal pase lo que pase la cultura del SO
$inv = [Globalization.CultureInfo]::InvariantCulture

function Limita($v, $min, $max) {
    if ($v -lt $min) { return $min }
    if ($v -gt $max) { return $max }
    return $v
}

function Acerca($actual, $objetivo, $factor) {
    return $actual + ($objetivo - $actual) * $factor
}

function CalculaRpm($kmh, $maxRpm) {
    $velMax = 140.0
    $marches = 6
    $ralenti = 800.0
    $posicion = (Limita ($kmh / $velMax) 0.0 1.0) / (1.0 / $marches)
    $marcha = [Math]::Min([Math]::Max([int][Math]::Floor($posicion), 0), $marches - 1)
    $dentro = ($posicion - $marcha) * 0.88
    return [Math]::Round($ralenti + $dentro * ($maxRpm - $ralenti))
}

Write-Host "Simulando ESP32 -> $Host_`:$Port  topic=$Topic" -ForegroundColor Cyan
Write-Host "Ctrl+C para detener." -ForegroundColor DarkGray
Write-Host ""

$velocidad = 0.0
$objetivo = 0.0
$potenciometro = 0.0
$bateria = 12.6
$proximoCambio = 0
$fin = if ($Segundos -gt 0) { (Get-Date).AddSeconds($Segundos) } else { [DateTime]::MaxValue }
$iteracion = 0

while ((Get-Date) -lt $fin) {
    $iteracion++

    if ($iteracion -ge $proximoCambio) {
        $proximoCambio = $iteracion + 4 + (Get-Random -Maximum 6)
        $objetivo = Get-Random -Maximum 131
    }

    $velocidad = Acerca $velocidad $objetivo 0.06
    $demanda = Limita (($objetivo - $velocidad) * 7.0) 0.0 100.0
    if ($objetivo -lt $velocidad) { $demanda = 0 }
    $potenciometro = Acerca $potenciometro $demanda 0.12

    $rpm = CalculaRpm $velocidad $maxRpm
    if ($rpm -gt 3000) { $bateria = Limita ($bateria + 0.004) 11.8 14.4 }
    else { $bateria = Limita ($bateria - 0.00008) 11.8 14.4 }

    $payload = '{{"velocidad":{0},"rpm":{1},"maxRpm":{2},"potenciometro":{3},"bateria":{4}}}' -f `
        $velocidad.ToString("F1", $inv), $rpm.ToString("F0", $inv),
        $maxRpm.ToString("F0", $inv), $potenciometro.ToString("F0", $inv),
        $bateria.ToString("F2", $inv)

    & $pub -h $Host_ -p $Port -t $Topic -q 1 -r -m $payload | Out-Null

    Write-Host ("{0,5}s  vel {1,6:F1} km/h  rpm {2,5}  pot {3,3:F0}%  bat {4:F2} V" -f `
        $iteracion, $velocidad, $rpm, $potenciometro, $bateria) -ForegroundColor DarkGray

    Start-Sleep -Seconds 1
}
