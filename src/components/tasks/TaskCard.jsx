import {
  CheckCircle,
  Circle,
  Clock,
  AlertCircle,
  Edit,
  Trash2,
  User,
  Calendar,
} from "lucide-react";
import { format } from "date-fns";

export default function TaskCard({
  task,
  onEdit,
  onDelete,
  onStatusChange,
  compact = false,
}) {
  const statusIcons = {
    completed: <CheckCircle className="h-5 w-5 text-green-500" />,
    "in-progress": <Clock className="h-5 w-5 text-blue-500" />,
    review: <AlertCircle className="h-5 w-5 text-yellow-500" />,
    todo: <Circle className="h-5 w-5 text-gray-400" />,
  };

  const priorityColors = {
    urgent: "bg-red-100 text-red-800",
    high: "bg-orange-100 text-orange-800",
    medium: "bg-yellow-100 text-yellow-800",
    low: "bg-green-100 text-green-800",
  };

  const statusColors = {
    completed: "bg-green-100 text-green-800",
    "in-progress": "bg-blue-100 text-blue-800",
    review: "bg-yellow-100 text-yellow-800",
    todo: "bg-gray-100 text-gray-800",
  };

  if (compact) {
    return (
      <div className="bg-white p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 min-w-0">
            <button
              onClick={() =>
                onStatusChange?.(
                  task.id,
                  task.status === "completed" ? "todo" : "completed"
                )
              }
              className="flex-shrink-0"
              aria-label={
                task.status === "completed"
                  ? "Mark as todo"
                  : "Mark as completed"
              }
            >
              {statusIcons[task.status]}
            </button>

            <div className="min-w-0 flex-1">
              <h4
                className={`text-sm font-medium truncate ${
                  task.status === "completed"
                    ? "line-through text-gray-500"
                    : "text-gray-900"
                }`}
              >
                {task.title}
              </h4>
              <div className="flex items-center space-x-2 mt-1">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    priorityColors[task.priority]
                  }`}
                >
                  {task.priority}
                </span>
                {task.deadline && (
                  <span className="text-xs text-gray-500 flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    {format(new Date(task.deadline), "MMM d")}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex space-x-1 ml-2">
            <button
              onClick={() => onEdit?.(task)}
              className="p-1 text-gray-500 hover:text-blue-600"
              title="Edit"
            >
              <Edit className="h-3 w-3" />
            </button>
            <button
              onClick={() => onDelete?.(task.id)}
              className="p-1 text-gray-500 hover:text-red-600"
              title="Delete"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 min-w-0">
          <button
            onClick={() =>
              onStatusChange?.(
                task.id,
                task.status === "completed" ? "todo" : "completed"
              )
            }
            className="mt-1 flex-shrink-0"
            aria-label={
              task.status === "completed" ? "Mark as todo" : "Mark as completed"
            }
          >
            {statusIcons[task.status]}
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h4
                className={`font-medium truncate ${
                  task.status === "completed"
                    ? "line-through text-gray-500"
                    : "text-gray-900"
                }`}
              >
                {task.title}
              </h4>
              <span className={`badge ${priorityColors[task.priority]}`}>
                {task.priority}
              </span>
              <span className={`badge ${statusColors[task.status]}`}>
                {task.status.replace("-", " ")}
              </span>
            </div>

            {task.description && (
              <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                {task.description}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500">
              {task.assignee && (
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-1" />
                  <span className="truncate">
                    {task.assignee.full_name || task.assignee.email}
                  </span>
                </div>
              )}

              {task.deadline && (
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>
                    Due: {format(new Date(task.deadline), "MMM d, yyyy")}
                  </span>
                </div>
              )}

              {task.milestone && (
                <div className="flex items-center">
                  <span className="badge bg-purple-100 text-purple-800">
                    {task.milestone.name}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex space-x-1 ml-2">
          <button
            onClick={() => onEdit?.(task)}
            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
            title="Edit"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete?.(task.id)}
            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="flex flex-wrap gap-2">
          {["todo", "in-progress", "review", "completed"].map((status) => (
            <button
              key={status}
              onClick={() => onStatusChange?.(task.id, status)}
              className={`text-xs px-3 py-1 rounded-full capitalize ${
                task.status === status
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {status.replace("-", " ")}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
