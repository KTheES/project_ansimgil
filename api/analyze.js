// api/analyze.js
// Hugging Face 무료 API로 외출 안전 점수 분석

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET');

  const HF_TOKEN = process.env.HF_TOKEN; // Vercel 환경변수

  // 쿼리에서 데이터 받기
  const { transport, signal, bike, region = '전국' } = req.query;

  const transportCount = parseInt(transport || 0);
  const signalSafe = parseInt(signal || 0);
  const bikeCount = parseInt(bike || 0);

  // AI에게 보낼 프롬프트
  const prompt = `다음은 ${region} 교통약자 이동지원 현황입니다.
- 이동지원 차량 대기 가능: ${transportCount}대
- 안전한 신호등 수: ${signalSafe}개
- 대여 가능 공영자전거: ${bikeCount}대

위 데이터를 바탕으로 교통약자의 외출 안전도를 0~100점으로 평가하고, 
한 줄 조언을 한국어로 짧게 알려주세요.
형식: {"score": 숫자, "advice": "한 줄 조언"}`;

  try {
    const response = await fetch(
      'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HF_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_new_tokens: 100,
            temperature: 0.3,
            return_full_text: false,
          },
        }),
      }
    );

    const data = await response.json();

    // 응답 파싱 시도
    let score = 0;
    let advice = '데이터를 분석 중입니다.';

    if (data?.[0]?.generated_text) {
      const text = data[0].generated_text;
      try {
        // JSON 형식 추출 시도
        const match = text.match(/\{[\s\S]*?\}/);
        if (match) {
          const parsed = JSON.parse(match[0]);
          score = Math.min(100, Math.max(0, parseInt(parsed.score || 0)));
          advice = parsed.advice || advice;
        }
      } catch {
        // JSON 파싱 실패시 규칙 기반으로 fallback
        score = calcFallbackScore(transportCount, signalSafe, bikeCount);
        advice = getFallbackAdvice(score);
      }
    } else {
      // API 응답 없을 시 규칙 기반
      score = calcFallbackScore(transportCount, signalSafe, bikeCount);
      advice = getFallbackAdvice(score);
    }

    res.status(200).json({ success: true, score, advice, region });
  } catch (e) {
    // 오류시 규칙 기반으로 fallback (서비스 중단 없음)
    const score = calcFallbackScore(transportCount, signalSafe, bikeCount);
    res.status(200).json({
      success: true,
      score,
      advice: getFallbackAdvice(score),
      region,
      fallback: true,
    });
  }
}

// 규칙 기반 점수 계산 (AI 실패시 fallback)
function calcFallbackScore(transport, signal, bike) {
  let score = 0;
  if (transport >= 10) score += 40;
  else if (transport >= 5) score += 25;
  else if (transport >= 1) score += 10;

  if (signal >= 10) score += 35;
  else if (signal >= 5) score += 20;
  else if (signal >= 1) score += 10;

  if (bike >= 20) score += 25;
  else if (bike >= 10) score += 15;
  else if (bike >= 1) score += 8;

  return Math.min(100, score);
}

function getFallbackAdvice(score) {
  if (score >= 80) return '지금 외출하기 좋은 환경입니다. 안심하고 이동하세요! 😊';
  if (score >= 60) return '대체로 안전하지만 이동지원 차량 예약을 미리 해두세요.';
  if (score >= 40) return '일부 구간 주의가 필요합니다. 보호자 동반을 권장합니다.';
  return '현재 이동 지원이 부족합니다. 잠시 후 다시 확인해주세요.';
}
