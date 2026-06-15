<#
.SYNOPSIS
  Builds the static site into dist/ with Astro, optionally serving it locally.

.PARAMETER Serve
  After building, serve the production build at http://localhost:8080.
#>
param(
    [switch]$Serve
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

if (-not (Test-Path "node_modules")) {
    npm install
}

npm run build

if ($Serve) {
    npm run preview -- --port 8080
}
