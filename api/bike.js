// api/bike.js
// 자치단체 공영자전거 대여가능 현황

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const API_KEY = process.env.DATA_API_KEY;
  const { numOfRows = 20, pageNo = 1 } = req.query;

  try {
    const url = new URL('https://apis.data.go.kr/B551982/pbdo_v2/inf_101_00010002_v2');
    url.searchParams.set('serviceKey', API_KEY);
    url.searchParams.set('numOfRows', numOfRows);
    url.searchParams.set('pageNo', pageNo);
    url.searchParams.set('type', 'json');

    const response = await fetch(url.toString());
    const text = await response.text();

    let json;
    try { json = JSON.parse(text); }
    catch { return res.status(200).json({ success: true, data: [], total: 0, debug: text.slice(0, 300) }); }

    const items = json?.response?.body?.items?.item ?? json?.items?.item ?? json?.item ?? [];
    const arr = Array.isArray(items) ? items : (items ? [items] : []);

    const parsed = arr.map(item => ({
      id: item.rentSttnId ?? item.stationId ?? Math.random(),
      name: item.rentSttnNm ?? item.stationNm ?? '자전거 스테이션',
      status: mapBikeStatus(item.rntPosblBicycleCnt, item.rackTotCnt),
      statusText: getBikeStatusText(item.rntPosblBicycleCnt, item.rackTotCnt),
      lat: parseFloat(item.latitude ?? item.stationLa ?? item.la ?? 0),
      lng: parseFloat(item.longitude ?? item.stationLo ?? item.lo ?? 0),
      detail1: `대여 가능 ${item.rntPosblBicycleCnt ?? 0}대`,
      detail2: `전체 거치대 ${item.rackTotCnt ?? 0}대`,
      type: 'bike',
    })).filter(i => i.lat !== 0);

    res.status(200).json({ success: true, data: parsed, total: arr.length });
  } catch (e) {
    res.status(200).json({ success: true, data: [], total: 0, error: e.message });
  }
}

function mapBikeStatus(avail, total) {
  if (!avail || !total) return 'warn';
  const ratio = avail / total;
  if (ratio >= 0.3) return 'safe';
  if (ratio >= 0.1) return 'warn';
  return 'danger';
}

function getBikeStatusText(avail, total) {
  if (!avail || !total) return '정보없음';
  const ratio = avail / total;
  if (ratio >= 0.3) return '여유';
  if (ratio >= 0.1) return '혼잡';
  return '매진임박';
}
