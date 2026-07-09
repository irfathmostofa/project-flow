import { useEffect, useState } from "react";
import {
  useParams,
  useNavigate,
  useLocation,
  useSearchParams,
} from "react-router-dom";
import {
  Plus,
  Filter,
  Search,
  Grid,
  List,
  ChevronDown,
  Users,
  Calendar,
  Clock,
  CheckCircle,
  Circle,
  AlertCircle,
  MoreVertical,
  X,
  FolderKanban,
  Layers,
  Target,
  BarChart3,
  SortAsc,
  ArrowLeft,
} from "lucide-react";
import { format } from "date-fns";
import { supabase } from "../lib/supabase";
import TaskForm from "../components/tasks/TaskForm";
import Modal from "../components/ui/Modal";
import TaskCard from "../components/tasks/TaskCard";

export default function TaskPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const milestoneId = searchParams.get("milestone");

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [viewMode, setViewMode] = useState("kanban");
  const [showFilters, setShowFilters] = useState(false);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null); // Changed: null instead of projectId || ""

  const [filters, setFilters] = useState({
    status: "",
    priority: "",
    assignee: "",
    sortBy: "deadline",
    search: "",
  });

  const [users, setUsers] = useState([]);
  const [milestone, setMilestone] = useState(null);

  // Check if we're on /tasks or /projects/:id
  const isGlobalTaskView =
    location.pathname === "/tasks" || location.pathname.startsWith("/tasks/");

  useEffect(() => {
    // Always fetch projects in global task view
    if (isGlobalTaskView) {
      fetchUserProjects();
    } else if (projectId) {
      // If coming from /projects/:id, set that as selected project
      setSelectedProject(projectId);
    }
  }, [isGlobalTaskView, projectId]);

  useEffect(() => {
    // Only fetch tasks if a project is selected
    if (selectedProject) {
      fetchTasks();
      fetchUsers();
      if (milestoneId) {
        fetchMilestone();
      }
    }
  }, [selectedProject, milestoneId, filters]);

  const fetchUserProjects = async () => {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch projects user owns
      const { data: ownedProjects } = await supabase
        .from("projects")
        .select("*")
        .eq("owner_id", user.id);

      // Fetch projects where user is a member
      const { data: memberProjects } = await supabase
        .from("project_members")
        .select("project_id")
        .eq("user_id", user.id);

      const memberProjectIds = memberProjects?.map((m) => m.project_id) || [];
      let allProjects = [...(ownedProjects || [])];

      if (memberProjectIds.length > 0) {
        const { data: memberProjectDetails } = await supabase
          .from("projects")
          .select("*")
          .in("id", memberProjectIds);

        // Filter out duplicates
        const uniqueMemberProjects = (memberProjectDetails || []).filter(
          (project) => !ownedProjects?.some((owned) => owned.id === project.id),
        );

        allProjects = [...allProjects, ...uniqueMemberProjects];
      }

      setProjects(allProjects);

      // Don't auto-select any project - let user choose
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from("tasks")
        .select(
          `
          *,
          task_assignees!left (
            user_id,
            users:user_id (
              id,
              full_name,
              email
            )
          ),
          milestone:milestones(name),
          feedback_by:users!feedback_by(id, full_name),
          project:projects!inner(id, name, owner_id)
        `,
        )
        .eq("project_id", selectedProject);

      if (milestoneId) {
        query = query.eq("milestone_id", milestoneId);
      }

      if (filters.status && filters.status !== "all") {
        query = query.eq("status", filters.status);
      }

      if (filters.priority && filters.priority !== "all") {
        query = query.eq("priority", filters.priority);
      }

      if (filters.assignee && filters.assignee !== "all") {
        query = query.eq("task_assignees.user_id", filters.assignee);
      }

      if (filters.search) {
        query = query.or(
          `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`,
        );
      }

      switch (filters.sortBy) {
        case "deadline":
          query = query.order("deadline", {
            ascending: true,
            nullsFirst: false,
          });
          break;
        case "priority":
          query = query.order("priority", { ascending: false });
          break;
        case "created":
          query = query.order("created_at", { ascending: false });
          break;
        default:
          query = query.order("created_at", { ascending: false });
      }

      const { data, error } = await query;

      if (error) throw error;

      const processedTasks = data.map((task) => ({
        ...task,
        assignees: task.task_assignees?.map((ta) => ta.users) || [],
      }));

      setTasks(processedTasks || []);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      // Get project members
      const { data: membersData } = await supabase
        .from("project_members")
        .select("user_id")
        .eq("project_id", selectedProject);

      const memberIds = membersData?.map((m) => m.user_id) || [];

      // Add project owner
      const { data: projectData } = await supabase
        .from("projects")
        .select("owner_id")
        .eq("id", selectedProject)
        .single();

      if (projectData?.owner_id) {
        memberIds.push(projectData.owner_id);
      }

      if (memberIds.length > 0) {
        const { data: usersData } = await supabase
          .from("users")
          .select("id, email, full_name")
          .in("id", memberIds)
          .order("full_name", { ascending: true });

        setUsers(usersData || []);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const fetchMilestone = async () => {
    try {
      const { data } = await supabase
        .from("milestones")
        .select("*")
        .eq("id", milestoneId)
        .single();
      setMilestone(data);
    } catch (error) {
      console.error("Error fetching milestone:", error);
    }
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

      await supabase.from("task_activities").insert([
        {
          task_id: taskId,
          user_id: (await supabase.auth.getUser()).data.user?.id,
          action: "status_change",
          details: `Status changed to ${newStatus}`,
        },
      ]);

      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId ? { ...task, ...updates } : task,
        ),
      );
    } catch (error) {
      console.error("Error updating task status:", error);
    }
  };

  const deleteTask = async (taskId) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;

    try {
      const { error } = await supabase.from("tasks").delete().eq("id", taskId);

      if (error) throw error;

      setTasks((prev) => prev.filter((task) => task.id !== taskId));
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      status: "",
      priority: "",
      assignee: "",
      sortBy: "deadline",
      search: "",
    });
  };

  const getStatusConfig = (status) => {
    const configs = {
      todo: {
        title: "To Do",
        icon: Circle,
        color: "text-gray-500",
        bgColor: "bg-gray-100",
        borderColor: "border-gray-200",
        countColor: "bg-gray-200 text-gray-700",
      },
      "in-progress": {
        title: "In Progress",
        icon: Clock,
        color: "text-blue-500",
        bgColor: "bg-blue-100",
        borderColor: "border-blue-200",
        countColor: "bg-blue-200 text-blue-700",
      },
      review: {
        title: "Review",
        icon: AlertCircle,
        color: "text-yellow-500",
        bgColor: "bg-yellow-100",
        borderColor: "border-yellow-200",
        countColor: "bg-yellow-200 text-yellow-700",
      },
      completed: {
        title: "Completed",
        icon: CheckCircle,
        color: "text-green-500",
        bgColor: "bg-green-100",
        borderColor: "border-green-200",
        countColor: "bg-green-200 text-green-700",
      },
    };
    return configs[status] || configs.todo;
  };

  const getPriorityConfig = (priority) => {
    const configs = {
      low: { label: "Low", color: "bg-gray-100 text-gray-700" },
      medium: { label: "Medium", color: "bg-blue-100 text-blue-700" },
      high: { label: "High", color: "bg-orange-100 text-orange-700" },
      urgent: { label: "Urgent", color: "bg-red-100 text-red-700" },
    };
    return configs[priority] || configs.medium;
  };

  const groupedTasks = {
    todo: tasks.filter((t) => t.status === "todo"),
    "in-progress": tasks.filter((t) => t.status === "in-progress"),
    review: tasks.filter((t) => t.status === "review"),
    completed: tasks.filter((t) => t.status === "completed"),
  };

  const stats = {
    total: tasks.length,
    completed: groupedTasks.completed.length,
    overdue: tasks.filter(
      (t) =>
        t.deadline &&
        new Date(t.deadline) < new Date() &&
        t.status !== "completed",
    ).length,
    inProgress: groupedTasks["in-progress"].length,
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTask(null);
  };

  const handleProjectSelect = (projectId) => {
    setSelectedProject(projectId);
    if (isGlobalTaskView) {
      navigate(`/tasks?project=${projectId}`);
    }
  };

  const handleCreateTask = () => {
    if (!selectedProject) return;
    setEditingTask(null);
    setIsModalOpen(true);
  };

  if (loading && !selectedProject) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-full mx-auto px-2 md:px-4 py-2 md:py-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                <Layers className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {milestone ? `${milestone.name} Tasks` : "Tasks"}
                </h1>
                {milestone && milestone.description && (
                  <p className="text-gray-600 mt-1">{milestone.description}</p>
                )}
              </div>
            </div>

            {selectedProject && (
              <button
                onClick={handleCreateTask}
                className="px-2 md:px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium shadow-md hover:shadow-lg transition-shadow flex items-center gap-2"
              >
                <Plus className="h-5 w-5" />
                New Task
              </button>
            )}
          </div>

          {/* Project Selector (always shown in global task view) */}
          {isGlobalTaskView && (
            <div className="mb-2 md:mb-6">
              <div className="flex items-center gap-3 mb-3">
                <FolderKanban className="h-5 w-5 text-gray-500" />
                <label className="text-sm font-medium text-gray-700">
                  Select Project
                </label>
              </div>
              {projects.length === 0 ? (
                <div className="bg-white rounded-xl p-6 text-center border border-gray-200">
                  <p className="text-gray-600 mb-4">No projects found</p>
                  <button
                    onClick={() => navigate("/projects/new")}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Create Project
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {projects.map((project) => (
                    <button
                      key={project.id}
                      onClick={() => handleProjectSelect(project.id)}
                      className={`px-4 py-2 rounded-lg transition-all ${
                        selectedProject === project.id
                          ? "bg-blue-600 text-white"
                          : "bg-white text-gray-700 border border-gray-300 hover:border-blue-300"
                      }`}
                    >
                      {project.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Show stats and tasks only when a project is selected */}
          {selectedProject ? (
            <></>
          ) : (
            // Show "Select Project" message when no project is selected
            isGlobalTaskView && (
              <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FolderKanban className="h-10 w-10 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Select a Project
                </h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Choose a project from the list above to view and manage its
                  tasks. If you don't see any projects, create one first.
                </p>
                <button
                  onClick={() => navigate("/projects")}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium inline-flex items-center gap-2"
                >
                  <FolderKanban className="h-5 w-5" />
                  Go to Projects
                </button>
              </div>
            )
          )}
        </div>

        {/* Filters & Tasks (only shown when project is selected) */}
        {selectedProject && (
          <>
            {/* Filters Bar */}
            <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4 flex-wrap">
                  {/* View Toggle */}

                  {/* Filter Toggle */}
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                      showFilters
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    <Filter className="h-4 w-4" />
                    <span>Filters</span>
                    {(filters.status ||
                      filters.priority ||
                      filters.assignee ||
                      filters.search) && (
                      <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                        Active
                      </span>
                    )}
                  </button>

                  {/* Search */}
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={filters.search}
                      onChange={(e) =>
                        handleFilterChange("search", e.target.value)
                      }
                      placeholder="Search tasks..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Sort */}
                <div className="flex items-center gap-2">
                  <SortAsc className="h-4 w-4 text-gray-400" />
                  <select
                    value={filters.sortBy}
                    onChange={(e) =>
                      handleFilterChange("sortBy", e.target.value)
                    }
                    className="border-0 bg-transparent focus:ring-0 text-sm"
                  >
                    <option value="deadline">Sort by Deadline</option>
                    <option value="priority">Sort by Priority</option>
                    <option value="created">Sort by Created</option>
                  </select>
                </div>
              </div>

              {/* Advanced Filters */}
              {showFilters && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Status
                      </label>
                      <select
                        value={filters.status}
                        onChange={(e) =>
                          handleFilterChange("status", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">All Status</option>
                        <option value="todo">To Do</option>
                        <option value="in-progress">In Progress</option>
                        <option value="review">Review</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Priority
                      </label>
                      <select
                        value={filters.priority}
                        onChange={(e) =>
                          handleFilterChange("priority", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">All Priorities</option>
                        <option value="urgent">Urgent</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Assignee
                      </label>
                      <select
                        value={filters.assignee}
                        onChange={(e) =>
                          handleFilterChange("assignee", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">All Assignees</option>
                        {users.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.full_name || user.email}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-end">
                      <button
                        onClick={clearFilters}
                        className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
                      >
                        Clear Filters
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Task Modal */}
            <Modal
              isOpen={isModalOpen}
              onClose={handleCloseModal}
              title={editingTask ? "Edit Task" : "Create New Task"}
              size="4xl"
            >
              <TaskForm
                projectId={selectedProject}
                milestoneId={milestoneId}
                initialData={editingTask}
                onSuccess={() => {
                  handleCloseModal();
                  fetchTasks();
                }}
              />
            </Modal>

            {/* Loading state for tasks */}
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading tasks...</p>
              </div>
            ) : (
              <>
                {/* Mobile List View */}
                {viewMode === "list" && (
                  <div className="sm:hidden space-y-3">
                    {tasks.length === 0 ? (
                      <div className="bg-white rounded-xl shadow-sm border border-gray-200 text-center py-12">
                        <div className="max-w-md mx-auto px-4">
                          <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Layers className="h-8 w-8 text-purple-600" />
                          </div>
                          <h4 className="text-lg font-bold text-gray-900 mb-2">
                            No tasks yet
                          </h4>
                          <p className="text-sm text-gray-600 mb-6">
                            Add your first task to get started
                          </p>
                          <button
                            onClick={handleCreateTask}
                            className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
                          >
                            <Plus className="h-5 w-5 inline mr-2" />
                            Create Task
                          </button>
                        </div>
                      </div>
                    ) : (
                      tasks.map((task) => (
                        <div
                          key={task.id}
                          className="bg-white rounded-lg shadow-sm border border-gray-200"
                        >
                          <TaskCard
                            task={task}
                            compact={true}
                            onEdit={() => {
                              setEditingTask(task);
                              setIsModalOpen(true);
                            }}
                            onDelete={deleteTask}
                            onStatusChange={updateTaskStatus}
                          />
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Mobile Kanban View */}
                {viewMode === "kanban" && (
                  <div className="sm:hidden space-y-4">
                    {Object.entries(groupedTasks).map(
                      ([status, statusTasks]) => {
                        const config = statusConfig[status];
                        const Icon = config.icon;

                        return (
                          <div
                            key={status}
                            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
                          >
                            {/* Column Header */}
                            <div
                              className={`flex items-center justify-between p-4 border-b ${config.borderColor} bg-gradient-to-r ${config.color} bg-opacity-10`}
                            >
                              <div className="flex items-center space-x-2">
                                <div
                                  className={`p-1.5 rounded-md ${config.bgColor}`}
                                >
                                  <Icon className="h-4 w-4 text-gray-700" />
                                </div>
                                <h4 className="font-bold text-gray-900 text-sm">
                                  {config.title}
                                </h4>
                              </div>
                              <span
                                className={`px-2 py-0.5 rounded-full text-xs font-bold ${config.bgColor} border ${config.borderColor}`}
                              >
                                {statusTasks.length}
                              </span>
                            </div>

                            {/* Tasks */}
                            <div className="space-y-2 p-2">
                              {statusTasks.map((task) => (
                                <div
                                  key={task.id}
                                  className="border border-gray-200 rounded-lg  hover:border-blue-300 transition-colors"
                                >
                                  <TaskCard
                                    task={task}
                                    compact={true}
                                    onEdit={() => {
                                      setEditingTask(task);
                                      setIsModalOpen(true);
                                    }}
                                    onDelete={deleteTask}
                                    onStatusChange={updateTaskStatus}
                                  />
                                </div>
                              ))}

                              {statusTasks.length === 0 && (
                                <div className="text-center py-6 text-gray-400 text-sm">
                                  <Circle className="h-6 w-6 mx-auto mb-2 opacity-50" />
                                  <p>No tasks</p>
                                </div>
                              )}

                              {/* Add Task Button */}
                              <button
                                onClick={handleCreateTask}
                                className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50 text-sm font-medium transition-all flex items-center justify-center space-x-2"
                              >
                                <Plus className="h-4 w-4" />
                                <span>Add task</span>
                              </button>
                            </div>
                          </div>
                        );
                      },
                    )}
                  </div>
                )}

                {/* Desktop Kanban Board */}
                <div className="hidden sm:block">
                  {tasks.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 text-center py-12 sm:py-16">
                      <div className="max-w-md mx-auto px-4">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Layers className="h-8 w-8 sm:h-10 sm:w-10 text-purple-600" />
                        </div>
                        <h4 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                          No tasks yet
                        </h4>
                        <p className="text-sm sm:text-base text-gray-600 mb-6">
                          Add your first task to get started
                        </p>
                        <button
                          onClick={handleCreateTask}
                          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
                        >
                          <Plus className="h-5 w-5 inline mr-2" />
                          Create Task
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {Object.entries(groupedTasks).map(
                        ([status, statusTasks]) => {
                          const config = statusConfig[status];
                          const Icon = config.icon;

                          return (
                            <div
                              key={status}
                              className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 hover:shadow-md transition-shadow min-h-[600px] flex flex-col"
                            >
                              {/* Column Header */}
                              <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-gray-100">
                                <div className="flex items-center space-x-2">
                                  <div
                                    className={`p-2 rounded-lg ${config.bgColor}`}
                                  >
                                    <Icon className="h-5 w-5 text-gray-700" />
                                  </div>
                                  <h4 className="font-bold text-gray-900">
                                    {config.title}
                                  </h4>
                                </div>
                                <div
                                  className={`px-3 py-1 rounded-full text-xs font-bold ${config.bgColor} border ${config.borderColor}`}
                                >
                                  {statusTasks.length}
                                </div>
                              </div>

                              {/* Tasks */}
                              <div className="space-y-3 flex-1 overflow-y-auto pr-1 custom-scrollbar">
                                {/* Add Task Button */}
                                <button
                                  onClick={handleCreateTask}
                                  className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50 text-sm font-medium transition-all flex items-center justify-center space-x-2"
                                >
                                  <Plus className="h-4 w-4" />
                                  <span>Add task</span>
                                </button>
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
                                  <div className="text-center py-4 text-gray-400 text-sm">
                                    <Circle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <p>No tasks</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        },
                      )}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Mobile Floating Button */}
            <button
              onClick={handleCreateTask}
              className="fixed bottom-20 right-6 sm:hidden h-14 w-14 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full shadow-xl flex items-center justify-center hover:shadow-2xl transition-all z-40"
              aria-label="Add Task"
            >
              <Plus className="h-6 w-6" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
