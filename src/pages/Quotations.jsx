// pages/Quotations.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import {
  FileText,
  Plus,
  Search,
  Filter,
  Download,
  Send,
  Eye,
  Edit,
  Trash2,
  DollarSign,
  Calendar,
  Users,
  MoreVertical,
  X,
  CheckCircle,
  Clock,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import { format } from "date-fns";
import Modal from "../components/ui/Modal";
import QuotationForm from "../components/quotations/QuotationForm";
import QuotationDetails from "../components/quotations/QuotationDetails";

export default function Quotations() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState(null);
  const [editingQuotation, setEditingQuotation] = useState(null);
  const [project, setProject] = useState(null);
  const [lineItems, setLineItems] = useState([]);
  const [recurringItems, setRecurringItems] = useState([]);
  const [filters, setFilters] = useState({
    search: "",
    status: "",
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (projectId) {
      fetchProject();
      fetchQuotations();
    } else {
      // If no projectId, redirect to projects page
      navigate("/projects");
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

  const fetchQuotations = async () => {
    try {
      let query = supabase
        .from("quotations")
        .select(
          `
          *,
          project:projects(name),
          created_by_user:users!created_by(full_name, email),
          quotation_line_items(count)
        `,
        )
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (filters.search) {
        query = query.or(
          `quote_number.ilike.%${filters.search}%,client_name.ilike.%${filters.search}%`,
        );
      }
      if (filters.status) {
        query = query.eq("status", filters.status);
      }

      const { data, error } = await query;
      if (error) throw error;
      setQuotations(data || []);
    } catch (error) {
      console.error("Error fetching quotations:", error);
      toast.error("Failed to load quotations");
    } finally {
      setLoading(false);
    }
  };

  const fetchQuotationDetails = async (quotationId) => {
    try {
      const { data, error } = await supabase
        .from("quotations")
        .select(
          `
          *,
          quotation_line_items(*),
          quotation_recurring_items(*)
        `,
        )
        .eq("id", quotationId)
        .single();

      if (error) throw error;
      setSelectedQuotation(data);
      setLineItems(data?.quotation_line_items || []);
      setRecurringItems(data?.quotation_recurring_items || []);
    } catch (error) {
      console.error("Error fetching quotation details:", error);
      toast.error("Failed to load quotation details");
    }
  };

  const updateQuotationStatus = async (id, status) => {
    try {
      const { error } = await supabase
        .from("quotations")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;
      toast.success(`Quotation ${status === "sent" ? "sent" : status}`);
      fetchQuotations();
    } catch (error) {
      console.error("Error updating quotation:", error);
      toast.error("Failed to update quotation");
    }
  };

  const deleteQuotation = async (id) => {
    if (!window.confirm("Are you sure you want to delete this quotation?"))
      return;

    try {
      const { error } = await supabase.from("quotations").delete().eq("id", id);
      if (error) throw error;
      toast.success("Quotation deleted");
      fetchQuotations();
    } catch (error) {
      console.error("Error deleting quotation:", error);
      toast.error("Failed to delete quotation");
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      draft: { label: "Draft", color: "bg-gray-100 text-gray-700", icon: Edit },
      sent: { label: "Sent", color: "bg-blue-100 text-blue-700", icon: Send },
      approved: {
        label: "Approved",
        color: "bg-green-100 text-green-700",
        icon: CheckCircle,
      },
      rejected: {
        label: "Rejected",
        color: "bg-red-100 text-red-700",
        icon: X,
      },
      expired: {
        label: "Expired",
        color: "bg-yellow-100 text-yellow-700",
        icon: AlertCircle,
      },
    };
    return configs[status] || configs.draft;
  };

  const stats = {
    total: quotations.length,
    draft: quotations.filter((q) => q.status === "draft").length,
    sent: quotations.filter((q) => q.status === "sent").length,
    approved: quotations.filter((q) => q.status === "approved").length,
    totalValue: quotations.reduce((sum, q) => sum + (q.total_amount || 0), 0),
  };

  const clearFilters = () => {
    setFilters({ search: "", status: "" });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading quotations...</p>
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
              <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Quotations</h1>
                <p className="text-gray-600 mt-1">
                  {project?.name} - Manage client quotations and proposals
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setEditingQuotation(null);
                setIsModalOpen(true);
              }}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium shadow-md hover:shadow-lg transition-all flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              New Quotation
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.total}
                  </p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <FileText className="h-6 w-6 text-purple-600" />
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
                  <Edit className="h-6 w-6 text-gray-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Sent</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {stats.sent}
                  </p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <Send className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Approved</p>
                  <p className="text-2xl font-bold text-green-600">
                    {stats.approved}
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
                  <p className="text-sm text-gray-600">Total Value</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ৳{stats.totalValue.toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <DollarSign className="h-6 w-6 text-yellow-600" />
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
                      ? "bg-purple-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <Filter className="h-4 w-4" />
                  <span>Filters</span>
                  {filters.status && (
                    <span className="bg-purple-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                      1
                    </span>
                  )}
                </button>

                <div className="relative">
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
                    placeholder="Search quotations..."
                    className="w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              {(filters.search || filters.status) && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Clear filters
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">All Status</option>
                      <option value="draft">Draft</option>
                      <option value="sent">Sent</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                      <option value="expired">Expired</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={clearFilters}
                      className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                    >
                      Clear All Filters
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quotations Table */}
        {quotations.length > 0 ? (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Quote #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Valid Until
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
                {quotations.map((quotation) => {
                  const statusConfig = getStatusConfig(quotation.status);
                  const StatusIcon = statusConfig.icon;
                  const isValid = new Date(quotation.valid_until) >= new Date();

                  return (
                    <tr key={quotation.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">
                          {quotation.quote_number}
                        </div>
                        <div className="text-sm text-gray-500">
                          {format(
                            new Date(quotation.created_at),
                            "MMM d, yyyy",
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">
                          {quotation.client_name}
                        </div>
                        {quotation.client_email && (
                          <div className="text-sm text-gray-500">
                            {quotation.client_email}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">
                          ৳{quotation.total_amount?.toLocaleString() || 0}
                        </div>
                        <div className="text-xs text-gray-500">
                          {quotation.currency}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div
                          className={`flex items-center gap-1 text-sm ${!isValid && quotation.status !== "approved" ? "text-red-600" : "text-gray-600"}`}
                        >
                          <Calendar className="h-3 w-3" />
                          {format(
                            new Date(quotation.valid_until),
                            "MMM d, yyyy",
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
                              fetchQuotationDetails(quotation.id);
                              setIsDetailsModalOpen(true);
                            }}
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {quotation.status === "draft" && (
                            <>
                              <button
                                onClick={() => {
                                  setEditingQuotation(quotation);
                                  setIsModalOpen(true);
                                }}
                                className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg"
                                title="Edit"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() =>
                                  updateQuotationStatus(quotation.id, "sent")
                                }
                                className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg"
                                title="Send"
                              >
                                <Send className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          {quotation.status === "sent" && (
                            <button
                              onClick={() =>
                                updateQuotationStatus(quotation.id, "approved")
                              }
                              className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg"
                              title="Approve"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                          )}
                          {(quotation.status === "draft" ||
                            quotation.status === "rejected") && (
                            <button
                              onClick={() => deleteQuotation(quotation.id)}
                              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
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
            <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No quotations yet
            </h3>
            <p className="text-gray-600 mb-4">
              Create your first quotation for this project
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium"
            >
              <Plus className="h-5 w-5 inline mr-2" />
              Create Quotation
            </button>
          </div>
        )}

        {/* Modals */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingQuotation(null);
          }}
          title={editingQuotation ? "Edit Quotation" : "Create New Quotation"}
          size="4xl"
        >
          <QuotationForm
            projectId={projectId}
            initialData={editingQuotation}
            onSuccess={() => {
              setIsModalOpen(false);
              setEditingQuotation(null);
              fetchQuotations();
              toast.success(
                editingQuotation ? "Quotation updated" : "Quotation created",
              );
            }}
          />
        </Modal>

        <Modal
          isOpen={isDetailsModalOpen}
          onClose={() => {
            setIsDetailsModalOpen(false);
            setSelectedQuotation(null);
            setLineItems([]);
            setRecurringItems([]);
          }}
          title="Quotation Details"
          size="4xl"
        >
          <QuotationDetails
            quotation={selectedQuotation}
            lineItems={lineItems}
            recurringItems={recurringItems}
            onStatusChange={updateQuotationStatus}
          />
        </Modal>
      </div>
    </div>
  );
}
