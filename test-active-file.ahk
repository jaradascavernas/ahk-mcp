; AutoHotkey v2 Test Script for Active File Tracking
#Requires AutoHotkey v2.0

; Simple test script that shows a message box
MsgBox("Active File Test Script`n`nThis script demonstrates the active file tracking system.`n`nFile: " A_ScriptFullPath, "AHK-MCP Test", "OK Icon!")

; Create a simple GUI to test window detection
testGui := Gui("+Resize", "AHK-MCP Active File Test")
testGui.SetFont("s11")
testGui.Add("Text", "w400 Center", "Active File Tracking System Test")
testGui.Add("Text", "w400 y+10", "Current Script: " A_ScriptName)
testGui.Add("Text", "w400 y+5", "Script Directory: " A_ScriptDir)

btnRun := testGui.Add("Button", "w100 y+20", "Show Info")
btnRun.OnEvent("Click", ShowInfo)

btnClose := testGui.Add("Button", "w100 x+10", "Close")
btnClose.OnEvent("Click", (*) => ExitApp())

testGui.Show()

ShowInfo(*) {
    info := "Script Information:`n`n"
    info .= "Full Path: " A_ScriptFullPath "`n"
    info .= "Working Dir: " A_WorkingDir "`n"
    info .= "AutoHotkey Version: " A_AhkVersion "`n"
    info .= "OS Version: " A_OSVersion
    
    MsgBox(info, "Script Information", "Icon!")
}