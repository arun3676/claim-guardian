'use client';

import React, { useState, useEffect } from 'react';

// TypeScript interfaces for the dashboard
interface DashboardStats {
  totalBillsAnalyzed: number;
  totalOverchargesDetected: number;
  averageOverchargePercentage: number;
  successfulAppeals: number;
  totalSavings: number;
}

interface ChartDataPoint {
  category: string;
  overchargeAmount: number;
  percentage: number;
  count: number;
  color: string;
}

interface AnalysisHistoryItem {
  id: string;
  date: string;
  proceduresAnalyzed: number;
  totalSavings: number;
  overchargePercentage: number;
  status: 'success' | 'warning' | 'error';
  description: string;
}

interface BillingDashboardProps {
  stats?: Partial<DashboardStats>;
  chartData?: ChartDataPoint[];
  history?: AnalysisHistoryItem[];
}

// Mock data for demo purposes
const generateMockData = () => {
  const stats: DashboardStats = {
    totalBillsAnalyzed: 1247,
    totalOverchargesDetected: 892,
    averageOverchargePercentage: 34.7,
    successfulAppeals: 156,
    totalSavings: 45680.50
  };

  const chartData: ChartDataPoint[] = [
    { category: 'Evaluation & Management', overchargeAmount: 18500, percentage: 40.5, count: 234, color: '#3B82F6' },
    { category: 'Pathology & Laboratory', overchargeAmount: 12400, percentage: 27.1, count: 156, color: '#10B981' },
    { category: 'Radiology', overchargeAmount: 8900, percentage: 19.5, count: 89, color: '#F59E0B' },
    { category: 'Cardiology', overchargeAmount: 4200, percentage: 9.2, count: 45, color: '#EF4444' },
    { category: 'Other', overchargeAmount: 1680, percentage: 3.7, count: 23, color: '#8B5CF6' }
  ];

  const history: AnalysisHistoryItem[] = [
    {
      id: '1',
      date: '2025-12-11T14:30:00Z',
      proceduresAnalyzed: 8,
      totalSavings: 1250.75,
      overchargePercentage: 42.3,
      status: 'success',
      description: 'Office visit and lab work analysis'
    },
    {
      id: '2',
      date: '2025-12-11T11:15:00Z',
      proceduresAnalyzed: 5,
      totalSavings: 890.50,
      overchargePercentage: 28.7,
      status: 'success',
      description: 'Radiology and cardiology procedures'
    },
    {
      id: '3',
      date: '2025-12-10T16:45:00Z',
      proceduresAnalyzed: 12,
      totalSavings: 2100.25,
      overchargePercentage: 55.2,
      status: 'warning',
      description: 'Comprehensive metabolic panel and follow-up'
    },
    {
      id: '4',
      date: '2025-12-10T09:20:00Z',
      proceduresAnalyzed: 3,
      totalSavings: 450.00,
      overchargePercentage: 18.9,
      status: 'success',
      description: 'Vaccination and consultation'
    },
    {
      id: '5',
      date: '2025-12-09T13:10:00Z',
      proceduresAnalyzed: 6,
      totalSavings: 0,
      overchargePercentage: 0,
      status: 'success',
      description: 'Preventive care - no overcharges found'
    }
  ];

  return { stats, chartData, history };
};

