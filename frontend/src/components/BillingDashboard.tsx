'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { FileText, AlertTriangle, TrendingUp, CheckCircle2, BarChart3, Clock } from 'lucide-react';

/**
 * BillingDashboard Component
 * 
 * VERCEL INTEGRATION:
 * - Fetches real analysis history from Vercel KV via /api/analysis/history
 * - Falls back to mock data if storage is not configured
 * - Shows real-time stats from user's session
 */

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

// Analysis record from Vercel KV storage
interface StorageAnalysisRecord {
  id: string;
  timestamp: string;
  source: string;
  analysisType: string;
  fileName?: string;
  summary?: string;
  riskScore?: number;
  riskLevel?: string;
  errorsFound?: number;
  potentialSavings?: number;
  status: string;
}

interface BillingDashboardProps {
  stats?: Partial<DashboardStats>;
  chartData?: ChartDataPoint[];
  history?: AnalysisHistoryItem[];
}

// Mock data for demo purposes (fallback when storage not available)
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

/**
 * Convert storage record to history item format
 */
function convertToHistoryItem(record: StorageAnalysisRecord): AnalysisHistoryItem {
  const getStatus = (): 'success' | 'warning' | 'error' => {
    if (record.status === 'failed') return 'error';
    if (record.riskLevel === 'HIGH') return 'warning';
    return 'success';
  };

  return {
    id: record.id,
    date: record.timestamp,
    proceduresAnalyzed: record.errorsFound || 1,
    totalSavings: record.potentialSavings || 0,
    overchargePercentage: record.riskScore || 0,
    status: getStatus(),
    description: record.summary || record.fileName || `${record.source} analysis`,
  };
}

