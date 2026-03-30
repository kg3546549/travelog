import { useState, useEffect, useMemo } from 'react'
import { HashRouter as Router, Routes, Route, useNavigate } from 'react-router-dom'
import { Plane, Check, Waves, ShoppingBag, DollarSign, ChevronLeft, MapPin, Calendar, ExternalLink, RefreshCw, ArrowRight, Plus, Trash2, Users, Percent, Wallet, BadgeCheck } from 'lucide-react'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent, Badge, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Tabs, TabsList, TabsTrigger, TabsContent, Checkbox } from "@/components/ui"
import { cn } from "@/lib/utils"

// ─── Types ──────────────────────────────────────────────────────────────────
type SplitType    = 'individual' | 'shared'
type VendorStatus = 'paid' | 'unpaid'
type EntryType    = 'dive' | 'meal' | 'travel' | 'free' | 'rest'

interface BudgetItem {
  id: string
  emoji: string
  name: string
  usd: number        // per-person (individual) | total (shared)
  krw: number        // per-person (individual) | total (shared)
  note: string
  checked: boolean
  split: SplitType
  splitCount: number // for shared: N-way split; for individual: 1
  vendorStatus: VendorStatus
  advanceUsd: number // already paid — same scale as usd
  advanceKrw: number // already paid — same scale as krw
  url?: string
}

interface Member {
  id: string
  name: string
  isMe: boolean
  settled: boolean
}

interface TimeEntry    { time: string; activity: string; type?: EntryType }
interface DaySchedule  { date: string; entries: TimeEntry[] }

// ─── Helpers ────────────────────────────────────────────────────────────────
const f = (n: number) => Math.round(n).toLocaleString()

function ppKrw(item: BudgetItem, rate: number): number {
  const base = item.krw || Math.round(item.usd * rate)
  return item.split === 'shared' ? Math.round(base / item.splitCount) : base
}

function ppAdvKrw(item: BudgetItem, rate: number): number {
  const base = item.advanceKrw + Math.round(item.advanceUsd * rate)
  return item.split === 'shared' ? Math.round(base / item.splitCount) : base
}

function totKrw(item: BudgetItem, rate: number, n: number): number {
  const base = item.krw || Math.round(item.usd * rate)
  return item.split === 'shared' ? base : base * n
}

function totAdvKrw(item: BudgetItem, rate: number, n: number): number {
  const base = item.advanceKrw + Math.round(item.advanceUsd * rate)
  return item.split === 'shared' ? base : base * n
}

// ─── Static Data ────────────────────────────────────────────────────────────
const FLIGHTS = [
  {
    type: 'out' as const,
    label: '가는 편',
    date: '2026년 7월 7일 (화)',
    flightNo: '7C3211', carrier: '제주항공',
    depTime: '오후 8:20', depCode: 'ICN', depName: '인천 국제',
    arrTime: '오전 2:00', arrCode: 'SPN', arrName: '사이판 국제',
    arrDate: '2026년 7월 8일 (수)', arrSuffix: '+1',
    duration: '4시간 40분', stops: '직항',
  },
  {
    type: 'in' as const,
    label: '오는 편',
    date: '2026년 7월 12일 (일)',
    flightNo: '7C3212', carrier: '제주항공',
    depTime: '오전 3:05', depCode: 'SPN', depName: '사이판 국제',
    arrTime: '오전 6:50', arrCode: 'ICN', arrName: '인천 국제',
    arrDate: '2026년 7월 12일 (일)', arrSuffix: '',
    duration: '4시간 45분', stops: '직항',
  },
]

const INITIAL_ITEMS: BudgetItem[] = [
  // usd/krw = per-person (individual) | total (shared)
  // advanceUsd/Krw = already paid, same scale
  { id: 'flight',    emoji: '✈️',  name: '항공권',              usd: 0,   krw: 344600, note: '제주항공',          checked: true,  split: 'individual', splitCount: 1, vendorStatus: 'paid',   advanceUsd: 0,   advanceKrw: 344600 },
  { id: 'pkg',       emoji: '🤿',  name: '4박5일 다이빙 패키지', usd: 530, krw: 0,      note: '숙박+다이빙 포함',  checked: true,  split: 'individual', splitCount: 1, vendorStatus: 'unpaid', advanceUsd: 106, advanceKrw: 0,     url: 'http://prosaipan.com/page_LfEm64' },
  { id: 'tanks',     emoji: '🚤',  name: '보트 2회 추가',        usd: 160, krw: 0,      note: '다이빙 집중 시',    checked: true,  split: 'individual', splitCount: 1, vendorStatus: 'unpaid', advanceUsd: 32,  advanceKrw: 0      },
  { id: 'dorm',      emoji: '🛏️', name: '도미토리 1박 추가',    usd: 25,  krw: 0,      note: '7/7 도착일 포함',   checked: true,  split: 'individual', splitCount: 1, vendorStatus: 'unpaid', advanceUsd: 5,   advanceKrw: 0      },
  { id: 'gear',      emoji: '🎽',  name: '장비 렌탈',            usd: 90,  krw: 0,      note: '',                  checked: true,  split: 'individual', splitCount: 1, vendorStatus: 'unpaid', advanceUsd: 0,   advanceKrw: 0      },
  { id: 'transfer',  emoji: '🚐',  name: '공항 픽드랍',          usd: 50,  krw: 0,      note: '$50 왕복 · 3인 분담', checked: false, split: 'shared',   splitCount: 3, vendorStatus: 'unpaid', advanceUsd: 0,   advanceKrw: 0      },
  { id: 'pocket',    emoji: '🍽️', name: '여비 (식비·관광)',     usd: 300, krw: 0,      note: '식사당 $5~$20',     checked: true,  split: 'individual', splitCount: 1, vendorStatus: 'unpaid', advanceUsd: 0,   advanceKrw: 0      },
  { id: 'car',       emoji: '🚗',  name: '렌트카 (옵션)',        usd: 0,   krw: 82610,  note: '미정',              checked: true,  split: 'shared',   splitCount: 3, vendorStatus: 'unpaid', advanceUsd: 0,   advanceKrw: 0      },
]

