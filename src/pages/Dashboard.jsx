import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Link } from "react-router-dom";
import {
  FolderKanban,
  Target,
  CheckCircle,
  Clock,
  AlertCircle,
  Calendar,
  TrendingUp,
  Zap,
  Activity,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { format } from "date-fns";

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    totalTasks: 0,
    completedTasks: 0,
    overdueTasks: 0,
  });

  const [recentProjects, setRecentProjects] = useState([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data: projects } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);

      const { data: tasks } = await supabase.from("tasks").select("*");

      const today = new Date().toISOString().split("T")[0];
      const { data: overdueTasks } = await supabase
        .from("tasks")
        .select("*")
        .lt("deadline", today)
        .neq("status", "completed");

      const totalProjects = projects?.length || 0;
      const activeProjects =
        projects?.filter((p) => p.status === "active").length || 0;
      const totalTasks = tasks?.length || 0;
      const completedTasks =
        tasks?.filter((t) => t.status === "completed").length || 0;
      const overdueTasksCount = overdueTasks?.length || 0;

      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      const nextWeekStr = nextWeek.toISOString().split("T")[0];

      const { data: deadlines } = await supabase
        .from("tasks")
        .select(
          `
          *,
          project:projects(name)
        `
        )
        .gte("deadline", today)
        .lte("deadline", nextWeekStr)
        .neq("status", "completed")
        .order("deadline", { ascending: true })
        .limit(5);

      setStats({
        totalProjects,
        activeProjects,
        totalTasks,
        completedTasks,
        overdueTasks: overdueTasksCount,
      });

      setRecentProjects(projects || []);
      setUpcomingDeadlines(deadlines || []);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "Total Projects",
      value: stats.totalProjects,
      icon: FolderKanban,
      gradient: "from-blue-500 to-indigo-600",
      bgColor: "bg-blue-50",
      iconBg: "bg-blue-100",
    },
    {
      title: "Active Projects",
      value: stats.activeProjects,
      icon: Target,
      gradient: "from-green-500 to-emerald-600",
      bgColor: "bg-green-50",
      iconBg: "bg-green-100",
    },
    {
      title: "Total Tasks",
      value: stats.totalTasks,
      icon: Activity,
      gradient: "from-purple-500 to-pink-600",
      bgColor: "bg-purple-50",
      iconBg: "bg-purple-100",
    },
    {
      title: "Completed Tasks",
      value: stats.completedTasks,
      icon: CheckCircle,
      gradient: "from-emerald-500 to-teal-600",
      bgColor: "bg-emerald-50",
      iconBg: "bg-emerald-100",
    },
    {
      title: "Overdue Tasks",
      value: stats.overdueTasks,
      icon: AlertCircle,
      gradient: "from-red-500 to-pink-600",
      bgColor: "bg-red-50",
      iconBg: "bg-red-100",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const completionRate =
    stats.totalTasks > 0
      ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
      : 0;

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-50 p-2">
      <div className="max-w-ful mx-auto space-y-8">
        {/* Header */}
        <div className="relative">
          <div className="absolute -top-4 -left-4 w-24 h-24 bg-blue-400 rounded-full opacity-20 blur-3xl"></div>
          <div className="absolute -top-4 -right-4 w-32 h-32 bg-purple-400 rounded-full opacity-20 blur-3xl"></div>

          <div className="relative">
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Dashboard
              </h1>
              <Sparkles className="h-6 w-6 text-yellow-500 animate-pulse" />
            </div>
            <p className="text-gray-600 ml-0 sm:ml-16">
              Welcome back! Here's your productivity overview
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="group relative bg-white rounded-2xl p-5 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden"
              >
                <div
                  className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${stat.gradient} opacity-10 rounded-full -mr-12 -mt-12`}
                ></div>

                <div className="relative">
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className={`p-3 rounded-xl ${stat.iconBg} group-hover:scale-110 transition-transform`}
                    >
                      <Icon className="h-5 w-5 text-gray-700" />
                    </div>
                  </div>

                  <p className="text-sm font-medium text-gray-600 mb-1">
                    {stat.title}
                  </p>
                  <p
                    className={`text-3xl font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent`}
                  >
                    {stat.value}
                  </p>
                </div>

                <div
                  className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.gradient} transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left`}
                ></div>
              </div>
            );
          })}
        </div>

        {/* Completion Rate Card */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-xl p-6 sm:p-8 text-white">
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
              <div>
                <p className="text-blue-100 text-sm font-medium">
                  Overall Progress
                </p>
                <p className="text-3xl font-bold">{completionRate}%</p>
                <p className="text-blue-100 text-sm">
                  {stats.completedTasks} of {stats.totalTasks} tasks completed
                </p>
              </div>
            </div>

            <div className="w-full sm:w-64">
              <div className="h-4 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
                <div
                  className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-500 relative"
                  style={{ width: `${completionRate}%` }}
                >
                  <div className="absolute inset-0 bg-white opacity-30 animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Projects */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FolderKanban className="h-5 w-5 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Recent Projects
                  </h2>
                </div>
                <Link
                  to="/projects"
                  className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm font-semibold group"
                >
                  <span>View all</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-3">
                {recentProjects.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FolderKanban className="h-8 w-8 text-blue-600" />
                    </div>
                    <p className="text-gray-500 mb-3">No projects yet</p>
                    <Link
                      to="/projects"
                      className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-800 font-semibold text-sm"
                    >
                      <span>Create your first project</span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                ) : (
                  recentProjects.map((project) => (
                    <Link
                      key={project.id}
                      to={`/projects/${project.id}`}
                      className="group block p-4 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 rounded-xl border-2 border-gray-100 hover:border-blue-200 transition-all"
                    >
                      <div className="flex items-start justify-between space-x-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                            {project.name}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <span
                              className={`text-xs px-3 py-1 rounded-full font-semibold border ${
                                project.status === "active"
                                  ? "bg-green-100 text-green-700 border-green-200"
                                  : project.status === "completed"
                                  ? "bg-blue-100 text-blue-700 border-blue-200"
                                  : "bg-yellow-100 text-yellow-700 border-yellow-200"
                              }`}
                            >
                              {project.status.toUpperCase()}
                            </span>
                            {project.deadline && (
                              <span className="text-xs text-gray-600 flex items-center bg-gray-100 px-2 py-1 rounded-full">
                                <Calendar className="h-3 w-3 mr-1" />
                                {format(new Date(project.deadline), "MMM d")}
                              </span>
                            )}
                          </div>
                        </div>
                        <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all flex-shrink-0" />
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Upcoming Deadlines */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Clock className="h-5 w-5 text-purple-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Upcoming Deadlines
                  </h2>
                </div>
                <span className="text-xs font-semibold text-gray-600 bg-white px-3 py-1 rounded-full">
                  Next 7 days
                </span>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-3">
                {upcomingDeadlines.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Calendar className="h-8 w-8 text-purple-600" />
                    </div>
                    <p className="text-gray-500">No upcoming deadlines</p>
                  </div>
                ) : (
                  upcomingDeadlines.map((task) => (
                    <div
                      key={task.id}
                      className="group p-4 border-2 border-gray-100 hover:border-purple-200 rounded-xl hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 transition-all"
                    >
                      <div className="flex items-start justify-between space-x-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 truncate">
                            {task.title}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <span
                              className={`text-xs px-3 py-1 rounded-full font-semibold border ${
                                task.priority === "urgent"
                                  ? "bg-red-100 text-red-700 border-red-200"
                                  : task.priority === "high"
                                  ? "bg-orange-100 text-orange-700 border-orange-200"
                                  : task.priority === "medium"
                                  ? "bg-yellow-100 text-yellow-700 border-yellow-200"
                                  : "bg-green-100 text-green-700 border-green-200"
                              }`}
                            >
                              {task.priority.toUpperCase()}
                            </span>
                            <span className="text-xs text-gray-600 truncate bg-gray-100 px-2 py-1 rounded-full">
                              {task.project?.name || "Unknown"}
                            </span>
                          </div>
                          {task.description && (
                            <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                              {task.description}
                            </p>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-sm font-bold text-gray-900 bg-gray-100 px-3 py-1 rounded-lg">
                            {format(new Date(task.deadline), "MMM d")}
                          </div>
                          <div className="text-xs text-gray-600 capitalize mt-1">
                            {task.status.replace("-", " ")}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Quick Actions */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center">
                  <Zap className="h-5 w-5 mr-2 text-yellow-500" />
                  Quick Actions
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <Link
                    to="/projects"
                    className="group flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-100 hover:border-blue-300 text-blue-700 rounded-xl hover:shadow-md transition-all text-sm font-semibold"
                  >
                    <FolderKanban className="h-5 w-5 mr-2 flex-shrink-0 group-hover:scale-110 transition-transform" />
                    <span className="truncate">New Project</span>
                  </Link>
                  <Link
                    to="/projects"
                    className="group flex items-center justify-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-100 hover:border-green-300 text-green-700 rounded-xl hover:shadow-md transition-all text-sm font-semibold"
                  >
                    <Target className="h-5 w-5 mr-2 flex-shrink-0 group-hover:scale-110 transition-transform" />
                    <span className="truncate">View Tasks</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
