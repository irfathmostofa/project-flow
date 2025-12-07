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
  Users,
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
      // Fetch projects
      const { data: projects } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);

      // Fetch tasks
      const { data: tasks } = await supabase.from("tasks").select("*");

      // Fetch overdue tasks
      const today = new Date().toISOString().split("T")[0];
      const { data: overdueTasks } = await supabase
        .from("tasks")
        .select("*")
        .lt("deadline", today)
        .neq("status", "completed");

      // Calculate stats
      const totalProjects = projects?.length || 0;
      const activeProjects =
        projects?.filter((p) => p.status === "active").length || 0;
      const totalTasks = tasks?.length || 0;
      const completedTasks =
        tasks?.filter((t) => t.status === "completed").length || 0;
      const overdueTasksCount = overdueTasks?.length || 0;

      // Get upcoming deadlines (next 7 days)
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
      color: "bg-blue-500",
      textColor: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Active Projects",
      value: stats.activeProjects,
      icon: Target,
      color: "bg-green-500",
      textColor: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Total Tasks",
      value: stats.totalTasks,
      icon: CheckCircle,
      color: "bg-purple-500",
      textColor: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Completed Tasks",
      value: stats.completedTasks,
      icon: TrendingUp,
      color: "bg-emerald-500",
      textColor: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
    {
      title: "Overdue Tasks",
      value: stats.overdueTasks,
      icon: AlertCircle,
      color: "bg-red-500",
      textColor: "text-red-600",
      bgColor: "bg-red-50",
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Dashboard
        </h1>
        <p className="text-gray-600 mt-1 sm:mt-2">
          Welcome back! Here's what's happening with your projects.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className={`${stat.bgColor} rounded-xl p-3 sm:p-4 col-span-1`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">
                    {stat.title}
                  </p>
                  <p
                    className={`text-lg sm:text-xl font-bold ${stat.textColor} mt-1 sm:mt-2`}
                  >
                    {stat.value}
                  </p>
                </div>
                <div className={`${stat.color} p-2 sm:p-3 rounded-lg`}>
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent Projects */}
        <div className="card">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
              Recent Projects
            </h2>
            <Link
              to="/projects"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              View all →
            </Link>
          </div>

          <div className="space-y-3">
            {recentProjects.length === 0 ? (
              <div className="text-center py-6 sm:py-8">
                <FolderKanban className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No projects yet</p>
                <Link
                  to="/projects"
                  className="inline-block mt-3 text-blue-600 hover:text-blue-800 font-medium text-sm"
                >
                  Create your first project
                </Link>
              </div>
            ) : (
              recentProjects.map((project) => (
                <Link
                  key={project.id}
                  to={`/projects/${project.id}`}
                  className="block p-3 sm:p-4 hover:bg-gray-50 rounded-lg border border-gray-200 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">
                        {project.name}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            project.status === "active"
                              ? "bg-green-100 text-green-800"
                              : project.status === "completed"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {project.status}
                        </span>
                        {project.deadline && (
                          <span className="text-xs text-gray-500 flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {format(new Date(project.deadline), "MMM d")}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-sm text-gray-500 text-right">
                      Created {format(new Date(project.created_at), "MMM d")}
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div className="card">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
              Upcoming Deadlines
            </h2>
            <span className="text-sm text-gray-500">Next 7 days</span>
          </div>

          <div className="space-y-3">
            {upcomingDeadlines.length === 0 ? (
              <div className="text-center py-6 sm:py-8">
                <Calendar className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No upcoming deadlines</p>
              </div>
            ) : (
              upcomingDeadlines.map((task) => (
                <div
                  key={task.id}
                  className="p-3 sm:p-4 border border-gray-200 rounded-lg"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">
                        {task.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                          {task.priority}
                        </span>
                        <span className="text-xs text-gray-500 truncate">
                          Project: {task.project?.name || "Unknown"}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {format(new Date(task.deadline), "MMM d")}
                      </div>
                      <div className="text-xs text-gray-500 capitalize">
                        {task.status}
                      </div>
                    </div>
                  </div>

                  {task.description && (
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                      {task.description}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Quick Actions */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <Link
                to="/projects"
                className="flex items-center justify-center p-3 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm"
              >
                <FolderKanban className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="truncate">New Project</span>
              </Link>
              <Link
                to="/projects"
                className="flex items-center justify-center p-3 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors text-sm"
              >
                <Target className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="truncate">View Tasks</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
