// api/bike.js
// 전국 공영자전거 실시간 정보
// https://www.data.go.kr/data/15126639/openapi.do

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const API_KEY = process.env.DATA_API_KEY;
  const { numOfRows = 20, pageNo = 1 } = req.query;

  try {
    const url = new URL('https://apis.data.go.kr/B552061/PublicBicycle/getPublicBicycleList');
    url.searchParams.set('serviceKey', API_KEY);
    url.searchParams.set('numOfRows', numOfRows);
    url.searchParams.set('pageNo', pageNo);
    url.searchParams.set('_type', 'json');

    const response = await fetch(url.toString());
    const json = await response.json();

    const items = json?.response?.body?.items?.item ?? [];

    const parsed = (Array.isArray(items) ? items : [items]).map(item => ({
      id: item.stationId ?? item.sn,
      name: item.stationNm ?? item.rackNm ?? '자전거 스테이션',
      status: mapBikeStatus(item.parkingCnt, item.rackTotCnt),
      statusText: getBikeStatusText(item.parkingCnt, item.rackTotCnt),
      lat: parseFloat(item.stationLa ?? item.la ?? 0),
      lng: parseFloat(item.stationLo ?? item.lo ?? 0),
      detail1: `대여 가능 ${item.parkingCnt ?? 0}대`,
      detail2: `반납 가능 ${(item.rackTotCnt ?? 0) - (item.parkingCnt ?? 0)}대`,
      type: 'bike',
    })).filter(i => i.lat !== 0);

    res.status(200).json({ success: true, data: parsed, total: items.length });
  } catch (e) {
    console.error('bike API error:', e);
    res.status(500).json({ success: false, error: e.message });
  }
}

function mapBikeStatus(parking, total) {
  if (!parking || !total) return 'warn';
  const ratio = parking / total;
  if (ratio >= 0.3) return 'safe';
  if (ratio >= 0.1) return 'warn';
  return 'danger';
}

function getBikeStatusText(parking, total) {
  if (!parking || !total) return '정보없음';
  const ratio = parking / total;
  if (ratio >= 0.3) return '여유';
  if (ratio >= 0.1) return '혼잡';
  return '매진임박';
}
