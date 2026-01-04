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
  Users,
  Layers,
} from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();
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
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch user's projects (owned and where they are a member)
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

      // Get details for member projects
      if (memberProjectIds.length > 0) {
        const { data: memberProjectDetails } = await supabase
          .from("projects")
          .select("*")
          .in("id", memberProjectIds);

        // Filter out duplicates (projects user already owns)
        const uniqueMemberProjects = (memberProjectDetails || []).filter(
          (project) => !ownedProjects?.some((owned) => owned.id === project.id)
        );

        allProjects = [...allProjects, ...uniqueMemberProjects];
      }

      // Get all tasks from user's projects
      const projectIds = allProjects.map((p) => p.id);
      let allTasks = [];

      if (projectIds.length > 0) {
        const { data: tasks } = await supabase
          .from("tasks")
          .select("*, task_assignees!left(user_id)")
          .in("project_id", projectIds);

        allTasks = tasks || [];
      }

      // Get tasks where user is assigned (through task_assignees)
      const { data: assignedTasksData } = await supabase
        .from("task_assignees")
        .select("task_id")
        .eq("user_id", user.id);

      const assignedTaskIds = assignedTasksData?.map((t) => t.task_id) || [];

      // Get details for assigned tasks
      let assignedTasks = [];
      if (assignedTaskIds.length > 0) {
        const { data: assignedTaskDetails } = await supabase
          .from("tasks")
          .select("*")
          .in("id", assignedTaskIds);

        assignedTasks = assignedTaskDetails || [];
      }

      // Combine all tasks (from projects + directly assigned)
      const combinedTasks = [...allTasks, ...assignedTasks];

      // Remove duplicates
      const uniqueTasks = Array.from(
        new Map(combinedTasks.map((task) => [task.id, task])).values()
      );

      // Calculate overdue tasks
      const today = new Date().toISOString().split("T")[0];
      const overdueTasks = uniqueTasks.filter(
        (task) =>
          task.deadline && task.deadline < today && task.status !== "completed"
      );

      // Calculate stats
      const totalProjects = allProjects.length || 0;
      const activeProjects =
        allProjects.filter((p) => p.status === "active").length || 0;
      const totalTasks = uniqueTasks.length || 0;
      const completedTasks =
        uniqueTasks.filter((t) => t.status === "completed").length || 0;
      const overdueTasksCount = overdueTasks.length || 0;

      // Update stats
      setStats({
        totalProjects,
        activeProjects,
        totalTasks,
        completedTasks,
        overdueTasks: overdueTasksCount,
      });

      // Get recent projects (last 5)
      setRecentProjects(allProjects.slice(0, 5));

      // Get upcoming deadlines (next 7 days)
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      const nextWeekStr = nextWeek.toISOString().split("T")[0];

      // Get tasks with deadlines in next 7 days that are not completed
      const upcomingTasks = uniqueTasks.filter(
        (task) =>
          task.deadline &&
          task.deadline >= today &&
          task.deadline <= nextWeekStr &&
          task.status !== "completed"
      );

      // Get project names for upcoming tasks
      const upcomingDeadlinesWithProjects = await Promise.all(
        upcomingTasks.slice(0, 5).map(async (task) => {
          const { data: project } = await supabase
            .from("projects")
            .select("name")
            .eq("id", task.project_id)
            .single();

          return {
            ...task,
            project: project || { name: "Unknown Project" },
          };
        })
      );

      setUpcomingDeadlines(upcomingDeadlinesWithProjects);
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
      icon: Layers,
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-1 md:p-4">
      <div className="max-w-full mx-auto space-y-4">
        {/* Header */}
        <div className="space-y-2">
          {/* Dashboard Header */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3">
                <Zap className="h-6 w-6 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              </div>
              <p className="text-gray-600 text-sm mt-1">
                Welcome back! Here's your overview
              </p>
            </div>

            {/* Progress Badge */}
            <div className="flex items-center space-x-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm text-gray-600">Overall Progress</p>
                <p className="text-lg font-semibold text-gray-900">
                  {completionRate}% complete
                </p>
              </div>
            </div>
          </div>

          {/* Progress Bar - Mobile Friendly */}
          <div className="sm:hidden bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Overall Progress: {stats.completedTasks}/{stats.totalTasks}
              </span>
              <span className="text-sm font-semibold text-blue-600">
                {completionRate}%
              </span>
            </div>
          </div>
        </div>
        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="group relative bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 overflow-hidden"
              >
                {/* Background gradient */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
                ></div>

                <div className="relative flex items-center justify-between">
                  {/* Left side: Icon and title */}
                  <div className="flex items-center space-x-4">
                    <div
                      className={`hidden md:block p-2.5 rounded-lg ${stat.iconBg} group-hover:scale-110 transition-transform`}
                    >
                      <Icon className="h-5 w-5 text-gray-700" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        {stat.title}
                      </p>
                    </div>
                  </div>

                  {/* Right side: Value */}
                  <p
                    className={`text-2xl font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent`}
                  >
                    {stat.value}
                  </p>
                </div>

                {/* Hover effect line */}
                <div
                  className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${stat.gradient} transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left`}
                ></div>
              </div>
            );
          })}
        </div>

        {/* Recent Projects & Upcoming Deadlines */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Projects */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-100 to-indigo-100 px-6 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1 md:space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FolderKanban className="h-5 w-5 text-blue-600" />
                  </div>
                  <h2 className="text-lg md:text-xl font-bold text-gray-900">
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

            <div className="p-1 md:p-6 ">
              <div className="space-y-4">
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
                          {project.description && (
                            <p className="text-sm text-gray-600 mt-1 line-clamp-1">
                              {project.description}
                            </p>
                          )}
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
            <div className="bg-gradient-to-r from-purple-100 to-pink-100 px-6 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1 md:space-x-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Clock className="h-5 w-5 text-purple-600" />
                  </div>
                  <h2 className="text-lg md:text-xl font-bold text-gray-900">
                    Upcoming Deadlines
                  </h2>
                </div>
                <span className="text-xs font-semibold text-gray-600 bg-white px-3 py-1 rounded-full">
                  Next 7 days
                </span>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                {upcomingDeadlines.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Calendar className="h-8 w-8 text-purple-600" />
                    </div>
                    <p className="text-gray-500">No upcoming deadlines</p>
                  </div>
                ) : (
                  upcomingDeadlines.map((task) => (
                    <Link
                      key={task.id}
                      to={`/projects/${task.project_id}`}
                      className="group block p-4 border-2 border-gray-100 hover:border-purple-200 rounded-xl hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 transition-all"
                    >
                      <div className="flex items-start justify-between space-x-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 truncate group-hover:text-purple-600 transition-colors">
                            {task.title}
                          </h3>
                          {task.description && (
                            <p className="text-sm text-gray-600 mt-1 line-clamp-1">
                              {task.description}
                            </p>
                          )}
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
                              {task.priority?.toUpperCase() || "MEDIUM"}
                            </span>
                            <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                              {task.project?.name || "Unknown"}
                            </span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-sm font-bold text-gray-900 bg-gray-100 px-3 py-1 rounded-lg">
                            {format(new Date(task.deadline), "MMM d")}
                          </div>
                          <div className="text-xs text-gray-600 capitalize mt-1">
                            {task.status?.replace("-", " ") || "todo"}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
