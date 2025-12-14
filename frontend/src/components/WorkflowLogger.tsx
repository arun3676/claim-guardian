'use client';

import React, { useState, useRef, useEffect } from 'react';
import { CheckCircle2, XCircle, AlertCircle, Loader2, Code2 } from 'lucide-react';

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'info' | 'success' | 'warning' | 'error' | 'tool';
  tool?: string;
  message: string;
  details?: string;
  data?: any;
}

interface WorkflowLoggerProps {
  logs: LogEntry[];
  isRunning: boolean;
  onClear?: () => void;
}

export default function WorkflowLogger({ logs, isRunning, onClear }: WorkflowLoggerProps) {
  const logEndRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const copyLog = async (log: LogEntry) => {
    const logText = `[${log.timestamp.toISOString()}] [${log.level.toUpperCase()}]${log.tool ? ` [${log.tool}]` : ''} ${log.message}${log.details ? `\n${log.details}` : ''}${log.data ? `\n${JSON.stringify(log.data, null, 2)}` : ''}`;
    
    try {
      await navigator.clipboard.writeText(logText);
      setCopiedId(log.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy log:', err);
    }
  };

  const copyAllLogs = async () => {
    const allLogsText = logs.map(log => 
      `[${log.timestamp.toISOString()}] [${log.level.toUpperCase()}]${log.tool ? ` [${log.tool}]` : ''} ${log.message}${log.details ? `\n${log.details}` : ''}${log.data ? `\n${JSON.stringify(log.data, null, 2)}` : ''}`
    ).join('\n\n');
    
    try {
      await navigator.clipboard.writeText(allLogsText);
      alert('All logs copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy logs:', err);
    }
  };

  const getLevelBorderColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'success':
        return 'border-l-4 border-emerald-500';
      case 'warning':
        return 'border-l-4 border-yellow-500';
      case 'error':
        return 'border-l-4 border-red-500';
      case 'tool':
        return 'border-l-4 border-blue-500';
      default:
        return 'border-l-4 border-zinc-300';
    }
  };

  const getStatusDot = (level: LogEntry['level'], isLast: boolean) => {
    const baseClasses = 'absolute left-0 w-3 h-3 rounded-full border-2 border-white transform -translate-x-1/2';
    
    switch (level) {
      case 'success':
        return (
          <div className={`${baseClasses} bg-emerald-500 ${!isLast ? 'animate-pulse' : ''}`} />
        );
      case 'error':
        return (
          <div className={`${baseClasses} bg-red-500`} />
        );
      case 'tool':
      case 'info':
        return (
          <div className={`${baseClasses} bg-blue-500 animate-pulse`} />
        );
      default:
        return (
          <div className={`${baseClasses} bg-zinc-400`} />
        );
    }
  };

  return (
    <div className="bg-white border border-zinc-200 rounded-xl shadow-sm">
      <div className="flex items-center justify-between p-4 border-b border-zinc-200 bg-zinc-50">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-zinc-900">AI Activity Stream</h3>
          {isRunning && (
            <span className="flex items-center gap-2 text-sm text-blue-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing...
            </span>
          )}
          {logs.length > 0 && (
            <span className="text-sm text-zinc-500">
              {logs.length} {logs.length === 1 ? 'entry' : 'entries'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {logs.length > 0 && (
            <>
              <button
                onClick={copyAllLogs}
                className="px-3 py-1.5 text-sm bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-md transition-colors"
                type="button"
              >
                Copy All
              </button>
              {onClear && (
                <button
                  onClick={onClear}
                  className="px-3 py-1.5 text-sm bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-md transition-colors"
                  type="button"
                >
                  Clear
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <div className="h-96 overflow-y-auto p-6 relative">
        {logs.length === 0 ? (
          <div className="text-center text-zinc-400 py-8">
            <p>No logs yet. Upload a PDF to start the workflow.</p>
          </div>
        ) : (
          <div className="relative pl-8 border-l-2 border-zinc-100">
            {logs.map((log, index) => {
              const isLast = index === logs.length - 1;
              return (
                <div
                  key={log.id}
                  className={`relative mb-6 bg-white border ${getLevelBorderColor(log.level)} rounded-lg p-4 shadow-sm hover:shadow-md transition-all animate-fade-in`}
                  style={{
                    animation: 'fadeIn 0.3s ease-in-out'
                  }}
                >
                  {/* Status Dot */}
                  {getStatusDot(log.level, isLast)}
                  
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        {log.tool && (
                          <div className="flex items-center gap-1.5">
                            <Code2 className="w-4 h-4 text-zinc-500" />
                            <span className="text-sm font-semibold text-zinc-900">Using Tool: {log.tool}</span>
                          </div>
                        )}
                        <span className="text-xs text-zinc-500">
                          {log.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-zinc-900 mb-2 break-words">{log.message}</p>
                      {(log.details || log.data) && (
                        <div className="mt-3 font-mono text-xs bg-zinc-50 p-3 rounded-md border border-zinc-200 overflow-x-auto">
                          {log.details && (
                            <div className="whitespace-pre-wrap break-words text-zinc-700 mb-2">
                              {log.details}
                            </div>
                          )}
                          {log.data && (
                            <pre className="text-zinc-700">
                              {JSON.stringify(log.data, null, 2)}
                            </pre>
                          )}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => copyLog(log)}
                      className="flex-shrink-0 px-2 py-1 text-xs bg-zinc-100 hover:bg-zinc-200 rounded border border-zinc-200 transition-colors"
                      type="button"
                      title="Copy log entry"
                    >
                      {copiedId === log.id ? '✓ Copied' : '📋'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div ref={logEndRef} />
      </div>

      {logs.some(log => log.level === 'error') && (
        <div className="p-4 bg-red-50 border-t border-red-200">
          <div className="flex items-center gap-2 text-red-800">
            <XCircle className="w-4 h-4" />
            <span className="font-semibold">Errors Detected</span>
            <button
              onClick={() => {
                const errorLogs = logs.filter(log => log.level === 'error');
                const errorText = errorLogs.map(log => 
                  `[${log.timestamp.toISOString()}] [ERROR]${log.tool ? ` [${log.tool}]` : ''} ${log.message}${log.details ? `\n${log.details}` : ''}`
                ).join('\n\n');
                navigator.clipboard.writeText(errorText);
                alert('Error logs copied to clipboard!');
              }}
              className="text-xs px-2 py-1 bg-red-100 hover:bg-red-200 rounded"
              type="button"
            >
              Copy Errors
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
