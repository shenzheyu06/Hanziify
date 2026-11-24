$ErrorActionPreference = "Stop"
$node = (Get-Command node -CommandType Application).Source
$converter = Join-Path $PSScriptRoot 'convert-taskbar-title.mjs'

if (-not ('HanziifyNativeCaption' -as [type])) {
    Add-Type @'
using System;
using System.Runtime.InteropServices;

public static class HanziifyNativeCaption {
    [DllImport("user32.dll", ExactSpelling = true, CharSet = CharSet.Unicode)]
    public static extern bool SetWindowTextW(IntPtr window, string title);
}
'@
}

$lastWindow = [IntPtr]::Zero
$lastProcess = 0
$lastTitle = $null
$lastSource = $null
$lastConverted = $null
Write-Host 'Watching the Spotify taskbar title. Press Ctrl+C to stop.'

while ($true) {
    $spotify = Get-Process -Name Spotify -ErrorAction SilentlyContinue |
        Where-Object { $_.MainWindowHandle -ne [IntPtr]::Zero } |
        Select-Object -First 1

    if (-not $spotify) {
        $lastWindow = [IntPtr]::Zero
        $lastTitle = $null
        Start-Sleep -Milliseconds 500
        continue
    }

    $window = $spotify.MainWindowHandle
    $title = $spotify.MainWindowTitle
    if ($window -ne $lastWindow -or $spotify.Id -ne $lastProcess) {
        $lastWindow = $window
        $lastProcess = $spotify.Id
        $lastTitle = $null
    }

    if ($title -and $title -cne $lastTitle) {
        $lastTitle = $title
        if ($title -match '[\p{IsCJKUnifiedIdeographs}\p{IsCJKCompatibilityIdeographs}\p{IsCJKUnifiedIdeographsExtensionA}\uD800-\uDBFF]') {
            if ($title -cne $lastSource) {
                $encoded = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($title))
                $output = & $node $converter $encoded
                if ($LASTEXITCODE -ne 0 -or -not $output) { throw 'Could not convert the Spotify caption.' }
                $lastSource = $title
                $lastConverted = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($output))
            }

            if ($lastConverted -cne $title) {
                # Spotify may have switched tracks while OpenCC was running.
                $spotify.Refresh()
                if ($spotify.MainWindowHandle -eq $window -and $spotify.MainWindowTitle -ceq $title) {
                    if ([HanziifyNativeCaption]::SetWindowTextW($window, $lastConverted)) {
                        $lastTitle = $lastConverted
                    } else {
                        Write-Warning 'Windows did not accept the Spotify caption change.'
                    }
                }
            }
        }
    }

    Start-Sleep -Milliseconds 500
}
