// pages/Payments.jsx
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import {
  CreditCard,
  Plus,
  Search,
  Filter,
  Eye,
  Download,
  DollarSign,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  Banknote,
  Wallet,
} from "lucide-react";
import { format } from "date-fns";
import Modal from "../components/ui/Modal";
import PaymentForm from "../components/payments/PaymentForm";

export default function Payments() {
  const { user } = useAuth();
  const toast = useToast();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [projects, setProjects] = useState([]);
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    project: "",
    dateRange: "",
  });

  useEffect(() => {
    fetchPayments();
    fetchProjects();
  }, [user, filters]);

  const fetchPayments = async () => {
    try {
      let query = supabase
        .from("payments")
        .select(
          `
          *,
          project:projects(name),
          payment_schedule:payment_schedules(description, payment_type),
          received_by_user:users!received_by(full_name, email)
        `,
        )
        .order("payment_date", { ascending: false });

      if (filters.project) {
        query = query.eq("project_id", filters.project);
      }
      if (filters.status) {
        query = query.eq("status", filters.status);
      }

      const { data, error } = await query;
      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      console.error("Error fetching payments:", error);
      toast.error("Failed to load payments");
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const { data: userProjects } = await supabase
        .from("projects")
        .select("id, name")
        .eq("owner_id", user?.id);

      const { data: memberProjects } = await supabase
        .from("project_members")
        .select("project_id, projects:project_id(id, name)")
        .eq("user_id", user?.id);

      const allProjects = [
        ...(userProjects || []),
        ...(memberProjects?.map((m) => m.projects) || []),
      ];
      setProjects(allProjects);
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      completed: {
        label: "Completed",
        color: "bg-green-100 text-green-700",
        icon: CheckCircle,
      },
      pending: {
        label: "Pending",
        color: "bg-yellow-100 text-yellow-700",
        icon: Clock,
      },
      failed: {
        label: "Failed",
        color: "bg-red-100 text-red-700",
        icon: AlertCircle,
      },
      refunded: {
        label: "Refunded",
        color: "bg-gray-100 text-gray-700",
        icon: Banknote,
      },
    };
    return configs[status] || configs.completed;
  };

  const getPaymentMethodIcon = (method) => {
    const icons = {
      cash: Banknote,
      bank_transfer: CreditCard,
      credit_card: CreditCard,
      mobile_banking: Wallet,
    };
    const Icon = icons[method] || CreditCard;
    return <Icon className="h-4 w-4" />;
  };

  const stats = {
    total: payments.length,
    totalAmount: payments.reduce((sum, p) => sum + (p.amount || 0), 0),
    completed: payments.filter((p) => p.status === "completed").length,
    pending: payments.filter((p) => p.status === "pending").length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading payments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl">
                <CreditCard className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
                <p className="text-gray-600 mt-1">
                  Track and manage project payments
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-xl font-medium shadow-md hover:shadow-lg transition-shadow flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Record Payment
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Payments</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.total}
                  </p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <CreditCard className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Amount</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ৳{stats.totalAmount.toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <DollarSign className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-green-600">
                    {stats.completed}
                  </p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {stats.pending}
                  </p>
                </div>
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search payments..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <select
                  value={filters.project}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, project: e.target.value }))
                  }
                  className="px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">All Projects</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
                <select
                  value={filters.status}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, status: e.target.value }))
                  }
                  className="px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">All Status</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Payments Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Transaction
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Project
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Received By
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {payments.map((payment) => {
                const statusConfig = getStatusConfig(payment.status);
                const StatusIcon = statusConfig.icon;

                return (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">
                        {payment.transaction_id || "N/A"}
                      </div>
                      {payment.reference_note && (
                        <div className="text-sm text-gray-500">
                          {payment.reference_note}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {payment.project?.name || "N/A"}
                      </div>
                      {payment.payment_schedule && (
                        <div className="text-xs text-gray-500">
                          {payment.payment_schedule.description}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">
                        ৳{payment.amount.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getPaymentMethodIcon(payment.payment_method)}
                        <span className="text-sm capitalize">
                          {payment.payment_method.replace("_", " ")}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(payment.payment_date), "MMM d, yyyy")}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}
                      >
                        <StatusIcon className="h-3 w-3" />
                        {statusConfig.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {payment.received_by_user?.full_name ||
                          payment.received_by_user?.email ||
                          "N/A"}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {payments.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No payments recorded
              </h3>
              <p className="text-gray-600 mb-4">
                Record your first payment to track finances
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-xl font-medium"
              >
                <Plus className="h-5 w-5 inline mr-2" />
                Record Payment
              </button>
            </div>
          )}
        </div>

        {/* Payment Form Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Record New Payment"
          size="lg"
        >
          <PaymentForm
            projects={projects}
            onSuccess={() => {
              setIsModalOpen(false);
              fetchPayments();
              toast.success("Payment recorded successfully");
            }}
          />
        </Modal>
      </div>
    </div>
  );
}
