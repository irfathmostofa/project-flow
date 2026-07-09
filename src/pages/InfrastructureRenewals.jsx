// pages/InfrastructureRenewals.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import {
  Server,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  DollarSign,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import Modal from "../components/ui/Modal";
import InfrastructureRenewalForm from "../components/infrastructure/InfrastructureRenewalForm";

export default function InfrastructureRenewals() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const [renewals, setRenewals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRenewal, setEditingRenewal] = useState(null);
  const [project, setProject] = useState(null);
  const [filters, setFilters] = useState({
    search: "",
    status: "",
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (projectId) {
      fetchProject();
      fetchRenewals();
    }
  }, [projectId, filters]);

  const fetchProject = async () => {
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, owner_id")
        .eq("id", projectId)
        .single();

      if (error) throw error;
      setProject(data);
    } catch (error) {
      console.error("Error fetching project:", error);
      toast.error("Project not found");
      navigate("/projects");
    }
  };

  const fetchRenewals = async () => {
    try {
      let query = supabase
        .from("infrastructure_renewals")
        .select("*")
        .eq("project_id", projectId)
        .order("renewal_date", { ascending: true });

      if (filters.search) {
        query = query.ilike("item_name", `%${filters.search}%`);
      }
      if (filters.status) {
        query = query.eq("status", filters.status);
      }

      const { data, error } = await query;
      if (error) throw error;
      setRenewals(data || []);
    } catch (error) {
      console.error("Error fetching renewals:", error);
      toast.error("Failed to load renewals");
    } finally {
      setLoading(false);
    }
  };

  const deleteRenewal = async (id) => {
    if (!window.confirm("Are you sure you want to delete this renewal item?"))
      return;

    try {
      const { error } = await supabase
        .from("infrastructure_renewals")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Renewal item deleted");
      fetchRenewals();
    } catch (error) {
      console.error("Error deleting renewal:", error);
      toast.error("Failed to delete renewal");
    }
  };

  const getStatusConfig = (status, renewalDate) => {
    const daysUntilRenewal = differenceInDays(
      new Date(renewalDate),
      new Date(),
    );

    if (status === "expired" || daysUntilRenewal < 0) {
      return {
        label: "Expired",
        color: "bg-red-100 text-red-700",
        icon: AlertCircle,
      };
    } else if (daysUntilRenewal <= 30) {
      return {
        label: "Due Soon",
        color: "bg-yellow-100 text-yellow-700",
        icon: Clock,
      };
    } else if (status === "renewed") {
      return {
        label: "Renewed",
        color: "bg-green-100 text-green-700",
        icon: CheckCircle,
      };
    }
    return {
      label: "Active",
      color: "bg-blue-100 text-blue-700",
      icon: RefreshCw,
    };
  };

  const stats = {
    total: renewals.length,
    totalCost: renewals.reduce((sum, r) => sum + (r.annual_cost || 0), 0),
    dueSoon: renewals.filter((r) => {
      const days = differenceInDays(new Date(r.renewal_date), new Date());
      return days <= 30 && days > 0;
    }).length,
    expired: renewals.filter(
      (r) => differenceInDays(new Date(r.renewal_date), new Date()) < 0,
    ).length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading renewals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-4">
        {/* Header with Back Button */}
        <div className="mb-8">
          <button
            onClick={() => navigate(`/projects/${projectId}`)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Project
          </button>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl shadow-lg">
                <Server className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Infrastructure Renewals
                </h1>
                <p className="text-gray-600 mt-1">
                  {project?.name} - Track domain, hosting, and service renewals
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setEditingRenewal(null);
                setIsModalOpen(true);
              }}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-medium shadow-md hover:shadow-lg transition-all flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Add Renewal Item
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Items</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.total}
                  </p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <Server className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Annual Cost</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ৳{stats.totalCost.toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Due Soon</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {stats.dueSoon}
                  </p>
                </div>
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Expired</p>
                  <p className="text-2xl font-bold text-red-600">
                    {stats.expired}
                  </p>
                </div>
                <div className="p-3 bg-red-50 rounded-lg">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
                    showFilters
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <Filter className="h-4 w-4" />
                  <span>Filters</span>
                </button>

                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        search: e.target.value,
                      }))
                    }
                    placeholder="Search items..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {showFilters && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      value={filters.status}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          status: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">All Status</option>
                      <option value="active">Active</option>
                      <option value="renewed">Renewed</option>
                      <option value="expired">Expired</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={() => setFilters({ search: "", status: "" })}
                      className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                    >
                      Clear Filters
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Renewals Table */}
        {renewals.length > 0 ? (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Item Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Provider
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Annual Cost
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Renewal Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {renewals.map((renewal) => {
                  const statusConfig = getStatusConfig(
                    renewal.status,
                    renewal.renewal_date,
                  );
                  const StatusIcon = statusConfig.icon;
                  const daysUntil = differenceInDays(
                    new Date(renewal.renewal_date),
                    new Date(),
                  );

                  return (
                    <tr key={renewal.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">
                          {renewal.item_name}
                        </div>
                        {renewal.notes && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {renewal.notes}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {renewal.provider || "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">
                          ৳{renewal.annual_cost?.toLocaleString() || 0}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <div className="text-sm text-gray-900">
                            {format(
                              new Date(renewal.renewal_date),
                              "MMM d, yyyy",
                            )}
                          </div>
                          {daysUntil > 0 && daysUntil <= 30 && (
                            <div className="text-xs text-yellow-600">
                              {daysUntil} days remaining
                            </div>
                          )}
                          {daysUntil < 0 && (
                            <div className="text-xs text-red-600">
                              {Math.abs(daysUntil)} days overdue
                            </div>
                          )}
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
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setEditingRenewal(renewal);
                              setIsModalOpen(true);
                            }}
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteRenewal(renewal.id)}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm text-center py-16">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Server className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No renewal items
            </h3>
            <p className="text-gray-600 mb-4">
              Add domain, hosting, or service renewals for this project
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-medium"
            >
              <Plus className="h-5 w-5 inline mr-2" />
              Add Renewal Item
            </button>
          </div>
        )}

        {/* Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingRenewal(null);
          }}
          title={editingRenewal ? "Edit Renewal Item" : "Add Renewal Item"}
          size="lg"
        >
          <InfrastructureRenewalForm
            projectId={projectId}
            initialData={editingRenewal}
            onSuccess={() => {
              setIsModalOpen(false);
              setEditingRenewal(null);
              fetchRenewals();
              toast.success(
                editingRenewal ? "Renewal updated" : "Renewal added",
              );
            }}
          />
        </Modal>
      </div>
    </div>
  );
}
