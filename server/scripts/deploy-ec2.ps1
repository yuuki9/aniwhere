param(
    [Parameter(Mandatory = $true, HelpMessage = "EC2 public IPv4 or public DNS name")]
    [string] $Ec2Host,

    [string] $SshUser = "ec2-user",

    [string] $PemPath = "D:\aniwhere-project\aniwhere-key.pem",

    [string] $RemoteDir = "aniwhere-server",

    [string] $EnvFilePath = "",

    [switch] $SkipEnvUpload
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath $PemPath)) {
    throw "PEM not found: $PemPath"
}

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$sshOpts = @("-i", $PemPath, "-o", "StrictHostKeyChecking=accept-new")
$sshTarget = "${SshUser}@${Ec2Host}"

$remoteBase = "/home/$SshUser/$RemoteDir"
$remoteTar = "/tmp/aniwhere-deploy.tgz"

$tarball = Join-Path $env:TEMP "aniwhere-deploy-$([Guid]::NewGuid().ToString('n')).tgz"

Push-Location $repoRoot
try {
    & tar.exe -czf $tarball `
        --exclude=.git `
        --exclude=build `
        --exclude=.gradle `
        --exclude=.idea `
        --exclude=.vscode `
        .
}
finally {
    Pop-Location
}

Write-Host "Uploading bundle..."
& scp.exe @sshOpts $tarball "${sshTarget}:$remoteTar"
if ($LASTEXITCODE -ne 0) { throw "scp (bundle) failed: exit $LASTEXITCODE" }
Remove-Item -LiteralPath $tarball -Force

$uploadEnv = $false
if (-not $SkipEnvUpload) {
    $chosen = $EnvFilePath
    if (-not $chosen) {
        $fallback = "D:\aniwhere-project\.env"
        if (Test-Path -LiteralPath $fallback) { $chosen = $fallback
        }
    }
    if ($chosen -and (Test-Path -LiteralPath $chosen)) {
        Write-Host "Uploading .env from $chosen ..."
        & scp.exe @sshOpts $chosen "${sshTarget}:/tmp/aniwhere.env"
        if ($LASTEXITCODE -ne 0) { throw "scp (.env) failed: exit $LASTEXITCODE" }
        $uploadEnv = $true
    }
}

$remoteSh = @"
set -euo pipefail
mkdir -p '$remoteBase'
cd '$remoteBase'
tar -xzf '$remoteTar'
rm -f '$remoteTar'
if [ "$uploadEnv" = "True" ]; then
  mv /tmp/aniwhere.env '$remoteBase/.env'
  chmod 600 '$remoteBase/.env' || true
fi
if [ ! -f '$remoteBase/.env' ]; then
  echo "Missing $remoteBase/.env — create it (DB_* vars) or re-run without -SkipEnvUpload and pass -EnvFilePath"
  exit 1
fi
if ! command -v docker >/dev/null 2>&1; then
  echo 'Docker is not installed. Install Docker first, then re-run this script.'
  exit 1
fi
compose() {
  if docker compose version >/dev/null 2>&1; then
    sudo docker compose "`$@"
  elif command -v docker-compose >/dev/null 2>&1; then
    sudo docker-compose "`$@"
  else
    echo 'Installing docker-compose-plugin (requires apt)...'
    sudo apt-get update -qq
    sudo apt-get install -y docker-compose-plugin
    sudo docker compose "`$@"
  fi
}
cd '$remoteBase'
compose -f docker-compose.ec2.yml down 2>/dev/null || true
compose -f docker-compose.ec2.yml up -d --build
sudo docker ps -a --filter name=aniwhere-server
"@

Write-Host "Deploying on EC2 (port 61783 -> container 8080)..."
$remoteSh | & ssh.exe @sshOpts $sshTarget "bash -s"
if ($LASTEXITCODE -ne 0) { throw "ssh (deploy) failed: exit $LASTEXITCODE" }

Write-Host "Done. Try: http://${Ec2Host}:61783/swagger-ui.html"
