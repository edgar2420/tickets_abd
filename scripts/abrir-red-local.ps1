<#
    Abre el sistema a la red local.

    Ejecutar en PowerShell COMO ADMINISTRADOR:
        powershell -ExecutionPolicy Bypass -File scripts\abrir-red-local.ps1

    Para cerrarlo despues de la prueba:
        powershell -ExecutionPolicy Bypass -File scripts\abrir-red-local.ps1 -Cerrar
#>

param([switch]$Cerrar)

$ErrorActionPreference = 'Stop'

$esAdministrador = ([Security.Principal.WindowsPrincipal] `
    [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
    [Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $esAdministrador) {
    Write-Host 'Este script necesita privilegios de administrador.' -ForegroundColor Red
    Write-Host 'Abra PowerShell con el boton derecho, "Ejecutar como administrador", y vuelva a correrlo.'
    exit 1
}

$REGLAS = @(
    @{ Nombre = 'Sistema de Tickets - Aplicacion web'; Puerto = 5173 },
    @{ Nombre = 'Sistema de Tickets - API';            Puerto = 4000 }
)

if ($Cerrar) {
    foreach ($regla in $REGLAS) {
        if (Get-NetFirewallRule -DisplayName $regla.Nombre -ErrorAction SilentlyContinue) {
            Remove-NetFirewallRule -DisplayName $regla.Nombre
            Write-Host "  Retirada: $($regla.Nombre)" -ForegroundColor Yellow
        }
    }
    Write-Host ''
    Write-Host 'El sistema deja de ser accesible desde la red local.' -ForegroundColor Green
    exit 0
}

$perfiles = Get-NetConnectionProfile | Where-Object { $_.NetworkCategory -eq 'Public' }
if ($perfiles) {
    Write-Host 'Estas redes estan marcadas como publicas, el perfil mas restrictivo:' -ForegroundColor Yellow
    $perfiles | ForEach-Object { Write-Host "  $($_.InterfaceAlias)" }
    Write-Host 'Si la red es de confianza, conviene pasarla a privada:' -ForegroundColor Yellow
    $perfiles | ForEach-Object {
        Write-Host "  Set-NetConnectionProfile -InterfaceAlias '$($_.InterfaceAlias)' -NetworkCategory Private"
    }
    Write-Host ''
}

foreach ($regla in $REGLAS) {
    if (Get-NetFirewallRule -DisplayName $regla.Nombre -ErrorAction SilentlyContinue) {
        Remove-NetFirewallRule -DisplayName $regla.Nombre
    }
    New-NetFirewallRule `
        -DisplayName $regla.Nombre `
        -Direction Inbound `
        -Action Allow `
        -Protocol TCP `
        -LocalPort $regla.Puerto `
        -Profile Domain,Private,Public `
        -Description 'Prueba del sistema de tickets desde otra maquina de la red local' | Out-Null
    Write-Host "  Habilitado el puerto $($regla.Puerto): $($regla.Nombre)" -ForegroundColor Green
}

$direcciones = Get-NetIPAddress -AddressFamily IPv4 |
    Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' } |
    Select-Object -ExpandProperty IPAddress

Write-Host ''
Write-Host 'Comparta cualquiera de estas direcciones con quien va a probar:' -ForegroundColor Cyan
foreach ($direccion in $direcciones) {
    Write-Host "    http://$direccion`:5173"
}

Write-Host ''
Write-Host 'Recuerde que la conexion es sin cifrar: sirve para una prueba interna,' -ForegroundColor Yellow
Write-Host 'no para dejar el sistema publicado de forma permanente.' -ForegroundColor Yellow
Write-Host ''
Write-Host 'Al terminar, cierre los puertos con:' -ForegroundColor Cyan
Write-Host '    powershell -ExecutionPolicy Bypass -File scripts\abrir-red-local.ps1 -Cerrar'
