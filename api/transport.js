// api/transport.js
// 교통약자 이동지원 현황 실시간 정보
// https://www.data.go.kr/data/15140825/openapi.do

export default async function handler(req, res) {
  // CORS 허용
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const API_KEY = process.env.DATA_API_KEY; // Vercel 환경변수
  const { numOfRows = 10, pageNo = 1 } = req.query;

  try {
    const url = new URL('https://apis.data.go.kr/B552061/TransprtForDisabled/getTransprtForDisabledList');
    url.searchParams.set('serviceKey', API_KEY);
    url.searchParams.set('numOfRows', numOfRows);
    url.searchParams.set('pageNo', pageNo);
    url.searchParams.set('_type', 'json');

    const response = await fetch(url.toString());
    const json = await response.json();

    // 응답 파싱 — 실제 필드명은 API 문서 확인 후 조정
    const items = json?.response?.body?.items?.item ?? [];

    const parsed = (Array.isArray(items) ? items : [items]).map(item => ({
      id: item.vhcleNo ?? item.sn,          // 차량번호
      name: item.operInstNm ?? '복지콜',     // 운영기관명
      status: mapTransportStatus(item.vhcleSttus), // 차량상태
      statusText: item.vhcleSttus ?? '-',
      lat: parseFloat(item.la ?? item.lat ?? 0),
      lng: parseFloat(item.lo ?? item.lon ?? 0),
      detail1: item.operTelno ?? '-',        // 운영 전화번호
      detail2: item.sigunguNm ?? '-',        // 시군구명
      type: 'transport',
    })).filter(i => i.lat !== 0); // 좌표 없는 항목 제외

    res.status(200).json({ success: true, data: parsed, total: items.length });
  } catch (e) {
    console.error('transport API error:', e);
    res.status(500).json({ success: false, error: e.message });
  }
}

function mapTransportStatus(raw) {
  if (!raw) return 'safe';
  if (raw.includes('대기') || raw.includes('가능')) return 'safe';
  if (raw.includes('운행') || raw.includes('배차')) return 'warn';
  return 'danger';
}
