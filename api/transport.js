export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const API_KEY = process.env.DATA_API_KEY;
  const { numOfRows = 20, pageNo = 1 } = req.query;

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
    catch { return res.status(200).json({ success: true, data: [], total: 0 }); }

    const items = json?.body?.item ?? [];
    const arr = Array.isArray(items) ? items : [items];

    const regionCoords = {
      '서울특별시':  { lat: 37.5665, lng: 126.9780 },
      '부산광역시':  { lat: 35.1796, lng: 129.0756 },
      '대구광역시':  { lat: 35.8714, lng: 128.6014 },
      '인천광역시':  { lat: 37.4563, lng: 126.7052 },
      '광주광역시':  { lat: 35.1595, lng: 126.8526 },
      '대전광역시':  { lat: 36.3504, lng: 127.3845 },
      '울산광역시':  { lat: 35.5384, lng: 129.3114 },
      '세종특별자치시': { lat: 36.4800, lng: 127.2890 },
      '경기도':     { lat: 37.4138, lng: 127.5183 },
      '강원도':     { lat: 37.8228, lng: 128.1555 },
      '충청북도':   { lat: 36.6357, lng: 127.4917 },
      '충청남도':   { lat: 36.5184, lng: 126.8000 },
      '전라북도':   { lat: 35.7175, lng: 127.1530 },
      '전라남도':   { lat: 34.8679, lng: 126.9910 },
      '경상북도':   { lat: 36.4919, lng: 128.8889 },
      '경상남도':   { lat: 35.4606, lng: 128.2132 },
      '제주특별자치도': { lat: 33.4890, lng: 126.4983 },
    };

    const parsed = arr.map((item, idx) => {
      const avl = parseInt(item.avlVhclCntom || 0);
      const opr = parseInt(item.oprVhclCntom || 0);
      const tot = parseInt(item.tvhclCntom || 1);
      const coords = regionCoords[item.lclgvNm] ?? { lat: 36.5 + idx * 0.1, lng: 127.5 };

      return {
        id: item.cntrId ?? idx,
        name: item.cntrNm ?? '이동지원센터',
        status: avl > 0 ? 'safe' : opr > 0 ? 'warn' : 'danger',
        statusText: avl > 0 ? '대기가능' : opr > 0 ? '운행중' : '불가',
        lat: coords.lat,
        lng: coords.lng,
        detail1: `가용 ${avl}대 / 전체 ${tot}대`,
        detail2: `대기 ${item.wtngNocs ?? 0}건`,
        type: 'transport',
      };
    });

    res.status(200).json({ success: true, data: parsed, total: arr.length });
  } catch (e) {
    res.status(200).json({ success: true, data: [], total: 0, error: e.message });
  }
}
