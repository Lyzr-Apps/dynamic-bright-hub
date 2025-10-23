import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Plus, BarChart3, TrendingUp, List, Loader2 } from 'lucide-react'
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
        <Button className="fixed bottom-8 right-8 rounded-full w-16 h-16 shadow-lg bg-blue-600 hover:bg-blue-700">
          <Plus size={24} />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Transaction</DialogTitle>
          <DialogDescription>
            Record a new income or expense transaction
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={type} onValueChange={(v) => { setType(v as 'income' | 'expense'); setCategory('') }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Date</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Monthly Salary"
            />
          </div>

          <div className="space-y-2">
            <Label>Amount</Label>
            <Input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
            />
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
            Add Transaction
          </Button>
        </form>
      </DialogContent>
    </Dialog>
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

  // Prepare data for bar chart (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - i)
    return d.toISOString().split('T')[0]
  }).reverse()

  const dailyData = last7Days.map(date => {
    const dayTransactions = transactions.filter(t => t.date === date)
    return {
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      income: dayTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
      expense: dayTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
    }
  })

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1']

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="text-sm text-gray-600 mb-1">Total Income</div>
            <div className="text-3xl font-bold text-green-600">${totalIncome.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="text-sm text-gray-600 mb-1">Total Expenses</div>
            <div className="text-3xl font-bold text-red-600">${totalExpenses.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="text-sm text-gray-600 mb-1">Net Balance</div>
            <div className={`text-3xl font-bold ${netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${netBalance.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <Card className="bg-white border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Last 7 Days</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="income" fill="#10b981" />
                <Bar dataKey="expense" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pie Chart */}
        <Card className="bg-white border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Expenses by Category</CardTitle>
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
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-gray-400 py-12">No expense data yet</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card className="bg-white border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length > 0 ? (
            <div className="space-y-2">
              {transactions.slice(-5).reverse().map(t => (
                <div key={t.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{t.description}</div>
                    <div className="text-sm text-gray-600">{t.category}</div>
                  </div>
                  <div className={`text-lg font-semibold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    {t.type === 'income' ? '+' : '-'}${t.amount.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-400 py-8">No transactions yet</div>
          )}
        </CardContent>
      </Card>
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
    <div className="space-y-4">
      <Input
        placeholder="Search transactions..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="bg-white"
      />

      <Card className="bg-white border-0 shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-gray-200">
                <TableHead className="text-gray-600">Date</TableHead>
                <TableHead className="text-gray-600">Description</TableHead>
                <TableHead className="text-gray-600">Category</TableHead>
                <TableHead className="text-gray-600">Amount</TableHead>
                <TableHead className="text-gray-600">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length > 0 ? (
                filtered.map(t => (
                  <TableRow key={t.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <TableCell className="text-sm">{new Date(t.date).toLocaleDateString()}</TableCell>
                    <TableCell className="text-sm font-medium">{t.description}</TableCell>
                    <TableCell>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        t.type === 'income'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {t.category}
                      </span>
                    </TableCell>
                    <TableCell className={`font-semibold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {t.type === 'income' ? '+' : '-'}${t.amount.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onEdit(t.id)}
                          className="text-xs"
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onDelete(t.id)}
                          className="text-xs text-red-600 hover:text-red-700"
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-400">
                    No transactions found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
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
    <div className="space-y-6">
      <Button
        onClick={fetchInsights}
        disabled={loading || transactions.length === 0}
        className="bg-blue-600 hover:bg-blue-700"
      >
        {loading ? (
          <>
            <Loader2 size={16} className="mr-2 animate-spin" />
            Analyzing...
          </>
        ) : (
          <>
            <TrendingUp size={16} className="mr-2" />
            Generate Insights
          </>
        )}
      </Button>

      {error && (
        <Card className="bg-red-50 border-0 shadow-sm">
          <CardContent className="pt-6">
            <p className="text-red-700">{error}</p>
          </CardContent>
        </Card>
      )}

      {insights && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-white border-0 shadow-sm">
              <CardContent className="pt-6">
                <div className="text-sm text-gray-600 mb-1">Total Income</div>
                <div className="text-3xl font-bold text-green-600">
                  ${insights.result.summary.total_income.toFixed(2)}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-0 shadow-sm">
              <CardContent className="pt-6">
                <div className="text-sm text-gray-600 mb-1">Total Expenses</div>
                <div className="text-3xl font-bold text-red-600">
                  ${insights.result.summary.total_expenses.toFixed(2)}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-0 shadow-sm">
              <CardContent className="pt-6">
                <div className="text-sm text-gray-600 mb-1">Net Income</div>
                <div className={`text-3xl font-bold ${insights.result.summary.net_income >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${insights.result.summary.net_income.toFixed(2)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Narrative */}
          <Card className="bg-white border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Monthly Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">
                {insights.result.summary.narrative}
              </p>
            </CardContent>
          </Card>

          {/* Budgeting Tips */}
          <Card className="bg-white border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Budgeting Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {insights.result.budgeting_tips.map((tip, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="text-blue-600 font-bold mt-0.5">{i + 1}.</span>
                    <span className="text-gray-700">{tip}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card className="bg-gray-50 border-0 shadow-sm">
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-gray-600">Transactions Analyzed</div>
                  <div className="font-semibold text-gray-900">{insights.metadata.transactions_analyzed}</div>
                </div>
                <div>
                  <div className="text-gray-600">Auto-Categorized</div>
                  <div className="font-semibold text-gray-900">{insights.metadata.transactions_auto_categorized}</div>
                </div>
                <div>
                  <div className="text-gray-600">Confidence</div>
                  <div className="font-semibold text-gray-900">{(insights.confidence * 100).toFixed(0)}%</div>
                </div>
                <div>
                  <div className="text-gray-600">Period</div>
                  <div className="font-semibold text-gray-900">{insights.metadata.analysis_period}</div>
                </div>
              </div>
            </CardContent>
          </Card>
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Budget Tracker</h1>
          <p className="text-gray-600 mt-1">Manage your income and expenses with ease</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-white border border-gray-200 shadow-sm mb-8">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 size={18} />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="transactions" className="flex items-center gap-2">
              <List size={18} />
              <span className="hidden sm:inline">Transactions</span>
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center gap-2">
              <TrendingUp size={18} />
              <span className="hidden sm:inline">Insights</span>
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
