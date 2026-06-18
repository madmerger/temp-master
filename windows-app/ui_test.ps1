Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

Add-Type @"
using System;
using System.Runtime.InteropServices;
public class MouseSim {
    [DllImport("user32.dll")]
    public static extern void mouse_event(int dwFlags, int dx, int dy, int dwData, int dwExtraInfo);
    public const int MOUSEEVENTF_LEFTDOWN = 0x02;
    public const int MOUSEEVENTF_LEFTUP = 0x04;
    public const int MOUSEEVENTF_WHEEL = 0x0800;
}
"@

function Click-At($x, $y) {
    [System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point($x, $y)
    Start-Sleep -Milliseconds 200
    [MouseSim]::mouse_event([MouseSim]::MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0)
    [MouseSim]::mouse_event([MouseSim]::MOUSEEVENTF_LEFTUP, 0, 0, 0, 0)
    Start-Sleep -Milliseconds 300
}

function Scroll-Down($clicks) {
    [MouseSim]::mouse_event([MouseSim]::MOUSEEVENTF_WHEEL, 0, 0, -120 * $clicks, 0)
    Start-Sleep -Milliseconds 500
}

function Scroll-Up($clicks) {
    [MouseSim]::mouse_event([MouseSim]::MOUSEEVENTF_WHEEL, 0, 0, 120 * $clicks, 0)
    Start-Sleep -Milliseconds 500
}

Write-Output "Starting UI test..."

# Wait for app to fully load
Start-Sleep -Seconds 5

Write-Output "Step 1: Viewing initial dashboard state"
Start-Sleep -Seconds 3

Write-Output "Step 2: Scrolling down to see more meters"
# Position cursor in the middle of the app
[System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point(640, 400)
Start-Sleep -Milliseconds 500
Scroll-Down 3
Start-Sleep -Seconds 2
Scroll-Down 3
Start-Sleep -Seconds 2
Scroll-Down 3
Start-Sleep -Seconds 2

Write-Output "Step 3: Scrolling back to top"
Scroll-Up 3
Start-Sleep -Seconds 1
Scroll-Up 3
Start-Sleep -Seconds 1
Scroll-Up 3
Start-Sleep -Seconds 2

Write-Output "Step 4: Changing time range to 'Last Hour'"
Click-At 180 48
Start-Sleep -Milliseconds 500
[System.Windows.Forms.SendKeys]::SendWait('{HOME}')
Start-Sleep -Milliseconds 200
[System.Windows.Forms.SendKeys]::SendWait('{ENTER}')
Start-Sleep -Seconds 4

Write-Output "Step 5: Changing time range to 'Last 7 Days'"
Click-At 180 48
Start-Sleep -Milliseconds 500
[System.Windows.Forms.SendKeys]::SendWait('{HOME}')
Start-Sleep -Milliseconds 200
[System.Windows.Forms.SendKeys]::SendWait('{DOWN}')
Start-Sleep -Milliseconds 200
[System.Windows.Forms.SendKeys]::SendWait('{DOWN}')
Start-Sleep -Milliseconds 200
[System.Windows.Forms.SendKeys]::SendWait('{ENTER}')
Start-Sleep -Seconds 4

Write-Output "Step 6: Changing time range to 'Last 30 Days'"
Click-At 180 48
Start-Sleep -Milliseconds 500
[System.Windows.Forms.SendKeys]::SendWait('{HOME}')
Start-Sleep -Milliseconds 200
[System.Windows.Forms.SendKeys]::SendWait('{DOWN}')
Start-Sleep -Milliseconds 200
[System.Windows.Forms.SendKeys]::SendWait('{DOWN}')
Start-Sleep -Milliseconds 200
[System.Windows.Forms.SendKeys]::SendWait('{DOWN}')
Start-Sleep -Milliseconds 200
[System.Windows.Forms.SendKeys]::SendWait('{ENTER}')
Start-Sleep -Seconds 4

Write-Output "Step 7: Clicking Refresh Data button"
Click-At 343 48
Start-Sleep -Seconds 4

Write-Output "Step 8: Final view - scrolling through all meters"
[System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point(640, 400)
Start-Sleep -Milliseconds 500
Scroll-Down 2
Start-Sleep -Seconds 2
Scroll-Down 2
Start-Sleep -Seconds 2
Scroll-Up 4
Start-Sleep -Seconds 2

Write-Output "UI test complete!"
