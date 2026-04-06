// api/transport.js
// 교통약자이동지원센터 차량 이용가능 정보
// https://www.data.go.kr/data/15140825/openapi.do

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const API_KEY = process.env.DATA_API_KEY;
  const { numOfRows = 10, pageNo = 1 } = req.query;

  try {
    const url = new URL('https://apis.data.go.kr/B551982/tsdo_v2/info_vehicle_use_v2');
    url.searchParams.set('serviceKey', API_KEY);
    url.searchParams.set('numOfRows', numOfRows);
    url.searchParams.set('pageNo', pageNo);
    url.searchParams.set('type', 'json');

    const response = await fetch(url.toString());
    const text = await response.text();

    let json;
    try { json = JSON.parse(text); }
    catch { return res.status(500).json({ success: false, error: 'JSON 파싱 실패', raw: text }); }

    const items = json?.response?.body?.items?.item ?? json?.items?.item ?? json?.item ?? [];
    const arr = Array.isArray(items) ? items : [items];

    const parsed = arr.map(item => ({
      id: (item.ctprvnNm ?? '') + '_' + (item.signguNm ?? ''),
      name: `${item.ctprvnNm ?? ''} ${item.signguNm ?? ''} 이동지원센터`.trim(),
      status: mapStatus(item.useVhcleCo, item.totVhcleCo),
      statusText: getStatusText(item.useVhcleCo, item.totVhcleCo),
      lat: parseFloat(item.latitude ?? item.la ?? item.lat ?? 0),
      lng: parseFloat(item.longitude ?? item.lo ?? item.lon ?? 0),
      detail1: `운행중 ${item.useVhcleCo ?? 0}대 / 전체 ${item.totVhcleCo ?? 0}대`,
      detail2: `대기 예약 ${item.rsvtWaitCo ?? 0}건`,
      type: 'transport',
    })).filter(i => i.lat !== 0);

    res.status(200).json({ success: true, data: parsed, total: arr.length });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
}

function mapStatus(use, total) {
  if (!use || !total) return 'safe';
  const ratio = use / total;
  if (ratio < 0.5) return 'safe';
  if (ratio < 0.8) return 'warn';
  return 'danger';
}

function getStatusText(use, total) {
  if (!use || !total) return '정보없음';
  const ratio = use / total;
  if (ratio < 0.5) return '대기가능';
  if (ratio < 0.8) return '혼잡';
  return '매우혼잡';
}
