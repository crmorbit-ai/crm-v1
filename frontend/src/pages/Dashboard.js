import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import SubscriptionAlert from '../components/SubscriptionAlert';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { leadService } from '../services/leadService';
import { accountService } from '../services/accountService';
import { contactService } from '../services/contactService';
import { opportunityService } from '../services/opportunityService';
import { useAuth } from '../context/AuthContext';
import {
  Building2,
  Contact,
  DollarSign,
  Target,
  TrendingUp,
  TrendingDown,
  CreditCard,
  ClipboardList,
  UserCircle,
} from 'lucide-react';

const STATS_CACHE_KEY = 'dashboard_stats_cache';
const STATS_CACHE_EXPIRY = 'dashboard_stats_expiry';
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

const Dashboard = () => {
  const { user } = useAuth();

  // Try to get cached stats for instant display
  const getCachedStats = () => {
    try {
      const cached = localStorage.getItem(STATS_CACHE_KEY);
      const expiry = localStorage.getItem(STATS_CACHE_EXPIRY);
      if (cached && expiry && Date.now() < parseInt(expiry)) {
        return JSON.parse(cached);
      }
    } catch (e) {}
    return null;
  };

  const cachedStats = getCachedStats();
  const [stats, setStats] = useState(cachedStats || {
    leads: null,
    accounts: null,
    contacts: null,
    opportunities: null
  });
  const [loading, setLoading] = useState(!cachedStats);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // Only show loading if no cached data
      if (!getCachedStats()) {
        setLoading(true);
      }

      const [leadStats, accountStats, contactStats, opportunityStats] = await Promise.all([
        leadService.getLeadStats().catch(() => ({ data: null })),
        accountService.getAccountStats().catch(() => ({ data: null })),
        contactService.getContactStats().catch(() => ({ data: null })),
        opportunityService.getOpportunityStats().catch(() => ({ data: null }))
      ]);

      const newStats = {
        leads: leadStats.data,
        accounts: accountStats.data,
        contacts: contactStats.data,
        opportunities: opportunityStats.data
      };

      setStats(newStats);

      // Cache the stats
      try {
        localStorage.setItem(STATS_CACHE_KEY, JSON.stringify(newStats));
        localStorage.setItem(STATS_CACHE_EXPIRY, String(Date.now() + CACHE_DURATION));
      } catch (e) {}
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Skeleton loader for stat cards
  const SkeletonStatCard = () => (
    <div
      className="relative overflow-hidden rounded-lg border border-gray-200 p-4"
      style={{ background: 'linear-gradient(135deg, rgb(153 255 251) 0%, rgb(255 255 255) 100%)' }}
    >
      <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500" />
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-lg bg-gray-200 animate-pulse" />
        <div className="flex-1">
          <div className="h-6 w-16 bg-gray-200 rounded animate-pulse mb-2" />
          <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    </div>
  );

  // Stat card with original gradient styling
  const StatCard = ({ title, value, subtitle, icon: Icon, trend }) => (
    <div
      className="relative overflow-hidden rounded-lg border border-gray-200 p-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-blue-400"
      style={{
        background: 'linear-gradient(135deg, rgb(153 255 251) 0%, rgb(255 255 255) 100%)',
      }}
    >
      {/* Top accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500" />

      <div className="flex items-center gap-3">
        {Icon && (
          <div
            className="h-12 w-12 rounded-lg flex items-center justify-center text-2xl shadow-md"
            style={{
              background: 'linear-gradient(135deg, #4A90E2 0%, #2c5364 100%)',
              color: 'white',
            }}
          >
            <Icon className="h-6 w-6" />
          </div>
        )}
        <div className="flex-1">
          <p className="text-2xl font-extrabold text-gray-800 leading-none">
            {value}
          </p>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-1">
            {title}
          </p>
          {subtitle && (
            <p className={`text-xs mt-1 flex items-center gap-1 font-semibold ${
              trend === 'up' ? 'text-green-600' :
              trend === 'down' ? 'text-red-600' :
              'text-gray-500'
            }`}>
              {trend === 'up' && <TrendingUp className="h-3 w-3" />}
              {trend === 'down' && <TrendingDown className="h-3 w-3" />}
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );

  // Card with blue accent bar
  const AccentCard = ({ children, className = "" }) => (
    <div className={`relative overflow-hidden rounded-lg border border-gray-200 bg-white shadow-md transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-blue-400 ${className}`}>
      <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500" />
      {children}
    </div>
  );

  return (
    <DashboardLayout title={`Welcome back, ${user?.firstName}!`}>
      <SubscriptionAlert />

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {loading ? (
          <>
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
          </>
        ) : (
          <>
            <StatCard
              title="Total Leads"
              value={stats?.leads?.total || 0}
              subtitle={`${stats?.leads?.newThisMonth || 0} new this month`}
              icon={Target}
              trend="up"
            />
            <StatCard
              title="Accounts"
              value={stats?.accounts?.total || 0}
              subtitle={`${stats?.accounts?.newThisMonth || 0} new this month`}
              icon={Building2}
            />
            <StatCard
              title="Contacts"
              value={stats?.contacts?.total || 0}
              subtitle={`${stats?.contacts?.newThisMonth || 0} new this month`}
              icon={Contact}
            />
            <StatCard
              title="Total Pipeline"
              value={formatCurrency(stats?.opportunities?.totalValue || 0)}
              subtitle={`${stats?.opportunities?.total || 0} opportunities`}
              icon={DollarSign}
              trend="up"
            />
          </>
        )}
      </div>

      {/* Opportunity Stats */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <SkeletonStatCard />
          <SkeletonStatCard />
          <SkeletonStatCard />
          <SkeletonStatCard />
        </div>
      ) : stats.opportunities && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Weighted Pipeline"
            value={formatCurrency(stats.opportunities.weightedValue || 0)}
            subtitle="Expected value"
          />
          <StatCard
            title="Closing This Month"
            value={stats.opportunities.closingThisMonth || 0}
            subtitle="Opportunities"
          />
          <StatCard
            title="Closed Won"
            value={stats.opportunities.wonCount || 0}
            subtitle="Success"
            trend="up"
          />
          <StatCard
            title="Closed Lost"
            value={stats.opportunities.lostCount || 0}
            subtitle="Lost deals"
            trend="down"
          />
        </div>
      )}

      {/* Quick Actions */}
      <AccentCard className="mb-6">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-sm font-bold text-gray-800">Quick Actions</h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Button asChild variant="outline" className="h-auto py-4 flex flex-col gap-2 hover:bg-blue-50 hover:border-blue-400">
              <Link to="/subscription">
                <CreditCard className="h-5 w-5 text-blue-600" />
                <span>Subscription</span>
              </Link>
            </Button>
            <Button asChild className="h-auto py-4 flex flex-col gap-2 bg-blue-600 hover:bg-blue-700">
              <Link to="/leads">
                <ClipboardList className="h-5 w-5" />
                <span>Leads</span>
              </Link>
            </Button>
            <Button asChild variant="secondary" className="h-auto py-4 flex flex-col gap-2 hover:bg-gray-200">
              <Link to="/accounts">
                <Building2 className="h-5 w-5" />
                <span>Accounts</span>
              </Link>
            </Button>
            <Button asChild variant="secondary" className="h-auto py-4 flex flex-col gap-2 hover:bg-gray-200">
              <Link to="/contacts">
                <UserCircle className="h-5 w-5" />
                <span>Contacts</span>
              </Link>
            </Button>
            <Button asChild variant="secondary" className="h-auto py-4 flex flex-col gap-2 hover:bg-gray-200">
              <Link to="/opportunities">
                <DollarSign className="h-5 w-5" />
                <span>Opportunities</span>
              </Link>
            </Button>
          </div>
        </div>
      </AccentCard>

      {/* Opportunity Pipeline by Stage */}
      {stats.opportunities?.byStage?.length > 0 && (
        <AccentCard className="mb-6">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-sm font-bold text-gray-800">Opportunity Pipeline by Stage</h3>
          </div>
          <div className="p-4">
            <div className="space-y-3">
              {stats.opportunities.byStage.map((item) => (
                <div
                  key={item._id}
                  className="flex items-center justify-between p-4 rounded-lg border border-gray-200 bg-gradient-to-r from-white to-gray-50 hover:border-blue-400 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-1 h-10 bg-blue-500 rounded-full" />
                    <div>
                      <p className="font-bold text-gray-800">{item._id || 'Unknown'}</p>
                      <p className="text-sm text-gray-500">
                        {item.count} {item.count === 1 ? 'opportunity' : 'opportunities'}
                      </p>
                    </div>
                  </div>
                  <p className="text-lg font-extrabold text-green-600">
                    {formatCurrency(item.totalAmount || 0)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </AccentCard>
      )}

      {/* Lead Status Breakdown */}
      {stats.leads?.byStatusDetailed?.length > 0 && (
        <AccentCard className="mb-6">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-sm font-bold text-gray-800">Lead Pipeline</h3>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {stats.leads.byStatusDetailed.map((item) => (
                <div
                  key={item._id}
                  className="flex flex-col items-center justify-center p-4 rounded-lg border border-gray-200 bg-gradient-to-b from-white to-gray-50 hover:border-blue-400 hover:shadow-md transition-all duration-200"
                >
                  <Badge variant={
                    item._id?.toLowerCase() === 'converted' ? 'success' :
                    item._id?.toLowerCase() === 'lost' || item._id?.toLowerCase() === 'unqualified' ? 'destructive' :
                    'secondary'
                  }>
                    {item._id || 'Unknown'}
                  </Badge>
                  <p className="text-3xl font-extrabold text-gray-800 mt-3">{item.count}</p>
                </div>
              ))}
            </div>
          </div>
        </AccentCard>
      )}

      {/* Account Types */}
      {stats.accounts?.byType?.length > 0 && (
        <AccentCard>
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-sm font-bold text-gray-800">Accounts by Type</h3>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {stats.accounts.byType.map((item) => (
                <div
                  key={item._id}
                  className="flex flex-col items-center justify-center p-4 rounded-lg border border-gray-200 bg-gradient-to-b from-white to-gray-50 hover:border-blue-400 hover:shadow-md transition-all duration-200"
                >
                  <p className="text-sm font-semibold text-gray-500 text-center">
                    {item._id || 'Unknown'}
                  </p>
                  <p className="text-2xl font-extrabold text-gray-800 mt-2">{item.count}</p>
                </div>
              ))}
            </div>
          </div>
        </AccentCard>
      )}
    </DashboardLayout>
  );
};

export default Dashboard;
