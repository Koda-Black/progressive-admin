import { useEffect, useState } from "react";
import {
  ClipboardList,
  Clock,
  CheckCircle,
  TrendingUp,
  RefreshCw,
} from "lucide-react";
import { motion } from "framer-motion";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

interface Stats {
  pendingOrders: number;
  preparingOrders: number;
  completedToday: number;
  averageWaitTime: number;
}

interface RecentOrder {
  id: string;
  tableNumber: string;
  status: string;
  total: number;
  createdAt: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    pendingOrders: 0,
    preparingOrders: 0,
    completedToday: 0,
    averageWaitTime: 0,
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [ordersRes, analyticsRes] = await Promise.all([
        axios.get(`${API_URL}/admin/orders?limit=10`),
        axios.get(`${API_URL}/admin/analytics`),
      ]);

      if (ordersRes.data.success) {
        setRecentOrders(ordersRes.data.data.orders);
      }

      if (analyticsRes.data.success) {
        setStats(analyticsRes.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Poll for updates every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const statCards = [
    {
      label: "Pending Orders",
      value: stats.pendingOrders,
      icon: ClipboardList,
      color: "text-sunsetOrange",
      bg: "bg-sunsetOrange/10",
    },
    {
      label: "Preparing",
      value: stats.preparingOrders,
      icon: Clock,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Completed Today",
      value: stats.completedToday,
      icon: CheckCircle,
      color: "text-green-500",
      bg: "bg-green-500/10",
    },
    {
      label: "Avg Wait Time",
      value: `${stats.averageWaitTime}m`,
      icon: TrendingUp,
      color: "text-steelBlue",
      bg: "bg-steelBlue/10",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/20 text-yellow-500";
      case "confirmed":
        return "bg-blue-500/20 text-blue-500";
      case "preparing":
        return "bg-sunsetOrange/20 text-sunsetOrange";
      case "ready":
        return "bg-green-500/20 text-green-500";
      case "delivered":
        return "bg-steelBlue/20 text-steelBlue";
      default:
        return "bg-white/10 text-white";
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-steelBlue">Real-time order overview</p>
        </div>
        <button
          onClick={fetchData}
          disabled={isLoading}
          className="btn-ghost flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="card p-6"
          >
            <div
              className={`w-12 h-12 ${stat.bg} rounded-xl flex items-center justify-center mb-4`}
            >
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <p className="text-steelBlue text-sm mb-1">{stat.label}</p>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Recent Orders */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="card"
      >
        <div className="p-6 border-b border-white/5">
          <h2 className="text-lg font-bold text-white">Recent Orders</h2>
        </div>

        <div className="divide-y divide-white/5">
          {recentOrders.length === 0 ? (
            <div className="p-8 text-center text-steelBlue">No orders yet</div>
          ) : (
            recentOrders.map((order) => (
              <div
                key={order.id}
                className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <span className="text-primary font-bold text-sm">
                      {order.tableNumber}
                    </span>
                  </div>
                  <div>
                    <p className="text-white font-medium">
                      Order #{order.id.slice(0, 8)}
                    </p>
                    <p className="text-steelBlue text-sm">
                      {new Date(order.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span
                    className={`badge ${getStatusColor(
                      order.status
                    )} capitalize`}
                  >
                    {order.status}
                  </span>
                  <span className="text-sunsetOrange font-bold">
                    ₦{order.total.toLocaleString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}
