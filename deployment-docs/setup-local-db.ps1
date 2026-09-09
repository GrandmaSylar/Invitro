# SQL Server Express Silent LAN Auto-Installer for Invitro LIMS
# Run this script as Administrator on the designated host computer.

$ErrorActionPreference = "Stop"

# 1. Download Details
$installerUrl = "https://go.microsoft.com/fwlink/?linkid=2215158" # SQL Server 2022 Express Web Installer
$installerPath = "$env:TEMP\SQL2022-SSEI-Expr.exe"
$downloadDir = "C:\SQL2022InvitroInstall"

# Check Admin privileges
$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Error "This script must be run as an Administrator. Please relaunch PowerShell as Admin."
}

Write-Host "--------------------------------------------------------" -ForegroundColor Green
Write-Host "   INVITRO LIMS - LOCAL SQL SERVER AUTO-INSTALLER" -ForegroundColor Green
Write-Host "--------------------------------------------------------" -ForegroundColor Green

# 2. Download SQL Server Express Installer
Write-Host "1. Downloading SQL Server Express Setup..." -ForegroundColor Cyan
Invoke-WebRequest -Uri $installerUrl -OutFile $installerPath
Write-Host "Download Complete." -ForegroundColor Green

# Create temporary directory for media download
if (-not (Test-Path $downloadDir)) {
    New-Item -Path $downloadDir -ItemType Directory | Out-Null
}

# 3. Silent Extract and Install SQL Server Express
Write-Host "2. Running Silent SQL Server Installation (SA Pass: InvitroLims@2026!). Please wait..." -ForegroundColor Cyan
$installArgs = @(
    "/Action=Install",
    "/SelectFeatures=SQL",
    "/InstanceName=MSSQLSERVER",
    "/SQLSVCSTARTUPTYPE=Automatic",
    "/SQLSYSADMINACCOUNTS=BUILTIN\Administrators",
    "/SECURITYMODE=SQL",
    "/SAPWD=InvitroLims@2026!",
    "/TCPENABLED=1",
    "/NPENABLED=0",
    "/IACCEPTSQLSERVERLICENSETERMS",
    "/QuietSimple"
)

# Start installer and wait for exit
$process = Start-Process -FilePath $installerPath -ArgumentList "/ConfigurationFile=", "/MEDIAPATH=$downloadDir", "/QUIET", "/IAcceptSQLServerLicenseTerms", "/Action=Download", "/ShowProgress=False" -PassThru -Wait
$installProcess = Start-Process -FilePath "$installerPath" -ArgumentList $installArgs -PassThru -Wait

Write-Host "SQL Server Express Installed." -ForegroundColor Green

# 4. Enable TCP/IP Protocols via Registry
Write-Host "3. Enabling TCP/IP Networking for Remote Workstation Access..." -ForegroundColor Cyan
$registryPath = "HKLM:\SOFTWARE\Microsoft\Microsoft SQL Server\MSSQL16.MSSQLSERVER\MSSQLServer\SuperSocketNetLib\Tcp"
if (Test-Path $registryPath) {
    Set-ItemProperty -Path $registryPath -Name "Enabled" -Value 1
    
    # Enable Port 1433 on IPAll
    $ipAllPath = "$registryPath\IPAll"
    if (Test-Path $ipAllPath) {
        Set-ItemProperty -Path $ipAllPath -Name "TcpPort" -Value "1433"
        Set-ItemProperty -Path $ipAllPath -Name "TcpDynamicPorts" -Value ""
    }
}
Write-Host "TCP/IP configured to Port 1433." -ForegroundColor Green

# 5. Open Inbound Port 1433 on Windows Firewall
Write-Host "4. Configuring Windows Defender Firewall for Port 1433 Inbound Access..." -ForegroundColor Cyan
$ruleName = "SQL Server Port 1433 (Invitro LIMS)"
$firewallRule = Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue

if ($null -eq $firewallRule) {
    New-NetFirewallRule -DisplayName $ruleName -Direction Inbound -Action Allow -Protocol TCP -LocalPort 1433 -Profile Any -Description "Allow inbound SQL Server traffic for Invitro LIMS laboratory workstations." | Out-Null
    Write-Host "Firewall rule created successfully." -ForegroundColor Green
} else {
    Write-Host "Firewall rule already exists." -ForegroundColor Yellow
}

# 6. Automate Static IP Assignment on Active Adapter
Write-Host "5. Converting current active network connection to Static IP..." -ForegroundColor Cyan
try {
    $activeNet = Get-NetRoute -DestinationPrefix "0.0.0.0/0" | Select-Object -First 1
    if ($activeNet) {
        $ifIndex = $activeNet.InterfaceIndex
        $currentIpObj = Get-NetIPAddress -InterfaceIndex $ifIndex -AddressFamily IPv4 | Select-Object -First 1
        $gatewayObj = Get-NetIPConfiguration -InterfaceIndex $ifIndex | Select-Object -ExpandProperty IPv4DefaultGateway

        if ($currentIpObj -and $gatewayObj) {
            $ipAddress = $currentIpObj.IPv4Address
            $prefixLength = $currentIpObj.PrefixLength
            $gateway = $gatewayObj.NextHop

            $adapter = Get-NetIPInterface -InterfaceIndex $ifIndex -AddressFamily IPv4
            if ($adapter.Dhcp -eq "Enabled") {
                Remove-NetIPAddress -InterfaceIndex $ifIndex -AddressFamily IPv4 -Confirm:$false -ErrorAction SilentlyContinue
                Remove-NetRoute -InterfaceIndex $ifIndex -DestinationPrefix "0.0.0.0/0" -Confirm:$false -ErrorAction SilentlyContinue

                New-NetIPAddress -InterfaceIndex $ifIndex -IPAddress $ipAddress -PrefixLength $prefixLength -DefaultGateway $gateway | Out-Null
                Set-DnsClientServerAddress -InterfaceIndex $ifIndex -ServerAddresses ("8.8.8.8", "1.1.1.1") | Out-Null

                Write-Host "Successfully locked Static IP to: $ipAddress (Gateway: $gateway)" -ForegroundColor Green
            } else {
                Write-Host "Network adapter is already using a Static IP: $ipAddress" -ForegroundColor Yellow
            }
        }
    }
} catch {
    Write-Host "Warning: Could not automatically set Static IP. You may set it manually in Windows Network Settings." -ForegroundColor Yellow
}

# 7. Restart SQL Service to Apply Configurations
Write-Host "6. Restarting SQL Server Service to apply network changes..." -ForegroundColor Cyan
Restart-Service -Name "MSSQLSERVER" -Force
Write-Host "SQL Service restarted successfully." -ForegroundColor Green

# Cleanup
Remove-Item -Path $installerPath -Force -ErrorAction SilentlyContinue
Remove-Item -Path $downloadDir -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "`n========================================================" -ForegroundColor Green
Write-Host " INVITRO LIMS DATABASE SERVER READY!" -ForegroundColor Green
Write-Host " Database Host: localhost (or IP above)" -ForegroundColor Green
Write-Host " Database Name: invitro" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green
