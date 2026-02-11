import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Users, BookOpen, FileText, Wallet, Loader2 } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts";
import { supabase } from "@/lib/supabase";
import { startOfMonth, format, subMonths, isSameMonth, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCourses: 0,
    totalLessons: 0,
    totalRevenue: 0
  });

  const [userGrowthData, setUserGrowthData] = useState<any[]>([]);
  const [lessonFinanceData, setLessonFinanceData] = useState<any[]>([]);
  const [platformGrowthData, setPlatformGrowthData] = useState<any[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);

        // 1. Fetch Raw Data for Aggregation (Last 6 Months)
        const sixMonthsAgo = subMonths(new Date(), 5).toISOString();

        const { data: usersRaw } = await supabase.from('users').select('created_at');
        const { data: coursesRaw } = await supabase.from('courses').select('created_at');
        const { data: lessonsRaw } = await supabase.from('lessons').select('created_at');
        const { data: paymentsRaw } = await supabase.from('payments').select('amount_cents, created_at, status').in('status', ['paid', 'completed']);

        // Calculate Totals
        const totalUsers = usersRaw?.length || 0;
        const totalCourses = coursesRaw?.length || 0;
        const totalLessons = lessonsRaw?.length || 0;
        const totalRevenue = paymentsRaw?.reduce((acc, curr) => acc + (curr.amount_cents || 0), 0) || 0;

        setStats({ totalUsers, totalCourses, totalLessons, totalRevenue });

        // Generate Last 6 Months Buckets
        const months = Array.from({ length: 6 }, (_, i) => {
          const date = subMonths(new Date(), 5 - i);
          return {
            date,
            label: format(date, 'MMM', { locale: ptBR }),
            fullLabel: format(date, 'MMMM yyyy', { locale: ptBR }),
          };
        });

        // 2. Aggregate Data per Month
        const growthData = months.map(month => {
          const monthUsers = usersRaw?.filter(u => isSameMonth(parseISO(u.created_at), month.date)).length || 0;
          const monthCourses = coursesRaw?.filter(c => isSameMonth(parseISO(c.created_at), month.date)).length || 0;
          return { month: month.label, usuarios: monthUsers, cursos: monthCourses };
        });

        const financeData = months.map(month => {
          const monthLessons = lessonsRaw?.filter(l => isSameMonth(parseISO(l.created_at), month.date)).length || 0;
          const monthRevenue = paymentsRaw
            ?.filter(p => isSameMonth(parseISO(p.created_at), month.date))
            .reduce((acc, curr) => acc + (curr.amount_cents || 0), 0) || 0;
          return { month: month.label, aulas: monthLessons, receita: monthRevenue };
        });

        // 3. Platform Growth (Simple User Growth %)
        let cumulativeUsers = 0;
        // Pre-calculate cumulative users before 6 months window (approximate or 0 if start)
        const usersBeforeWindow = usersRaw?.filter(u => parseISO(u.created_at) < subMonths(new Date(), 5)).length || 0;
        cumulativeUsers = usersBeforeWindow;

        const growthPercentData = months.map(month => {
          const newUsers = usersRaw?.filter(u => isSameMonth(parseISO(u.created_at), month.date)).length || 0;
          const previousTotal = cumulativeUsers;
          cumulativeUsers += newUsers;

          let growth = 0;
          if (previousTotal > 0) {
            growth = (newUsers / previousTotal) * 100;
          } else if (newUsers > 0) {
            growth = 100; // First month growth
          }

          return { month: month.label, crescimento: Math.round(growth) };
        });

        setUserGrowthData(growthData);
        setLessonFinanceData(financeData);
        setPlatformGrowthData(growthPercentData);

      } catch (error) {
        console.error('Error loading dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const metrics = [
    {
      title: "Usuários Totais",
      value: stats.totalUsers,
      icon: <Users className="w-6 h-6" />,
      color: "text-sky-500",
      bgColor: "bg-sky-50",
    },
    {
      title: "Cursos Criados",
      value: stats.totalCourses,
      icon: <BookOpen className="w-6 h-6" />,
      color: "text-sky-500",
      bgColor: "bg-sky-50",
    },
    {
      title: "Aulas Criadas",
      value: stats.totalLessons,
      icon: <FileText className="w-6 h-6" />,
      color: "text-sky-500",
      bgColor: "bg-sky-50",
    },
    {
      title: "Receita Total",
      value: stats.totalRevenue,
      icon: <Wallet className="w-6 h-6" />,
      color: "text-sky-500",
      bgColor: "bg-sky-50",
      isCurrency: true,
    },
  ];

  const distributionData = [
    { name: "Usuários", value: stats.totalUsers || 1, color: "#0ea5e9" },
    { name: "Cursos", value: stats.totalCourses || 1, color: "#38bdf8" },
    { name: "Aulas", value: stats.totalLessons || 1, color: "#7dd3fc" },
  ];

  const formatCurrency = (valueCents: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(valueCents / 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <Loader2 className="w-12 h-12 text-sky-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-600 mt-2">Bem-vindo ao painel administrativo da Vibe Coding 1.0</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <Card key={index} className="p-6 hover:shadow-lg transition-shadow duration-300 bg-white">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">{metric.title}</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">
                  {metric.isCurrency
                    ? formatCurrency(metric.value as number)
                    : (metric.value as number).toLocaleString()
                  }
                </p>
              </div>
              <div className={`${metric.bgColor} p-3 rounded-lg`}>
                <div className={`${metric.color}`}>
                  {metric.icon}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Users & Courses Chart */}
        <Card className="p-6 bg-white">
          <h2 className="text-lg font-bold text-slate-900 mb-1">Usuários & Cursos Ativos</h2>
          <p className="text-sm text-slate-500 mb-4">Crescimento mensal de usuários e cursos</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={userGrowthData}>
                <defs>
                  <linearGradient id="colorUsuarios" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorCursos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="usuarios"
                  stroke="#0ea5e9"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorUsuarios)"
                  name="Usuários"
                />
                <Area
                  type="monotone"
                  dataKey="cursos"
                  stroke="#38bdf8"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorCursos)"
                  name="Cursos"
                />
                <Legend />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Lessons & Finance Chart */}
        <Card className="p-6 bg-white">
          <h2 className="text-lg font-bold text-slate-900 mb-1">Aulas & Finanças</h2>
          <p className="text-sm text-slate-500 mb-4">Relação entre aulas criadas e receita</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={lessonFinanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                <YAxis yAxisId="left" stroke="#94a3b8" fontSize={12} />
                <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                  formatter={(value, name) => {
                    if (name === 'Receita') return [`${(value as number / 1000000).toFixed(2)}M Kz`, name];
                    return [value, name];
                  }}
                />
                <Bar yAxisId="left" dataKey="aulas" fill="#0ea5e9" name="Aulas" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="receita" fill="#7dd3fc" name="Receita" radius={[4, 4, 0, 0]} />
                <Legend />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Platform Growth Chart */}
        <Card className="p-6 bg-white">
          <h2 className="text-lg font-bold text-slate-900 mb-1">Crescimento da Plataforma</h2>
          <p className="text-sm text-slate-500 mb-4">Percentual de crescimento mensal (%)</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={platformGrowthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `${v}%`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                  formatter={(value) => [`${value}%`, 'Crescimento']}
                />
                <Line
                  type="monotone"
                  dataKey="crescimento"
                  stroke="#0ea5e9"
                  strokeWidth={3}
                  dot={{ fill: '#0ea5e9', strokeWidth: 2, r: 5 }}
                  activeDot={{ r: 8, fill: '#0284c7' }}
                  name="Crescimento"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Distribution Pie Chart */}
        <Card className="p-6 bg-white">
          <h2 className="text-lg font-bold text-slate-900 mb-1">Distribuição da Plataforma</h2>
          <p className="text-sm text-slate-500 mb-4">Proporção de recursos ativos</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}
