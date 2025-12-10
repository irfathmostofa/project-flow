import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import {
  CheckCircle,
  Circle,
  Clock,
  AlertCircle,
  Plus,
  Filter,
  X,
  Layers,
} from "lucide-react";
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

      if (filters.status) {
        query = query.eq("status", filters.status);
      }

      if (filters.priority) {
        query = query.eq("priority", filters.priority);
      }

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

  const groupedTasks = {
    todo: tasks.filter((t) => t.status === "todo"),
    "in-progress": tasks.filter((t) => t.status === "in-progress"),
    review: tasks.filter((t) => t.status === "review"),
    completed: tasks.filter((t) => t.status === "completed"),
  };

  const statusConfig = {
    todo: {
      title: "To Do",
      icon: Circle,
      color: "from-gray-400 to-gray-500",
      bgColor: "bg-gray-50",
      borderColor: "border-gray-200",
    },
    "in-progress": {
      title: "In Progress",
      icon: Clock,
      color: "from-blue-500 to-indigo-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
    },
    review: {
      title: "Review",
      icon: AlertCircle,
      color: "from-yellow-500 to-orange-600",
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200",
    },
    completed: {
      title: "Completed",
      icon: CheckCircle,
      color: "from-green-500 to-emerald-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
    },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg shadow-md">
            <Layers className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Tasks</h3>
            <p className="text-sm text-gray-600">
              {tasks.length} task{tasks.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 transition-all ${
              showFilters
                ? "bg-blue-600 text-white shadow-md"
                : "bg-white text-gray-700 border border-gray-300 hover:border-blue-300"
            }`}
          >
            {showFilters ? (
              <X className="h-4 w-4" />
            ) : (
              <Filter className="h-4 w-4" />
            )}
            <span>{showFilters ? "Hide" : "Filters"}</span>
          </button>

          <button
            onClick={() => {
              setEditingTask(null);
              setIsModalOpen(true);
            }}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-sm font-medium shadow-md hover:shadow-lg transform hover:scale-105 transition-all flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 animate-slideDown">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm"
              >
                <option value="">All Status</option>
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="review">Review</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Priority
              </label>
              <select
                value={filters.priority}
                onChange={(e) => handleFilterChange("priority", e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm"
              >
                <option value="">All Priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Sort By
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange("sortBy", e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="deadline">Deadline</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              Clear Filters
            </button>
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 text-center py-16">
          <div className="max-w-md mx-auto">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Layers className="h-10 w-10 text-purple-600" />
            </div>
            <h4 className="text-xl font-bold text-gray-900 mb-2">
              No tasks yet
            </h4>
            <p className="text-gray-600 mb-6">
              Add your first task to get started
            </p>
            <button
              onClick={() => {
                setEditingTask(null);
                setIsModalOpen(true);
              }}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
            >
              <Plus className="h-5 w-5 inline mr-2" />
              Create Task
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
          {Object.entries(groupedTasks).map(([status, statusTasks]) => {
            const config = statusConfig[status];
            const Icon = config.icon;

            return (
              <div
                key={status}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-gray-100">
                  <div className="flex items-center space-x-2">
                    <div className={`p-2 rounded-lg ${config.bgColor}`}>
                      <Icon className="h-5 w-5 text-gray-700" />
                    </div>
                    <h4 className="font-bold text-gray-900">{config.title}</h4>
                  </div>
                  <div
                    className={`px-3 py-1 rounded-full text-xs font-bold ${config.bgColor} border ${config.borderColor}`}
                  >
                    {statusTasks.length}
                  </div>
                </div>

                {/* Tasks */}
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
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
                    <div className="text-center py-8 text-gray-400 text-sm">
                      <Circle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No tasks</p>
                    </div>
                  )}
                </div>

                {/* Add Task Button */}
                <button
                  onClick={() => {
                    setEditingTask(null);
                    setIsModalOpen(true);
                  }}
                  className="w-full mt-4 p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50 text-sm font-medium transition-all flex items-center justify-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add task</span>
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
        className="fixed bottom-6 right-6 lg:hidden h-14 w-14 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full shadow-xl flex items-center justify-center hover:shadow-2xl transform hover:scale-110 transition-all z-40"
        aria-label="Add Task"
      >
        <Plus className="h-6 w-6" />
      </button>

      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
}
