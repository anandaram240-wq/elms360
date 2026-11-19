'use client'

import * as React from 'react'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

const DONUT_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#6B7280']

interface DashboardChartsProps {
  departmentDistribution: Array<{ name: string; count: number; percentage: number }>
  monthlyTrends: Array<{ month: string; applied: number; approved: number; rejected: number }>
  leaveTypeBreakdown: Array<{ name: string; days: number; color?: string }>
  topDepartments: Array<{ name: string; count: number; percentage: number }>
}

export function HRDashboardCharts({
  departmentDistribution,
  monthlyTrends,
  leaveTypeBreakdown,
  topDepartments,
}: DashboardChartsProps) {
  const [isMounted, setIsMounted] = React.useState(false)

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="h-80 animate-pulse bg-muted/20" />
        <Card className="h-80 animate-pulse bg-muted/20" />
        <Card className="h-80 animate-pulse bg-muted/20" />
        <Card className="h-80 animate-pulse bg-muted/20" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Monthly Leave Trend Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Monthly Leave Trends (This Year)</CardTitle>
            <CardDescription>Comparison of applications, approvals, and rejections</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    border: '1px solid #e2e8f0',
                  }}
                />
                <Legend wrapperStyle={{ paddingTop: 10, fontSize: '12px' }} />
                <Bar dataKey="applied" fill="#93C5FD" name="Applied" radius={[4, 4, 0, 0]} />
                <Bar dataKey="approved" fill="#3B82F6" name="Approved" radius={[4, 4, 0, 0]} />
                <Bar dataKey="rejected" fill="#EF4444" name="Rejected" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 2. Department-wise Leave Distribution (Donut Chart) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Department-wise Leave Distribution</CardTitle>
            <CardDescription>Share of approved leaves by business unit</CardDescription>
          </CardHeader>
          <CardContent className="h-80 flex flex-col justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={departmentDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={4}
                  dataKey="count"
                  nameKey="name"
                >
                  {departmentDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any, name: any, props: any) => [
                    `${value} days (${props.payload.percentage}%)`,
                    props.payload.name,
                  ]}
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 3. Leave Type Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Leave Type Consumption</CardTitle>
            <CardDescription>Total days consumed across different leave types</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={leaveTypeBreakdown}
                layout="vertical"
                margin={{ top: 10, right: 20, left: 20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.3} />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value: any) => [`${value} Days`, 'Used']}
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                  }}
                />
                <Bar dataKey="days" radius={[0, 4, 4, 0]}>
                  {leaveTypeBreakdown.map((entry, idx) => (
                    <Cell key={`type-cell-${idx}`} fill={entry.color || DONUT_COLORS[idx % DONUT_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 4. Top 5 Departments by Leave Count */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Top 5 Departments by Leaves</CardTitle>
            <CardDescription>Departments with highest leave frequencies this quarter</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 pt-2">
            {topDepartments.map((dept, idx) => (
              <div key={dept.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                      {idx + 1}
                    </span>
                    {dept.name}
                  </span>
                  <span className="text-muted-foreground font-medium">
                    {dept.count} leaves ({dept.percentage}%)
                  </span>
                </div>
                <Progress value={dept.percentage} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
