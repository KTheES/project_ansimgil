// api/signal.js
// 교통안전 신호등 실시간 정보
// https://www.data.go.kr/data/15157604/openapi.do

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const API_KEY = process.env.DATA_API_KEY;
  const { numOfRows = 20, pageNo = 1 } = req.query;

  try {
    const url = new URL('https://apis.data.go.kr/B552061/TrafficSignal/getTrafficSignalList');
    url.searchParams.set('serviceKey', API_KEY);
    url.searchParams.set('numOfRows', numOfRows);
    url.searchParams.set('pageNo', pageNo);
    url.searchParams.set('_type', 'json');

    const response = await fetch(url.toString());
    const json = await response.json();

    const items = json?.response?.body?.items?.item ?? [];

    const parsed = (Array.isArray(items) ? items : [items]).map(item => ({
      id: item.sn ?? item.signalId,
      name: item.itstNm ?? item.crossNm ?? '교차로',   // 교차로명
      status: mapSignalStatus(item.signalSttus ?? item.sttus),
      statusText: item.signalSttus ?? '정상',
      lat: parseFloat(item.la ?? item.lat ?? 0),
      lng: parseFloat(item.lo ?? item.lon ?? 0),
      detail1: `보행신호 ${item.pedSignalTime ?? '-'}초`,
      detail2: item.soundSignalYn === 'Y' ? '음향신호 정상' : '음향신호 없음',
      type: 'signal',
    })).filter(i => i.lat !== 0);

    res.status(200).json({ success: true, data: parsed, total: items.length });
  } catch (e) {
    console.error('signal API error:', e);
    res.status(500).json({ success: false, error: e.message });
  }
}

function mapSignalStatus(raw) {
  if (!raw) return 'safe';
  if (raw.includes('정상') || raw.includes('양호')) return 'safe';
  if (raw.includes('주의') || raw.includes('점검')) return 'warn';
  return 'danger';
}
