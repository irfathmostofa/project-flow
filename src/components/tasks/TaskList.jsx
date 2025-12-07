import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import {
  CheckCircle,
  Circle,
  Clock,
  AlertCircle,
  Edit,
  Trash2,
  Plus,
} from "lucide-react";
import { format } from "date-fns";
import TaskForm from "./TaskForm";

export default function TaskList({ projectId, milestoneId }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  useEffect(() => {
    fetchTasks();
  }, [projectId, milestoneId]);

  const fetchTasks = async () => {
    try {
      let query = supabase
        .from("tasks")
        .select(
          `
          *,
          assignee:users(full_name, email),
          milestone:milestones(name)
        `
        )
        .order("created_at", { ascending: false });

      if (projectId) {
        query = query.eq("project_id", projectId);
      }

      if (milestoneId) {
        query = query.eq("milestone_id", milestoneId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteTask = async (id) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;

    try {
      const { error } = await supabase.from("tasks").delete().eq("id", id);

      if (error) throw error;
      fetchTasks();
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      const updates = {
        status: newStatus,
        updated_at: new Date().toISOString(),
      };

      if (newStatus === "completed") {
        updates.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("tasks")
        .update(updates)
        .eq("id", taskId);

      if (error) throw error;
      fetchTasks();
    } catch (error) {
      console.error("Error updating task status:", error);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "in-progress":
        return <Clock className="h-5 w-5 text-blue-500" />;
      case "review":
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Circle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-green-100 text-green-800";
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading tasks...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Tasks</h3>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Task
        </button>
      </div>

      {(showForm || editingTask) && (
        <div className="bg-white p-6 rounded-lg shadow">
          <TaskForm
            projectId={projectId}
            milestoneId={milestoneId}
            initialData={editingTask}
            onSuccess={() => {
              setShowForm(false);
              setEditingTask(null);
              fetchTasks();
            }}
          />
        </div>
      )}

      <div className="space-y-3">
        {tasks.map((task) => (
          <div key={task.id} className="bg-white rounded-lg shadow p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <button
                  onClick={() =>
                    updateTaskStatus(
                      task.id,
                      task.status === "completed" ? "todo" : "completed"
                    )
                  }
                  className="mt-1"
                >
                  {getStatusIcon(task.status)}
                </button>

                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h4
                      className={`font-medium ${
                        task.status === "completed"
                          ? "line-through text-gray-500"
                          : "text-gray-900"
                      }`}
                    >
                      {task.title}
                    </h4>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${getPriorityColor(
                        task.priority
                      )}`}
                    >
                      {task.priority}
                    </span>
                    {task.milestone && (
                      <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full">
                        {task.milestone.name}
                      </span>
                    )}
                  </div>

                  {task.description && (
                    <p className="text-gray-600 text-sm mt-1">
                      {task.description}
                    </p>
                  )}

                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                    {task.assignee && (
                      <span>
                        Assigned to:{" "}
                        {task.assignee.full_name || task.assignee.email}
                      </span>
                    )}
                    {task.deadline && (
                      <span>
                        Due: {format(new Date(task.deadline), "MMM d, yyyy")}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => setEditingTask(task)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <Edit className="h-4 w-4 text-gray-500" />
                </button>
                <button
                  onClick={() => deleteTask(task.id)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </button>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex space-x-4">
                {["todo", "in-progress", "review", "completed"].map(
                  (status) => (
                    <button
                      key={status}
                      onClick={() => updateTaskStatus(task.id, status)}
                      className={`text-xs px-3 py-1 rounded-full capitalize ${
                        task.status === status
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {status.replace("-", " ")}
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
