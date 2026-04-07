export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const API_KEY = process.env.DATA_API_KEY;

  try {
    const url = new URL('https://apis.data.go.kr/B551982/tsdo_v2/tl_drct_info');
    url.searchParams.set('serviceKey', API_KEY);
    url.searchParams.set('numOfRows', '3');
    url.searchParams.set('pageNo', '1');
    url.searchParams.set('type', 'json');

    const response = await fetch(url.toString());
    const text = await response.text();
    res.status(200).json({ raw: text.slice(0, 1000) });
  } catch (e) {
    res.status(200).json({ error: e.message });
  }
}
