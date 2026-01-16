import { useEffect, useState, useCallback } from "react";
import {
  RefreshCw,
  ChevronDown,
  Check,
  ChefHat,
  Truck,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

interface OrderItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  specialInstructions?: string;
}

interface Order {
  id: string;
  tableNumber: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: string;
  estimatedWaitTime: number;
  notes?: string;
  createdAt: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>("active");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string> = {};

      if (filter === "active") {
        // We'll filter client-side for multiple statuses
      } else if (filter !== "all") {
        params.status = filter;
      }

      const response = await axios.get(`${API_URL}/admin/orders`, { params });

      if (response.data.success) {
        let fetchedOrders = response.data.data.orders;

        // Filter active orders client-side
        if (filter === "active") {
          fetchedOrders = fetchedOrders.filter((o: Order) =>
            ["pending", "confirmed", "preparing", "ready"].includes(o.status)
          );
        }

        setOrders(fetchedOrders);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchOrders();

    // Poll every 15 seconds for new orders
    const interval = setInterval(fetchOrders, 15000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await axios.patch(`${API_URL}/admin/orders/${orderId}`, {
        status: newStatus,
      });

      if (response.data.success) {
        setOrders((prev) =>
          prev.map((order) =>
            order.id === orderId ? { ...order, status: newStatus } : order
          )
        );
      }
    } catch (error) {
      console.error("Failed to update order:", error);
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/10 border-yellow-500/30";
      case "confirmed":
        return "bg-blue-500/10 border-blue-500/30";
      case "preparing":
        return "bg-sunsetOrange/10 border-sunsetOrange/30";
      case "ready":
        return "bg-green-500/10 border-green-500/30";
      default:
        return "bg-white/5 border-white/10";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Orders</h1>
          <p className="text-steelBlue">Manage and fulfill customer orders</p>
        </div>
        <div className="flex items-center gap-4">
          {/* Filter */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-surface border border-white/10 rounded-lg py-2 px-4 text-white focus:outline-none focus:border-primary"
          >
            <option value="active">Active Orders</option>
            <option value="all">All Orders</option>
            <option value="pending">Pending</option>
            <option value="preparing">Preparing</option>
            <option value="ready">Ready</option>
            <option value="delivered">Delivered</option>
          </select>

          <button
            onClick={fetchOrders}
            disabled={isLoading}
            className="btn-ghost flex items-center gap-2"
          >
            <RefreshCw
              className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
            />
            <span className="hidden md:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {orders.map((order) => (
            <motion.div
              key={order.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`card border ${getStatusBg(order.status)}`}
            >
              {/* Order Header */}
              <div className="p-4 border-b border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <span className="badge-primary font-bold">
                    {order.tableNumber}
                  </span>
                  <span className="text-steelBlue text-sm">
                    {new Date(order.createdAt).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-white font-mono text-sm">
                  #{order.id.slice(0, 8).toUpperCase()}
                </p>
              </div>

              {/* Order Items */}
              <div className="p-4">
                <button
                  onClick={() =>
                    setExpandedOrder(
                      expandedOrder === order.id ? null : order.id
                    )
                  }
                  className="flex items-center justify-between w-full text-left mb-3"
                >
                  <span className="text-steelBlue text-sm">
                    {order.items.length} item
                    {order.items.length !== 1 ? "s" : ""}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-steelBlue transition-transform ${
                      expandedOrder === order.id ? "rotate-180" : ""
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {expandedOrder === order.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden mb-4"
                    >
                      <ul className="space-y-2">
                        {order.items.map((item, idx) => (
                          <li
                            key={idx}
                            className="flex justify-between text-sm"
                          >
                            <span className="text-white">
                              {item.quantity}x {item.name}
                            </span>
                            <span className="text-steelBlue">
                              ₦{(item.price * item.quantity).toLocaleString()}
                            </span>
                          </li>
                        ))}
                      </ul>
                      {order.notes && (
                        <p className="mt-2 text-sm text-sunsetOrange italic">
                          Note: {order.notes}
                        </p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex items-center justify-between">
                  <span className="text-white font-bold text-lg">
                    ₦{order.total.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Status Actions */}
              <div className="p-4 border-t border-white/5 bg-white/5">
                <div className="flex flex-wrap gap-2">
                  {/* Show logical next status options based on current status */}
                  {order.status === "pending" && (
                    <>
                      <button
                        onClick={() => updateOrderStatus(order.id, "confirmed")}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-white/10 hover:bg-white/20 transition-colors text-blue-500"
                      >
                        <Check className="w-4 h-4" />
                        <span>Confirm</span>
                      </button>
                      <button
                        onClick={() => updateOrderStatus(order.id, "cancelled")}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-white/10 hover:bg-red-500/20 transition-colors text-red-500"
                      >
                        <X className="w-4 h-4" />
                        <span>Cancel</span>
                      </button>
                    </>
                  )}
                  {order.status === "confirmed" && (
                    <button
                      onClick={() => updateOrderStatus(order.id, "preparing")}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-white/10 hover:bg-white/20 transition-colors text-sunsetOrange"
                    >
                      <ChefHat className="w-4 h-4" />
                      <span>Start Preparing</span>
                    </button>
                  )}
                  {order.status === "preparing" && (
                    <button
                      onClick={() => updateOrderStatus(order.id, "ready")}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-white/10 hover:bg-white/20 transition-colors text-green-500"
                    >
                      <Truck className="w-4 h-4" />
                      <span>Mark Ready</span>
                    </button>
                  )}
                  {order.status === "ready" && (
                    <button
                      onClick={() => updateOrderStatus(order.id, "delivered")}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-green-500/20 hover:bg-green-500/30 transition-colors text-green-400"
                    >
                      <Check className="w-4 h-4" />
                      <span>Mark Delivered</span>
                    </button>
                  )}
                  {(order.status === "delivered" ||
                    order.status === "cancelled") && (
                    <span className="text-steelBlue text-sm italic">
                      Order completed
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {!isLoading && orders.length === 0 && (
        <div className="text-center py-12">
          <p className="text-steelBlue text-lg">No orders found</p>
          <p className="text-text-muted text-sm">
            Orders will appear here when customers place them
          </p>
        </div>
      )}
    </div>
  );
}
