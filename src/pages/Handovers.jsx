// pages/Handovers.jsx
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import {
  FileCheck,
  Plus,
  Search,
  Filter,
  Eye,
  Download,
  Users,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  Box,
  Key,
  GraduationCap,
  HeartHandshake,
  FileText,
  X,
  ChevronDown,
  MoreVertical,
} from "lucide-react";
import { format } from "date-fns";
import Modal from "../components/ui/Modal";
import HandoverForm from "../components/handovers/HandoverForm";
import HandoverDetails from "../components/handovers/HandoverDetails";

export default function Handovers() {
  const { user } = useAuth();
  const toast = useToast();
  const [handovers, setHandovers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedHandover, setSelectedHandover] = useState(null);
  const [editingHandover, setEditingHandover] = useState(null);
  const [projects, setProjects] = useState([]);
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    project: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [signingId, setSigningId] = useState(null);

  useEffect(() => {
    fetchHandovers();
    fetchProjects();
  }, [user, filters]);

  const fetchHandovers = async () => {
    try {
      let query = supabase
        .from("handover_documents")
        .select(
          `
          *,
          project:projects(id, name, owner_id),
          delivered_by_user:users!delivered_by(id, full_name, email),
          received_by_user:users!received_by(id, full_name, email),
          handover_deliverables(count),
          handover_credentials(count),
          handover_training_sessions(count),
          handover_support_terms(count)
        `,
        )
        .order("created_at", { ascending: false });

      if (filters.search) {
        query = query.or(
          `handover_number.ilike.%${filters.search}%,project.name.ilike.%${filters.search}%`,
        );
      }
      if (filters.status) {
        query = query.eq("status", filters.status);
      }
      if (filters.project) {
        query = query.eq("project_id", filters.project);
      }

      const { data, error } = await query;

      if (error) throw error;
      setHandovers(data || []);
    } catch (error) {
      console.error("Error fetching handovers:", error);
      toast.error("Failed to load handovers");
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      // Fetch projects user owns
      const { data: ownedProjects } = await supabase
        .from("projects")
        .select("id, name")
        .eq("owner_id", user?.id);

      // Fetch projects where user is a member
      const { data: memberProjects } = await supabase
        .from("project_members")
        .select("project_id, projects:project_id(id, name)")
        .eq("user_id", user?.id);

      const allProjects = [
        ...(ownedProjects || []),
        ...(memberProjects?.map((m) => m.projects) || []),
      ];

      setProjects(allProjects);
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  const updateHandoverStatus = async (id, status) => {
    setSigningId(id);
    try {
      const { error } = await supabase
        .from("handover_documents")
        .update({
          status,
          signed_at: status === "signed" ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;
      toast.success(`Handover ${status === "signed" ? "signed" : status}`);
      fetchHandovers();
    } catch (error) {
      console.error("Error updating handover:", error);
      toast.error("Failed to update handover");
    } finally {
      setSigningId(null);
    }
  };

  const deleteHandover = async (id) => {
    if (
      !window.confirm("Are you sure you want to delete this handover document?")
    )
      return;

    try {
      // Delete related records first (cascade should handle this, but explicit for safety)
      await supabase
        .from("handover_deliverables")
        .delete()
        .eq("handover_id", id);
      await supabase
        .from("handover_credentials")
        .delete()
        .eq("handover_id", id);
      await supabase
        .from("handover_training_sessions")
        .delete()
        .eq("handover_id", id);
      await supabase
        .from("handover_support_terms")
        .delete()
        .eq("handover_id", id);

      const { error } = await supabase
        .from("handover_documents")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Handover deleted");
      fetchHandovers();
    } catch (error) {
      console.error("Error deleting handover:", error);
      toast.error("Failed to delete handover");
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      draft: {
        label: "Draft",
        color: "bg-gray-100 text-gray-700",
        borderColor: "border-gray-200",
        icon: FileText,
        gradient: "from-gray-500 to-gray-600",
      },
      signed: {
        label: "Signed",
        color: "bg-green-100 text-green-700",
        borderColor: "border-green-200",
        icon: CheckCircle,
        gradient: "from-green-500 to-emerald-600",
      },
      completed: {
        label: "Completed",
        color: "bg-blue-100 text-blue-700",
        borderColor: "border-blue-200",
        icon: FileCheck,
        gradient: "from-blue-500 to-indigo-600",
      },
    };
    return configs[status] || configs.draft;
  };

  const stats = {
    total: handovers.length,
    draft: handovers.filter((h) => h.status === "draft").length,
    signed: handovers.filter((h) => h.status === "signed").length,
    completed: handovers.filter((h) => h.status === "completed").length,
  };

  const clearFilters = () => {
    setFilters({ search: "", status: "", project: "" });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading handovers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl shadow-lg">
                <FileCheck className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Project Handovers
                </h1>
                <p className="text-gray-600 mt-1">
                  Manage project delivery and client handover documentation
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setEditingHandover(null);
                setIsModalOpen(true);
              }}
              className="px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl font-medium shadow-md hover:shadow-lg transition-all flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              New Handover
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Handovers</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.total}
                  </p>
                </div>
                <div className="p-3 bg-orange-50 rounded-lg">
                  <FileCheck className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Draft</p>
                  <p className="text-2xl font-bold text-gray-600">
                    {stats.draft}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <FileText className="h-6 w-6 text-gray-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Signed</p>
                  <p className="text-2xl font-bold text-green-600">
                    {stats.signed}
                  </p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {stats.completed}
                  </p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <FileCheck className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filters Bar */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
                    showFilters
                      ? "bg-orange-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <Filter className="h-4 w-4" />
                  <span>Filters</span>
                  {(filters.status || filters.project) && (
                    <span className="bg-orange-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                      Active
                    </span>
                  )}
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
                    placeholder="Search handovers..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
              </div>

              {(filters.search || filters.status || filters.project) && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Clear all filters
                </button>
              )}
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">All Status</option>
                      <option value="draft">Draft</option>
                      <option value="signed">Signed</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Project
                    </label>
                    <select
                      value={filters.project}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          project: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">All Projects</option>
                      {projects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Handovers Grid */}
        {handovers.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {handovers.map((handover) => {
              const statusConfig = getStatusConfig(handover.status);
              const StatusIcon = statusConfig.icon;
              const deliverableCount =
                handover.handover_deliverables?.[0]?.count || 0;
              const credentialCount =
                handover.handover_credentials?.[0]?.count || 0;
              const trainingCount =
                handover.handover_training_sessions?.[0]?.count || 0;

              return (
                <div
                  key={handover.id}
                  className="group bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300 overflow-hidden"
                >
                  {/* Colored top bar */}
                  <div
                    className={`h-1.5 bg-gradient-to-r ${statusConfig.gradient}`}
                  />

                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {handover.handover_number}
                          </h3>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color} border ${statusConfig.borderColor}`}
                          >
                            <StatusIcon className="h-3 w-3" />
                            {statusConfig.label}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          {handover.project?.name}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span>
                          Handover Date:{" "}
                          {format(
                            new Date(handover.handover_date),
                            "MMM d, yyyy",
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span>
                          Delivered by:{" "}
                          {handover.delivered_by_user?.full_name || "N/A"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span>
                          Received by:{" "}
                          {handover.received_by_user?.full_name || "N/A"}
                        </span>
                      </div>
                    </div>

                    {/* Stats badges */}
                    <div className="flex flex-wrap gap-2 mb-4 pt-2 border-t border-gray-100">
                      {deliverableCount > 0 && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-lg">
                          <Box className="h-3.5 w-3.5" />
                          {deliverableCount} Deliverable
                          {deliverableCount !== 1 ? "s" : ""}
                        </span>
                      )}
                      {credentialCount > 0 && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 text-purple-700 text-xs font-medium rounded-lg">
                          <Key className="h-3.5 w-3.5" />
                          {credentialCount} Credential
                          {credentialCount !== 1 ? "s" : ""}
                        </span>
                      )}
                      {trainingCount > 0 && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-lg">
                          <GraduationCap className="h-3.5 w-3.5" />
                          {trainingCount} Training Session
                          {trainingCount !== 1 ? "s" : ""}
                        </span>
                      )}
                      {deliverableCount === 0 &&
                        credentialCount === 0 &&
                        trainingCount === 0 && (
                          <span className="text-xs text-gray-400">
                            No items added yet
                          </span>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                      <button
                        onClick={() => {
                          setSelectedHandover(handover);
                          setIsDetailsModalOpen(true);
                        }}
                        className="px-4 py-2 text-orange-600 hover:bg-orange-50 rounded-lg font-medium transition-colors"
                      >
                        View Details
                      </button>
                      {handover.status === "draft" && (
                        <>
                          <button
                            onClick={() => {
                              setEditingHandover(handover);
                              setIsModalOpen(true);
                            }}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() =>
                              updateHandoverStatus(handover.id, "signed")
                            }
                            disabled={signingId === handover.id}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-1"
                          >
                            {signingId === handover.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                            ) : (
                              <CheckCircle className="h-4 w-4" />
                            )}
                            Sign & Complete
                          </button>
                        </>
                      )}
                      {handover.status !== "completed" && (
                        <button
                          onClick={() => deleteHandover(handover.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <FileText className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty State */
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 text-center py-16 px-4">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FileCheck className="h-10 w-10 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                No handovers yet
              </h3>
              <p className="text-gray-600 mb-6">
                Create a handover document to track project delivery and client
                handover. Include deliverables, credentials, training sessions,
                and support terms.
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl font-medium hover:shadow-lg transition-all inline-flex items-center gap-2"
              >
                <Plus className="h-5 w-5" />
                Create Your First Handover
              </button>
            </div>
          </div>
        )}

        {/* Modals */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingHandover(null);
          }}
          title={
            editingHandover ? "Edit Handover Document" : "Create New Handover"
          }
          size="4xl"
        >
          <HandoverForm
            initialData={editingHandover}
            projects={projects}
            onSuccess={() => {
              setIsModalOpen(false);
              setEditingHandover(null);
              fetchHandovers();
              toast.success(
                editingHandover ? "Handover updated" : "Handover created",
              );
            }}
          />
        </Modal>

        <Modal
          isOpen={isDetailsModalOpen}
          onClose={() => {
            setIsDetailsModalOpen(false);
            setSelectedHandover(null);
          }}
          title="Handover Details"
          size="4xl"
        >
          <HandoverDetails
            handover={selectedHandover}
            onStatusChange={updateHandoverStatus}
          />
        </Modal>
      </div>
    </div>
  );
}
