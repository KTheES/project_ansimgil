# 안심길 🦽 — 교통약자 실시간 안전지도

## 프로젝트 구조

```
ansimgil/
├── api/
│   ├── transport.js   # 교통약자 이동지원 (data.go.kr 15140825)
│   ├── signal.js      # 교통안전 신호등   (data.go.kr 15157604)
│   └── bike.js        # 공영자전거        (data.go.kr 15126639)
├── public/
│   └── index.html     # 프론트엔드
├── vercel.json
└── README.md
```

---

## 🚀 배포 순서 (30분 안에 끝)

### 1. API 키 발급

#### 카카오맵
1. https://developers.kakao.com 접속 → 로그인
2. 내 애플리케이션 → 애플리케이션 추가
3. 앱 키 → **JavaScript 키** 복사
4. 플랫폼 → Web → 사이트 도메인에 `https://[내도메인].vercel.app` 추가

#### data.go.kr 공공데이터
1. https://www.data.go.kr 접속 → 회원가입
2. 아래 3개 API 검색 후 **활용신청** (즉시 or 1~2시간 내 승인)
   - `15140825` 교통약자 이동지원 현황 실시간 정보
   - `15157604` 교통안전 신호등 실시간 정보
   - `15126639` 전국 공영자전거 실시간 정보
3. 마이페이지 → 개발계정 → **일반 인증키(Encoding)** 복사

---

### 2. GitHub에 올리기

```bash
git init
git add .
git commit -m "init: 안심길 교통약자 안전지도"
git remote add origin https://github.com/[유저명]/ansimgil.git
git push -u origin main
```

---

### 3. Vercel 배포

1. https://vercel.com 접속 → GitHub 로그인
2. New Project → ansimgil 레포 선택
3. **Environment Variables** 탭에서 추가:
   - `DATA_API_KEY` = data.go.kr에서 복사한 인코딩 키
4. Deploy 클릭 → 2분 후 URL 발급!

---

### 4. 카카오맵 키 교체

`public/index.html` 13번째 줄:
```html
<!-- 수정 전 -->
src="...appkey=YOUR_KAKAO_KEY..."
<!-- 수정 후 -->
src="...appkey=발급받은_JS_키..."
```
수정 후 git push → Vercel 자동 재배포

---

## ✅ 제출 체크리스트

- [ ] Vercel URL 정상 접속 확인
- [ ] API 3개 데이터 정상 로드 확인
- [ ] 지도에 마커 표시 확인
- [ ] 모바일 화면 확인
- [ ] 기획서(붙임4) 작성
- [ ] 설문조사(붙임5) 작성
- [ ] URL 제출

---

## 🔧 실제 API 응답에 맞게 파싱 조정

api/ 폴더의 각 파일에서 필드명을 실제 응답에 맞게 수정하세요.
API 응답 확인 방법:
```
https://apis.data.go.kr/B552061/TransprtForDisabled/getTransprtForDisabledList
  ?serviceKey=YOUR_KEY&numOfRows=1&pageNo=1&_type=json
```
