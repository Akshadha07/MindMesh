$job = Start-Job -ScriptBlock { Set-Location 'd:\PROJECTS\mernstack\server'; node src/server.js }
Start-Sleep -Seconds 4
try {
    # 1. Health check
    $h = Invoke-RestMethod -Uri "http://localhost:5000/api/health" -Method Get
    Write-Output "Health: $($h.status)"

    # 2. Get initial list
    $initial = Invoke-RestMethod -Uri "http://localhost:5000/api/notes" -Method Get
    Write-Output "Initial Notes Count: $($initial.Count)"

    # 3. Create Note via POST
    $postBody = @{
        title = "E2E Cypress Neural Testing"
        description = "Automated integration testing for full-stack MERN synaptic flows."
        category = "System Design"
        tags = @("Testing", "MERN", "E2E")
    } | ConvertTo-Json
    $created = Invoke-RestMethod -Uri "http://localhost:5000/api/notes" -Method Post -Body $postBody -ContentType "application/json"
    Write-Output "POST Created Note ID: $($created.id)"

    # 4. Verify count increased
    $afterPost = Invoke-RestMethod -Uri "http://localhost:5000/api/notes" -Method Get
    Write-Output "Count after POST: $($afterPost.Count)"

    # 5. Update Note via PATCH
    $patchBody = @{
        title = "E2E Cypress Neural Testing (Modified)"
        description = "Updated description for verification."
    } | ConvertTo-Json
    $updated = Invoke-RestMethod -Uri "http://localhost:5000/api/notes/$($created.id)" -Method Patch -Body $patchBody -ContentType "application/json"
    Write-Output "PATCH Verified: $($updated.title)"

    # 6. Delete Note via DELETE
    $deleted = Invoke-RestMethod -Uri "http://localhost:5000/api/notes/$($created.id)" -Method Delete
    Write-Output "DELETE Verified: $($deleted.message)"

    # 7. Final count verification
    $final = Invoke-RestMethod -Uri "http://localhost:5000/api/notes" -Method Get
    Write-Output "Final Notes Count: $($final.Count)"
} finally {
    Stop-Job $job
    Remove-Job $job
    Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
}
