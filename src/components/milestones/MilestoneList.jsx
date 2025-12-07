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

export default function MilestoneList({ projectId }) {
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
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
          tasks: tasks(count)
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

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "in-progress":
        return <Clock className="h-5 w-5 text-blue-500" />;
      default:
        return <Circle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in-progress":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getProgressPercentage = (milestone) => {
    // This would need additional logic if you want to track completion percentage
    return milestone.status === "completed"
      ? 100
      : milestone.status === "in-progress"
      ? 50
      : 0;
  };

  if (loading) {
    return <div className="text-center py-4">Loading milestones...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Milestones</h3>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Milestone
        </button>
      </div>

      {(showForm || editingMilestone) && (
        <div className="bg-white p-6 rounded-lg shadow">
          <MilestoneForm
            projectId={projectId}
            initialData={editingMilestone}
            onSuccess={() => {
              setShowForm(false);
              setEditingMilestone(null);
              fetchMilestones();
            }}
          />
        </div>
      )}

      <div className="space-y-4">
        {milestones.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-lg shadow">
            <Target className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <h4 className="text-lg font-medium text-gray-900 mb-1">
              No milestones yet
            </h4>
            <p className="text-gray-500 mb-4">
              Create your first milestone to organize your project
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Milestone
            </button>
          </div>
        ) : (
          milestones.map((milestone) => (
            <div
              key={milestone.id}
              className="bg-white rounded-lg shadow overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
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
                      className="mt-1"
                    >
                      {getStatusIcon(milestone.status)}
                    </button>

                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-lg font-semibold text-gray-900">
                          {milestone.name}
                        </h4>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(
                            milestone.status
                          )}`}
                        >
                          {milestone.status}
                        </span>
                      </div>

                      {milestone.description && (
                        <p className="text-gray-600 mt-1">
                          {milestone.description}
                        </p>
                      )}

                      <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
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

                        {milestone.tasks && (
                          <div className="flex items-center">
                            <span className="text-gray-600">
                              {milestone.tasks[0]?.count || 0} tasks
                            </span>
                          </div>
                        )}
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
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => setEditingMilestone(milestone)}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <Edit className="h-4 w-4 text-gray-500" />
                    </button>
                    <button
                      onClick={() => deleteMilestone(milestone.id)}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </button>
                  </div>
                </div>

                {/* Status buttons */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex space-x-2">
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
                      className="text-xs px-3 py-1.5 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-full ml-auto"
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
                <div className="border-t border-gray-200 bg-gray-50 p-6">
                  <TaskList projectId={projectId} milestoneId={milestone.id} />
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
