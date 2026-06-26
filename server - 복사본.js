require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const gameRequirements = [
    { name: "리그 오브 레전드", baseFps: 160, cpuWeight: 0.6, gpuWeight: 0.4, demand: 10000 },
    { name: "배틀그라운드", baseFps: 90, cpuWeight: 0.3, gpuWeight: 0.7, demand: 18000 },
    { name: "사이버펑크 2077", baseFps: 45, cpuWeight: 0.2, gpuWeight: 0.8, demand: 27000 },
    { name: "GTA 6 (차세대 요구 사양)", baseFps: 60, cpuWeight: 0.4, gpuWeight: 0.6, demand: 24000 }
];

app.post("/analyze", async (req, res) => {
    console.log("📥 [시스템 신호] 프론트엔드로부터 사양 분석 요청 접수 완료!");
    
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "내용이 없습니다." });

    const prompt = `
    너는 중고 컴퓨터 시세 감정사야. 다음 판매글을 분석해서 오직 아래 형식의 JSON 하나만 출력해. 백틱이나 설명은 절대 넣지마.
    
    {
      "cpu": "CPU 모델명 (없으면 '미확인')",
      "cpu_score": 성능점수 (숫자, rtx3060급 짝꿍은 16500, rtx4090급 짝꿍은 40000 기준 상대평가),
      "cpu_price": 실제 부품 중고 시세 (원 단위 숫자),
      "gpu": "GPU 모델명 (없으면 '미확인')",
      "gpu_score": 성능점수 (숫자, rtx3060급 16500, rtx4090급 40000 기준 상대평가),
      "gpu_price": 실제 부품 중고 시세 (원 단위 숫자),
      "ram_size": RAM 용량 (숫자만, 예: 16),
      "price": 글에 적힌 매물 가격 (숫자만, 없으면 0)
    }

    [판매글 본문]
    ${text}
    `;

    let responseText = "";
    let usedModel = "gemini-2.5-flash";

    try {
        // 1️⃣ 1차 시도: 기본형 2.5-flash 가동
        console.log(`🤖 [1차 시도] ${usedModel} 엔진 연산 시작...`);
        const modelFlash = genAI.getGenerativeModel({ model: usedModel });
        const result = await modelFlash.generateContent(prompt);
        responseText = result.response.text().trim();
        console.log(`✅ [성공] ${usedModel} 엔진으로 분석을 완료했습니다.`);

    } catch (err) {
        console.log(`⚠️ [경고] ${usedModel} 무료 용량이 초과되었거나 에러가 발생했습니다.`);
        
        // 429 제한 또는 기타 할당량 에러 감지 시 즉시 pro 모델로 토스
        if (err.message && (err.message.includes("429") || err.message.includes("Quota") || err.message.includes("quota"))) {
            
            usedModel = "gemini-2.5-pro"; // 대피소 모델 교체 완료
            console.log(`🔄 [자동 백업 시스템] 즉시 상위 등급 모델인 [ ${usedModel} ] 엔진으로 자동 우회합니다!`);
            
            try {
                // 2️⃣ 2차 시도: 꼬임 없는 순수 pro 모델 연산 파트
                const modelPro = genAI.getGenerativeModel({ model: usedModel });
                const fallbackResult = await modelPro.generateContent(prompt);
                responseText = fallbackResult.response.text().trim();
                console.log(`✅ [복구 완료] 우회 통로(${usedModel})를 통해 성공적으로 데이터를 살려냈습니다!`);
            } catch (fallbackErr) {
                console.error(`❌ [최종 셧다운] 우회용 ${usedModel} 모델마저 제한을 소진했습니다:`, fallbackErr.message);
                return res.status(500).json({ error: "모든 AI 서버의 무료 제공량이 소진되었습니다." });
            }
        } else {
            console.error("❌ [서버 치명적 에러]:", err.message);
            return res.status(500).json({ error: "AI 분석 실패" });
        }
    }

    // 데이터 파싱 파트
    try {
        if (responseText.includes("```")) {
            responseText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
        }

        const jsonMatch = responseText.match(/\{([\s\S]*?)\}/);
        if (!jsonMatch) throw new Error("AI가 올바른 JSON 형식을 주지 않았습니다.");
        
        const aiData = JSON.parse(jsonMatch[0]);

        // 🚀 게임 성능 연산
        const games = gameRequirements.map(game => {
            let totalScore = ((aiData.cpu_score || 10000) * game.cpuWeight) + ((aiData.gpu_score || 10000) * game.gpuWeight);
            if (game.name.includes("GTA 6") && aiData.ram_size < 24) totalScore *= 0.7;
            else if (aiData.ram_size <= 8) totalScore *= 0.65;
            
            const performanceRatio = totalScore / game.demand;
            let fps = "구동 불가"; let status = "불가";
            
            if (performanceRatio >= 1.0) { fps = `${Math.round(game.baseFps * performanceRatio)} FPS`; status = "쾌적"; }
            else if (performanceRatio >= 0.65) { fps = `${Math.round(game.baseFps * performanceRatio)} FPS`; status = "보통"; }
            else { fps = game.name.includes("GTA 6") ? "구동 불가" : `${Math.round(game.baseFps * performanceRatio * 0.5)} FPS`; status = "불가"; }
            
            return { name: game.name, fps, status };
        });

        // 가성비 계산
        let ramPrice = aiData.ram_size >= 32 ? 80000 : (aiData.ram_size >= 24 ? 60000 : 40000);
        if (aiData.ram_size <= 8) ramPrice = 20000;
        
        const calculatedNormalPrice = (aiData.cpu_price || 0) + (aiData.gpu_price || 0) + ramPrice + 120000;

        let priceStatus = "미확인";
        let priceComment = "판매 가격이 본문에 적혀있지 않아 시세 비교가 어렵습니다.";

        if (aiData.price > 0) {
            const priceDiff = aiData.price - calculatedNormalPrice;
            if (priceDiff > 70000) {
                priceStatus = "비씀";
                priceComment = `🔴 시장 적정 중고 시세(${calculatedNormalPrice.toLocaleString()}원)보다 약 ${(priceDiff).toLocaleString()}원 비쌉니다. 가성비가 떨어지니 조율해 보세요!`;
            } else if (priceDiff < -70000) {
                priceStatus = "개이득";
                priceComment = `🟢 시장 적정 중고 시세(${calculatedNormalPrice.toLocaleString()}원)보다 ${Math.abs(priceDiff).toLocaleString()}원 저렴한 개이득 매물입니다! 부품 하자가 없다면 즉시 구조하세요.`;
            } else {
                priceStatus = "적당";
                priceComment = `🟡 현재 중고 부품 감가가 적절히 반영된 시세 가격(${calculatedNormalPrice.toLocaleString()}원) 매물입니다. 안심하고 구매하셔도 좋습니다.`;
            }
        }

        console.log(`📤 [결과 전송] 최종 브리핑 전송 완료 (사용한 엔진: ${usedModel})\n`);
        res.json({ 
            specs: { 
                cpu: aiData.cpu || "미확인", 
                gpu: aiData.gpu || "미확인", 
                ram: (aiData.ram_size || 16) + "GB" 
            }, 
            games: games,
            priceAnalysis: { 
                calculatedNormalPrice: calculatedNormalPrice, 
                priceStatus: priceStatus, 
                priceComment: priceComment 
            }
        });

    } catch (parseErr) {
        console.error("❌ [파싱 에러]:", parseErr.message);
        res.status(500).json({ error: "데이터 추출 오류 발생" });
    }
});

app.listen(5000, () => {
    console.log("🚀 컴맹 구조대 백엔드 서버가 5000번 포트에서 실행 중입니다!");
});