const INITIAL_MEMBERS: Member[] = [
  { id: 'm1', name: '나 (총무)', isMe: true,  settled: true  },
  { id: 'm2', name: '멤버 2',   isMe: false, settled: false },
  { id: 'm3', name: '멤버 3',   isMe: false, settled: false },
]

const CHECKLIST = [
  { id: 1, text: '여권 (유효기간 6개월 이상)',  sub: '필수 — 없으면 탑승 불가' },
  { id: 2, text: '수영복 · 래시가드',           sub: '바다 입수 시 래시가드 권장' },
  { id: 3, text: '수건 4장 이상',               sub: '숙소 수건 없음 · 건조기 있음' },
  { id: 4, text: '다이버 C-카드 (소지 시)',     sub: 'PADI 등 자격증' },
  { id: 5, text: '친환경 선크림',               sub: '옥시벤존 금지 성분 확인' },
  { id: 6, text: '멀미약',                      sub: '보트 탑승 전 복용 권장' },
  { id: 7, text: '방수 파우치 · 액션캠',        sub: 'GoPro 등 촬영 장비' },
  { id: 8, text: 'USD 현금 일부',               sub: '팁 및 비상금' },
  { id: 9, text: '여행자 보험 가입',            sub: '다이빙 포함 여부 확인' },
  { id: 10, text: '귀마개 · 방수 귀약',         sub: '외이도염 예방용' },
]

// ─── Exchange Rate Hook ──────────────────────────────────────────────────────
function useExchangeRate() {
  const [rate, setRate]       = useState(1400)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    fetch('https://open.er-api.com/v6/latest/USD')
      .then(r => r.json())
      .then(d => { if (d.rates?.KRW) setRate(d.rates.KRW) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])
  return { rate, loading }
}

