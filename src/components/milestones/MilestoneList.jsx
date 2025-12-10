import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import {
  Calendar,
  CheckCircle,
  Circle,
  Clock,
  Edit,
  Trash2,
  Plus,
  Target,
  Loader2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  TrendingUp,
  MoreVertical,
} from "lucide-react";
import { format } from "date-fns";
import MilestoneForm from "./MilestoneForm";
import TaskList from "../tasks/TaskList";
import Modal from "../ui/Modal";
import { useToast } from "../../context/ToastContext";

export default function MilestoneList({ projectId }) {
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState(null);
  const [expandedMilestone, setExpandedMilestone] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(null);

  const [deletingId, setDeletingId] = useState(null);
  const [updatingStatusId, setUpdatingStatusId] = useState(null);
  const [expandingId, setExpandingId] = useState(null);
  const [creatingMilestone, setCreatingMilestone] = useState(false);

  const toast = useToast();

  useEffect(() => {
    fetchMilestones();
  }, [projectId]);

  const fetchMilestones = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("milestones")
        .select(
          `
          *,
          tasks (count)
        `
        )
        .eq("project_id", projectId)
        .order("deadline", { ascending: true });

      if (error) throw error;

      setMilestones(data || []);
    } catch (error) {
      console.error("Error fetching milestones:", error);
      toast.error("Failed to load milestones");
    } finally {
      setLoading(false);
    }
  };

  const deleteMilestone = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this milestone? All associated tasks will be unassigned from this milestone."
      )
    )
      return;

    try {
      setDeletingId(id);
      const { error } = await supabase.from("milestones").delete().eq("id", id);

      if (error) throw error;

      toast.success("Milestone deleted successfully");
      fetchMilestones();
    } catch (error) {
      console.error("Error deleting milestone:", error);
      toast.error("Failed to delete milestone");
    } finally {
      setDeletingId(null);
    }
  };

  const updateMilestoneStatus = async (milestoneId, newStatus) => {
    try {
      setUpdatingStatusId(milestoneId);
      const { error } = await supabase
        .from("milestones")
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", milestoneId);

      if (error) throw error;

      toast.success(`Milestone marked as ${newStatus.replace("-", " ")}`);
      fetchMilestones();
    } catch (error) {
      console.error("Error updating milestone status:", error);
      toast.error("Failed to update milestone status");
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleCreateMilestone = () => {
    setCreatingMilestone(true);
    setTimeout(() => {
      setEditingMilestone(null);
      setIsModalOpen(true);
      setCreatingMilestone(false);
    }, 300);
  };

  const handleEditMilestone = (milestone) => {
    setEditingMilestone(milestone);
    setIsModalOpen(true);
    setMobileMenuOpen(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingMilestone(null);
  };

  const handleToggleTasks = async (milestoneId) => {
    if (expandedMilestone === milestoneId) {
      setExpandedMilestone(null);
    } else {
      setExpandingId(milestoneId);
      setTimeout(() => {
        setExpandedMilestone(milestoneId);
        setExpandingId(null);
      }, 300);
    }
    setMobileMenuOpen(null);
  };

  const getProgressPercentage = (milestone) => {
    const statusProgress = {
      pending: 0,
      "in-progress": 50,
      completed: 100,
    };
    return statusProgress[milestone.status] || 0;
  };

  const getStatusConfig = (status) => {
    const configs = {
      completed: {
        icon: CheckCircle,
        color: "from-green-500 to-emerald-600",
        bgColor: "bg-green-50",
        textColor: "text-green-700",
        borderColor: "border-green-200",
        dotColor: "bg-green-500",
      },
      "in-progress": {
        icon: Clock,
        color: "from-blue-500 to-indigo-600",
        bgColor: "bg-blue-50",
        textColor: "text-blue-700",
        borderColor: "border-blue-200",
        dotColor: "bg-blue-500",
      },
      pending: {
        icon: Circle,
        color: "from-gray-400 to-gray-500",
        bgColor: "bg-gray-50",
        textColor: "text-gray-700",
        borderColor: "border-gray-200",
        dotColor: "bg-gray-400",
      },
    };
    return configs[status] || configs.pending;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] py-12 px-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600">Loading milestones...</p>
      </div>
    );
  }

  const completedCount = milestones.filter(
    (m) => m.status === "completed"
  ).length;
  const inProgressCount = milestones.filter(
    (m) => m.status === "in-progress"
  ).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-full mx-auto">
        {/* Header Section */}
        <div className="mb-6 lg:mb-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-4 lg:mb-6 gap-4">
            <div className="w-full lg:w-auto">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-2">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg w-fit">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                    Project Milestones
                  </h1>
                  <p className="text-gray-600 mt-1 sm:mt-0">
                    Track your project progress and achievements
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={handleCreateMilestone}
              disabled={creatingMilestone}
              className="group w-full sm:w-auto px-4 sm:px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creatingMilestone ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="hidden sm:inline">Creating...</span>
                  <span className="sm:hidden">Create</span>
                </>
              ) : (
                <>
                  <Plus className="h-5 w-5" />
                  <span className="hidden sm:inline">New Milestone</span>
                  <span className="sm:hidden">New</span>
                </>
              )}
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6">
            <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-600 mb-1">
                    Total Milestones
                  </p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                    {milestones.length}
                  </p>
                </div>
                <div className="p-2 sm:p-3 bg-blue-100 rounded-lg sm:rounded-xl">
                  <Target className="h-5 sm:h-6 w-5 sm:w-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-600 mb-1">
                    Completed
                  </p>
                  <p className="text-2xl sm:text-3xl font-bold text-green-600">
                    {completedCount}
                  </p>
                </div>
                <div className="p-2 sm:p-3 bg-green-100 rounded-lg sm:rounded-xl">
                  <CheckCircle className="h-5 sm:h-6 w-5 sm:w-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow col-span-1 sm:col-span-2 lg:col-span-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-600 mb-1">
                    In Progress
                  </p>
                  <p className="text-2xl sm:text-3xl font-bold text-blue-600">
                    {inProgressCount}
                  </p>
                </div>
                <div className="p-2 sm:p-3 bg-blue-100 rounded-lg sm:rounded-xl">
                  <TrendingUp className="h-5 sm:h-6 w-5 sm:w-6 text-blue-600" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Milestone Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          title={editingMilestone ? "Edit Milestone" : "Create New Milestone"}
          size="lg"
        >
          <MilestoneForm
            projectId={projectId}
            initialData={editingMilestone}
            onSuccess={() => {
              handleCloseModal();
              fetchMilestones();
              toast.success(
                editingMilestone
                  ? "Milestone updated successfully"
                  : "Milestone created successfully"
              );
            }}
          />
        </Modal>

        {/* Milestones List */}
        {milestones.length === 0 ? (
          <div className="text-center py-12 sm:py-16 bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100">
            <div className="max-w-md mx-auto px-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="h-8 w-8 sm:h-10 sm:w-10 text-blue-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                No milestones yet
              </h3>
              <p className="text-gray-600 mb-6 text-sm sm:text-base">
                Create your first milestone to start tracking progress
              </p>
              <button
                onClick={handleCreateMilestone}
                disabled={creatingMilestone}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all disabled:opacity-50 w-full sm:w-auto"
              >
                {creatingMilestone ? (
                  <>
                    <Loader2 className="h-5 w-5 inline mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="h-5 w-5 inline mr-2" />
                    Create Milestone
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {milestones.map((milestone, index) => {
              const config = getStatusConfig(milestone.status);
              const StatusIcon = config.icon;
              const progress = getProgressPercentage(milestone);
              const isExpanded = expandedMilestone === milestone.id;
              const taskCount = milestone.tasks?.[0]?.count || 0;
              const isDeleting = deletingId === milestone.id;
              const isUpdatingStatus = updatingStatusId === milestone.id;
              const isExpanding = expandingId === milestone.id;

              return (
                <div
                  key={milestone.id}
                  className="group relative bg-white rounded-xl sm:rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100"
                >
                  {/* Status Indicator Strip */}
                  <div
                    className={`absolute left-0 top-0 bottom-0 w-1 sm:w-1.5 bg-gradient-to-b ${config.color}`}
                  />

                  {/* Main Content */}
                  <div className="p-4 sm:p-6 pl-5 sm:pl-8">
                    <div className="flex items-start justify-between gap-3 sm:gap-4 mb-4">
                      {/* Timeline Dot & Status Button */}
                      <div className="flex flex-col items-center flex-shrink-0">
                        <button
                          onClick={() =>
                            updateMilestoneStatus(
                              milestone.id,
                              milestone.status === "completed"
                                ? "pending"
                                : "completed"
                            )
                          }
                          disabled={isUpdatingStatus}
                          className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full ${config.bgColor} border-2 ${config.borderColor} flex items-center justify-center shadow-sm hover:shadow-md transition-all disabled:opacity-50`}
                        >
                          {isUpdatingStatus ? (
                            <Loader2 className="h-4 w-4 sm:h-6 sm:w-6 animate-spin text-gray-400" />
                          ) : (
                            <StatusIcon
                              className={`h-4 w-4 sm:h-6 sm:w-6 ${config.textColor}`}
                            />
                          )}
                        </button>
                        {index < milestones.length - 1 && (
                          <div className="w-0.5 h-4 sm:h-6 bg-gray-200 mt-2" />
                        )}
                      </div>

                      {/* Milestone Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-2 gap-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg sm:text-xl font-bold text-gray-900 truncate">
                              {milestone.name}
                            </h3>
                            {milestone.description && (
                              <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                                {milestone.description}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-2">
                            <span
                              className={`px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs font-semibold ${config.bgColor} ${config.textColor} border ${config.borderColor} whitespace-nowrap`}
                            >
                              {milestone.status.replace("-", " ").toUpperCase()}
                            </span>

                            {/* Mobile Menu Button */}
                            <div className="sm:hidden relative">
                              <button
                                onClick={() =>
                                  setMobileMenuOpen(
                                    mobileMenuOpen === milestone.id
                                      ? null
                                      : milestone.id
                                  )
                                }
                                className="p-2 hover:bg-gray-100 rounded-lg"
                              >
                                <MoreVertical className="h-5 w-5 text-gray-600" />
                              </button>

                              {mobileMenuOpen === milestone.id && (
                                <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                                  <button
                                    onClick={() =>
                                      handleEditMilestone(milestone)
                                    }
                                    className="w-full text-left px-4 py-2 hover:bg-blue-50 text-blue-600 flex items-center space-x-2"
                                  >
                                    <Edit className="h-4 w-4" />
                                    <span>Edit</span>
                                  </button>
                                  <button
                                    onClick={() =>
                                      deleteMilestone(milestone.id)
                                    }
                                    disabled={isDeleting}
                                    className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 flex items-center space-x-2 disabled:opacity-50"
                                  >
                                    {isDeleting ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Trash2 className="h-4 w-4" />
                                    )}
                                    <span>Delete</span>
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleToggleTasks(milestone.id)
                                    }
                                    className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700 flex items-center space-x-2 border-t border-gray-200"
                                  >
                                    {isExpanded ? (
                                      <ChevronUp className="h-4 w-4" />
                                    ) : (
                                      <ChevronDown className="h-4 w-4" />
                                    )}
                                    <span>
                                      {isExpanded ? "Hide" : "Show"} Tasks
                                    </span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Metadata */}
                        <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm mb-4">
                          {milestone.deadline && (
                            <div className="flex items-center space-x-1 sm:space-x-2 text-gray-600">
                              <Calendar className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                              <span>
                                Due:{" "}
                                {format(
                                  new Date(milestone.deadline),
                                  "MMM d, yyyy"
                                )}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center space-x-1 sm:space-x-2 text-gray-600">
                            <div
                              className={`w-2 h-2 rounded-full ${config.dotColor} animate-pulse flex-shrink-0`}
                            />
                            <span>
                              {taskCount} task{taskCount !== 1 ? "s" : ""}
                            </span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mt-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs sm:text-sm font-medium text-gray-700">
                              Progress
                            </span>
                            <span className="text-xs sm:text-sm font-bold text-gray-900">
                              {Math.round(progress)}%
                            </span>
                          </div>
                          <div className="h-1.5 sm:h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full bg-gradient-to-r ${config.color} rounded-full transition-all duration-500 ease-out relative`}
                              style={{ width: `${progress}%` }}
                            >
                              <div className="absolute inset-0 bg-white opacity-30 animate-pulse" />
                            </div>
                          </div>
                        </div>

                        {/* Status Buttons and Actions */}
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex flex-wrap gap-1 sm:gap-2">
                              {["pending", "in-progress", "completed"].map(
                                (status) => (
                                  <button
                                    key={status}
                                    onClick={() =>
                                      updateMilestoneStatus(
                                        milestone.id,
                                        status
                                      )
                                    }
                                    disabled={isUpdatingStatus}
                                    className={`text-xs px-2 py-1 sm:px-3 sm:py-1.5 rounded-full capitalize transition-colors whitespace-nowrap ${
                                      milestone.status === status
                                        ? "bg-blue-600 text-white"
                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                                  >
                                    {isUpdatingStatus &&
                                    milestone.status === status ? (
                                      <Loader2 className="h-3 w-3 animate-spin inline mr-1" />
                                    ) : null}
                                    {status.replace("-", " ")}
                                  </button>
                                )
                              )}
                            </div>

                            {/* Desktop Action Buttons */}
                            <div className="hidden sm:flex items-center space-x-2">
                              <button
                                onClick={() => handleToggleTasks(milestone.id)}
                                disabled={isExpanding}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-1"
                                title={isExpanded ? "Hide tasks" : "Show tasks"}
                              >
                                {isExpanding ? (
                                  <Loader2 className="h-4 w-4 animate-spin text-gray-600" />
                                ) : isExpanded ? (
                                  <ChevronUp className="h-4 w-4 text-gray-600" />
                                ) : (
                                  <ChevronDown className="h-4 w-4 text-gray-600" />
                                )}
                                <span className="text-sm text-gray-600">
                                  {isExpanded ? "Hide" : "Show"} Tasks
                                </span>
                              </button>

                              <button
                                onClick={() => handleEditMilestone(milestone)}
                                disabled={isDeleting}
                                className="p-2 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                                title="Edit milestone"
                              >
                                <Edit className="h-5 w-5 text-blue-600" />
                              </button>
                              <button
                                onClick={() => deleteMilestone(milestone.id)}
                                disabled={isDeleting}
                                className="p-2 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                title="Delete milestone"
                              >
                                {isDeleting ? (
                                  <Loader2 className="h-5 w-5 animate-spin text-red-600" />
                                ) : (
                                  <Trash2 className="h-5 w-5 text-red-600" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded tasks section */}
                  {isExpanded && (
                    <div className="border-t border-gray-200 bg-gradient-to-br from-gray-50 to-slate-50 p-4 sm:p-6">
                      <TaskList
                        projectId={projectId}
                        milestoneId={milestone.id}
                      />
                    </div>
                  )}

                  {/* Hover Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
