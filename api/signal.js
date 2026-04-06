// api/signal.js
// 신호제어기 신호잔여시간 정보

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const API_KEY = process.env.DATA_API_KEY;
  const { numOfRows = 20, pageNo = 1 } = req.query;

  try {
    const url = new URL('https://apis.data.go.kr/B551982/rti/tl_drct_info');
    url.searchParams.set('serviceKey', API_KEY);
    url.searchParams.set('numOfRows', numOfRows);
    url.searchParams.set('pageNo', pageNo);
    url.searchParams.set('type', 'json');

    const response = await fetch(url.toString());
    const text = await response.text();

    // raw 응답 확인용 (디버깅)
    let json;
    try { json = JSON.parse(text); }
    catch { return res.status(200).json({ success: true, data: [], total: 0, debug: text.slice(0, 300) }); }

    const items = json?.response?.body?.items?.item ?? json?.items?.item ?? json?.item ?? [];
    const arr = Array.isArray(items) ? items : (items ? [items] : []);

    const parsed = arr.map(item => ({
      id: item.itstId ?? item.sn ?? Math.random(),
      name: item.itstNm ?? item.crossNm ?? '교차로',
      status: mapSignalStatus(item),
      statusText: getSignalStatusText(item),
      lat: parseFloat(item.latitude ?? item.la ?? item.lat ?? 0),
      lng: parseFloat(item.longitude ?? item.lo ?? item.lon ?? 0),
      detail1: `보행신호 잔여 ${item.pedestrianRemainTime ?? item.pedRmdrTime ?? '-'}초`,
      detail2: `차량신호 잔여 ${item.vehicleRemainTime ?? item.vhcleRmdrTime ?? '-'}초`,
      type: 'signal',
    })).filter(i => i.lat !== 0);

    res.status(200).json({ success: true, data: parsed, total: arr.length });
  } catch (e) {
    // 500 대신 빈 데이터로 응답 (프론트 에러 방지)
    res.status(200).json({ success: true, data: [], total: 0, error: e.message });
  }
}

function mapSignalStatus(item) {
  const ped = parseInt(item.pedestrianRemainTime ?? item.pedRmdrTime ?? 30);
  if (ped >= 20) return 'safe';
  if (ped >= 10) return 'warn';
  return 'danger';
}

function getSignalStatusText(item) {
  const ped = parseInt(item.pedestrianRemainTime ?? item.pedRmdrTime ?? 30);
  if (ped >= 20) return '안전';
  if (ped >= 10) return '주의';
  return '위험';
}
