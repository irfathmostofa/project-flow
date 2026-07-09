// pages/Handovers.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import {
  FileCheck,
  Plus,
  Search,
  Filter,
  Eye,
  Users,
  Calendar,
  CheckCircle,
  Box,
  Key,
  GraduationCap,
  HeartHandshake,
  FileText,
  ArrowLeft,
} from "lucide-react";
import { format } from "date-fns";
import Modal from "../components/ui/Modal";
import HandoverForm from "../components/handovers/HandoverForm";
import HandoverDetails from "../components/handovers/HandoverDetails";

export default function Handovers() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const [handovers, setHandovers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedHandover, setSelectedHandover] = useState(null);
  const [editingHandover, setEditingHandover] = useState(null);
  const [project, setProject] = useState(null);
  const [filters, setFilters] = useState({
    search: "",
    status: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [signingId, setSigningId] = useState(null);

  useEffect(() => {
    if (projectId) {
      fetchProject();
      fetchHandovers();
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

  const fetchHandovers = async () => {
    try {
      let query = supabase
        .from("handover_documents")
        .select(
          `
          *,
          project:projects(id, name),
          delivered_by_user:users!delivered_by(id, full_name, email),
          received_by_user:users!received_by(id, full_name, email),
          handover_deliverables(count),
          handover_credentials(count),
          handover_training_sessions(count),
          handover_support_terms(count)
        `,
        )
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (filters.search) {
        query = query.or(`handover_number.ilike.%${filters.search}%`);
      }
      if (filters.status) {
        query = query.eq("status", filters.status);
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

  const getStatusConfig = (status) => {
    const configs = {
      draft: {
        label: "Draft",
        color: "bg-gray-100 text-gray-700",
        icon: FileText,
      },
      signed: {
        label: "Signed",
        color: "bg-green-100 text-green-700",
        icon: CheckCircle,
      },
      completed: {
        label: "Completed",
        color: "bg-blue-100 text-blue-700",
        icon: FileCheck,
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
              <div className="p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl shadow-lg">
                <FileCheck className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Project Handovers
                </h1>
                <p className="text-gray-600 mt-1">
                  {project?.name} - Manage project delivery and client handover
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
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
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
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
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
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
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
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
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

          {/* Filters Bar */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
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
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
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
                      <option value="draft">Draft</option>
                      <option value="signed">Signed</option>
                      <option value="completed">Completed</option>
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
                  className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {handover.handover_number}
                          </h3>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}
                          >
                            <StatusIcon className="h-3 w-3" />
                            {statusConfig.label}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>
                          Handover Date:{" "}
                          {format(
                            new Date(handover.handover_date),
                            "MMM d, yyyy",
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Users className="h-4 w-4" />
                        <span>
                          Received by:{" "}
                          {handover.received_by_user?.full_name || "N/A"}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {deliverableCount > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded-lg">
                          <Box className="h-3 w-3" />
                          {deliverableCount} Deliverables
                        </span>
                      )}
                      {credentialCount > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-600 text-xs rounded-lg">
                          <Key className="h-3 w-3" />
                          {credentialCount} Credentials
                        </span>
                      )}
                      {trainingCount > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-600 text-xs rounded-lg">
                          <GraduationCap className="h-3 w-3" />
                          {trainingCount} Training Sessions
                        </span>
                      )}
                    </div>

                    <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                      <button
                        onClick={() => {
                          setSelectedHandover(handover);
                          setIsDetailsModalOpen(true);
                        }}
                        className="px-4 py-2 text-orange-600 hover:bg-orange-50 rounded-lg font-medium"
                      >
                        View Details
                      </button>
                      {handover.status === "draft" && (
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
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm text-center py-16">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileCheck className="h-8 w-8 text-orange-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No handovers yet
            </h3>
            <p className="text-gray-600 mb-4">
              Create a handover document for this project
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl font-medium"
            >
              <Plus className="h-5 w-5 inline mr-2" />
              Create Handover
            </button>
          </div>
        )}

        {/* Modals */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingHandover(null);
          }}
          title={editingHandover ? "Edit Handover" : "Create New Handover"}
          size="4xl"
        >
          <HandoverForm
            projectId={projectId}
            initialData={editingHandover}
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