const BillingDashboard: React.FC<BillingDashboardProps> = ({
  stats: propStats,
  chartData: propChartData,
  history: propHistory
}) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [history, setHistory] = useState<AnalysisHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [usingRealData, setUsingRealData] = useState(false);

  /**
   * Fetch real history from Vercel KV storage
   */
  const fetchRealHistory = useCallback(async () => {
    try {
      const response = await fetch('/api/analysis/history?limit=10');
      if (!response.ok) {
        throw new Error('Failed to fetch history');
      }

      const data = await response.json();
      
      if (data.success && data.analyses && data.analyses.length > 0) {
        // Convert storage records to history items
        const realHistory = data.analyses.map(convertToHistoryItem);
        setHistory(realHistory);
        
        // Update stats with real data
        setStats(prev => ({
          ...prev!,
          totalBillsAnalyzed: data.stats.totalAnalyses,
          totalSavings: data.stats.totalSavings,
          totalOverchargesDetected: data.stats.highRiskCount,
        }));
        
        setUsingRealData(true);
        return true;
      }
      
      return false;
    } catch (error) {
      console.warn('Could not fetch real history, using mock data:', error);
      return false;
    }
  }, []);

  useEffect(() => {
    const initDashboard = async () => {
      // Use provided data or generate mock data as fallback
      const mockData = generateMockData();
      setStats(propStats ? { ...mockData.stats, ...propStats } : mockData.stats);
      setChartData(propChartData || mockData.chartData);
      
      // If history is provided as prop, use it
      if (propHistory) {
        setHistory(propHistory);
        setIsLoading(false);
        return;
      }

      // Try to fetch real history from Vercel KV
      const hasRealData = await fetchRealHistory();
      
      // If no real data, use mock data
      if (!hasRealData) {
        setHistory(mockData.history);
      }

      setIsLoading(false);
    };

    initDashboard();
  }, [propStats, propChartData, propHistory, fetchRealHistory]);

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
      {/* Data Source Indicator - Vercel KV Integration */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {usingRealData ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <span className="w-2 h-2 mr-1.5 rounded-full bg-green-500 animate-pulse"></span>
              Live Data (Vercel KV)
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
              Demo Data
            </span>
          )}
        </div>
        <button
          onClick={() => fetchRealHistory()}
          className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
        >
          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Summary Cards - Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Bills Analyzed */}
        <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-start justify-between mb-4">
            <div className="bg-teal-50 text-teal-700 rounded-lg p-2.5">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">Total Bills Analyzed</p>
          <p className="text-3xl font-semibold text-zinc-900">{stats.totalBillsAnalyzed.toLocaleString()}</p>
        </div>

        {/* Total Overcharges Detected */}
        <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-start justify-between mb-4">
            <div className="bg-red-50 text-red-700 rounded-lg p-2.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">Overcharges Detected</p>
          <p className="text-3xl font-semibold text-zinc-900">{stats.totalOverchargesDetected.toLocaleString()}</p>
        </div>

        {/* Average Overcharge Percentage */}
        <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-start justify-between mb-4">
            <div className="bg-emerald-50 text-emerald-700 rounded-lg p-2.5">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">Avg Overcharge</p>
          <p className="text-3xl font-semibold text-zinc-900">{formatPercentage(stats.averageOverchargePercentage)}</p>
        </div>

        {/* Successful Appeals */}
        <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-start justify-between mb-4">
            <div className="bg-teal-50 text-teal-700 rounded-lg p-2.5">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">Successful Appeals</p>
          <p className="text-3xl font-semibold text-zinc-900">{stats.successfulAppeals}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Overcharge Distribution Chart */}
        <div className="bg-white border border-zinc-200 rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-zinc-900 mb-6 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-medical-primary" />
            Overcharge Distribution by Category
          </h3>

          <div className="space-y-4">
            {chartData.map((item, index) => (
              <div key={index} className="flex items-center space-x-4">
                <div className="w-32 text-sm text-zinc-600 truncate">{item.category}</div>
                <div className="flex-1">
                  <div className="relative h-2 bg-zinc-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000 ease-out bg-medical-primary"
                      style={{
                        width: `${item.percentage}%`,
                        minWidth: '2px'
                      }}
                    />
                  </div>
                  <div className="mt-1 text-xs text-zinc-500">
                    {formatCurrency(item.overchargeAmount)}
                  </div>
                </div>
                <div className="w-16 text-right">
                  <span className="text-sm font-medium text-zinc-900">{formatPercentage(item.percentage)}</span>
                  <span className="text-xs text-zinc-500 block">({item.count})</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-zinc-200">
            <div className="flex justify-between text-sm text-zinc-600">
              <span>Total Overcharges: {formatCurrency(chartData.reduce((sum, item) => sum + item.overchargeAmount, 0))}</span>
              <span>{chartData.reduce((sum, item) => sum + item.count, 0)} procedures</span>
            </div>
          </div>
        </div>

        {/* Recent Analysis History */}
        <div className="bg-white border border-zinc-200 rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-zinc-900 mb-6 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-medical-accent" />
            Recent Analysis History
          </h3>

          <div className="space-y-4 max-h-80 overflow-y-auto">
            {history.map((item) => (
              <div key={item.id} className="flex items-start space-x-4 p-4 bg-zinc-50 rounded-lg hover:bg-zinc-100 transition-colors">
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${getStatusColor(item.status)}`}>
                  {getStatusIcon(item.status)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-zinc-900 truncate">{item.description}</p>
                    <span className="text-xs text-zinc-500">
                      {new Date(item.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>

                  <div className="mt-2 grid grid-cols-3 gap-4 text-xs text-zinc-600">
                    <div>
                      <span className="font-medium">{item.proceduresAnalyzed}</span> procedures
                    </div>
                    <div>
                      <span className="font-medium">{formatPercentage(item.overchargePercentage)}</span> overcharge
                    </div>
                    <div>
                      <span className="font-medium text-medical-accent">{formatCurrency(item.totalSavings)}</span> saved
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-zinc-200">
            <button className="w-full bg-zinc-900 text-white py-2 px-4 rounded-md hover:bg-zinc-800 transition-colors text-sm font-medium">
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
