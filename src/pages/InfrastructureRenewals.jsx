// pages/InfrastructureRenewals.jsx
import { useEffect, useState } from "react";
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
  RefreshCw,
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import Modal from "../components/ui/Modal";
import InfrastructureRenewalForm from "../components/infrastructure/InfrastructureRenewalForm";

export default function InfrastructureRenewals() {
  const { user } = useAuth();
  const toast = useToast();
  const [renewals, setRenewals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRenewal, setEditingRenewal] = useState(null);
  const [projects, setProjects] = useState([]);
  const [filters, setFilters] = useState({
    project: "",
    status: "",
  });

  useEffect(() => {
    fetchRenewals();
    fetchProjects();
  }, [user, filters]);

  const fetchRenewals = async () => {
    try {
      let query = supabase
        .from("infrastructure_renewals")
        .select(
          `
          *,
          project:projects(name)
        `,
        )
        .order("renewal_date", { ascending: true });

      if (filters.project) {
        query = query.eq("project_id", filters.project);
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

  const fetchProjects = async () => {
    try {
      const { data: userProjects } = await supabase
        .from("projects")
        .select("id, name")
        .eq("owner_id", user?.id);

      setProjects(userProjects || []);
    } catch (error) {
      console.error("Error fetching projects:", error);
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
    dueSoon: renewals.filter(
      (r) =>
        differenceInDays(new Date(r.renewal_date), new Date()) <= 30 &&
        differenceInDays(new Date(r.renewal_date), new Date()) > 0,
    ).length,
    expired: renewals.filter(
      (r) => differenceInDays(new Date(r.renewal_date), new Date()) < 0,
    ).length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            Loading infrastructure renewals...
          </p>
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
              <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl">
                <Server className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Infrastructure Renewals
                </h1>
                <p className="text-gray-600 mt-1">
                  Track domain, hosting, and service renewals
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setEditingRenewal(null);
                setIsModalOpen(true);
              }}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-medium shadow-md hover:shadow-lg transition-shadow flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Add Renewal Item
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-sm">
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
            <div className="bg-white rounded-xl p-6 shadow-sm">
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
            <div className="bg-white rounded-xl p-6 shadow-sm">
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
            <div className="bg-white rounded-xl p-6 shadow-sm">
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

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
            <div className="flex items-center gap-4">
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
                <option value="active">Active</option>
                <option value="renewed">Renewed</option>
                <option value="expired">Expired</option>
              </select>
              <button
                onClick={() => setFilters({ project: "", status: "" })}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Renewals Table */}
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
                  Project
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
                      <div className="text-sm text-gray-900">
                        {renewal.project?.name || "N/A"}
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
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteRenewal(renewal.id)}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
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

          {renewals.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Server className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No renewal items
              </h3>
              <p className="text-gray-600 mb-4">
                Add domain, hosting, or service renewals to track
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
        </div>

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
            initialData={editingRenewal}
            projects={projects}
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
