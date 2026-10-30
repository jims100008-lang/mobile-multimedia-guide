# 三合院智慧導覽系統：UML 用例圖 (Use Case Diagram)

```mermaid
graph TB
    %% 系統邊界
    subgraph 三合院智慧導覽系統 ["三合院智慧導覽系統 (System Boundary)"]
        direction TB
        UC01(["UC01: 偵測訪客"])
        UC02(["UC02: 發送迎賓通知"])
        UC03(["UC03: 執行迎賓導航"])
        UC04(["UC04: 互動迎賓問候"])
    end

    %% 參與者定義
    Visitor["👤 遊客<br/>(Visitor)"]
    Camera["📷 智慧門口鏡頭<br/>(Entrance Camera)"]
    Pi["🍓 樹莓派通訊節點<br/>(Raspberry Pi)"]
    Robot["🤖 導覽機器人<br/>(Robot)"]

    %% 參與者與用例之關聯 (Association)
    Visitor --- UC01
    Camera --- UC01
    Camera --- UC02
    Pi --- UC02
    Pi --- UC03
    Robot --- UC03
    Robot --- UC04
    Visitor --- UC04

    %% 用例之間的相依性擴充關係 (Include / Extend)
    UC01 -.->|"&laquo;include&raquo;"<br/>觸發 | UC02
    UC02 -.->|"&laquo;include&raquo;"<br/>派送 | UC03
    UC03 -.->|"&laquo;include&raquo;"<br/>抵達 | UC04