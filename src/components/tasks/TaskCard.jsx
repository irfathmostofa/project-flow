import { useState } from "react";
import {
  CheckCircle,
  Circle,
  Clock,
  AlertCircle,
  Edit,
  Trash2,
  User,
} from "lucide-react";
import { format } from "date-fns";

export default function TaskCard({
  task,
  onEdit,
  onDelete,
  onStatusChange,
  compact = false,
}) {
  const [isHovered, setIsHovered] = useState(false);

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

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in-progress":
        return "bg-blue-100 text-blue-800";
      case "review":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (compact) {
    return (
      <div
        className="bg-white p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() =>
                onStatusChange?.(
                  task.id,
                  task.status === "completed" ? "todo" : "completed"
                )
              }
              className="flex-shrink-0"
            >
              {getStatusIcon(task.status)}
            </button>

            <div>
              <h4
                className={`text-sm font-medium ${
                  task.status === "completed"
                    ? "line-through text-gray-500"
                    : "text-gray-900"
                }`}
              >
                {task.title}
              </h4>
              <div className="flex items-center space-x-2 mt-1">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${getPriorityColor(
                    task.priority
                  )}`}
                >
                  {task.priority}
                </span>
                {task.deadline && (
                  <span className="text-xs text-gray-500">
                    Due: {format(new Date(task.deadline), "MMM d")}
                  </span>
                )}
              </div>
            </div>
          </div>

          {isHovered && (
            <div className="flex space-x-2">
              <button
                onClick={() => onEdit?.(task)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <Edit className="h-3 w-3 text-gray-500" />
              </button>
              <button
                onClick={() => onDelete?.(task.id)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <Trash2 className="h-3 w-3 text-red-500" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <button
            onClick={() =>
              onStatusChange?.(
                task.id,
                task.status === "completed" ? "todo" : "completed"
              )
            }
            className="mt-1 flex-shrink-0"
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
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(
                  task.status
                )}`}
              >
                {task.status.replace("-", " ")}
              </span>
            </div>

            {task.description && (
              <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                {task.description}
              </p>
            )}

            <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
              {task.assignee && (
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-1" />
                  {task.assignee.full_name || task.assignee.email}
                </div>
              )}

              {task.deadline && (
                <div className="flex items-center">
                  <span>
                    Due: {format(new Date(task.deadline), "MMM d, yyyy")}
                  </span>
                </div>
              )}

              {task.milestone && (
                <div className="flex items-center">
                  <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full">
                    {task.milestone.name}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {isHovered && (
          <div className="flex space-x-2">
            <button
              onClick={() => onEdit?.(task)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <Edit className="h-4 w-4 text-gray-500" />
            </button>
            <button
              onClick={() => onDelete?.(task.id)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </button>
          </div>
        )}
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
