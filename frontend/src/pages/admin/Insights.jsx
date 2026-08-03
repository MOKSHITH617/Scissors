import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  TrendingUp, Users, Heart, Award, 
  ArrowUp, DollarSign, CalendarCheck, HelpCircle 
} from 'lucide-react';
import './Insights.css';

const Insights = () => {
  const { authFetch } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState({
    dailyRevenue: [],
    monthlyRevenue: [],
    categoryDistribution: [],
    statistics: {
      averageSpending: 0,
      returningRate: 0,
      conversionRate: 0,
      followups: { total: 0, completed: 0, rescheduled: 0, pending: 0 }
    }
  });

  const loadInsights = async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/analytics/insights');
      const data = await res.json();
      if (data.success) {
        setAnalytics(data.data);
      }
    } catch (err) {
      console.error('Error fetching insights data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInsights();
  }, []);

  if (loading) {
    return (
      <div className="insights-loading-root">
        <div className="spinner"></div>
      </div>
    );
  }

  // Calculation helpers for custom SVG charts
  const maxDailyRevenue = Math.max(...analytics.dailyRevenue.map(d => d.revenue), 1000);
  const maxMonthlyRevenue = Math.max(...analytics.monthlyRevenue.map(m => m.revenue), 1000);
  
  // Custom SVG Line Graph coordinate generation for Daily Revenue (7 days)
  const chartHeight = 160;
  const chartWidth = 500;
  const dailyPoints = analytics.dailyRevenue.map((d, i) => {
    const x = (i / (analytics.dailyRevenue.length - 1)) * chartWidth;
    const y = chartHeight - (d.revenue / maxDailyRevenue) * (chartHeight - 30) - 10;
    return { x, y, label: d.dayName, val: d.revenue };
  });

  const linePath = dailyPoints.reduce((path, pt, i) => {
    return i === 0 ? `M ${pt.x} ${pt.y}` : `${path} L ${pt.x} ${pt.y}`;
  }, '');

  const areaPath = dailyPoints.length > 0 
    ? `${linePath} L ${dailyPoints[dailyPoints.length - 1].x} ${chartHeight} L ${dailyPoints[0].x} ${chartHeight} Z`
    : '';

  return (
    <div className="insights-root animate-fade-in-simple">
      
      {/* 3 cards stats banner */}
      <div className="insights-stats-banner">
        <div className="insight-stat-card glass-card">
          <div className="stat-icon-bg bg-gold">
            <DollarSign size={20} />
          </div>
          <div>
            <span className="insight-stat-label">Average Client Spending</span>
            <h3 className="insight-stat-value">₹{analytics.statistics.averageSpending}</h3>
            <span className="insight-stat-sub">Per visit receipt ticket</span>
          </div>
        </div>

        <div className="insight-stat-card glass-card">
          <div className="stat-icon-bg bg-success">
            <Users size={20} />
          </div>
          <div>
            <span className="insight-stat-label">Returning Client Rate</span>
            <h3 className="insight-stat-value">{analytics.statistics.returningRate}%</h3>
            <span className="insight-stat-sub">Clients with 2+ visits logged</span>
          </div>
        </div>

        <div className="insight-stat-card glass-card">
          <div className="stat-icon-bg bg-warning">
            <CalendarCheck size={20} />
          </div>
          <div>
            <span className="insight-stat-label">Follow-up Conversion</span>
            <h3 className="insight-stat-value">{analytics.statistics.conversionRate}%</h3>
            <span className="insight-stat-sub">Followups closed as done</span>
          </div>
        </div>
      </div>

      {/* Row 2: Charts Panel */}
      <div className="insights-charts-grid">
        
        {/* Daily Revenue Area line chart */}
        <div className="chart-card glass-card">
          <div className="chart-card-header">
            <h4>Daily Sales Trend</h4>
            <span className="trend-subtitle">Last 7 operating days</span>
          </div>

          <div className="svg-chart-container">
            {analytics.dailyRevenue.length === 0 ? (
              <p className="empty-chart-text">No daily data logged.</p>
            ) : (
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="svg-line-chart">
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent-gold)" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="var(--accent-gold)" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grid lines */}
                <line x1="0" y1={chartHeight - 10} x2={chartWidth} y2={chartHeight - 10} stroke="#E5E7EB" strokeWidth="0.5" />
                <line x1="0" y1={chartHeight / 2} x2={chartWidth} y2={chartHeight / 2} stroke="#F3F4F6" strokeWidth="0.5" />
                <line x1="0" y1="20" x2={chartWidth} y2="20" stroke="#F9FAFB" strokeWidth="0.5" />

                {/* Area under the line */}
                <path d={areaPath} fill="url(#chartGradient)" />

                {/* Line Path */}
                <path d={linePath} fill="none" stroke="var(--accent-gold)" strokeWidth="2.5" />

                {/* Data points dots */}
                {dailyPoints.map((pt, i) => (
                  <g key={i} className="chart-dot-group">
                    <circle cx={pt.x} cy={pt.y} r="4" className="chart-dot" />
                    <circle cx={pt.x} cy={pt.y} r="8" className="chart-dot-pulse" />
                    {/* Tooltip trigger or label values */}
                    <text x={pt.x} y={pt.y - 12} textAnchor="middle" className="chart-val-lbl">
                      ₹{pt.val}
                    </text>
                  </g>
                ))}
              </svg>
            )}
          </div>
          
          {/* Chart bottom labels */}
          <div className="chart-labels-row">
            {dailyPoints.map((pt, i) => (
              <span key={i} className="chart-axis-lbl">{pt.label}</span>
            ))}
          </div>
        </div>

        {/* Monthly Revenue Bar Chart */}
        <div className="chart-card glass-card">
          <div className="chart-card-header">
            <h4>Annual Sales Summary</h4>
            <span className="trend-subtitle">Year to date performance</span>
          </div>

          <div className="bar-chart-container">
            {analytics.monthlyRevenue.filter(m => m.revenue > 0).length === 0 ? (
              <p className="empty-chart-text">No monthly sales data compiled.</p>
            ) : (
              <div className="bars-wrapper">
                {analytics.monthlyRevenue.map((item, idx) => {
                  const percent = maxMonthlyRevenue > 0 ? (item.revenue / maxMonthlyRevenue) * 100 : 0;
                  return (
                    <div key={idx} className="bar-column" title={`${item.month}: ₹${item.revenue}`}>
                      <div className="bar-value-hint">₹{item.revenue > 1000 ? `${(item.revenue/1000).toFixed(1)}k` : item.revenue}</div>
                      <div className="bar-track">
                        <div 
                          className="bar-fill" 
                          style={{ height: `${Math.max(percent, 4)}%` }}
                        ></div>
                      </div>
                      <span className="bar-axis-lbl">{item.month}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Row 3: Client Breakdown & Followup Reminders analysis */}
      <div className="insights-row-3">
        
        {/* Category distribution stack list */}
        <div className="insights-card glass-card">
          <div className="card-header">
            <h4>Customer Categories Breakdown</h4>
          </div>
          
          <div className="category-progress-stack">
            {analytics.categoryDistribution.map((item, index) => {
              const total = analytics.categoryDistribution.reduce((sum, c) => sum + c.value, 0);
              const percentage = total > 0 ? Math.round((item.value / total) * 100) : 0;
              
              return (
                <div key={index} className="category-progress-row">
                  <div className="row-meta">
                    <strong>{item.name}</strong>
                    <span>{item.value} clients ({percentage}%)</span>
                  </div>
                  <div className="progress-track">
                    <div 
                      className={`progress-fill bg-${item.name.toLowerCase().replace(' ', '-')}`} 
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Follow-up reminders stats */}
        <div className="insights-card glass-card">
          <div className="card-header">
            <h4>Follow-up Reminders Summary</h4>
          </div>

          <div className="followup-statistics-deck">
            <div className="fup-stats-grid">
              <div className="fup-stat-cell">
                <span className="lbl">Total Reminders</span>
                <span className="val">{analytics.statistics.followups.total}</span>
              </div>
              <div className="fup-stat-cell">
                <span className="lbl text-success">Completed</span>
                <span className="val">{analytics.statistics.followups.completed}</span>
              </div>
              <div className="fup-stat-cell">
                <span className="lbl text-warning">Rescheduled</span>
                <span className="val">{analytics.statistics.followups.rescheduled}</span>
              </div>
              <div className="fup-stat-cell">
                <span className="lbl text-muted">Pending</span>
                <span className="val">{analytics.statistics.followups.pending}</span>
              </div>
            </div>
            
            <p className="fup-tip-desc">
              Tip: Standard retention practices state that a followup template converted at <strong>25% or higher</strong> guarantees repeat bookings of 60% annually.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
};

export default Insights;
export { Insights };
