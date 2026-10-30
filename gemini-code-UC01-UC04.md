# 三合院智慧導覽系統：UC01 至 UC04 UML 循序圖與用例圖

## 一、 UML 循序圖 (Sequence Diagram)

```
mermaid
sequenceDiagram
    autonumber
    actor Visitor as 遊客 (Visitor)
    participant Cam as 大門口智慧鏡頭<br/>(Entrance Camera)
    participant Pi as 樹莓派通訊節點<br/>(Raspberry Pi)
    participant Robot as 導覽機器人<br/>(Robot)

    %% UC01: 偵測訪客
    rect rgb(240, 248, 255)
        note over Visitor, Cam: UC01: 偵測訪客
        Visitor->>Cam: 步行進入三合院大門口範圍
        activate Cam
        Cam->>Cam: AI 邊緣運算辨識人體特徵
    end

    %% UC02: 發送迎賓通知
    rect rgb(245, 245, 220)
        note over Cam, Robot: UC02: 發送迎賓通知
        Cam->>Pi: 觸發事件：偵測到新訪客 (發送座標/時間)
        deactivate Cam
        activate Pi
        Pi->>Robot: 推播迎賓請求與目標座標 (MQTT)
        deactivate Pi
    end

    %% UC03: 執行迎賓導航
    rect rgb(240, 255, 240)
        note over Robot: UC03: 執行迎賓導航
        activate Robot
        Robot->>Robot: 接收指令，啟動 SLAM 自主導航與路徑規劃
        Robot->>Robot: 避開庭院障礙物，移動至大門口迎賓點
    end

    %% UC04: 互動迎賓問候
    rect rgb(255, 240, 245)
        note over Visitor, Robot: UC04: 互動迎賓問候
        Robot-->>Visitor: 到達定位，觸發近距離感測器
        Robot->>Visitor: 語音播放：「歡迎光臨三合院！」
        Robot->>Visitor: 螢幕顯示歡迎介面與導覽選項
        deactivate Robot
    end