const BillingDashboard: React.FC<BillingDashboardProps> = ({
  stats: propStats,
  chartData: propChartData,
  history: propHistory
}) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [history, setHistory] = useState<AnalysisHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Use provided data or generate mock data
    const mockData = generateMockData();

    setStats(propStats ? { ...mockData.stats, ...propStats } : mockData.stats);
    setChartData(propChartData || mockData.chartData);
    setHistory(propHistory || mockData.history);

    // Simulate loading delay for demo effect
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, [propStats, propChartData, propHistory]);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (percentage: number): string => {
    return `${percentage.toFixed(1)}%`;
  };

  const getStatusColor = (status: AnalysisHistoryItem['status']): string => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: AnalysisHistoryItem['status']): string => {
    switch (status) {
      case 'success': return '✓';
      case 'warning': return '⚠';
      case 'error': return '✕';
      default: return '○';
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-200 rounded-lg p-6 h-32"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-gray-200 rounded-lg p-6 h-80"></div>
          <div className="bg-gray-200 rounded-lg p-6 h-80"></div>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Bills Analyzed */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg transform hover:scale-105 transition-transform duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Bills Analyzed</p>
              <p className="text-3xl font-bold mt-2">{stats.totalBillsAnalyzed.toLocaleString()}</p>
            </div>
            <div className="bg-blue-400 bg-opacity-30 rounded-full p-3">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-blue-200">↗ Active analyses</span>
          </div>
        </div>

        {/* Total Overcharges Detected */}
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white shadow-lg transform hover:scale-105 transition-transform duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm font-medium">Overcharges Detected</p>
              <p className="text-3xl font-bold mt-2">{stats.totalOverchargesDetected.toLocaleString()}</p>
            </div>
            <div className="bg-red-400 bg-opacity-30 rounded-full p-3">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-red-200">↑ {formatPercentage((stats.totalOverchargesDetected / stats.totalBillsAnalyzed) * 100)} of total</span>
          </div>
        </div>

        {/* Average Overcharge Percentage */}
        <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl p-6 text-white shadow-lg transform hover:scale-105 transition-transform duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm font-medium">Avg Overcharge</p>
              <p className="text-3xl font-bold mt-2">{formatPercentage(stats.averageOverchargePercentage)}</p>
            </div>
            <div className="bg-yellow-400 bg-opacity-30 rounded-full p-3">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
              </svg>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-yellow-200">Above Medicare rates</span>
          </div>
        </div>

        {/* Successful Appeals */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg transform hover:scale-105 transition-transform duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Successful Appeals</p>
              <p className="text-3xl font-bold mt-2">{stats.successfulAppeals}</p>
            </div>
            <div className="bg-green-400 bg-opacity-30 rounded-full p-3">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-green-200">{formatCurrency(stats.totalSavings)} saved</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Overcharge Distribution Chart */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <svg className="w-5 h-5 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
            </svg>
            Overcharge Distribution by Category
          </h3>

          <div className="space-y-4">
            {chartData.map((item, index) => (
              <div key={index} className="flex items-center space-x-4">
                <div className="w-32 text-sm text-gray-600 truncate">{item.category}</div>
                <div className="flex-1">
                  <div className="relative">
                    <div
                      className="h-6 rounded-full transition-all duration-1000 ease-out"
                      style={{
                        backgroundColor: item.color,
                        width: `${item.percentage}%`,
                        minWidth: '20px'
                      }}
                    >
                      <div className="absolute inset-0 flex items-center justify-end pr-2">
                        <span className="text-xs font-medium text-white drop-shadow-sm">
                          {formatCurrency(item.overchargeAmount)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="w-16 text-right">
                  <span className="text-sm font-medium text-gray-900">{formatPercentage(item.percentage)}</span>
                  <span className="text-xs text-gray-500 block">({item.count})</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Total Overcharges: {formatCurrency(chartData.reduce((sum, item) => sum + item.overchargeAmount, 0))}</span>
              <span>{chartData.reduce((sum, item) => sum + item.count, 0)} procedures</span>
            </div>
          </div>
        </div>

        {/* Recent Analysis History */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <svg className="w-5 h-5 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            Recent Analysis History
          </h3>

          <div className="space-y-4 max-h-80 overflow-y-auto">
            {history.map((item) => (
              <div key={item.id} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${getStatusColor(item.status)}`}>
                  {getStatusIcon(item.status)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.description}</p>
                    <span className="text-xs text-gray-500">
                      {new Date(item.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>

                  <div className="mt-2 grid grid-cols-3 gap-4 text-xs text-gray-600">
                    <div>
                      <span className="font-medium">{item.proceduresAnalyzed}</span> procedures
                    </div>
                    <div>
                      <span className="font-medium">{formatPercentage(item.overchargePercentage)}</span> overcharge
                    </div>
                    <div>
                      <span className="font-medium text-green-600">{formatCurrency(item.totalSavings)}</span> saved
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200">
            <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
              View All History
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingDashboard;
export type { DashboardStats, ChartDataPoint, AnalysisHistoryItem, BillingDashboardProps };
