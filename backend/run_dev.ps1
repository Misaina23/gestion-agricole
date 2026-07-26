# Run development server setup (Windows PowerShell)
# Usage: Open PowerShell, cd to backend, then: ./run_dev.ps1

param(
  [switch]$RecreateVenv
)

$venvPath = "$PSScriptRoot\\.venv"

if ($RecreateVenv -or -not (Test-Path $venvPath)) {
  Write-Host "Creating virtual environment at $venvPath..."
  python -m venv $venvPath
}

Write-Host "Activating virtual environment..."
. "$venvPath\Scripts\Activate.ps1"

Write-Host "Upgrading pip..."
python -m pip install --upgrade pip

Write-Host "Installing requirements..."
python -m pip install -r "$PSScriptRoot\\requirements.txt"

Write-Host "Ensure environment variables are set. You can create a .env file from .env.example"
if (Test-Path "$PSScriptRoot\\.env") {
  Write-Host "Loading .env into process environment (PowerShell does not load .env automatically)"
  Get-Content "$PSScriptRoot\\.env" | ForEach-Object {
    if ($_ -match "^\s*#") { return }
    if ($_ -match "^\s*$") { return }
    $parts = $_ -split '='
    if ($parts.Length -ge 2) {
      $name = $parts[0].Trim()
      $value = ($parts[1..($parts.Length-1)] -join '=').Trim()
      [Environment]::SetEnvironmentVariable($name, $value, "Process")
    }
  }
} else {
  Write-Host ".env not found. Copy .env.example to .env and set LLM_API_KEY if you plan to use AI features."
}

Write-Host "Running migrations..."
python manage.py migrate

Write-Host "Starting development server on 0.0.0.0:8000"
python manage.py runserver 0.0.0.0:8000
