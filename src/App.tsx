import { useState, useEffect, useMemo } from 'react'
import { HashRouter as Router, Routes, Route, useNavigate } from 'react-router-dom'
import { Plane, Check, Waves, ShoppingBag, DollarSign, ChevronLeft, MapPin, Calendar, ExternalLink, RefreshCw, ArrowRight } from 'lucide-react'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent, Badge, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Tabs, TabsList, TabsTrigger, TabsContent, Checkbox } from "@/components/ui"
import { cn } from "@/lib/utils"

// --- 실시간 환율 훅 ---
function useExchangeRate() {
  const [rate, setRate] = useState<number>(1400) // 기본값
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('https://open.er-api.com/v6/latest/USD')
      .then(res => res.json())
      .then(data => {
        if (data.rates && data.rates.KRW) {
          setRate(data.rates.KRW)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return { rate, loading }
}

// --- 항공편 아코디언 컴포넌트 ---
const flights = [
  {
    type: 'out' as const,
    label: '가는 편',
    date: '2026년 7월 7일 (화)',
    flightNo: '7C3211',
    carrier: '제주항공',
    depTime: '오후 8:20',
    depCode: 'ICN',
    depName: '인천 국제',
    arrTime: '오전 2:00',
    arrCode: 'SPN',
    arrName: '사이판 국제',
    arrDate: '2026년 7월 8일 (수)',
    arrSuffix: '+1',
    duration: '4시간 40분',
    stops: '직항',
  },
  {
    type: 'in' as const,
    label: '오는 편',
    date: '2026년 7월 12일 (일)',
    flightNo: '7C3212',
    carrier: '제주항공',
    depTime: '오전 3:05',
    depCode: 'SPN',
    depName: '사이판 국제',
    arrTime: '오전 6:50',
    arrCode: 'ICN',
    arrName: '인천 국제',
    arrDate: '2026년 7월 12일 (일)',
    arrSuffix: '',
    duration: '4시간 45분',
    stops: '직항',
  },
]

function FlightSection() {
  return (
    <section>
      <div className="font-mono text-base font-bold text-gray-400 uppercase border-b border-black/5 pb-2 mb-3 flex items-center gap-2">
        <Plane className="w-4 h-4" /> Flight Info
      </div>
      <Card className="rounded-xl border-black/5 overflow-hidden shadow-sm bg-white">
        <Accordion type="single" collapsible>
          {flights.map((f, i) => {
            const accentBg = f.type === 'out' ? 'bg-teal-50' : 'bg-amber-50'
            const accentText = f.type === 'out' ? 'text-teal-700' : 'text-amber-700'
            return (
              <AccordionItem key={i} value={`flight-${i}`} className="border-b border-black/5 last:border-0">
                <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-gray-50/60 [&>svg]:text-gray-300">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className={cn("w-9 h-9 rounded-full flex items-center justify-center text-xl flex-shrink-0", accentBg)}>
                      {f.type === 'out' ? '🛫' : '🛬'}
                    </div>
                    <div className="flex-grow min-w-0 text-left">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn("text-[11px] font-bold font-mono uppercase", accentText)}>{f.label}</span>
                        <span className="text-[11px] text-gray-400 font-mono">{f.date}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                        <span>{f.depCode}</span>
                        <div className="flex items-center gap-1 text-gray-300">
                          <div className="h-px w-6 bg-gray-200" />
                          <ArrowRight className="w-3 h-3" />
                        </div>
                        <span>{f.arrCode}</span>
                        {f.arrSuffix && <span className="text-[10px] font-mono text-amber-500 font-bold">{f.arrSuffix}</span>}
                      </div>
                      <div className="font-mono text-[11px] text-gray-400 mt-0.5">{f.depTime} → {f.arrTime} · {f.duration} · {f.stops}</div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-5 pb-5 bg-gray-50/40 border-t border-black/5">
                  <div className="flex items-center gap-2 mt-4 mb-4">
                    <Badge className="bg-white border border-black/8 text-gray-600 text-[11px] shadow-none">{f.carrier}</Badge>
                    <span className="font-mono text-[11px] text-gray-400">{f.flightNo}</span>
                  </div>
                  <div className="relative pl-4">
                    <div className="absolute left-[7px] top-3 bottom-3 w-px bg-gray-200" />
                    <div className="relative flex gap-4 mb-5">
                      <div className="w-3 h-3 rounded-full bg-teal-400 border-2 border-white ring-1 ring-teal-200 flex-shrink-0 mt-1" />
                      <div>
                        <div className="text-sm font-bold text-gray-800">{f.depTime}</div>
                        <div className="text-[12px] font-mono text-gray-500">{f.depCode} {f.depName}</div>
                        <div className="text-[11px] text-gray-400 mt-0.5">{f.date} 출발</div>
                      </div>
                    </div>
                    <div className="relative flex gap-4 mb-5">
                      <div className="w-3 h-3 flex-shrink-0" />
                      <div className="text-[11px] font-mono text-gray-400 bg-white border border-black/8 rounded-full px-3 py-1">{f.duration} · {f.stops}</div>
                    </div>
                    <div className="relative flex gap-4">
                      <div className="w-3 h-3 rounded-full bg-amber-400 border-2 border-white ring-1 ring-amber-200 flex-shrink-0 mt-1" />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-bold text-gray-800">{f.arrTime}</span>
                          {f.arrSuffix && <span className="text-[10px] font-mono font-bold text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded-full">{f.arrSuffix}</span>}
                        </div>
                        <div className="text-[12px] font-mono text-gray-500">{f.arrCode} {f.arrName}</div>
                        <div className="text-[11px] text-gray-400 mt-0.5">{f.arrDate} 도착</div>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            )
          })}
        </Accordion>
      </Card>
    </section>
  )
}

// --- 다이빙 플랜 카드 컴포넌트 ---
type EntryType = 'dive' | 'meal' | 'travel' | 'free' | 'rest'
type TimeEntry = { time: string; activity: string; type?: EntryType }
type DaySchedule = { date: string; entries: TimeEntry[] }

const entryStyle: Record<EntryType, { dot: string; text: string }> = {
  dive:   { dot: 'bg-teal-400',   text: 'text-teal-700' },
  meal:   { dot: 'bg-amber-400',  text: 'text-amber-700' },
  travel: { dot: 'bg-blue-400',   text: 'text-blue-700' },
  free:   { dot: 'bg-purple-300', text: 'text-purple-700' },
  rest:   { dot: 'bg-gray-300',   text: 'text-gray-400' },
}

function PlanCard({ days }: { days: DaySchedule[] }) {
  return (
    <Card className="rounded-xl border-black/5 shadow-sm bg-white overflow-hidden">
      <div className="divide-y divide-black/5">
        {days.map((day, i) => (
          <div key={i}>
            <div className="px-4 py-2.5 bg-gray-50 border-b border-black/5 font-mono text-[11px] font-bold text-teal-700 uppercase tracking-wider">
              {day.date}
            </div>
            <div className="divide-y divide-black/[0.04]">
              {day.entries.map((entry, j) => {
                const style = entry.type ? entryStyle[entry.type] : null
                return (
                  <div key={j} className="px-4 py-2.5 flex gap-3 items-start">
                    <div className="font-mono text-[11px] text-gray-400 w-11 flex-shrink-0 pt-0.5">{entry.time}</div>
                    {style && <div className={cn("w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0", style.dot)} />}
                    <div className={cn("text-[13px]", style ? style.text : 'text-gray-700')}>{entry.activity}</div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

// --- 상세 페이지 컴포넌트 (사이판) ---
function SaipanDetail() {
  const navigate = useNavigate();
  const { rate, loading: rateLoading } = useExchangeRate()
  
  // 예산 항목 상태
  const [budgetItems, setBudgetItems] = useState([
    { id: 'flight', name: '항공권', usd: 0, krw: 344600, note: '제주항공', checked: true },
    { id: 'diving_pkg', name: '4박5일 다이빙 패키지', usd: 530, krw: 0, note: '숙박+다이빙 포함', checked: true, url: 'http://prosaipan.com/page_LfEm64' },
    { id: 'extra_tanks', name: '보트 2회 추가', usd: 160, krw: 0, note: '다이빙 집중 시', checked: true },
    { id: 'extra_dorm', name: '도미토리 1박 추가', usd: 25, count: 3, krw: 0, note: '7/7 도착일 포함 3박', checked: true },
    { id: 'gear', name: '장비 렌탈', usd: 90, krw: 0, note: '', checked: true },
    { id: 'airport_transfer', name: '공항 픽드랍', usd: 17, krw: 0, note: '$50 왕복 · 3인 분담', checked: true },
    { id: 'pocket', name: '여비 (식비·관광)', usd: 300, krw: 0, note: '식사당 $5~$20', checked: true },
    { id: 'car', name: '차 렌트 (옵션)', usd: 0, krw: 82610, note: '미정', checked: false },
  ])

  // 체크리스트 상태
  const [checklist, setChecklist] = useState([
    { id: 1, text: "여권 (유효기간 6개월 이상)", sub: "필수 — 없으면 탑승 불가", done: false },
    { id: 2, text: "수영복 · 래시가드", sub: "바다 입수 시 래시가드 권장", done: false },
    { id: 3, text: "수건 4장 이상", sub: "숙소 수건 없음 · 건조기 있음", done: false },
    { id: 4, text: "다이버 C-카드 (소지 시)", sub: "PADI 등 자격증", done: false },
    { id: 5, text: "친환경 선크림", sub: "옥시벤존 금지 성분 확인", done: false },
    { id: 6, text: "멀미약", sub: "보트 탑승 전 복용 권장", done: false },
    { id: 7, text: "방수 파우치 · 액션캠", sub: "GoPro 등 촬영 장비", done: false },
    { id: 8, text: "USD 현금 일부", sub: "팁 및 비상금", done: false },
    { id: 9, text: "여행자 보험 가입", sub: "다이빙 포함 여부 확인", done: false },
    { id: 10, text: "귀마개 · 방수 귀약", sub: "외이도염 예방용", done: false },
  ])

  const toggleBudgetItem = (id: string) => {
    setBudgetItems(prev => prev.map(item => item.id === id ? { ...item, checked: !item.checked } : item))
  }

  const toggleCheck = (id: number) => {
    setChecklist(prev => prev.map(item => item.id === id ? { ...item, done: !item.done } : item))
  }

  const totalAmount = useMemo(() => {
    return budgetItems.reduce((acc, item) => {
      if (!item.checked) return acc;
      const usdToKrw = (item.usd * (item.count || 1)) * rate;
      return acc + usdToKrw + (item.krw || 0);
    }, 0)
  }, [budgetItems, rate])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center pb-12 w-full animate-in fade-in duration-500">
      <header className="w-full bg-teal-900 text-white py-12 px-6 text-center relative overflow-hidden">
        <button onClick={() => navigate('/')} className="absolute top-6 left-6 z-20 flex items-center gap-1 text-teal-100 hover:text-white transition-colors text-sm font-medium">
          <ChevronLeft className="w-4 h-4" /> 목록으로
        </button>
        <div className="relative z-10 max-w-2xl mx-auto">
          <div className="font-mono text-[11px] font-medium tracking-[0.12em] uppercase text-teal-100 mb-3 flex justify-center items-center gap-2">
            <Waves className="w-4 h-4" /> Diving Trip Plan
          </div>
          <h1 className="text-[32px] md:text-[40px] font-bold tracking-tight mb-2">사이판 다이빙 여행</h1>
          <div className="font-mono text-sm text-white/65 mb-6">2026 · 07. 07 (TUE) — 07. 12 (SUN)</div>
          <div className="flex flex-wrap justify-center gap-2">
            <Badge variant="outline" className="bg-white/12 border-white/20 text-white/90 rounded-full px-4 py-1">제주항공 왕복</Badge>
            <Badge variant="outline" className="bg-white/12 border-white/20 text-white/90 rounded-full px-4 py-1">5박 6일</Badge>
            <Badge variant="outline" className="bg-white/12 border-white/20 text-white/90 rounded-full px-4 py-1">펀다이빙</Badge>
          </div>
        </div>
      </header>

      <main className="w-full max-w-[720px] px-4 pt-8 space-y-9">
        <FlightSection />

        <section>
          <div className="flex justify-between items-end mb-3 border-b border-black/5 pb-2 px-1">
            <div className="font-mono text-base font-bold text-gray-400 uppercase flex items-center gap-2">
              <DollarSign className="w-4 h-4" /> Budget
            </div>
            <div className="font-mono text-xs text-gray-400">환율 : ₩{rate.toLocaleString()} / USD</div>
            {rateLoading && <RefreshCw className="w-3 h-3 animate-spin text-gray-400" />}
          </div>
          <Card className="rounded-xl border-black/5 overflow-hidden shadow-sm bg-white overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead className="bg-gray-50/50 text-gray-400 font-mono text-[11px] uppercase border-b border-black/5">
                <tr><th className="p-4 w-10"></th><th className="text-left p-4">항목</th><th className="text-right p-4">USD</th><th className="text-right p-4">KRW (합산)</th></tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {budgetItems.map((item) => (
                  <tr key={item.id} className={cn("transition-colors", item.checked ? "bg-white" : "bg-gray-50/50 grayscale opacity-60")}>
                    <td className="p-4 text-center">
                      <Checkbox checked={item.checked} onCheckedChange={() => toggleBudgetItem(item.id)} />
                    </td>
                    <td className="p-4">
                      <div className="font-medium flex items-center gap-1">
                        {item.name}
                        {item.url && <a href={item.url} target="_blank" rel="noreferrer"><ExternalLink className="w-3 h-3 text-blue-400" /></a>}
                      </div>
                      <div className="text-[11px] text-gray-400">{item.note}</div>
                    </td>
                    <td className="p-4 text-right font-mono text-gray-500">
                      {item.usd > 0 ? `$${(item.usd * (item.count || 1)).toLocaleString()}` : '-'}
                    </td>
                    <td className="p-4 text-right font-medium">
                      {item.krw > 0 ? `₩${item.krw.toLocaleString()}` : `₩${Math.round(item.usd * (item.count || 1) * rate).toLocaleString()}`}
                    </td>
                  </tr>
                ))}
                <tr className="bg-teal-600 text-white font-bold text-lg">
                  <td colSpan={3} className="p-5">선택 항목 총 합계</td>
                  <td className="p-5 text-right font-mono tracking-tighter">₩{Math.round(totalAmount).toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </Card>
        </section>

        <section>
          <div className="font-mono text-base font-bold text-gray-400 uppercase border-b border-black/5 pb-2 mb-4 px-1 flex items-center gap-2">
            <Waves className="w-4 h-4" /> Diving Plan
          </div>
          <Tabs defaultValue="a" className="w-full">
            <TabsList className="bg-white border border-black/5 p-1 rounded-full w-full h-auto flex flex-wrap shadow-sm">
              <TabsTrigger value="a" className="flex-1 rounded-full py-2 data-[state=active]:bg-teal-600 data-[state=active]:text-white text-xs md:text-sm">플랜 A</TabsTrigger>
              <TabsTrigger value="b" className="flex-1 rounded-full py-2 data-[state=active]:bg-teal-600 data-[state=active]:text-white text-xs md:text-sm">플랜 B</TabsTrigger>
              <TabsTrigger value="c" className="flex-1 rounded-full py-2 data-[state=active]:bg-teal-600 data-[state=active]:text-white text-xs md:text-sm">플랜 C</TabsTrigger>
            </TabsList>
            <TabsContent value="a" className="mt-4 space-y-4">
              <PlanCard days={[
                { date: '7/7 (화) — 출발', entries: [
                  { time: '18:00', activity: '인천공항 이동', type: 'travel' },
                  { time: '19:30', activity: '인천공항 도착 · 체크인', type: 'travel' },
                  { time: '20:20', activity: '제주항공 출발', type: 'travel' },
                ]},
                { date: '7/8 (수) — 도착 · 다이빙 Day 1', entries: [
                  { time: '02:00', activity: '사이판 공항 도착', type: 'travel' },
                  { time: '02:30', activity: '입국심사 · 수하물 수취', type: 'travel' },
                  { time: '03:15', activity: '숙소 이동', type: 'travel' },
                  { time: '03:45', activity: '체크인 · 취침', type: 'rest' },
                  { time: '08:00', activity: '기상 · 아침식사', type: 'meal' },
                  { time: '08:30', activity: '브리핑 · 장비 셋업', type: 'dive' },
                  { time: '09:00', activity: '1탱크 보트 다이빙 출발', type: 'dive' },
                  { time: '10:30', activity: '귀환 · 수면 간격 휴식', type: 'rest' },
                  { time: '11:30', activity: '2탱크 보트 다이빙 출발', type: 'dive' },
                  { time: '13:00', activity: '귀환 · 장비 세척', type: 'dive' },
                  { time: '13:30', activity: '점심식사', type: 'meal' },
                  { time: '15:00', activity: '자유시간 (해변·스낵 탐방)', type: 'free' },
                  { time: '18:30', activity: '저녁식사', type: 'meal' },
                ]},
                { date: '7/9 (목) — 다이빙 Day 2', entries: [
                  { time: '07:30', activity: '기상', type: 'rest' },
                  { time: '08:00', activity: '아침식사', type: 'meal' },
                  { time: '08:30', activity: '브리핑 · 장비 셋업', type: 'dive' },
                  { time: '09:00', activity: '1탱크 보트 다이빙 출발', type: 'dive' },
                  { time: '10:30', activity: '귀환 · 수면 간격 휴식', type: 'rest' },
                  { time: '11:30', activity: '2탱크 보트 다이빙 출발', type: 'dive' },
                  { time: '13:00', activity: '귀환 · 장비 세척', type: 'dive' },
                  { time: '13:30', activity: '점심식사', type: 'meal' },
                  { time: '15:00', activity: '자유시간 (마나가하섬 or 쇼핑)', type: 'free' },
                  { time: '18:30', activity: '저녁식사', type: 'meal' },
                ]},
                { date: '7/10 (금) — 다이빙 Day 3', entries: [
                  { time: '07:30', activity: '기상', type: 'rest' },
                  { time: '08:00', activity: '아침식사', type: 'meal' },
                  { time: '08:30', activity: '브리핑 · 장비 셋업', type: 'dive' },
                  { time: '09:00', activity: '1탱크 보트 다이빙 출발', type: 'dive' },
                  { time: '10:30', activity: '귀환 · 수면 간격 휴식', type: 'rest' },
                  { time: '11:30', activity: '2탱크 보트 다이빙 출발', type: 'dive' },
                  { time: '13:00', activity: '귀환 · 장비 세척 · 반납', type: 'dive' },
                  { time: '13:30', activity: '점심식사', type: 'meal' },
                  { time: '15:00', activity: '북부 관광 (버드아일랜드 · 자살절벽)', type: 'free' },
                  { time: '18:30', activity: '저녁식사 · 기념품 쇼핑', type: 'meal' },
                  { time: '21:00', activity: '짐 정리 · 귀국 준비', type: 'rest' },
                ]},
                { date: '7/11 (토) — 관광', entries: [
                  { time: '08:00', activity: '기상 · 아침식사', type: 'meal' },
                  { time: '10:00', activity: '마나가하섬 투어 출발 (페리)', type: 'travel' },
                  { time: '13:00', activity: '귀환 · 점심식사', type: 'meal' },
                  { time: '15:00', activity: 'DFS 쇼핑 · 해변 산책', type: 'free' },
                  { time: '18:30', activity: '저녁식사', type: 'meal' },
                  { time: '21:00', activity: '최종 짐 정리', type: 'rest' },
                ]},
                { date: '7/12 (일) — 귀국', entries: [
                  { time: '01:30', activity: '기상 · 체크아웃', type: 'rest' },
                  { time: '02:00', activity: '공항 이동', type: 'travel' },
                  { time: '03:05', activity: '제주항공 인천행 출발', type: 'travel' },
                  { time: '06:50', activity: '인천공항 도착', type: 'travel' },
                ]},
              ]} />
            </TabsContent>
            <TabsContent value="b" className="mt-4 space-y-4">
              <PlanCard days={[
                { date: '7/7 (화) — 출발', entries: [
                  { time: '18:00', activity: '인천공항 이동', type: 'travel' },
                  { time: '19:30', activity: '인천공항 도착 · 체크인', type: 'travel' },
                  { time: '20:20', activity: '제주항공 출발', type: 'travel' },
                ]},
                { date: '7/8 (수) — 도착 · 휴식', entries: [
                  { time: '02:00', activity: '사이판 공항 도착', type: 'travel' },
                  { time: '02:30', activity: '입국심사 · 수하물 수취', type: 'travel' },
                  { time: '03:15', activity: '숙소 이동', type: 'travel' },
                  { time: '03:45', activity: '체크인 · 취침', type: 'rest' },
                  { time: '10:00', activity: '기상 · 브런치', type: 'meal' },
                  { time: '11:30', activity: '장비 렌탈 · 셋업 확인', type: 'dive' },
                  { time: '13:00', activity: '해변 산책 · 컨디션 조절', type: 'free' },
                  { time: '15:00', activity: '숙소 휴식', type: 'rest' },
                  { time: '18:30', activity: '저녁식사', type: 'meal' },
                  { time: '20:00', activity: '다음날 브리핑 확인', type: 'rest' },
                ]},
                { date: '7/9 (목) — 다이빙 Day 1 (3탱크)', entries: [
                  { time: '07:00', activity: '기상', type: 'rest' },
                  { time: '07:30', activity: '아침식사', type: 'meal' },
                  { time: '08:00', activity: '브리핑 · 장비 셋업', type: 'dive' },
                  { time: '08:30', activity: '1탱크 보트 다이빙 출발', type: 'dive' },
                  { time: '10:00', activity: '귀환 · 수면 간격 휴식', type: 'rest' },
                  { time: '10:30', activity: '2탱크 보트 다이빙 출발', type: 'dive' },
                  { time: '12:00', activity: '귀환 · 점심식사', type: 'meal' },
                  { time: '14:00', activity: '3탱크 오후 보트 다이빙 출발', type: 'dive' },
                  { time: '15:30', activity: '귀환 · 장비 세척', type: 'dive' },
                  { time: '17:00', activity: '휴식 · 스트레칭', type: 'rest' },
                  { time: '18:30', activity: '저녁식사', type: 'meal' },
                ]},
                { date: '7/10 (금) — 다이빙 Day 2 (3탱크)', entries: [
                  { time: '07:00', activity: '기상', type: 'rest' },
                  { time: '07:30', activity: '아침식사', type: 'meal' },
                  { time: '08:00', activity: '브리핑', type: 'dive' },
                  { time: '08:30', activity: '1탱크 보트 다이빙 출발', type: 'dive' },
                  { time: '10:00', activity: '귀환 · 수면 간격 휴식', type: 'rest' },
                  { time: '10:30', activity: '2탱크 보트 다이빙 출발', type: 'dive' },
                  { time: '12:00', activity: '귀환 · 점심식사', type: 'meal' },
                  { time: '14:00', activity: '3탱크 오후 보트 다이빙 출발', type: 'dive' },
                  { time: '15:30', activity: '귀환 · 장비 세척', type: 'dive' },
                  { time: '17:00', activity: '자유시간 (쇼핑 · 산책)', type: 'free' },
                  { time: '18:30', activity: '저녁식사', type: 'meal' },
                ]},
                { date: '7/11 (토) — 다이빙 Day 3 (2탱크) · 관광', entries: [
                  { time: '07:00', activity: '기상', type: 'rest' },
                  { time: '07:30', activity: '아침식사', type: 'meal' },
                  { time: '08:00', activity: '브리핑', type: 'dive' },
                  { time: '08:30', activity: '1탱크 보트 다이빙 출발', type: 'dive' },
                  { time: '10:00', activity: '귀환 · 수면 간격 휴식', type: 'rest' },
                  { time: '10:30', activity: '2탱크 보트 다이빙 출발', type: 'dive' },
                  { time: '12:00', activity: '귀환 · 장비 세척 · 반납', type: 'dive' },
                  { time: '12:30', activity: '점심식사', type: 'meal' },
                  { time: '14:00', activity: '마나가하섬 투어 or 북부 관광', type: 'free' },
                  { time: '18:30', activity: '저녁식사 · 기념품 쇼핑', type: 'meal' },
                  { time: '21:00', activity: '짐 정리 · 귀국 준비', type: 'rest' },
                ]},
                { date: '7/12 (일) — 귀국', entries: [
                  { time: '01:30', activity: '기상 · 체크아웃', type: 'rest' },
                  { time: '02:00', activity: '공항 이동', type: 'travel' },
                  { time: '03:05', activity: '제주항공 인천행 출발', type: 'travel' },
                  { time: '06:50', activity: '인천공항 도착', type: 'travel' },
                ]},
              ]} />
            </TabsContent>
            <TabsContent value="c" className="mt-4 space-y-4">
              <PlanCard days={[
                { date: '7/7 (화) — 출발', entries: [
                  { time: '18:00', activity: '인천공항 이동', type: 'travel' },
                  { time: '19:30', activity: '인천공항 도착 · 체크인', type: 'travel' },
                  { time: '20:20', activity: '제주항공 출발', type: 'travel' },
                ]},
                { date: '7/8 (수) — 도착 · 오후 보트 3탱크', entries: [
                  { time: '02:00', activity: '사이판 공항 도착', type: 'travel' },
                  { time: '02:30', activity: '입국심사 · 수하물 수취', type: 'travel' },
                  { time: '03:15', activity: '숙소 이동', type: 'travel' },
                  { time: '03:45', activity: '체크인 · 취침', type: 'rest' },
                  { time: '10:00', activity: '기상 · 브런치', type: 'meal' },
                  { time: '11:30', activity: '장비 렌탈 · 셋업', type: 'dive' },
                  { time: '12:30', activity: '브리핑', type: 'dive' },
                  { time: '13:00', activity: '1탱크 오후 보트 출발', type: 'dive' },
                  { time: '14:30', activity: '귀환 · 수면 간격 휴식', type: 'rest' },
                  { time: '15:00', activity: '2탱크 보트 출발', type: 'dive' },
                  { time: '16:30', activity: '귀환 · 수면 간격 휴식', type: 'rest' },
                  { time: '17:00', activity: '3탱크 보트 출발', type: 'dive' },
                  { time: '18:30', activity: '귀환 · 장비 세척', type: 'dive' },
                  { time: '19:00', activity: '저녁식사', type: 'meal' },
                ]},
                { date: '7/9 (목) — 그로토 2탱크', entries: [
                  { time: '07:30', activity: '기상', type: 'rest' },
                  { time: '08:00', activity: '아침식사', type: 'meal' },
                  { time: '08:30', activity: '장비 셋업', type: 'dive' },
                  { time: '09:00', activity: '그로토 이동 (차 10분)', type: 'travel' },
                  { time: '09:15', activity: '1탱크 그로토 비치 다이빙', type: 'dive' },
                  { time: '10:30', activity: '귀환 · 수면 간격 휴식', type: 'rest' },
                  { time: '11:00', activity: '2탱크 그로토 비치 다이빙', type: 'dive' },
                  { time: '12:30', activity: '귀환 · 장비 세척', type: 'dive' },
                  { time: '13:00', activity: '점심식사', type: 'meal' },
                  { time: '14:30', activity: '자유시간 (비치 · 그로토 포토존)', type: 'free' },
                  { time: '18:30', activity: '저녁식사', type: 'meal' },
                ]},
                { date: '7/10 (금) — 보트 3탱크', entries: [
                  { time: '07:00', activity: '기상', type: 'rest' },
                  { time: '07:30', activity: '아침식사', type: 'meal' },
                  { time: '08:00', activity: '브리핑 · 장비 셋업', type: 'dive' },
                  { time: '08:30', activity: '1탱크 보트 다이빙 출발', type: 'dive' },
                  { time: '10:00', activity: '귀환 · 수면 간격 휴식', type: 'rest' },
                  { time: '10:30', activity: '2탱크 보트 다이빙 출발', type: 'dive' },
                  { time: '12:00', activity: '귀환 · 점심식사', type: 'meal' },
                  { time: '14:00', activity: '3탱크 오후 보트 다이빙 출발', type: 'dive' },
                  { time: '15:30', activity: '귀환 · 장비 세척 · 반납', type: 'dive' },
                  { time: '17:00', activity: '휴식', type: 'rest' },
                  { time: '18:30', activity: '저녁식사', type: 'meal' },
                ]},
                { date: '7/11 (토) — 자유', entries: [
                  { time: '08:00', activity: '기상 · 아침식사', type: 'meal' },
                  { time: '10:00', activity: '마나가하섬 투어 (페리) or 북부 관광', type: 'free' },
                  { time: '12:30', activity: '점심식사', type: 'meal' },
                  { time: '14:00', activity: 'DFS 쇼핑 · 해변 휴식', type: 'free' },
                  { time: '17:00', activity: '기념품 구입', type: 'free' },
                  { time: '18:30', activity: '저녁식사', type: 'meal' },
                  { time: '20:00', activity: '짐 정리 · 귀국 준비', type: 'rest' },
                ]},
                { date: '7/12 (일) — 귀국', entries: [
                  { time: '01:30', activity: '기상 · 체크아웃', type: 'rest' },
                  { time: '02:00', activity: '공항 이동', type: 'travel' },
                  { time: '03:05', activity: '제주항공 인천행 출발', type: 'travel' },
                  { time: '06:50', activity: '인천공항 도착', type: 'travel' },
                ]},
              ]} />
            </TabsContent>
          </Tabs>
        </section>

        <section>
          <div className="font-mono text-base font-bold text-gray-400 uppercase border-b border-black/5 pb-2 mb-3 px-1 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4" /> Checklist
          </div>
          <Card className="rounded-xl border-black/5 overflow-hidden shadow-sm bg-white divide-y divide-black/5">
            {checklist.map((item) => (
              <div 
                key={item.id} 
                className={cn("flex items-start gap-4 p-4 cursor-pointer transition-colors hover:bg-gray-50", item.done && "bg-gray-50/50")}
                onClick={() => toggleCheck(item.id)}
              >
                <div className={cn("w-5 h-5 rounded-md border-2 mt-0.5 flex items-center justify-center transition-all", item.done ? "bg-teal-400 border-teal-400" : "bg-white border-black/10 shadow-inner")}>
                  {item.done && <Check className="w-3.5 h-3.5 text-white stroke-[3px]" />}
                </div>
                <div className="flex-grow min-w-0">
                  <div className={cn("text-[13px] font-semibold transition-all", item.done ? "text-gray-400 line-through" : "text-gray-900")}>{item.text}</div>
                  <div className="text-[11.5px] text-gray-400 mt-0.5">{item.sub}</div>
                </div>
              </div>
            ))}
          </Card>
        </section>
      </main>
      <footer className="mt-20 text-center font-mono text-[11px] text-gray-400">
        <p>© 2026 KG.</p>
      </footer>
    </div>
  )
}

// --- 메인 리스트 컴포넌트 ---
function TripList() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-24 px-6">
      <div className="w-full max-w-sm space-y-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-2">여행 기록</h1>
          <p className="text-slate-400 font-mono text-sm tracking-widest uppercase">My Travel Archives</p>
        </div>
        <Card 
          className="border-none shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden cursor-pointer bg-white group hover:-translate-y-2"
          onClick={() => navigate('/trip/saipan-2026')}
        >
          <div className="h-4 bg-teal-600 w-full"></div>
          <CardHeader className="pt-8 pb-6">
            <CardTitle className="text-2xl group-hover:text-teal-600 transition-colors mb-2">사이판 다이빙 여행</CardTitle>
            <CardDescription className="font-mono text-xs flex items-center gap-2 text-slate-400">
              <Calendar className="w-3 h-3" /> 2026.07.07 - 07.12
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-8">
            <p className="text-sm text-slate-500 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-slate-300" /> 사이판 (Saipan)
            </p>
          </CardContent>
          <CardFooter className="bg-slate-50 border-t py-4 text-center">
            <div className="w-full text-xs font-bold text-teal-600 uppercase tracking-widest">상세 계획 보기</div>
          </CardFooter>
        </Card>
        <footer className="text-center text-[10px] text-slate-300 font-mono pt-12">
          © 2026 TRAVEL PLANNER · ALL RIGHTS RESERVED
        </footer>
      </div>
    </div>
  )
}

// --- 메인 앱 (라우터 설정) ---
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<TripList />} />
        <Route path="/trip/saipan-2026" element={<SaipanDetail />} />
      </Routes>
    </Router>
  )
}

export default App
