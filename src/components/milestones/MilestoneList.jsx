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
} from "lucide-react";
import { format } from "date-fns";
import MilestoneForm from "./MilestoneForm";
import TaskList from "../tasks/TaskList";
import Modal from "../ui/Modal";

export default function MilestoneList({ projectId }) {
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState(null);
  const [expandedMilestone, setExpandedMilestone] = useState(null);

  useEffect(() => {
    fetchMilestones();
  }, [projectId]);

  const fetchMilestones = async () => {
    try {
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
      const { error } = await supabase.from("milestones").delete().eq("id", id);

      if (error) throw error;
      fetchMilestones();
    } catch (error) {
      console.error("Error deleting milestone:", error);
    }
  };

  const updateMilestoneStatus = async (milestoneId, newStatus) => {
    try {
      const { error } = await supabase
        .from("milestones")
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", milestoneId);

      if (error) throw error;
      fetchMilestones();
    } catch (error) {
      console.error("Error updating milestone status:", error);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingMilestone(null);
  };

  const getProgressPercentage = (milestone) => {
    const statusProgress = {
      pending: 0,
      "in-progress": 50,
      completed: 100,
    };
    return statusProgress[milestone.status] || 0;
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading milestones...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Milestones</h3>
          <p className="text-sm text-gray-600">
            {milestones.length} milestone{milestones.length !== 1 ? "s" : ""}
          </p>
        </div>

        <button
          onClick={() => {
            setEditingMilestone(null);
            setIsModalOpen(true);
          }}
          className="btn-primary flex items-center"
        >
          <Plus className="h-4 w-4 mr-2 " />
          New Milestone
        </button>
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
          }}
        />
      </Modal>

      {/* Milestones List */}
      {milestones.length === 0 ? (
        <div className="card text-center py-12">
          <div className="max-w-md mx-auto">
            <Target className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <h4 className="text-lg font-medium text-gray-900 mb-1">
              No milestones yet
            </h4>
            <p className="text-gray-500 mb-4">
              Create your first milestone to organize your project
            </p>
            <button
              onClick={() => {
                setEditingMilestone(null);
                setIsModalOpen(true);
              }}
              className="btn-primary"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Milestone
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {milestones.map((milestone) => {
            const taskCount = milestone.tasks?.[0]?.count || 0;

            return (
              <div key={milestone.id} className="card overflow-hidden">
                <div className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between space-y-4 sm:space-y-0">
                    <div className="flex items-start space-x-3">
                      <button
                        onClick={() =>
                          updateMilestoneStatus(
                            milestone.id,
                            milestone.status === "completed"
                              ? "pending"
                              : "completed"
                          )
                        }
                        className="mt-1 flex-shrink-0"
                        aria-label={
                          milestone.status === "completed"
                            ? "Mark as pending"
                            : "Mark as completed"
                        }
                      >
                        {milestone.status === "completed" ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : milestone.status === "in-progress" ? (
                          <Clock className="h-5 w-5 text-blue-500" />
                        ) : (
                          <Circle className="h-5 w-5 text-gray-400" />
                        )}
                      </button>

                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                          <h4 className="text-lg font-semibold text-gray-900">
                            {milestone.name}
                          </h4>
                          <span
                            className={`badge ${
                              milestone.status === "completed"
                                ? "badge-success"
                                : milestone.status === "in-progress"
                                ? "badge-info"
                                : "badge-warning"
                            }`}
                          >
                            {milestone.status}
                          </span>
                        </div>

                        {milestone.description && (
                          <p className="text-gray-600 mt-1">
                            {milestone.description}
                          </p>
                        )}

                        <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 mt-3 text-sm text-gray-500">
                          {milestone.deadline && (
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              Deadline:{" "}
                              {format(
                                new Date(milestone.deadline),
                                "MMM d, yyyy"
                              )}
                            </div>
                          )}

                          <div className="flex items-center">
                            <span className="text-gray-600">
                              {taskCount} task{taskCount !== 1 ? "s" : ""}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setEditingMilestone(milestone);
                          setIsModalOpen(true);
                        }}
                        className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4 text-gray-600" />
                      </button>
                      <button
                        onClick={() => deleteMilestone(milestone.id)}
                        className="p-2 bg-red-100 hover:bg-red-200 rounded-lg "
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </button>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Progress</span>
                      <span>{getProgressPercentage(milestone)}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all duration-300"
                        style={{
                          width: `${getProgressPercentage(milestone)}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Status buttons */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex flex-wrap gap-2">
                      {["pending", "in-progress", "completed"].map((status) => (
                        <button
                          key={status}
                          onClick={() =>
                            updateMilestoneStatus(milestone.id, status)
                          }
                          className={`text-xs px-3 py-1.5 rounded-full capitalize ${
                            milestone.status === status
                              ? "bg-blue-600 text-white"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          {status.replace("-", " ")}
                        </button>
                      ))}

                      <button
                        onClick={() =>
                          setExpandedMilestone(
                            expandedMilestone === milestone.id
                              ? null
                              : milestone.id
                          )
                        }
                        className="ml-auto text-xs px-3 py-1.5 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-full"
                      >
                        {expandedMilestone === milestone.id
                          ? "Hide Tasks"
                          : "Show Tasks"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded tasks section */}
                {expandedMilestone === milestone.id && (
                  <div className="border-t border-gray-200 bg-gray-50 p-4 sm:p-6">
                    <TaskList
                      projectId={projectId}
                      milestoneId={milestone.id}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
