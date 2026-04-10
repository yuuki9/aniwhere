param(
    [Parameter(Mandatory = $true)]
    [string] $Ec2Host,

    [string] $SshUser = "ubuntu",

    [string] $PemPath = "D:\aniwhere-project\aniwhere-key.pem",

    [string] $RemoteDir = "aniwhere-server",

    [string] $EnvFilePath = "D:\aniwhere-project\.env"
)

$ErrorActionPreference = "Stop"

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    throw "Docker CLI not found. Install Docker Desktop and ensure docker is on PATH."
}
if (-not (Test-Path -LiteralPath $PemPath)) {
    throw "PEM not found: $PemPath"
}
if (-not (Test-Path -LiteralPath $EnvFilePath)) {
    throw ".env not found: $EnvFilePath"
}

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$sshOpts = @("-i", $PemPath, "-o", "StrictHostKeyChecking=accept-new")
$sshTarget = "${SshUser}@${Ec2Host}"
$remoteBase = "/home/$SshUser/$RemoteDir"
$composeFile = "docker-compose.ec2.image.yml"

Write-Host "Building image locally (pulls base image once on this PC)..."
& docker.exe build -t aniwhere-server:latest $repoRoot
if ($LASTEXITCODE -ne 0) { throw "docker build failed: exit $LASTEXITCODE" }

$imgTar = Join-Path $env:TEMP "aniwhere-image-$([Guid]::NewGuid().ToString('n')).tar"
Write-Host "Saving image to $imgTar ..."
& docker.exe save aniwhere-server:latest -o $imgTar
if ($LASTEXITCODE -ne 0) { throw "docker save failed: exit $LASTEXITCODE" }

try {
    Write-Host "Preparing remote directory..."
    & ssh.exe @sshOpts $sshTarget "mkdir -p $remoteBase"
    if ($LASTEXITCODE -ne 0) { throw "ssh mkdir failed: exit $LASTEXITCODE" }

    Write-Host "Uploading compose + .env..."
    & scp.exe @sshOpts (Join-Path $repoRoot $composeFile) "${sshTarget}:${remoteBase}/$composeFile"
    if ($LASTEXITCODE -ne 0) { throw "scp compose failed: exit $LASTEXITCODE" }
    & scp.exe @sshOpts $EnvFilePath "${sshTarget}:${remoteBase}/.env"
    if ($LASTEXITCODE -ne 0) { throw "scp .env failed: exit $LASTEXITCODE" }

    Write-Host "Uploading image tar (large, may take several minutes)..."
    & scp.exe @sshOpts $imgTar "${sshTarget}:/tmp/aniwhere-image.tar"
    if ($LASTEXITCODE -ne 0) { throw "scp image failed: exit $LASTEXITCODE" }

$remoteSh = @"
set -euo pipefail
if ! command -v docker >/dev/null 2>&1; then
  echo 'Docker is not installed on EC2.'
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
sudo docker load -i /tmp/aniwhere-image.tar
rm -f /tmp/aniwhere-image.tar
cd '$remoteBase'
chmod 600 .env || true
compose -f $composeFile down 2>/dev/null || true
compose -f $composeFile up -d
sudo docker ps -a --filter name=aniwhere-server
"@

    Write-Host "Loading image and starting stack on EC2..."
    $remoteSh | & ssh.exe @sshOpts $sshTarget "bash -s"
    if ($LASTEXITCODE -ne 0) { throw "ssh deploy failed: exit $LASTEXITCODE" }
}
finally {
    if (Test-Path -LiteralPath $imgTar) {
        Remove-Item -LiteralPath $imgTar -Force
    }
}

Write-Host "Done. http://${Ec2Host}:61783/swagger-ui.html"