// ─── Flight Section ──────────────────────────────────────────────────────────
function FlightSection() {
  return (
    <section>
      <SectionHeader icon={<Plane className="w-4 h-4" />} title="Flight Info" />
      <Card className="rounded-xl border-black/5 overflow-hidden shadow-sm bg-white">
        <Accordion type="single" collapsible>
          {FLIGHTS.map((fl, i) => {
            const isOut     = fl.type === 'out'
            const accentBg  = isOut ? 'bg-teal-50'   : 'bg-amber-50'
            const accentTxt = isOut ? 'text-teal-700' : 'text-amber-700'
            return (
              <AccordionItem key={i} value={`f${i}`} className="border-b border-black/5 last:border-0">
                <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-gray-50/60 [&>svg]:text-gray-300">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className={cn('w-9 h-9 rounded-full flex items-center justify-center text-xl flex-shrink-0', accentBg)}>
                      {isOut ? '🛫' : '🛬'}
                    </div>
                    <div className="flex-grow min-w-0 text-left">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn('text-[11px] font-bold font-mono uppercase', accentTxt)}>{fl.label}</span>
                        <span className="text-[11px] text-gray-400 font-mono">{fl.date}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                        <span>{fl.depCode}</span>
                        <div className="flex items-center gap-1 text-gray-300">
                          <div className="h-px w-6 bg-gray-200" />
                          <ArrowRight className="w-3 h-3" />
                        </div>
                        <span>{fl.arrCode}</span>
                        {fl.arrSuffix && <span className="text-[10px] font-mono text-amber-500 font-bold">{fl.arrSuffix}</span>}
                      </div>
                      <div className="font-mono text-[11px] text-gray-400 mt-0.5">
                        {fl.depTime} → {fl.arrTime} · {fl.duration} · {fl.stops}
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-5 pb-5 bg-gray-50/40 border-t border-black/5">
                  <div className="flex items-center gap-2 mt-4 mb-4">
                    <Badge className="bg-white border border-black/8 text-gray-600 text-[11px] shadow-none">{fl.carrier}</Badge>
                    <span className="font-mono text-[11px] text-gray-400">{fl.flightNo}</span>
                  </div>
                  <div className="relative pl-4">
                    <div className="absolute left-[7px] top-3 bottom-3 w-px bg-gray-200" />
                    <div className="relative flex gap-4 mb-5">
                      <div className="w-3 h-3 rounded-full bg-teal-400 border-2 border-white ring-1 ring-teal-200 flex-shrink-0 mt-1" />
                      <div>
                        <div className="text-sm font-bold text-gray-800">{fl.depTime}</div>
                        <div className="text-[12px] font-mono text-gray-500">{fl.depCode} {fl.depName}</div>
                        <div className="text-[11px] text-gray-400 mt-0.5">{fl.date} 출발</div>
                      </div>
                    </div>
                    <div className="relative flex gap-4 mb-5">
                      <div className="w-3 h-3 flex-shrink-0" />
                      <div className="text-[11px] font-mono text-gray-400 bg-white border border-black/8 rounded-full px-3 py-1">
                        {fl.duration} · {fl.stops}
                      </div>
                    </div>
                    <div className="relative flex gap-4">
                      <div className="w-3 h-3 rounded-full bg-amber-400 border-2 border-white ring-1 ring-amber-200 flex-shrink-0 mt-1" />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-bold text-gray-800">{fl.arrTime}</span>
                          {fl.arrSuffix && (
                            <span className="text-[10px] font-mono font-bold text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded-full">
                              {fl.arrSuffix}
                            </span>
                          )}
                        </div>
                        <div className="text-[12px] font-mono text-gray-500">{fl.arrCode} {fl.arrName}</div>
                        <div className="text-[11px] text-gray-400 mt-0.5">{fl.arrDate} 도착</div>
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

// ─── Plan Card ───────────────────────────────────────────────────────────────
const ENTRY_STYLE: Record<EntryType, { dot: string; text: string }> = {
  dive:   { dot: 'bg-teal-400',   text: 'text-teal-700'   },
  meal:   { dot: 'bg-amber-400',  text: 'text-amber-700'  },
  travel: { dot: 'bg-blue-400',   text: 'text-blue-700'   },
  free:   { dot: 'bg-purple-300', text: 'text-purple-700' },
  rest:   { dot: 'bg-gray-300',   text: 'text-gray-400'   },
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
                const style = entry.type ? ENTRY_STYLE[entry.type] : null
                return (
                  <div key={j} className="px-4 py-2.5 flex gap-3 items-start">
                    <div className="font-mono text-[11px] text-gray-400 w-11 flex-shrink-0 pt-0.5">{entry.time}</div>
                    {style && <div className={cn('w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0', style.dot)} />}
                    <div className={cn('text-[13px]', style ? style.text : 'text-gray-700')}>{entry.activity}</div>
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

// ─── Shared UI Primitives ─────────────────────────────────────────────────────
function SectionHeader({ icon, title, right }: { icon: React.ReactNode; title: string; right?: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center border-b border-black/5 pb-2 mb-4 px-0.5">
      <div className="font-mono text-base font-bold text-gray-400 uppercase flex items-center gap-2">
        {icon} {title}
      </div>
      {right}
    </div>
  )
}

// ─── Saipan Detail Page ───────────────────────────────────────────────────────
function SaipanDetail() {
  const navigate = useNavigate()
  const { rate, loading: rateLoading } = useExchangeRate()

  const [items,   setItems]   = useState<BudgetItem[]>(INITIAL_ITEMS)
  const [members, setMembers] = useState<Member[]>(INITIAL_MEMBERS)
  const [checks,  setChecks]  = useState<Record<number, boolean>>({})
  const [isCompact, setIsCompact] = useState(false)

  const toggleItem     = (id: string) => setItems(p => p.map(i => i.id === id ? { ...i, checked: !i.checked } : i))
  const cycleVendor    = (id: string) => setItems(p => p.map(i => i.id === id ? { ...i, vendorStatus: i.vendorStatus === 'unpaid' ? 'paid' : 'unpaid' } : i))
  const toggleCheck    = (id: number) => setChecks(p => ({ ...p, [id]: !p[id] }))
  const toggleSettled  = (id: string) => setMembers(p => p.map(m => m.id === id ? { ...m, settled: !m.settled } : m))
  const renameMember   = (id: string, name: string) => setMembers(p => p.map(m => m.id === id ? { ...m, name } : m))
  const addMember      = () => setMembers(p => [...p, { id: `m${Date.now()}`, name: `멤버 ${p.length + 1}`, isMe: false, settled: false }])
  const deleteMember   = (id: string) => setMembers(p => p.filter(m => m.id !== id))
  const setSplitCount  = (id: string, count: number) => setItems(p => p.map(i => i.id === id ? { ...i, splitCount: Math.max(2, Math.min(20, count || 2)) } : i))
  const setDepositRatio = (id: string, ratio: number) => setItems(p => p.map(i => {
    if (i.id !== id) return i
    const r = Math.max(0, Math.min(1, ratio))
    if (i.usd > 0) return { ...i, advanceUsd: Math.round(i.usd * r) }
    if (i.krw > 0) return { ...i, advanceKrw: Math.round(i.krw * r) }
    return i
  }))

  useEffect(() => {
    const COMPACT_ON = 160
    const COMPACT_OFF = 40
    let ticking = false

    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        const y = window.scrollY
        setIsCompact(prev => (prev ? y > COMPACT_OFF : y > COMPACT_ON))
        ticking = false
      })
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const summary = useMemo(() => {
    const active  = items.filter(i => i.checked)
    const n       = members.length

    // Per-person total cost
    const perPerson = active.reduce((a, i) => a + ppKrw(i, rate), 0)

    // Per-person advance already paid
    const perPersonAdv = active.reduce((a, i) => a + ppAdvKrw(i, rate), 0)

    // Total 총무 has already paid out (paid items in full + advances on unpaid)
    const paidOut = active.reduce((a, i) => {
      if (i.vendorStatus === 'paid') return a + totKrw(i, rate, n)
      return a + totAdvKrw(i, rate, n)
    }, 0)

    // Remaining balance owed to vendors
    const balanceDue = active
      .filter(i => i.vendorStatus === 'unpaid')
      .reduce((a, i) => a + Math.max(0, totKrw(i, rate, n) - totAdvKrw(i, rate, n)), 0)

    const nonMe      = members.filter(m => !m.isMe)
    const collected  = nonMe.filter(m => m.settled).length  * perPerson
    const outstanding = nonMe.filter(m => !m.settled).length * perPerson

    return { perPerson, perPersonAdv, paidOut, balanceDue, totalOutlay: paidOut + balanceDue, collected, outstanding }
  }, [items, members, rate])

  const activeItems   = items.filter(i => i.checked)
  const excludedItems = items.filter(i => !i.checked)
  const mCount        = members.length

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center pb-12 w-full">
      {/* Hero Header */}
      <header
        className={cn(
          'w-full bg-teal-900 text-white text-center relative overflow-hidden sticky top-0 z-30 border-b border-black/10 transition-all duration-300',
          isCompact ? 'py-2' : 'py-12'
        )}
      >
        <button
          onClick={() => navigate('/')}
          className="absolute top-6 left-6 z-20 flex items-center gap-1 text-teal-100 hover:text-white transition-colors text-sm font-medium"
        >
          <ChevronLeft className="w-4 h-4" /> 목록으로
        </button>
        <div className="relative z-10 max-w-2xl mx-auto transition-all duration-300">
          {!isCompact && (
            <div className="font-mono text-[11px] font-medium tracking-[0.12em] uppercase text-teal-300 mb-3 flex justify-center items-center gap-2 transition-all duration-300">
              <Waves className="w-4 h-4" /> Diving Trip Plan
            </div>
          )}
          <h1 className={cn('font-bold tracking-tight transition-all duration-300', isCompact ? 'text-[22px] md:text-[26px] mb-0' : 'text-[32px] md:text-[40px] mb-2')}>
            사이판 다이빙 여행
          </h1>
          <div className={cn('font-mono text-sm text-white/65 transition-all duration-300', isCompact ? 'mb-0 text-[11px]' : 'mb-6')}>
            2026 · 07.07 (TUE) — 07.12 (SUN)
          </div>
          {!isCompact && (
            <div className="flex flex-wrap justify-center gap-2 transition-all duration-300">
              <Badge variant="outline" className="bg-white/12 border-white/20 text-white/90 rounded-full px-4 py-1">제주항공 왕복</Badge>
              <Badge variant="outline" className="bg-white/12 border-white/20 text-white/90 rounded-full px-4 py-1">5박 6일</Badge>
              <Badge variant="outline" className="bg-white/12 border-white/20 text-white/90 rounded-full px-4 py-1">펀다이빙</Badge>
            </div>
          )}
        </div>
      </header>

      <main className="w-full max-w-[720px] px-4 pt-8">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="bg-white/90 backdrop-blur border border-black/5 p-1 rounded-full w-full h-auto flex shadow-sm sticky top-2 z-20">
            <TabsTrigger value="overview" className="flex-1 rounded-full py-2 data-[state=active]:bg-teal-600 data-[state=active]:text-white text-xs md:text-sm">개요</TabsTrigger>
            <TabsTrigger value="settlement" className="flex-1 rounded-full py-2 data-[state=active]:bg-teal-600 data-[state=active]:text-white text-xs md:text-sm">정산</TabsTrigger>
            <TabsTrigger value="plan" className="flex-1 rounded-full py-2 data-[state=active]:bg-teal-600 data-[state=active]:text-white text-xs md:text-sm">일정</TabsTrigger>
            <TabsTrigger value="checklist" className="flex-1 rounded-full py-2 data-[state=active]:bg-teal-600 data-[state=active]:text-white text-xs md:text-sm">체크</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6 space-y-10">
        {/* ── 항공편 ─────────────────────────────────────────────────────────── */}
        <FlightSection />

          </TabsContent>

          <TabsContent value="settlement" className="mt-6 space-y-8">
        {/* ── 정산 스튜디오 ─────────────────────────────────────────────────────── */}
        <section>
          <SectionHeader
            icon={<DollarSign className="w-4 h-4" />}
            title="정산 스튜디오"
            right={
              <div className="flex items-center gap-2">
                {rateLoading && <RefreshCw className="w-3 h-3 animate-spin text-gray-400" />}
                <span className="font-mono text-xs text-gray-400">₩{f(rate)} / USD</span>
              </div>
            }
          />

          {/* 헤드라인 요약 */}
          <div className="relative rounded-2xl p-6 mb-4 bg-[radial-gradient(circle_at_20%_20%,rgba(29,158,117,0.22),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(250,199,117,0.25),transparent_55%),linear-gradient(135deg,#062f28,#0b4a3d)] border border-teal-900/20 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.6)] text-white overflow-hidden">
            <div className="flex items-center gap-2 text-[11px] font-mono font-bold uppercase tracking-[0.24em] text-teal-300 mb-2">
              <Wallet className="w-3.5 h-3.5" /> 총무 선지출 · {mCount}명 기준
            </div>
            <div className="text-[40px] font-bold tracking-tight leading-none mb-3">₩{f(summary.totalOutlay)}</div>
            <div className="flex flex-wrap gap-4 text-sm">
              <div>
                <div className="text-[10px] font-mono text-teal-300 uppercase tracking-wider mb-0.5">납입 완료</div>
                <div className="text-lg font-bold text-white">₩{f(summary.paidOut)}</div>
              </div>
              <div className="w-px bg-white/15" />
              <div>
                <div className="text-[10px] font-mono text-amber-200 uppercase tracking-wider mb-0.5">잔금 예정</div>
                <div className="text-lg font-bold text-amber-200">₩{f(summary.balanceDue)}</div>
              </div>
              <div className="w-px bg-white/15" />
              <div>
                <div className="text-[10px] font-mono text-white/60 uppercase tracking-wider mb-0.5">1인 부담</div>
                <div className="text-lg font-bold text-white">₩{f(summary.perPerson)}</div>
              </div>
            </div>
          </div>

          {/* 요약 카드 */}
          <div className="grid grid-cols-2 gap-2 mb-6">
            <div className="bg-white rounded-xl border border-black/8 p-4 shadow-sm">
              <div className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-1.5">예약금 합계</div>
              <div className="text-[22px] font-bold text-emerald-600 leading-tight">₩{f(summary.perPersonAdv * mCount)}</div>
              <div className="text-[10px] font-mono text-gray-400 mt-1">1인 ₩{f(summary.perPersonAdv)}</div>
            </div>
            <div className="bg-rose-50 rounded-xl border border-rose-200 p-4">
              <div className="text-[10px] font-mono font-bold text-rose-500 uppercase tracking-wider mb-1.5">미수금</div>
              <div className="text-[22px] font-bold text-rose-600 leading-tight">₩{f(summary.outstanding)}</div>
              <div className="text-[10px] font-mono text-rose-400 mt-1">
                {members.filter(m => !m.isMe && !m.settled).length}명 미정산
                {summary.collected > 0 && (
                  <span className="text-emerald-600"> · 수령 ₩{f(summary.collected)}</span>
                )}
              </div>
            </div>
          </div>

          {/* 멤버 정산 보드 */}
          <div className="mb-7">
            <div className="flex justify-between items-center mb-2 px-0.5">
              <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider">
                <Users className="w-3 h-3" /> 멤버 정산 보드
              </div>
              <button
                onClick={addMember}
                className="flex items-center gap-1 text-[11px] font-bold text-teal-600 hover:text-teal-700 transition-colors"
              >
                <Plus className="w-3 h-3" /> 멤버 추가
              </button>
            </div>

            <Accordion type="multiple" className="space-y-2">
              {members.filter(m => !m.isMe).map(member => {
                const netOwed = Math.max(0, summary.perPerson - summary.perPersonAdv)
                return (
                  <AccordionItem
                    key={member.id}
                    value={member.id}
                    className="bg-white rounded-xl border border-black/8 shadow-sm overflow-hidden"
                  >
                    <AccordionTrigger className="px-4 py-3.5 hover:no-underline hover:bg-gray-50/40 [&>svg]:text-gray-300">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={cn('w-9 h-9 rounded-full flex items-center justify-center text-lg font-bold', member.settled ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-600')}>
                          {member.settled ? '✓' : '!'}
                        </div>
                        <div className="flex-grow min-w-0 text-left">
                          <input
                            value={member.name}
                            onChange={e => renameMember(member.id, e.target.value)}
                            onClick={e => e.stopPropagation()}
                            placeholder="이름 입력"
                            className="bg-transparent font-bold text-[14px] text-gray-800 outline-none w-full max-w-[180px] border-b border-transparent focus:border-teal-400"
                          />
                          <div className="text-[11px] font-mono text-gray-400 mt-1 flex items-center gap-2">
                            <span>1인 부담 ₩{f(summary.perPerson)}</span>
                            {summary.perPersonAdv > 0 && <span className="text-emerald-600">예약금 ₩{f(summary.perPersonAdv)}</span>}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[12px] font-mono text-gray-400">정산액</div>
                          <div className="text-[16px] font-bold text-gray-800">₩{f(netOwed)}</div>
                        </div>
                        <button
                          onClick={e => { e.stopPropagation(); toggleSettled(member.id) }}
                          className={cn(
                            'text-[10px] font-bold font-mono rounded-full px-2.5 py-1 border transition-all',
                            member.settled
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-600 border-rose-200'
                          )}
                        >
                          {member.settled ? '정산 완료' : '미정산'}
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); deleteMember(member.id) }}
                          className="ml-1 flex items-center gap-1 text-[11px] font-mono text-gray-400 hover:text-rose-500 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </AccordionTrigger>

                    <AccordionContent className="pb-0">
                      <table className="w-full border-t border-black/5">
                        <thead>
                          <tr className="bg-gray-50/80 border-b border-black/5">
                            <th className="text-left px-4 py-2 text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wide">항목</th>
                            <th className="text-right px-3 py-2 text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wide">1인 부담</th>
                            <th className="text-right px-4 py-2 text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wide">납입 현황</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-black/[0.04]">
                          {activeItems.map(item => {
                            const myShare = ppKrw(item, rate)
                            const myAdv   = ppAdvKrw(item, rate)
                            const myRem   = Math.max(0, myShare - myAdv)
                            const myUsd   = item.usd > 0
                              ? (item.split === 'shared' ? Math.round(item.usd / item.splitCount) : item.usd)
                              : 0
                            const advUsd  = item.advanceUsd > 0
                              ? (item.split === 'shared' ? Math.round(item.advanceUsd / item.splitCount) : item.advanceUsd)
                              : 0
                            return (
                              <tr key={item.id} className="text-[12px]">
                                <td className="px-4 py-2.5">
                                  <span className="mr-1.5">{item.emoji}</span>
                                  <span className="font-medium text-gray-700">{item.name}</span>
                                  {item.split === 'shared' && (
                                    <div className="text-[10px] font-mono text-orange-500">{item.splitCount}인 분담</div>
                                  )}
                                </td>
                                <td className="px-3 py-2.5 text-right font-mono">
                                  {myUsd > 0 && <div className="text-[10px] text-gray-400">${myUsd}</div>}
                                  <div className="font-bold text-gray-700">₩{f(myShare)}</div>
                                </td>
                                <td className="px-4 py-2.5 text-right">
                                  {myAdv >= myShare && myShare > 0 ? (
                                    <span className="text-[10px] font-bold font-mono text-emerald-600">완납 ✓</span>
                                  ) : myAdv > 0 ? (
                                    <div>
                                      <div className="text-[10px] font-mono text-emerald-600">
                                        예약금 {advUsd > 0 ? `$${advUsd}` : `₩${f(myAdv)}`} ✓
                                      </div>
                                      <div className="text-[10px] font-bold font-mono text-rose-600">잔금 ₩{f(myRem)}</div>
                                    </div>
                                  ) : (
                                    <span className="text-[10px] font-mono text-gray-400">미납</span>
                                  )}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                        <tfoot>
                          <tr className="bg-teal-50/60 border-t-2 border-teal-100">
                            <td className="px-4 py-3 font-bold text-[12px] text-gray-700">합계</td>
                            <td className="px-3 py-3 text-right font-mono font-bold text-gray-800 text-[13px]">
                              ₩{f(summary.perPerson)}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {summary.perPersonAdv > 0 && (
                                <div className="text-[10px] font-mono text-emerald-600">
                                  납입 ₩{f(summary.perPersonAdv)} ✓
                                </div>
                              )}
                              <div className="text-[12px] font-bold font-mono text-rose-600">
                                {netOwed > 0 ? `₩${f(netOwed)} 정산 필요` : '완납'}
                              </div>
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </AccordionContent>
                  </AccordionItem>
                )
              })}
            </Accordion>
          </div>

          {/* 예산 항목 */}
          <div>
            <div className="flex justify-between items-center mb-2 px-0.5">
              <div className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider">예산 항목</div>
              <div className="text-[10px] font-mono text-gray-300">선결제/미결제 · 예약금 비율 · 인원수 반영</div>
            </div>

            <div className="space-y-2">
              {activeItems.map(item => {
                const total     = totKrw(item, rate, mCount)
                const perPer    = ppKrw(item, rate)
                const advTotal  = totAdvKrw(item, rate, mCount)
                const remTotal  = Math.max(0, total - advTotal)
                const hasAdv    = item.advanceUsd > 0 || item.advanceKrw > 0
                const totalUsd  = item.split === 'shared' ? item.usd : item.usd * mCount
                const base = item.usd > 0 ? item.usd : item.krw
                const ratio = base > 0 ? (item.usd > 0 ? item.advanceUsd / item.usd : item.advanceKrw / item.krw) : 0
                const ratioPct = Math.round(ratio * 100)
                const ppUsd     = item.split === 'shared' ? Math.round(item.usd / item.splitCount) : item.usd
                return (
                  <Card key={item.id} className="rounded-xl border-black/5 shadow-sm bg-white overflow-hidden">
                    <div className="flex items-start gap-4 p-4">
                      <Checkbox checked={item.checked} onCheckedChange={() => toggleItem(item.id)} className="flex-shrink-0 mt-1" />
                      <div className="flex-grow min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap mb-1">
                          <span className="text-lg">{item.emoji}</span>
                          <span className="text-[14px] font-semibold text-gray-800">{item.name}</span>
                          {item.note && <span className="text-[11px] text-gray-400">{item.note}</span>}
                          {item.url && (
                            <a href={item.url} target="_blank" rel="noreferrer">
                              <ExternalLink className="w-3 h-3 text-blue-400" />
                            </a>
                          )}
                          <button
                            onClick={() => cycleVendor(item.id)}
                            className={cn(
                              'text-[10px] font-bold font-mono rounded-full px-2 py-0.5 border transition-all',
                              item.vendorStatus === 'paid'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-rose-50 text-rose-600 border-rose-200'
                            )}
                          >
                            {item.vendorStatus === 'paid' ? '결제완료' : '미결제'}
                          </button>
                          {item.split === 'shared' && (
                            <Badge className="bg-orange-50 text-orange-600 border border-orange-200 text-[10px] font-mono">
                              공유 {item.splitCount}인 분담
                            </Badge>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-3 mt-3">
                          <div className="bg-gray-50 rounded-lg p-3 border border-black/5">
                            <div className="text-[10px] font-mono text-gray-400 uppercase tracking-wide mb-1">총액</div>
                            {item.usd > 0 && <div className="text-[11px] font-mono text-gray-400">${totalUsd}</div>}
                            <div className="text-[16px] font-bold text-gray-800">₩{f(total)}</div>
                            <div className="text-[10px] font-mono text-gray-400 mt-1">
                              1인 ₩{f(perPer)}
                              {item.usd > 0 && <span> · ${ppUsd}</span>}
                            </div>
                          </div>

                          <div className="bg-teal-50/60 rounded-lg p-3 border border-teal-100">
                            <div className="flex items-center gap-2 text-[10px] font-mono text-teal-700 uppercase tracking-wide mb-1">
                              <Percent className="w-3 h-3" /> 예약금 비율
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="range"
                                min={0}
                                max={100}
                                value={ratioPct}
                                onChange={e => setDepositRatio(item.id, Number(e.target.value) / 100)}
                                disabled={base === 0}
                                className="flex-grow accent-teal-600"
                              />
                              <input
                                type="number"
                                min={0}
                                max={100}
                                value={ratioPct}
                                onChange={e => setDepositRatio(item.id, Number(e.target.value) / 100)}
                                disabled={base === 0}
                                className="w-16 text-right text-[11px] font-mono border border-black/10 rounded-md px-2 py-1 bg-white"
                              />
                            </div>
                            <div className="text-[10px] font-mono text-teal-600 mt-2">
                              납입 ₩{f(advTotal)} · 잔금 ₩{f(remTotal)}
                            </div>
                          </div>
                        </div>

                        {item.split === 'shared' && (
                          <div className="mt-3 flex items-center gap-2 text-[10px] font-mono text-gray-400">
                            분담 인원
                            <input
                              type="number"
                              min={2}
                              max={20}
                              value={item.splitCount}
                              onChange={e => setSplitCount(item.id, Number(e.target.value))}
                              className="w-16 text-right border border-black/10 rounded-md px-2 py-1 bg-white text-[11px]"
                            />
                            명
                          </div>
                        )}

                        {hasAdv && (
                          <div className="mt-3 flex items-center gap-2 text-[10px] font-mono">
                            <span className="inline-flex items-center gap-1 text-emerald-600">
                              <BadgeCheck className="w-3 h-3" /> 선결제 반영됨
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                )
              })}

              {excludedItems.map(item => (
                <div key={item.id} className="flex items-center gap-3 px-4 py-3 border border-dashed border-black/10 rounded-xl opacity-40">
                  <Checkbox checked={false} onCheckedChange={() => toggleItem(item.id)} className="flex-shrink-0" />
                  <span className="mr-0.5">{item.emoji}</span>
                  <div className="flex-grow min-w-0">
                    <span className="text-[12px] font-semibold text-gray-500 line-through">{item.name}</span>
                    {item.note && <span className="text-[11px] text-gray-400 ml-2">{item.note}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

          </TabsContent>

          <TabsContent value="plan" className="mt-6 space-y-8">
        {/* ── 다이빙 플랜 ──────────────────────────────────────────────────────── */}
        <section>
          <SectionHeader icon={<Waves className="w-4 h-4" />} title="Diving Plan" />
          <Tabs defaultValue="a" className="w-full">
            <TabsList className="bg-white border border-black/5 p-1 rounded-full w-full h-auto flex shadow-sm">
              {(['a','b','c'] as const).map(v => (
                <TabsTrigger key={v} value={v} className="flex-1 rounded-full py-2 data-[state=active]:bg-teal-600 data-[state=active]:text-white text-xs md:text-sm">
                  플랜 {v.toUpperCase()}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="a" className="mt-4">
              <PlanCard days={[
                { date: '7/7 (화) — 출발', entries: [
                  { time: '18:00', activity: '인천공항 이동', type: 'travel' },
                  { time: '19:30', activity: '인천공항 도착 · 체크인', type: 'travel' },
                  { time: '20:20', activity: '제주항공 출발', type: 'travel' },
                ]},
                { date: '7/8 (수) — 도착 · 다이빙 Day 1', entries: [
                  { time: '02:00', activity: '사이판 공항 도착', type: 'travel' },
                  { time: '03:45', activity: '체크인 · 취침', type: 'rest' },
                  { time: '08:00', activity: '기상 · 아침식사', type: 'meal' },
                  { time: '08:30', activity: '브리핑 · 장비 셋업', type: 'dive' },
                  { time: '09:00', activity: '1탱크 보트 다이빙', type: 'dive' },
                  { time: '11:30', activity: '2탱크 보트 다이빙', type: 'dive' },
                  { time: '13:30', activity: '점심식사', type: 'meal' },
                  { time: '15:00', activity: '자유시간', type: 'free' },
                  { time: '18:30', activity: '저녁식사', type: 'meal' },
                ]},
                { date: '7/9 (목) — 다이빙 Day 2', entries: [
                  { time: '08:00', activity: '아침식사', type: 'meal' },
                  { time: '09:00', activity: '1탱크 보트 다이빙', type: 'dive' },
                  { time: '11:30', activity: '2탱크 보트 다이빙', type: 'dive' },
                  { time: '13:30', activity: '점심식사', type: 'meal' },
                  { time: '15:00', activity: '자유시간 (마나가하섬 or 쇼핑)', type: 'free' },
                  { time: '18:30', activity: '저녁식사', type: 'meal' },
                ]},
                { date: '7/10 (금) — 다이빙 Day 3', entries: [
                  { time: '08:00', activity: '아침식사', type: 'meal' },
                  { time: '09:00', activity: '1탱크 보트 다이빙', type: 'dive' },
                  { time: '11:30', activity: '2탱크 보트 다이빙', type: 'dive' },
                  { time: '13:30', activity: '점심식사', type: 'meal' },
                  { time: '15:00', activity: '북부 관광 (버드아일랜드 · 자살절벽)', type: 'free' },
                  { time: '18:30', activity: '저녁식사 · 기념품 쇼핑', type: 'meal' },
                  { time: '21:00', activity: '짐 정리 · 귀국 준비', type: 'rest' },
                ]},
                { date: '7/11 (토) — 관광', entries: [
                  { time: '08:00', activity: '기상 · 아침식사', type: 'meal' },
                  { time: '10:00', activity: '마나가하섬 투어 (페리)', type: 'travel' },
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

            <TabsContent value="b" className="mt-4">
              <PlanCard days={[
                { date: '7/7 (화) — 출발', entries: [
                  { time: '18:00', activity: '인천공항 이동', type: 'travel' },
                  { time: '20:20', activity: '제주항공 출발', type: 'travel' },
                ]},
                { date: '7/8 (수) — 도착 · 휴식', entries: [
                  { time: '02:00', activity: '사이판 공항 도착', type: 'travel' },
                  { time: '03:45', activity: '체크인 · 취침', type: 'rest' },
                  { time: '10:00', activity: '기상 · 브런치', type: 'meal' },
                  { time: '11:30', activity: '장비 렌탈 · 셋업 확인', type: 'dive' },
                  { time: '13:00', activity: '해변 산책 · 컨디션 조절', type: 'free' },
                  { time: '18:30', activity: '저녁식사', type: 'meal' },
                ]},
                { date: '7/9 (목) — 다이빙 Day 1 (3탱크)', entries: [
                  { time: '07:30', activity: '아침식사', type: 'meal' },
                  { time: '08:30', activity: '1탱크 보트 다이빙', type: 'dive' },
                  { time: '10:30', activity: '2탱크 보트 다이빙', type: 'dive' },
                  { time: '14:00', activity: '3탱크 오후 보트 다이빙', type: 'dive' },
                  { time: '18:30', activity: '저녁식사', type: 'meal' },
                ]},
                { date: '7/10 (금) — 다이빙 Day 2 (3탱크)', entries: [
                  { time: '07:30', activity: '아침식사', type: 'meal' },
                  { time: '08:30', activity: '1탱크 보트 다이빙', type: 'dive' },
                  { time: '10:30', activity: '2탱크 보트 다이빙', type: 'dive' },
                  { time: '14:00', activity: '3탱크 오후 보트 다이빙', type: 'dive' },
                  { time: '17:00', activity: '자유시간', type: 'free' },
                  { time: '18:30', activity: '저녁식사', type: 'meal' },
                ]},
                { date: '7/11 (토) — 다이빙 Day 3 (2탱크) · 관광', entries: [
                  { time: '07:30', activity: '아침식사', type: 'meal' },
                  { time: '08:30', activity: '1탱크 보트 다이빙', type: 'dive' },
                  { time: '10:30', activity: '2탱크 보트 다이빙', type: 'dive' },
                  { time: '12:30', activity: '점심식사', type: 'meal' },
                  { time: '14:00', activity: '마나가하섬 투어 or 북부 관광', type: 'free' },
                  { time: '18:30', activity: '저녁식사 · 기념품 쇼핑', type: 'meal' },
                  { time: '21:00', activity: '짐 정리', type: 'rest' },
                ]},
                { date: '7/12 (일) — 귀국', entries: [
                  { time: '01:30', activity: '기상 · 체크아웃', type: 'rest' },
                  { time: '03:05', activity: '제주항공 인천행 출발', type: 'travel' },
                  { time: '06:50', activity: '인천공항 도착', type: 'travel' },
                ]},
              ]} />
            </TabsContent>

            <TabsContent value="c" className="mt-4">
              <PlanCard days={[
                { date: '7/7 (화) — 출발', entries: [
                  { time: '18:00', activity: '인천공항 이동', type: 'travel' },
                  { time: '20:20', activity: '제주항공 출발', type: 'travel' },
                ]},
                { date: '7/8 (수) — 도착 · 오후 3탱크', entries: [
                  { time: '02:00', activity: '사이판 공항 도착', type: 'travel' },
                  { time: '03:45', activity: '체크인 · 취침', type: 'rest' },
                  { time: '10:00', activity: '기상 · 브런치', type: 'meal' },
                  { time: '11:30', activity: '장비 렌탈 · 셋업', type: 'dive' },
                  { time: '13:00', activity: '1탱크 오후 보트', type: 'dive' },
                  { time: '15:00', activity: '2탱크 보트', type: 'dive' },
                  { time: '17:00', activity: '3탱크 보트', type: 'dive' },
                  { time: '19:00', activity: '저녁식사', type: 'meal' },
                ]},
                { date: '7/9 (목) — 그로토 2탱크', entries: [
                  { time: '08:00', activity: '아침식사', type: 'meal' },
                  { time: '09:15', activity: '1탱크 그로토 비치 다이빙', type: 'dive' },
                  { time: '11:00', activity: '2탱크 그로토 비치 다이빙', type: 'dive' },
                  { time: '13:00', activity: '점심식사', type: 'meal' },
                  { time: '14:30', activity: '자유시간 (그로토 포토존)', type: 'free' },
                  { time: '18:30', activity: '저녁식사', type: 'meal' },
                ]},
                { date: '7/10 (금) — 보트 3탱크', entries: [
                  { time: '07:30', activity: '아침식사', type: 'meal' },
                  { time: '08:30', activity: '1탱크 보트 다이빙', type: 'dive' },
                  { time: '10:30', activity: '2탱크 보트 다이빙', type: 'dive' },
                  { time: '14:00', activity: '3탱크 오후 보트 다이빙', type: 'dive' },
                  { time: '18:30', activity: '저녁식사', type: 'meal' },
                ]},
                { date: '7/11 (토) — 자유', entries: [
                  { time: '08:00', activity: '기상 · 아침식사', type: 'meal' },
                  { time: '10:00', activity: '마나가하섬 투어 or 북부 관광', type: 'free' },
                  { time: '12:30', activity: '점심식사', type: 'meal' },
                  { time: '14:00', activity: 'DFS 쇼핑 · 해변 휴식', type: 'free' },
                  { time: '18:30', activity: '저녁식사', type: 'meal' },
                  { time: '20:00', activity: '짐 정리 · 귀국 준비', type: 'rest' },
                ]},
                { date: '7/12 (일) — 귀국', entries: [
                  { time: '01:30', activity: '기상 · 체크아웃', type: 'rest' },
                  { time: '03:05', activity: '제주항공 인천행 출발', type: 'travel' },
                  { time: '06:50', activity: '인천공항 도착', type: 'travel' },
                ]},
              ]} />
            </TabsContent>
          </Tabs>
        </section>

          </TabsContent>

          <TabsContent value="checklist" className="mt-6 space-y-8">
        {/* ── 체크리스트 ────────────────────────────────────────────────────────── */}
        <section>
          <SectionHeader icon={<ShoppingBag className="w-4 h-4" />} title="Checklist" />
          <Card className="rounded-xl border-black/5 overflow-hidden shadow-sm bg-white divide-y divide-black/5">
            {CHECKLIST.map(item => {
              const done = !!checks[item.id]
              return (
                <div
                  key={item.id}
                  className={cn('flex items-start gap-4 p-4 cursor-pointer transition-colors hover:bg-gray-50', done && 'bg-gray-50/50')}
                  onClick={() => toggleCheck(item.id)}
                >
                  <div className={cn('w-5 h-5 rounded-md border-2 mt-0.5 flex items-center justify-center transition-all flex-shrink-0', done ? 'bg-teal-400 border-teal-400' : 'bg-white border-black/10 shadow-inner')}>
                    {done && <Check className="w-3.5 h-3.5 text-white stroke-[3px]" />}
                  </div>
                  <div className="flex-grow min-w-0">
                    <div className={cn('text-[13px] font-semibold transition-all', done ? 'text-gray-400 line-through' : 'text-gray-900')}>{item.text}</div>
                    <div className="text-[11.5px] text-gray-400 mt-0.5">{item.sub}</div>
                  </div>
                </div>
              )
            })}
          </Card>
        </section>
          </TabsContent>
        </Tabs>
      </main>

      <footer className="mt-20 text-center font-mono text-[11px] text-gray-400">
        © 2026 KG.
      </footer>
    </div>
  )
}

// ─── Trip List ───────────────────────────────────────────────────────────────
function TripList() {
  const navigate = useNavigate()
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
          <div className="h-4 bg-teal-600 w-full" />
          <CardHeader className="pt-8 pb-6">
            <CardTitle className="text-2xl group-hover:text-teal-600 transition-colors mb-2">사이판 다이빙 여행</CardTitle>
            <CardDescription className="font-mono text-xs flex items-center gap-2 text-slate-400">
              <Calendar className="w-3 h-3" /> 2026.07.07 — 07.12
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

// ─── App ─────────────────────────────────────────────────────────────────────
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
