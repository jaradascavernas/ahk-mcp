#!/usr/bin/env pwsh
# PowerShell script to push all changes to GitHub

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Git Push Script for AutoHotkey MCP Server" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in a git repository
if (-not (Test-Path .git)) {
    Write-Host "Error: Not in a git repository!" -ForegroundColor Red
    exit 1
}

# Show current branch
$branch = git branch --show-current
Write-Host "Current branch: $branch" -ForegroundColor Yellow
Write-Host ""

# Show current status
Write-Host "Git Status:" -ForegroundColor Yellow
git status --short

# Check for unpushed commits
$unpushed = git log origin/$branch..HEAD --oneline 2>$null
if ($unpushed) {
    Write-Host ""
    Write-Host "Unpushed commits:" -ForegroundColor Yellow
    Write-Output $unpushed
}

Write-Host ""
Write-Host "Pushing to origin/$branch..." -ForegroundColor Green

# Push to remote
git push origin $branch

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Successfully pushed to GitHub!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Repository URL: https://github.com/TrueCrimeAudit/ahk-mcp" -ForegroundColor Cyan
    Write-Host ""

    # Show latest commit
    Write-Host "Latest commit pushed:" -ForegroundColor Yellow
    git log -1 --oneline
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "Push failed!" -ForegroundColor Red
    Write-Host "You may need to:" -ForegroundColor Yellow
    Write-Host "  1. Set up GitHub authentication" -ForegroundColor White
    Write-Host "  2. Pull remote changes first: git pull origin $branch" -ForegroundColor White
    Write-Host "  3. Resolve any merge conflicts" -ForegroundColor White
}

Write-Host ""
Read-Host "Press Enter to exit"