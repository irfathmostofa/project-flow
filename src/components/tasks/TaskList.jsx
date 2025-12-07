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
  Filter,
} from "lucide-react";
import { format } from "date-fns";
import TaskForm from "./TaskForm";
import TaskCard from "./TaskCard";
import Modal from "../ui/Modal";

export default function TaskList({ projectId, milestoneId }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [filters, setFilters] = useState({
    status: "",
    priority: "",
    sortBy: "newest",
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, [projectId, milestoneId, filters]);

  const fetchTasks = async () => {
    try {
      let query = supabase.from("tasks").select(`
          *,
          assignee:users(full_name, email),
          milestone:milestones(name)
        `);

      if (projectId) {
        query = query.eq("project_id", projectId);
      }

      if (milestoneId) {
        query = query.eq("milestone_id", milestoneId);
      }

      // Apply filters
      if (filters.status) {
        query = query.eq("status", filters.status);
      }

      if (filters.priority) {
        query = query.eq("priority", filters.priority);
      }

      // Apply sorting
      switch (filters.sortBy) {
        case "newest":
          query = query.order("created_at", { ascending: false });
          break;
        case "oldest":
          query = query.order("created_at", { ascending: true });
          break;
        case "deadline":
          query = query.order("deadline", { ascending: true });
          break;
        default:
          query = query.order("created_at", { ascending: false });
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

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTask(null);
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      status: "",
      priority: "",
      sortBy: "newest",
    });
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading tasks...</p>
      </div>
    );
  }

  // Group tasks by status for better organization
  const groupedTasks = {
    todo: tasks.filter((t) => t.status === "todo"),
    "in-progress": tasks.filter((t) => t.status === "in-progress"),
    review: tasks.filter((t) => t.status === "review"),
    completed: tasks.filter((t) => t.status === "completed"),
  };

  const statusConfig = {
    todo: { title: "To Do", icon: Circle, color: "bg-gray-100 text-gray-800" },
    "in-progress": {
      title: "In Progress",
      icon: Clock,
      color: "bg-blue-100 text-blue-800",
    },
    review: {
      title: "Review",
      icon: AlertCircle,
      color: "bg-yellow-100 text-yellow-800",
    },
    completed: {
      title: "Completed",
      icon: CheckCircle,
      color: "bg-green-100 text-green-800",
    },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Tasks</h3>
          <p className="text-sm text-gray-600">
            {tasks.length} task{tasks.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn-secondary py-2 text-sm flex items-center"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </button>

          {/* New Task Button */}
          <button
            onClick={() => {
              setEditingTask(null);
              setIsModalOpen(true);
            }}
            className="btn-primary py-2 text-sm flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="card">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="input text-sm"
              >
                <option value="">All Status</option>
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="review">Review</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                value={filters.priority}
                onChange={(e) => handleFilterChange("priority", e.target.value)}
                className="input text-sm"
              >
                <option value="">All Priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sort By
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange("sortBy", e.target.value)}
                className="input text-sm"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="deadline">Deadline</option>
              </select>
            </div>

            <div className="sm:col-span-3 flex justify-end space-x-2">
              <button
                onClick={clearFilters}
                className="btn-secondary py-2 text-sm"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Task Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingTask ? "Edit Task" : "Create New Task"}
        size="lg"
      >
        <TaskForm
          projectId={projectId}
          milestoneId={milestoneId}
          initialData={editingTask}
          onSuccess={() => {
            handleCloseModal();
            fetchTasks();
          }}
        />
      </Modal>

      {/* Tasks Grid */}
      {tasks.length === 0 ? (
        <div className="card text-center py-12">
          <div className="mx-auto">
            <h4 className="text-lg font-medium text-gray-900 mb-1">
              No tasks yet
            </h4>
            <p className="text-gray-500 mb-4">
              Add your first task to get started
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
          {Object.entries(groupedTasks).map(([status, statusTasks]) => {
            const config = statusConfig[status];
            const Icon = config.icon;

            return (
              <div key={status} className="card">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Icon className="h-5 w-5 text-gray-500" />
                    <h4 className="font-medium text-gray-900">
                      {config.title}
                    </h4>
                  </div>
                  <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                    {statusTasks.length}
                  </span>
                </div>

                <div className="space-y-3">
                  {statusTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      compact={true}
                      onEdit={() => {
                        setEditingTask(task);
                        setIsModalOpen(true);
                      }}
                      onDelete={deleteTask}
                      onStatusChange={updateTaskStatus}
                    />
                  ))}

                  {statusTasks.length === 0 && (
                    <div className="text-center py-4 text-gray-500 text-sm">
                      No tasks
                    </div>
                  )}
                </div>

                {/* Add task to this status */}
                <button
                  onClick={() => {
                    setEditingTask(null);
                    setIsModalOpen(true);
                  }}
                  className="w-full mt-4 p-2 border border-dashed border-gray-300 rounded-lg text-gray-500 hover:text-gray-700 hover:border-gray-400 text-sm"
                >
                  <Plus className="h-4 w-4 inline mr-1" />
                  Add task
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Mobile Floating Button */}
      <button
        onClick={() => {
          setEditingTask(null);
          setIsModalOpen(true);
        }}
        className="fixed bottom-6 right-6 sm:hidden h-14 w-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 z-40"
        aria-label="Add Task"
      >
        <Plus className="h-6 w-6" />
      </button>
    </div>
  );
}
