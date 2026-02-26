'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts';

const COLORS = ['#FF6B35', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
const ROLE_COLORS: Record<string, string> = {
  buyer: '#3b82f6', owner: '#10b981', broker: '#f59e0b', admin: '#FF6B35',
};
const PLAN_COLORS: Record<string, string> = {
  free: '#6b7280', silver: '#94a3b8', gold: '#f59e0b',
};

const tooltipStyle = {
  contentStyle: { backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#fff', fontSize: 12 },
};

interface Props {
  propertiesByCityData: { city: string; count: number }[];
  usersByRoleData: { role: string; count: number }[];
  subsData: { plan: string; count: number }[];
  monthlyData: { month: string; count: number }[];
}

export function AnalyticsCharts({ propertiesByCityData, usersByRoleData, subsData, monthlyData }: Props) {
  return (
    <div className="space-y-6">
      {/* Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Properties by City */}
        <Card>
          <CardHeader><CardTitle>Properties by City (Top 10)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={propertiesByCityData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="city" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="count" fill="#FF6B35" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Monthly Subscriptions */}
        <Card>
          <CardHeader><CardTitle>New Subscriptions (Last 6 Months)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={monthlyData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <Tooltip {...tooltipStyle} />
                <Line type="monotone" dataKey="count" stroke="#FF6B35" strokeWidth={2} dot={{ fill: '#FF6B35', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Users by Role */}
        <Card>
          <CardHeader><CardTitle>Users by Role</CardTitle></CardHeader>
          <CardContent>
            {usersByRoleData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={usersByRoleData} dataKey="count" nameKey="role" cx="50%" cy="50%" outerRadius={90} paddingAngle={3}>
                    {usersByRoleData.map((entry, i) => (
                      <Cell key={i} fill={ROLE_COLORS[entry.role] || COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip {...tooltipStyle} />
                  <Legend formatter={(v) => <span style={{ color: '#9ca3af', fontSize: 12 }}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[240px] flex items-center justify-center">
                <p className="text-gray-600 text-sm">No data</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Subscriptions by Plan */}
        <Card>
          <CardHeader><CardTitle>Active Subscriptions by Plan</CardTitle></CardHeader>
          <CardContent>
            {subsData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={subsData} dataKey="count" nameKey="plan" cx="50%" cy="50%" outerRadius={90} paddingAngle={3}>
                    {subsData.map((entry, i) => (
                      <Cell key={i} fill={PLAN_COLORS[entry.plan] || COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip {...tooltipStyle} />
                  <Legend formatter={(v) => <span style={{ color: '#9ca3af', fontSize: 12 }}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[240px] flex items-center justify-center">
                <p className="text-gray-600 text-sm">No active subscriptions</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
