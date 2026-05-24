import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { format } from "date-fns";
import {
  Calendar,
  Users,
  Target,
  ArrowLeft,
  Edit,
  Trash2,
  Layers,
  CheckCircle,
  Clock,
  AlertCircle,
  Sparkles,
  FileText,
  CreditCard,
  FileCheck,
  Server,
  FolderKanban,
  Activity,
  TrendingUp,
  Zap,
} from "lucide-react";
import MilestoneList from "../components/milestones/MilestoneList";
import TaskList from "../components/tasks/TaskList";
import ProjectForm from "../components/projects/ProjectForm";
import Modal from "../components/ui/Modal";

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [projectStats, setProjectStats] = useState({
    totalMilestones: 0,
    completedMilestones: 0,
    totalTasks: 0,
    completedTasks: 0,
  });

  useEffect(() => {
    fetchProject();
    fetchProjectStats();
  }, [id]);

  const fetchProject = async () => {
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setProject(data);
    } catch (error) {
      console.error("Error fetching project:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectStats = async () => {
    try {
      // Fetch milestones
      const { data: milestones } = await supabase
        .from("milestones")
        .select("status")
        .eq("project_id", id);

      // Fetch tasks
      const { data: tasks } = await supabase
        .from("tasks")
        .select("status")
        .eq("project_id", id);

      setProjectStats({
        totalMilestones: milestones?.length || 0,
        completedMilestones:
          milestones?.filter((m) => m.status === "completed").length || 0,
        totalTasks: tasks?.length || 0,
        completedTasks:
          tasks?.filter((t) => t.status === "completed").length || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const deleteProject = async () => {
    if (
      !window.confirm(
        "Are you sure you want to delete this project? This action cannot be undone.",
      )
    )
      return;

    try {
      // Delete related data first
      await supabase.from("milestones").delete().eq("project_id", id);
      await supabase.from("tasks").delete().eq("project_id", id);
      await supabase.from("project_members").delete().eq("project_id", id);

      const { error } = await supabase.from("projects").delete().eq("id", id);

      if (error) throw error;
      navigate("/projects");
    } catch (error) {
      console.error("Error deleting project:", error);
      alert("Error deleting project: " + error.message);
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      active: {
        gradient: "from-green-500 to-emerald-600",
        bg: "bg-green-50",
        text: "text-green-700",
        border: "border-green-200",
        dot: "bg-green-500",
      },
      completed: {
        gradient: "from-blue-500 to-indigo-600",
        bg: "bg-blue-50",
        text: "text-blue-700",
        border: "border-blue-200",
        dot: "bg-blue-500",
      },
      planning: {
        gradient: "from-yellow-500 to-orange-600",
        bg: "bg-yellow-50",
        text: "text-yellow-700",
        border: "border-yellow-200",
        dot: "bg-yellow-500",
      },
      on_hold: {
        gradient: "from-gray-500 to-slate-600",
        bg: "bg-gray-50",
        text: "text-gray-700",
        border: "border-gray-200",
        dot: "bg-gray-500",
      },
    };
    return configs[status] || configs.planning;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading project...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="text-center bg-white rounded-2xl shadow-xl p-12 max-w-md">
          <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="h-10 w-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Project not found
          </h2>
          <p className="text-gray-600 mb-6">
            The project you're looking for doesn't exist or you don't have
            access to it.
          </p>
          <button
            onClick={() => navigate("/projects")}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all flex items-center mx-auto"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(project.status);
  const milestoneProgress =
    projectStats.totalMilestones > 0
      ? Math.round(
          (projectStats.completedMilestones / projectStats.totalMilestones) *
            100,
        )
      : 0;
  const taskProgress =
    projectStats.totalTasks > 0
      ? Math.round(
          (projectStats.completedTasks / projectStats.totalTasks) * 100,
        )
      : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Navigation Menu - Modern Sidebar Style */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Link
              to="/projects"
              className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="font-medium">Back to Projects</span>
            </Link>

            <div className="flex flex-wrap gap-3">
              <Link
                to="/quotations"
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
              >
                <FileText className="h-4 w-4" />
                <span className="text-sm">Quotations</span>
              </Link>
              <Link
                to="/payments"
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              >
                <CreditCard className="h-4 w-4" />
                <span className="text-sm">Payments</span>
              </Link>
              <Link
                to="/handovers"
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
              >
                <FileCheck className="h-4 w-4" />
                <span className="text-sm">Handovers</span>
              </Link>
              <Link
                to="/infrastructure-renewals"
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Server className="h-4 w-4" />
                <span className="text-sm">Infrastructure</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Project Header */}
        <div className="relative bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Decorative Background */}
          <div
            className={`absolute top-0 right-0 w-96 h-96 bg-gradient-to-br ${statusConfig.gradient} opacity-5 rounded-full -mr-48 -mt-48`}
          />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-br from-purple-500 to-pink-500 opacity-5 rounded-full -ml-32 -mb-32" />

          <div className="relative p-6 lg:p-8">
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
              {/* Project Info */}
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <div
                    className={`p-3 rounded-xl bg-gradient-to-br ${statusConfig.gradient} shadow-lg`}
                  >
                    <FolderKanban className="h-6 w-6 text-white" />
                  </div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                    {project.name}
                  </h1>
                  <span
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold ${statusConfig.bg} ${statusConfig.text} border ${statusConfig.border}`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${statusConfig.dot} animate-pulse`}
                    />
                    {project.status.replace("_", " ").toUpperCase()}
                  </span>
                  <Sparkles className="h-5 w-5 text-yellow-500 animate-pulse" />
                </div>

                {project.description && (
                  <p className="text-gray-600 text-base leading-relaxed mb-6">
                    {project.description}
                  </p>
                )}

                {/* Metadata */}
                <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Created:{" "}
                      {format(new Date(project.created_at), "MMM d, yyyy")}
                    </span>
                  </div>
                  {project.deadline && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>
                        Deadline:{" "}
                        {format(new Date(project.deadline), "MMM d, yyyy")}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    <span>
                      Last updated:{" "}
                      {format(new Date(project.updated_at), "MMM d, yyyy")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="group px-5 py-2.5 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 hover:border-blue-300 text-blue-700 rounded-xl font-semibold hover:shadow-md transition-all flex items-center gap-2"
                >
                  <Edit className="h-4 w-4 group-hover:rotate-12 transition-transform" />
                  Edit Project
                </button>
                <button
                  onClick={deleteProject}
                  className="group px-5 py-2.5 bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 hover:border-red-300 text-red-700 rounded-xl font-semibold hover:shadow-md transition-all flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4 group-hover:scale-110 transition-transform" />
                  Delete
                </button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8 pt-6 border-t border-gray-100">
              <div className="group bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100 hover:border-blue-200 hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 bg-blue-100 rounded-lg group-hover:scale-110 transition-transform">
                    <Target className="h-5 w-5 text-blue-600" />
                  </div>
                  <span className="text-2xl font-bold text-blue-600">
                    {projectStats.totalMilestones}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-700">
                  Total Milestones
                </p>
                <div className="mt-2 h-1.5 bg-blue-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all"
                    style={{ width: `${milestoneProgress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {projectStats.completedMilestones} completed (
                  {milestoneProgress}%)
                </p>
              </div>

              <div className="group bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100 hover:border-purple-200 hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 bg-purple-100 rounded-lg group-hover:scale-110 transition-transform">
                    <CheckCircle className="h-5 w-5 text-purple-600" />
                  </div>
                  <span className="text-2xl font-bold text-purple-600">
                    {projectStats.totalTasks}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-700">Total Tasks</p>
                <div className="mt-2 h-1.5 bg-purple-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-600 rounded-full transition-all"
                    style={{ width: `${taskProgress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {projectStats.completedTasks} completed ({taskProgress}%)
                </p>
              </div>

              <div className="group bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100 hover:border-green-200 hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 bg-green-100 rounded-lg group-hover:scale-110 transition-transform">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                  <span className="text-2xl font-bold text-green-600">
                    {taskProgress}%
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-700">
                  Overall Progress
                </p>
                <div className="mt-2 h-1.5 bg-green-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-600 rounded-full transition-all"
                    style={{ width: `${taskProgress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {taskProgress}% complete
                </p>
              </div>

              <div className="group bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-4 border border-yellow-100 hover:border-yellow-200 hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 bg-yellow-100 rounded-lg group-hover:scale-110 transition-transform">
                    <Zap className="h-5 w-5 text-yellow-600" />
                  </div>
                  <span className="text-2xl font-bold text-yellow-600">
                    {project.deadline
                      ? format(new Date(project.deadline), "MMM d")
                      : "N/A"}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-700">Deadline</p>
                <p className="text-xs text-gray-500 mt-2">
                  {project.deadline
                    ? `${Math.ceil((new Date(project.deadline) - new Date()) / (1000 * 60 * 60 * 24))} days remaining`
                    : "No deadline set"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Project Modal */}
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title="Edit Project"
          size="lg"
        >
          <ProjectForm
            initialData={project}
            onSuccess={() => {
              setIsEditModalOpen(false);
              fetchProject();
              fetchProjectStats();
            }}
          />
        </Modal>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-slate-50 border-b border-gray-200 px-4 lg:px-6 overflow-x-auto">
            <nav className="flex gap-1">
              {[
                { key: "overview", label: "Overview", icon: Layers },
                { key: "milestones", label: "Milestones", icon: Target },
                { key: "tasks", label: "Tasks", icon: CheckCircle },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`group relative py-4 px-4 lg:px-6 font-semibold text-sm whitespace-nowrap transition-all flex items-center gap-2 ${
                      isActive
                        ? "text-blue-600"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <Icon
                      className={`h-5 w-5 transition-all ${
                        isActive
                          ? "scale-110 text-blue-600"
                          : "group-hover:scale-110"
                      }`}
                    />
                    <span>{tab.label}</span>
                    {isActive && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-t-full" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-4 lg:p-6">
            {activeTab === "overview" && (
              <MilestoneList projectId={project.id} />
            )}
            {activeTab === "milestones" && (
              <MilestoneList projectId={project.id} />
            )}
            {activeTab === "tasks" && <TaskList projectId={project.id} />}
          </div>
        </div>
      </div>
    </div>
  );
}
