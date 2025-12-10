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
      <div className="flex flex-col items-center justify-center py-12">
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 sm:p-8">
      <div className="max-w-full mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 space-y-4 sm:space-y-0">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Project Milestones
                </h1>
              </div>
              <p className="text-gray-600 ml-0 sm:ml-16">
                Track your project progress and achievements
              </p>
            </div>

            <button
              onClick={handleCreateMilestone}
              disabled={creatingMilestone}
              className="group relative px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creatingMilestone ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Plus className="h-5 w-5" />
                  <span>New Milestone</span>
                </>
              )}
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Milestones</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {milestones.length}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Target className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Completed</p>
                  <p className="text-3xl font-bold text-green-600">
                    {completedCount}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-xl">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">In Progress</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {inProgressCount}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-xl">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
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
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="h-10 w-10 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                No milestones yet
              </h3>
              <p className="text-gray-600 mb-6">
                Create your first milestone to start tracking progress
              </p>
              <button
                onClick={handleCreateMilestone}
                disabled={creatingMilestone}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all disabled:opacity-50"
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
          <div className="space-y-6">
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
                  className="group relative bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100"
                >
                  {/* Status Indicator Strip */}
                  <div
                    className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${config.color}`}
                  />

                  {/* Main Content */}
                  <div className="p-6 pl-8">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start space-x-4 flex-1">
                        {/* Timeline Dot */}
                        <div className="relative flex-shrink-0 mt-1">
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
                            className={`w-12 h-12 rounded-full ${config.bgColor} border-2 ${config.borderColor} flex items-center justify-center shadow-sm hover:shadow-md transition-all disabled:opacity-50`}
                          >
                            {isUpdatingStatus ? (
                              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                            ) : (
                              <StatusIcon
                                className={`h-6 w-6 ${config.textColor}`}
                              />
                            )}
                          </button>
                          {index < milestones.length - 1 && (
                            <div className="absolute left-1/2 top-full w-0.5 h-6 bg-gray-200 transform -translate-x-1/2" />
                          )}
                        </div>

                        {/* Milestone Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-3 mb-2">
                            <h3 className="text-xl font-bold text-gray-900">
                              {milestone.name}
                            </h3>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${config.bgColor} ${config.textColor} border ${config.borderColor}`}
                            >
                              {milestone.status.replace("-", " ").toUpperCase()}
                            </span>
                          </div>

                          {milestone.description && (
                            <p className="text-gray-600 mb-4">
                              {milestone.description}
                            </p>
                          )}

                          {/* Metadata */}
                          <div className="flex flex-wrap items-center gap-4 text-sm">
                            {milestone.deadline && (
                              <div className="flex items-center space-x-2 text-gray-600">
                                <Calendar className="h-4 w-4" />
                                <span>
                                  Due:{" "}
                                  {format(
                                    new Date(milestone.deadline),
                                    "MMM d, yyyy"
                                  )}
                                </span>
                              </div>
                            )}
                            <div className="flex items-center space-x-2 text-gray-600">
                              <div
                                className={`w-2 h-2 rounded-full ${config.dotColor} animate-pulse`}
                              />
                              <span>
                                {taskCount} task{taskCount !== 1 ? "s" : ""}
                              </span>
                            </div>
                          </div>

                          {/* Progress Bar */}
                          <div className="mt-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-700">
                                Progress
                              </span>
                              <span className="text-sm font-bold text-gray-900">
                                {Math.round(progress)}%
                              </span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full bg-gradient-to-r ${config.color} rounded-full transition-all duration-500 ease-out relative`}
                                style={{ width: `${progress}%` }}
                              >
                                <div className="absolute inset-0 bg-white opacity-30 animate-pulse" />
                              </div>
                            </div>
                          </div>

                          {/* Status Buttons */}
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="flex flex-wrap gap-2 items-center">
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
                                    className={`text-xs px-3 py-1.5 rounded-full capitalize transition-colors ${
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

                              <button
                                onClick={() => handleToggleTasks(milestone.id)}
                                disabled={isExpanding}
                                className="ml-auto p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-1"
                                title={isExpanded ? "Hide tasks" : "Show tasks"}
                              >
                                {isExpanding ? (
                                  <Loader2 className="h-4 w-4 animate-spin text-gray-600" />
                                ) : isExpanded ? (
                                  <ChevronUp className="h-4 w-4 text-gray-600" />
                                ) : (
                                  <ChevronDown className="h-4 w-4 text-gray-600" />
                                )}
                                <span className="text-xs text-gray-600">
                                  {isExpanded ? "Hide" : "Show"} Tasks
                                </span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center space-x-2 ml-4">
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
