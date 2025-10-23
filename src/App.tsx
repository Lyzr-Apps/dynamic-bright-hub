import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts'
import { Plus, BarChart3, TrendingUp, List, Loader2, ArrowUpRight, ArrowDownLeft, Wallet, DollarSign, TrendingDown } from 'lucide-react'
import parseLLMJson from '@/utils/jsonParser'
import { callAIAgent } from '@/utils/aiAgent'

type Transaction = {
  id: string
  date: string
  description: string
  amount: number
  category: string
  type: 'income' | 'expense'
}

type InsightResponse = {
  result: {
    categorized_transactions: Record<string, unknown>
    summary: {
      total_income: number
      total_expenses: number
      net_income: number
      expense_percentage: number
      income_percentage: number
      narrative: string
    }
    budgeting_tips: string[]
  }
  confidence: number
  metadata: {
    processing_time: number
    transactions_analyzed: number
    transactions_auto_categorized: number
    analysis_period: string
  }
}

// Expense categories
const EXPENSE_CATEGORIES = [
  'Food & Dining',
  'Transportation',
  'Entertainment',
  'Healthcare',
  'Utilities',
  'Shopping',
  'Education',
  'Travel',
  'Insurance',
  'Other'
]

const INCOME_CATEGORIES = [
  'Salary',
  'Freelance',
  'Investment',
  'Bonus',
  'Side Income',
  'Other'
]

// Sub-component: Add Transaction Modal
function AddTransactionModal({ onAdd }: { onAdd: (transaction: Transaction) => void }) {
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<'expense' | 'income'>('expense')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!description.trim() || !amount || !category) return

    const transaction: Transaction = {
      id: Date.now().toString(),
      date,
      description,
      amount: parseFloat(amount),
      category,
      type
    }

    onAdd(transaction)
    setDescription('')
    setAmount('')
    setCategory('')
    setDate(new Date().toISOString().split('T')[0])
    setOpen(false)
  }

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="fixed bottom-8 right-8 rounded-full w-16 h-16 shadow-2xl bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all duration-300 transform hover:scale-110 flex items-center justify-center">
          <Plus size={28} className="text-white" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md backdrop-blur-xl bg-white/90 border border-white/20 shadow-2xl rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Add Transaction
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Record a new income or expense transaction
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-700">Type</Label>
            <Select value={type} onValueChange={(v) => { setType(v as 'income' | 'expense'); setCategory('') }}>
              <SelectTrigger className="border-2 border-gray-200 bg-white/50 backdrop-blur-sm rounded-xl hover:border-blue-400 transition-colors">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-700">Date</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="border-2 border-gray-200 bg-white/50 backdrop-blur-sm rounded-xl hover:border-blue-400 transition-colors"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-700">Description</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Monthly Salary"
              className="border-2 border-gray-200 bg-white/50 backdrop-blur-sm rounded-xl hover:border-blue-400 transition-colors"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-700">Amount</Label>
            <Input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="border-2 border-gray-200 bg-white/50 backdrop-blur-sm rounded-xl hover:border-blue-400 transition-colors"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-700">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="border-2 border-gray-200 bg-white/50 backdrop-blur-sm rounded-xl hover:border-blue-400 transition-colors">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl py-3 transition-all duration-300 transform hover:shadow-lg">
            Add Transaction
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Sub-component: Summary Card
function SummaryCard({ title, amount, icon: Icon, trend, color }: any) {
  return (
    <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br p-0.5 transition-all duration-300 hover:shadow-xl">
      <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-10 transition-opacity`}></div>
      <Card className="relative bg-white/80 backdrop-blur-xl border border-white/20 shadow-lg hover:shadow-2xl transition-all duration-300 rounded-2xl">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">{title}</p>
              <h3 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                ${amount.toFixed(2)}
              </h3>
              {trend && (
                <p className={`text-xs font-semibold mt-2 ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {trend > 0 ? '+' : ''}{trend}% vs last month
                </p>
              )}
            </div>
            <div className={`p-3 rounded-xl ${color} opacity-20 group-hover:opacity-30 transition-opacity`}>
              <Icon size={28} className={`text-${color.split('-')[1]}-600`} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Sub-component: Dashboard with Charts
