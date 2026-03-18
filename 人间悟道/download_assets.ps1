# PowerShell 下载脚本示例
# 运行此脚本前，确保有 Invoke-WebRequest 支持（PowerShell 内置）

# 示例开源URL（替换为实际）
Invoke-WebRequest -Uri "https://picsum.photos/512/512?random=1" -OutFile "assets/images/bg_main.jpg"
Invoke-WebRequest -Uri "https://picsum.photos/100/50?random=2" -OutFile "assets/images/btn_upgrade.png"
Invoke-WebRequest -Uri "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav" -OutFile "assets/sounds/sfx_upgrade.wav"

Write-Host "下载完成。请检查文件。"