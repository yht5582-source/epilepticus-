# 癲癇重積狀態 (SE) 時間軸決策與自動劑量系統
*(Status Epilepticus Timeline & Dosage Calculator)*

## 📝 專案簡介

這是一個專為神經內科、急診醫學科與加護病房 (ICU) 設計的單頁式 Web 應用程式 (SPA)。

癲癇重積狀態 (Status Epilepticus, SE) 的急救高度依賴 **「精確的時間掌控」** 與 **「因應體重變化的防呆劑量換算」**。本系統將國際指引中生硬的文字轉化為「時間軸驅動」的互動介面，自動引導醫療團隊在 T1 (5分鐘) 與 T2 (20分鐘) 等關鍵決策節點，做出正確的給藥與處置。

## ✨ 核心功能 (Core Features)

* **⏱️ 內建急症連動計時器 (SE Stopwatch)**
  * 支援輸入「到院前已發作時間 (Pre-hospital seizure duration)」，讓院內計時器無縫接軌真實發病時間。
  * 具備直覺的啟動、暫停與重置控制面板。
* **🚦 時間 + 治療反應雙軌引導 (v2.0)**
  * **0 ~ 5 分鐘 穩定期**：ABC、血糖（Thiamine → D50W）、IV、抽血；懷孕 ≥20 週提示 MgSO₄。
  * **第一線 BZD**（AES 5–20 分）：記錄給藥後觀察 5 分鐘；仍發作 → 重複一劑（Midazolam IM 僅單次）。
  * **第二線 ASM**（AES 20–40 分）：BZD 兩劑（或 IM 一劑）無效即進入，不必等滿 20 分。
  * **難治型 RSE**：依定義「BZD + 一種 ASM 仍無效」判定（不再以「>20 分鐘」誤判）；麻醉藥 ≥24 小時 → 超難治型。
  * 時間逾時警示：>10 分未給 BZD、>20 分未給 ASM、≥30 分（ILAE t2）、≥40 分（AES 第三線）。
* **🧾 處置時間戳記**：每個藥物可「記錄給藥」，另有發作停止／再發／撤銷；一鍵複製交班。計時與紀錄存於瀏覽器，重新整理不會遺失。
* **💊 國際規範之防呆劑量精算 (Smart Dose Calculator)**
  * 輸入病患體重後，系統會**瞬間算出所有三線藥物的推注 (Bolus) 與維持 (Maintenance) 劑量**。
  * 內建嚴格的**最大劑量封頂限制**（例如：Lorazepam 單次最大 4mg、Levetiracetam 絕對最大 4500mg、Valproate 最大 3000mg），從根本防堵急救高壓下人為心算導致的給藥過量。
  * 體重空白或超出 3–250 kg 時不顯示劑量（v1 會默默以 60 kg 計算）；顯示最短推注／輸注時間（Fosphenytoin ≤150 mg PE/min、Phenytoin ≤50 mg/min 等）。
  * 第二線新增 Phenytoin、Phenobarbital；第三線依 NCS 2012 改為 Midazolam / Propofol（mcg/kg/min ↔ mg/h、PRIS 警戒）/ Pentobarbital / Ketamine。
  * 特殊族群勾選：懷孕／肝病 → Valproate 警示；心律不整／低血壓 → (Fos)phenytoin 警示。

## 🏥 臨床邏輯與學理依據

* ILAE 2015 SE 定義與分類（Trinka, Epilepsia 2015）：痙攣性 SE t1 = 5 分、t2 = 30 分
* AES 2016 痙攣性 SE 治療指引（Glauser, Epilepsy Curr 2016）：時程與第一、二線劑量
* NCS 2012 SE 評估與處置指引（Brophy, Neurocrit Care 2012）：輸注速率、麻醉藥劑量、cEEG
* ESETT（Kapur, NEJM 2019）、RAMPART（Silbergleit, NEJM 2012）

## 🧪 測試

劑量與階段判斷邏輯位於 `index.html` 的 `/*ENGINE-START*/ … /*ENGINE-END*/` 區塊：

```
node tests.cjs
```

## 🚀 部署與使用方式

本專案採用純前端架構 (`HTML` + `CSS` + `Vanilla JavaScript`) 開發，**完全不需要伺服器或資料庫**即可獨立運行。

1. **本機直接運行**：將原始碼下載並另存為 `index.html`，雙擊檔案即可在急診室桌機、行動護理車或個人手機的瀏覽器上開啟使用。
2. **雲端機構部署 (推薦)**：將此專案推送至 GitHub，並啟用 **GitHub Pages**。產生的靜態網址可直接釘選於急診公用電腦的桌面或存為手機書籤，利於全院醫師跨裝置快速存取。

## 🛠 未來擴充計畫 (Roadmap)

- [ ] 整合兒童劑量模式 (Pediatric Mode) 與兒童特有最大劑量限制
- [x] 針對特殊群體（孕婦、肝病、心律不整）加入第二線藥物選擇警示（v2.0）
- [x] 新增「處置時間戳記 (Timestamp Log)」與複製交班（v2.0）

## ⚠️ 臨床免責聲明 (Disclaimer)

1. **非醫療診斷設備**：本工具僅供醫療專業人員作為急症決策之「輔助參考」，**絕對不可取代臨床醫師之最終專業判斷**。
2. **安全核對**：最終給藥途徑 (IV/IM)、實際給藥劑量、輸注速率與是否執行氣管內插管等處置，仍須依據病患當下之臨床表徵 (呼吸道通暢度、血壓變化等) 及各醫院之標準作業流程 (SOP) 為準，給藥前請務必落實雙重核對 (Double Check)。