function Dashboard({ transactions }: { transactions: Transaction[] }) {
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
  const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
  const netBalance = totalIncome - totalExpenses

  // Prepare data for pie chart
  const expensesByCategory = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      const existing = acc.find(item => item.name === t.category)
      if (existing) {
        existing.value += t.amount
      } else {
        acc.push({ name: t.category, value: t.amount })
      }
      return acc
    }, [] as Array<{ name: string; value: number }>)

  // Prepare data for line chart (last 30 days)
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - i)
    return d.toISOString().split('T')[0]
  }).reverse()

  const dailyData = last30Days.map((date, idx) => {
    const dayTransactions = transactions.filter(t => t.date === date)
    const income = dayTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
    const expense = dayTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
    return {
      date: idx % 5 === 0 ? new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '',
      income,
      expense,
      fullDate: date
    }
  })

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1']

  return (
    <div className="space-y-8 pb-20">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SummaryCard
          title="Total Income"
          amount={totalIncome}
          icon={ArrowDownLeft}
          color="from-green-500 to-emerald-500"
        />
        <SummaryCard
          title="Total Expenses"
          amount={totalExpenses}
          icon={ArrowUpRight}
          color="from-red-500 to-pink-500"
        />
        <SummaryCard
          title="Net Balance"
          amount={netBalance}
          icon={Wallet}
          color={netBalance >= 0 ? "from-blue-500 to-cyan-500" : "from-orange-500 to-red-500"}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line Chart */}
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br p-0.5 transition-all duration-300 hover:shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-500 opacity-0 group-hover:opacity-5 transition-opacity"></div>
          <Card className="relative bg-white/80 backdrop-blur-xl border border-white/20 shadow-lg rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-gray-900">30 Day Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailyData}>
                  <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis dataKey="date" stroke="#9ca3af" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: 'none', borderRadius: '8px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} />
                  <Legend />
                  <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={3} dot={false} fillOpacity={1} fill="url(#colorIncome)" />
                  <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={3} dot={false} fillOpacity={1} fill="url(#colorExpense)" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Pie Chart */}
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br p-0.5 transition-all duration-300 hover:shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-pink-500 opacity-0 group-hover:opacity-5 transition-opacity"></div>
          <Card className="relative bg-white/80 backdrop-blur-xl border border-white/20 shadow-lg rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-gray-900">Expense Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              {expensesByCategory.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={expensesByCategory}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {expensesByCategory.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: 'none', borderRadius: '8px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-gray-400 py-12">No expense data yet</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br p-0.5 transition-all duration-300 hover:shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-blue-500 opacity-0 group-hover:opacity-5 transition-opacity"></div>
        <Card className="relative bg-white/80 backdrop-blur-xl border border-white/20 shadow-lg rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-gray-900">Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length > 0 ? (
              <div className="space-y-3">
                {transactions.slice(-5).reverse().map(t => (
                  <div key={t.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-blue-50 hover:to-indigo-50 rounded-xl transition-all duration-300 border border-gray-200/50 hover:border-blue-200">
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`p-3 rounded-xl ${t.type === 'income' ? 'bg-green-100' : 'bg-red-100'}`}>
                        {t.type === 'income' ? (
                          <ArrowDownLeft size={20} className="text-green-600" />
                        ) : (
                          <ArrowUpRight size={20} className="text-red-600" />
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{t.description}</div>
                        <div className="text-sm text-gray-600">{t.category}</div>
                      </div>
                    </div>
                    <div className={`text-lg font-bold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {t.type === 'income' ? '+' : '-'}${t.amount.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-400 py-12">No transactions yet</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Sub-component: All Transactions
function AllTransactions({ transactions, onEdit, onDelete }: {
  transactions: Transaction[]
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}) {
  const [searchTerm, setSearchTerm] = useState('')

  const filtered = transactions.filter(t =>
    t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.category.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <div className="space-y-6 pb-20">
      <div className="relative">
        <Input
          placeholder="Search transactions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-white/80 backdrop-blur-xl border-2 border-white/20 rounded-xl pl-4 py-3 shadow-lg hover:border-blue-400 transition-colors"
        />
      </div>

      <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br p-0.5 transition-all duration-300 hover:shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-blue-500 opacity-0 group-hover:opacity-5 transition-opacity"></div>
        <Card className="relative bg-white/80 backdrop-blur-xl border border-white/20 shadow-lg rounded-2xl">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-gray-200/50 bg-gradient-to-r from-gray-50 to-gray-100/50">
                    <TableHead className="text-gray-600 font-semibold">Date</TableHead>
                    <TableHead className="text-gray-600 font-semibold">Description</TableHead>
                    <TableHead className="text-gray-600 font-semibold">Category</TableHead>
                    <TableHead className="text-gray-600 font-semibold">Amount</TableHead>
                    <TableHead className="text-gray-600 font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length > 0 ? (
                    filtered.map(t => (
                      <TableRow key={t.id} className="border-b border-gray-100/50 hover:bg-blue-50/50 transition-colors">
                        <TableCell className="text-sm text-gray-700">{new Date(t.date).toLocaleDateString()}</TableCell>
                        <TableCell className="text-sm font-semibold text-gray-900">{t.description}</TableCell>
                        <TableCell>
                          <span className={`px-4 py-2 rounded-full text-xs font-bold ${
                            t.type === 'income'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {t.category}
                          </span>
                        </TableCell>
                        <TableCell className={`font-bold text-sm ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                          {t.type === 'income' ? '+' : '-'}${t.amount.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onEdit(t.id)}
                              className="text-xs border-gray-200 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onDelete(t.id)}
                              className="text-xs text-red-600 hover:text-red-700 border-gray-200 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-gray-400">
                        No transactions found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Sub-component: Insights Page
function InsightsPage({ transactions }: { transactions: Transaction[] }) {
  const [insights, setInsights] = useState<InsightResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function fetchInsights() {
    if (transactions.length === 0) {
      setError('No transactions to analyze. Please add some transactions first.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const transactionSummary = transactions.map(t => ({
        date: t.date,
        description: t.description,
        amount: t.amount,
        category: t.category,
        type: t.type
      }))

      const prompt = `Analyze these transactions and provide financial insights with budgeting tips. Return JSON with keys "result" containing "categorized_transactions", "summary" (with total_income, total_expenses, net_income, expense_percentage, income_percentage, narrative), and "budgeting_tips" array. Also include "confidence" and "metadata" keys.

Transactions: ${JSON.stringify(transactionSummary)}`

      const response = await callAIAgent(prompt, '68fa32be058210757bf625b4')

      if (response?.response) {
        const parsed = parseLLMJson(response.response, null)
        if (parsed && typeof parsed === 'object' && 'result' in parsed) {
          setInsights(parsed as InsightResponse)
        } else {
          setError('Could not parse insights response')
        }
      }
    } catch (err) {
      setError('Failed to fetch insights. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8 pb-20">
      <Button
        onClick={fetchInsights}
        disabled={loading || transactions.length === 0}
        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl py-3 px-6 transition-all duration-300 transform hover:shadow-lg disabled:opacity-50"
      >
        {loading ? (
          <>
            <Loader2 size={18} className="mr-2 animate-spin" />
            Analyzing...
          </>
        ) : (
          <>
            <TrendingUp size={18} className="mr-2" />
            Generate Insights
          </>
        )}
      </Button>

      {error && (
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br p-0.5 transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-pink-500 opacity-10"></div>
          <Card className="relative bg-red-50/80 backdrop-blur-xl border border-red-200/50 shadow-lg rounded-2xl">
            <CardContent className="pt-6">
              <p className="text-red-700 font-medium">{error}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {insights && (
        <div className="space-y-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <SummaryCard
              title="Total Income"
              amount={insights.result.summary.total_income}
              icon={DollarSign}
              color="from-green-500 to-emerald-500"
            />
            <SummaryCard
              title="Total Expenses"
              amount={insights.result.summary.total_expenses}
              icon={TrendingDown}
              color="from-red-500 to-pink-500"
            />
            <SummaryCard
              title="Net Income"
              amount={insights.result.summary.net_income}
              icon={Wallet}
              color={insights.result.summary.net_income >= 0 ? "from-blue-500 to-cyan-500" : "from-orange-500 to-red-500"}
            />
          </div>

          {/* Narrative */}
          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br p-0.5 transition-all duration-300 hover:shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-blue-500 opacity-0 group-hover:opacity-5 transition-opacity"></div>
            <Card className="relative bg-white/80 backdrop-blur-xl border border-white/20 shadow-lg rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-gray-900">Monthly Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed text-base">
                  {insights.result.summary.narrative}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Budgeting Tips */}
          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br p-0.5 transition-all duration-300 hover:shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-emerald-500 opacity-0 group-hover:opacity-5 transition-opacity"></div>
            <Card className="relative bg-white/80 backdrop-blur-xl border border-white/20 shadow-lg rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-gray-900">Budgeting Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  {insights.result.budgeting_tips.map((tip, i) => (
                    <li key={i} className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                        {i + 1}
                      </div>
                      <span className="text-gray-700 pt-0.5">{tip}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Metadata */}
          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br p-0.5 transition-all duration-300 hover:shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-500 to-gray-500 opacity-0 group-hover:opacity-5 transition-opacity"></div>
            <Card className="relative bg-gradient-to-br from-gray-50 to-gray-100/50 backdrop-blur-xl border border-white/20 shadow-lg rounded-2xl">
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-2">Transactions</p>
                    <p className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                      {insights.metadata.transactions_analyzed}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-2">Auto-Categorized</p>
                    <p className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                      {insights.metadata.transactions_auto_categorized}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-2">Confidence</p>
                    <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      {(insights.confidence * 100).toFixed(0)}%
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-2">Period</p>
                    <p className="text-lg font-semibold text-gray-900">{insights.metadata.analysis_period}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}

// Main App Component
function App() {
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('budgetTrackerTransactions')
    return saved ? JSON.parse(saved) : []
  })
  const [currentTab, setCurrentTab] = useState('dashboard')
  const [editingId, setEditingId] = useState<string | null>(null)

  // Save to localStorage whenever transactions change
  useEffect(() => {
    localStorage.setItem('budgetTrackerTransactions', JSON.stringify(transactions))
  }, [transactions])

  function handleAddTransaction(transaction: Transaction) {
    setTransactions([...transactions, transaction])
  }

  function handleDeleteTransaction(id: string) {
    setTransactions(transactions.filter(t => t.id !== id))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-2000"></div>
        <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-4000"></div>
      </div>

      {/* Header */}
      <div className="sticky top-0 z-40 backdrop-blur-xl bg-white/10 border-b border-white/10 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Budget Tracker
              </h1>
              <p className="text-gray-300 mt-1 text-sm">Manage your finances with intelligence</p>
            </div>
            <div className="hidden md:block text-right">
              <p className="text-gray-300 text-sm">Total Transactions: {transactions.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-30 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-white/10 backdrop-blur-xl border border-white/20 shadow-lg mb-8 rounded-xl p-1">
            <TabsTrigger
              value="dashboard"
              className="flex items-center gap-2 rounded-lg transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white"
            >
              <BarChart3 size={18} />
              <span className="hidden sm:inline font-semibold">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger
              value="transactions"
              className="flex items-center gap-2 rounded-lg transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white"
            >
              <List size={18} />
              <span className="hidden sm:inline font-semibold">Transactions</span>
            </TabsTrigger>
            <TabsTrigger
              value="insights"
              className="flex items-center gap-2 rounded-lg transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white"
            >
              <TrendingUp size={18} />
              <span className="hidden sm:inline font-semibold">Insights</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <Dashboard transactions={transactions} />
          </TabsContent>

          <TabsContent value="transactions" className="space-y-6">
            <AllTransactions
              transactions={transactions}
              onEdit={setEditingId}
              onDelete={handleDeleteTransaction}
            />
          </TabsContent>

          <TabsContent value="insights" className="space-y-6">
            <InsightsPage transactions={transactions} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Transaction Button */}
      <AddTransactionModal onAdd={handleAddTransaction} />
    </div>
  )
}

export default App
