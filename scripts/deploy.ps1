# GenieFlowAI Deployment Script
# This script automates the process of deploying the GenieFlowAI application to production.

# ANSI color codes for console output
$colors = @{
    Reset = "`e[0m"
    Green = "`e[32m"
    Yellow = "`e[33m"
    Blue = "`e[34m"
    Red = "`e[31m"
    Bold = "`e[1m"
}

# Function to execute a command and print the output
function Execute-Command {
    param (
        [string]$Command,
        [string]$ErrorMessage
    )
    try {
        Write-Host "$($colors.Blue)> $Command$($colors.Reset)"
        Invoke-Expression $Command
        return $true
    }
    catch {
        Write-Host "$($colors.Red)$ErrorMessage$($colors.Reset)"
        Write-Host $_.Exception.Message
        return $false
    }
}

# Main deployment function
function Deploy {
    Write-Host "`n$($colors.Bold)$($colors.Green)========== GenieFlowAI Deployment ===========$($colors.Reset)`n"
    
    # 1. Check if we're in the right directory
    if (-not (Test-Path "package.json")) {
        Write-Host "$($colors.Red)Error: package.json not found. Make sure you're in the project root directory.$($colors.Reset)"
        exit 1
    }
    
    # 2. Check environment
    Write-Host "$($colors.Bold)[1/7] Checking environment...$($colors.Reset)"
    if (-not (Test-Path ".env.production")) {
        Write-Host "$($colors.Red)Error: .env.production file not found.$($colors.Reset)"
        exit 1
    }
    
    # 3. Install dependencies
    Write-Host "`n$($colors.Bold)[2/7] Installing dependencies...$($colors.Reset)"
    if (-not (Execute-Command "npm install --production=false" "Failed to install dependencies")) {
        exit 1
    }
    
    # 4. Run linting
    Write-Host "`n$($colors.Bold)[3/7] Running linter...$($colors.Reset)"
    Execute-Command "npm run lint --if-present" "Linting found issues (continuing anyway)"
    
    # 5. Run tests
    Write-Host "`n$($colors.Bold)[4/7] Running tests...$($colors.Reset)"
    Execute-Command "npm test -- --watchAll=false" "Tests failed (continuing anyway)"
    
    # 6. Build the application
    Write-Host "`n$($colors.Bold)[5/7] Building application...$($colors.Reset)"
    if (-not (Execute-Command "npm run build" "Failed to build the application")) {
        exit 1
    }
    
    # 7. Check build output
    Write-Host "`n$($colors.Bold)[6/7] Verifying build output...$($colors.Reset)"
    if (-not (Test-Path "build")) {
        Write-Host "$($colors.Red)Error: Build directory not found after build process.$($colors.Reset)"
        exit 1
    }
    
    # 8. Deployment instructions
    Write-Host "`n$($colors.Bold)[7/7] Deployment instructions:$($colors.Reset)"
    Write-Host "$($colors.Green)The application has been successfully built.$($colors.Reset)"
    Write-Host "$($colors.Yellow)To deploy to your web server:$($colors.Reset)"
    Write-Host "1. Upload the contents of the $($colors.Bold)build/$($colors.Reset) directory to your web server"
    Write-Host "2. Configure your web server to serve the application"
    Write-Host "3. Set up proper HTTPS and domain configuration"
    Write-Host "4. Ensure API endpoints at $($colors.Bold)https://api.genieflowai.com$($colors.Reset) are accessible`n"
    
    Write-Host "$($colors.Bold)$($colors.Green)=== Deployment preparation completed successfully ===$($colors.Reset)`n"
}

# Execute the deployment
try {
    Deploy
}
catch {
    Write-Host "$($colors.Red)Deployment failed:$($colors.Reset) $($_.Exception.Message)"
    exit 1
} 