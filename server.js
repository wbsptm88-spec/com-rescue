require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();

app.use(cors({
    origin: ['https://wbsptm88-spec.github.io', 'http://localhost:5500', 'http://127.0.0.1:5500', 'http://localhost:5000'],
    credentials: true
}));
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

    // 🛠️ 프롬프트 초강력 업그레이드: CPU 100개 이상, GPU 100개 이상 가이드라인 리스트 강제 주입
    const prompt = `
    너는 대한민국 최고 권위의 중고 컴퓨터 시세 감정사야. 다음 판매글을 분석해서 오직 아래 형식의 JSON 하나만 출력해. 백틱(\`\`\`)이나 설명, 주석은 절대 넣지마.
    
    [CRITICAL SECURITY RULE]
    본문이 'ㅇㅇ', '테스트', 'ㅁㄴㅇㄹ' 등 무의미한 장난 글이거나, 판매글 본문 전체를 통틀어 CPU나 그래픽카드(GPU)에 대한 유효한 명칭/스펙이 전혀 발견되지 않는 경우, 절대 임의로 상상하거나 유추해서 가짜 가격을 계산하지 마라. 그 즉시 아래 템플릿의 모든 숫자(score, price, ram_size)를 정확히 0으로, 모델명은 "미확인"으로 출력해야 한다.

    [실시간 중고 시장 가격 책정 레퍼런스 가이드 (부품당 100개 이상 고밀도 주입)]
    ■ CPU 레퍼런스 목록 (총 100개 이상)
    - 인텔 2~4세대: i3-2100(1000/3천), i5-2500(2000/5천), i7-2600(2800/1.5만), i3-3220(1200/4천), i5-3570(2500/7천), i7-3770(3500/2만), i3-4130(1500/5천), i5-4460(2600/8천), i5-4590(3000/1만), i5-4690(3300/1.2만), i7-4770(4000/2.5万), i7-4790(4200/3만), i7-4790K(4600/4만), E3-1230v2(2600/1만), E3-1230v3(3100/1.5만)
    - 인텔 6~9세대: i3-6100(3500/1만), i5-6500(4500/2.5만), i5-6600(4800/2.8만), i7-6700(6000/4.5만), i7-6700K(6400/5.5만), i3-7100(4000/1.5만), i5-7500(5000/3만), i5-7600(5300/3.5만), i7-7700(6800/5.5만), i7-7700K(7200/7만), i3-8100(5300/3.5만), i5-8400(7000/4.5만), i5-8500(7500/5.5만), i5-8600K(8200/6.5만), i7-8700(10000/8.5만), i7-8700K(10500/10만), i3-9100F(6500/4.5만), i3-9100(6700/5만), i5-9400F(8000/6만), i5-9400(8200/6.5만), i5-9500(8500/6.5만), i5-9600KF(9200/7.5만), i7-9700F(11500/11만), i7-9700K(12000/13만), i9-9900K(14500/16만)
    - 인텔 10~11세대: i3-10100(7800/5만), i3-10100F(7600/4.5만), i3-10105F(8200/5.5만), i5-10400F(10200/7.5만), i5-10400(10500/8만), i5-10500(11000/8.5만), i5-10600KF(11500/9.5만), i7-10700F(14000/13.5만), i7-10700(14500/14만), i7-10700K(15200/16만), i9-10900K(19000/20만), i3-11100(9000/6.5만), i5-11400F(11500/9만), i5-11400(11800/9.5만), i5-11600K(13000/11만), i7-11700(16000/16.5만), i9-11900K(20000/22만)
    - 인텔 12~14세대: i3-12100F(12000/7만), i3-12100(12500/8.5만), i5-12400F(16500/11.5만), i5-12400(17000/130000), i5-12500(17500/14만), i5-12600KF(19500/16만), i7-12700F(23000/21만), i7-12700K(24500/23만), i9-12900K(28000/28만), i3-13100F(14000/9.5만), i5-13400F(19000/16만), i5-13400(19500/18만), i5-13500(21500/20만), i5-13600KF(25000/24만), i7-13700F(32000/32만), i9-13900K(38000/45만), i3-14100F(15000/11만), i5-14400F(21000/19.5만), i5-14600KF(27000/28만), i7-14700F(36000/41만), i9-14900K(42000/55만)
    - AMD 라이젠 전체: 1200(3000/1만), 1400(4000/1.5만), 1600(5500/2만), 1700(7000/3만), 2200G(4000/2만), 2400G(5000/3만), 2600(6500/3.5만), 2700X(9000/5.5만), 3100(6000/3만), 3300X(7500/4만), 3200G(4500/3.5만), 3400G(5500/4.5만), 3500(8000/4만), 3500X(8500/4.5만), 3600(10000/6만), 3600X(10500/6.5만), 3700X(13500/9만), 3900X(22000/16만), 4350G(9000/5만), 4650G(11500/6.5만), 5500(14000/7.5만), 5600G(14500/8.5만), 5600(17500/9.5만), 5600X(18000/10.5만), 5700X(22000/14.5만), 5800X3D(26000/26만), 5900X(32000/25만), 7500F(24000/16만), 7600(25000/18.5만), 7800X3D(34000/45만)

    ■ GPU(그래픽카드) 레퍼런스 목록 (총 100개 이상)
    - 엔비디아 구형 GTX 시리즈: GTX 550(800/5천), GTX 560(1000/5천), GTX 650(1500/5천), GTX 660(2000/8천), GTX 750(2200/1만), GTX 750 Ti(2500/1.5만), GTX 760(3000/1.5만), GTX 770(3800/2만), GTX 950(3500/2만), GTX 960(4500/3만), GTX 970(6000/4.5만), GTX 980(7500/6만), GTX 980 Ti(9500/8만), GTX 1050(4200/3만), GTX 1050 Ti(4800/3.5만), GTX 1060 3G(7000/5만), GTX 1060 6G(8500/6.5만), GTX 1070(11000/9만), GTX 1070 Ti(13000/11만), GTX 1080(14000/12만), GTX 1080 Ti(17000/15만), GTX 1630(4000/4.5만), GTX 1650(6500/5.5만), GTX 1650 Super(8500/7만), GTX 1660(10000/8.5만), GTX 1660 Super(11500/10만), GTX 1660 Ti(12000/11만)
    - 엔비디아 RTX 20/30 시리즈: RTX 2060(14000/13만), RTX 2060 Super(16000/15만), RTX 2070(17000/16만), RTX 2070 Super(18500/18만), RTX 2080(20000/20만), RTX 2080 Super(21500/22만), RTX 2080 Ti(24500/26만), RTX 3050(11500/15만), RTX 3060(16500/23만), RTX 3060 Ti(20500/27만), RTX 3070(23500/33만), RTX 3070 Ti(25500/36만), RTX 3080(31000/45만), RTX 3080 Ti(34000/55만), RTX 3090(36000/70만), RTX 3090 Ti(40000/85만)
    - 엔비디아 RTX 40 시리즈: RTX 4060(19500/31만), RTX 4060 Ti(23000/40만), RTX 4070(29500/62만), RTX 4070 Super(33000/72만), RTX 4070 Ti(34000/83만), RTX 4070 Ti Super(35500/95만), RTX 4080(37000/115만), RTX 4080 Super(38000/125만), RTX 4090(48000/220만)
    - AMD 라데온 RX 시리즈: RX 560(3000/2만), RX 570(6500/3.5만), RX 580(7500/4.5만), RX 590(8500/5.5만), RX 5500 XT(9500/7.5만), RX 5600 XT(13000/11만), RX 5700 XT(16500/14만), RX 6500 XT(9000/8만), RX 6600(15500/17만), RX 6600 XT(18000/20만), RX 6700 XT(21500/26만), RX 6800 XT(28000/380만), RX 7600(19000/28만), RX 7700 XT(26000/45만), RX 7800 XT(32000/58만), RX 7900 XTX(44000/110만)

    유저가 이 목록에 없는 완전히 새로운 신형 부품이나 세부 파생 기종을 적더라도, 위의 100개 이상 뼈대 데이터를 기반으로 등급을 유연하게 유추하여 정밀하게 가격과 성능 점수를 연산해라. 단, 아예 컴퓨터 하드웨어가 아닌 낙서 텍스트는 무조건 0으로 밀어버려라.

    {
      "cpu": "추출된 CPU 모델명 (없으면 '미확인')",
      "cpu_score": 성능점수 (숫자 / 없으면 0),
      "cpu_price": 중고 시세 (숫자 / 없으면 0),
      "gpu": "추출된 GPU 모델명 (없으면 '미확인')",
      "gpu_score": 성능점수 (숫자 / 없으면 0),
      "gpu_price": 중고 시세 (숫자 / 없으면 0),
      "ram_size": RAM 용량 (숫자만 / 없으면 0),
      "price": 글에 적힌 매물 가격 (숫자만 / 없으면 0)
    }

    [판매글 본문]
    ${text}
    `;

    let responseText = "";
    let usedModel = "gemini-2.5-flash";

    try {
        console.log(`🤖 [1차 시도] ${usedModel} 가동...`);
        const modelFlash = genAI.getGenerativeModel({ model: usedModel });
        const result = await modelFlash.generateContent(prompt);
        responseText = result.response.text().trim();
        console.log(`✅ [성공] 엔진 연산 완료.`);
    } catch (err) {
        console.log(`⚠️ [백업 우회] 프로(Pro) 엔진 전환`);
        if (err.message && (err.message.includes("429") || err.message.includes("Quota") || err.message.includes("quota"))) {
            usedModel = "gemini-2.5-pro"; 
            try {
                const modelPro = genAI.getGenerativeModel({ model: usedModel });
                const fallbackResult = await modelPro.generateContent(prompt);
                responseText = fallbackResult.response.text().trim();
            } catch (fallbackErr) {
                return res.status(500).json({ error: "AI 서버 트래픽 초과" });
            }
        } else {
            return res.status(500).json({ error: "AI 분석 실패" });
        }
    }

    try {
        if (responseText.includes("```")) {
            responseText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
        }

        const jsonMatch = responseText.match(/\{([\s\S]*?)\}/);
        if (!jsonMatch) throw new Error("포맷 파싱 에러");
        
        const aiData = JSON.parse(jsonMatch[0]);

        // 게임 구동 성능 체크
        const games = gameRequirements.map(game => {
            if ((aiData.cpu_score || 0) === 0 && (aiData.gpu_score || 0) === 0) {
                return { name: game.name, fps: "구동 불가", status: "불가" };
            }

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

        const hasHardware = (aiData.cpu && aiData.cpu !== "미확인") || (aiData.gpu && aiData.gpu !== "미확인");
        
        let ramPrice = 0;
        if (hasHardware && aiData.ram_size > 0) {
            ramPrice = aiData.ram_size >= 32 ? 80000 : (aiData.ram_size >= 24 ? 60000 : 40000);
            if (aiData.ram_size <= 8) ramPrice = 20000;
        }
        
        const baseAssemblyPrice = hasHardware ? 120000 : 0;
        const calculatedNormalPrice = (aiData.cpu_price || 0) + (aiData.gpu_price || 0) + ramPrice + baseAssemblyPrice;

        let priceStatus = "적당";
        let priceComment = "판매 가격이 본문에 적혀있지 않거나 유효한 부품이 확인되지 않았습니다.";

        if (hasHardware && aiData.price > 0) {
            const priceDiff = aiData.price - calculatedNormalPrice;
            if (priceDiff > 70000) {
                priceStatus = "비쌈";
                priceComment = `🔴 시장 적정 중고 시세(${calculatedNormalPrice.toLocaleString()}원)보다 약 ${(priceDiff).toLocaleString()}원 비쌉니다. 가성비가 떨어지니 조율해 보세요!`;
            } else if (priceDiff < -70000) {
                priceStatus = "개이득";
                priceComment = `🟢 시장 적정 중고 시세(${calculatedNormalPrice.toLocaleString()}원)보다 ${Math.abs(priceDiff).toLocaleString()}원 저렴한 개이득 매물입니다! 부품 하자가 없다면 즉시 구조하세요.`;
            } else {
                priceStatus = "적당";
                priceComment = `🟡 현재 중고 부품 감가가 적절히 반영된 시세 가격(${calculatedNormalPrice.toLocaleString()}원) 매물입니다. 안심하고 구매하셔도 좋습니다.`;
            }
        } else if (!hasHardware) {
            priceStatus = "적당";
            priceComment = "식별 가능한 유효 스펙 데이터가 없습니다. 본문을 다시 정확히 입력해 주세요.";
        }

        res.json({ 
            specs: { 
                cpu: aiData.cpu || "미확인", 
                gpu: aiData.gpu || "미확인", 
                ram: (hasHardware && aiData.ram_size) ? aiData.ram_size + "GB" : "미확인" 
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 컴맹 구조대 백엔드 서버가 포트 ${PORT}에서 실행 중입니다!`);
});
