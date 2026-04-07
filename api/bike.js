export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const API_KEY = process.env.DATA_API_KEY;
  const { numOfRows = 30, pageNo = 1 } = req.query;

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
    catch { return res.status(200).json({ success: true, data: [], total: 0 }); }

    const items = json?.body?.item ?? [];
    const arr = Array.isArray(items) ? items : [items];

    const parsed = arr.map(item => {
      const avail = parseInt(item.bcyclTpkctNocs ?? 0);
      return {
        id: item.rntstnId ?? Math.random(),
        name: item.rntstnNm ?? '자전거 스테이션',
        status: avail >= 5 ? 'safe' : avail >= 1 ? 'warn' : 'danger',
        statusText: avail >= 5 ? '여유' : avail >= 1 ? '혼잡' : '없음',
        lat: parseFloat(item.lat ?? 0),
        lng: parseFloat(item.lot ?? 0), // lot = 경도!
        detail1: `대여 가능 ${avail}대`,
        detail2: item.lcgvmnInstNm ?? '-',
        type: 'bike',
      };
    }).filter(i => i.lat !== 0 && i.lng !== 0);

    res.status(200).json({ success: true, data: parsed, total: arr.length });
  } catch (e) {
    res.status(200).json({ success: true, data: [], total: 0, error: e.message });
  }
}
