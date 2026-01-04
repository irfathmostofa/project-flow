import { format } from "date-fns";
import { User, Calendar, MessageSquare, ThumbsUp, Users } from "lucide-react";
export function TaskDetails({ task, onClose, onEdit, onDelete }) {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900">Task Details</h3>
        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <div className="space-y-6">
        {/* Basic Info */}
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-500">Title</label>
            <p className="font-semibold">{task.title}</p>
          </div>

          {task.description && (
            <div>
              <label className="text-xs font-medium text-gray-500">
                Description
              </label>
              <p className="text-gray-700 whitespace-pre-line">
                {task.description}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500">
                Status
              </label>
              <p className="font-medium">
                {task.status.replace("-", " ").toUpperCase()}
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">
                Priority
              </label>
              <p className="font-medium">{task.priority.toUpperCase()}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-sm text-gray-600">
            {task.assignees && task.assignees.length > 0 ? (
              <>
                <Users className="h-4 w-4" />
                <span>
                  {task.assignees
                    .slice(0, 2)
                    .map((user) => user.full_name || user.email)
                    .join(", ")}
                  {task.assignees.length > 2 &&
                    ` +${task.assignees.length - 2}`}
                </span>
              </>
            ) : (
              <span className="text-gray-400">Unassigned</span>
            )}
          </div>

          {task.deadline && (
            <div>
              <label className="text-xs font-medium text-gray-500">
                Deadline
              </label>
              <p className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {format(new Date(task.deadline), "MMMM d, yyyy")}
              </p>
            </div>
          )}
        </div>

        {/* Suggestions */}
        {task.suggestions && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              <h4 className="font-semibold text-blue-800">Suggestions</h4>
              {task.suggestion_by_user && (
                <span className="text-xs text-blue-600 ml-auto">
                  By:{" "}
                  {task.suggestion_by_user.full_name ||
                    task.suggestion_by_user.email}
                </span>
              )}
            </div>
            <p className="text-sm text-blue-700 whitespace-pre-line">
              {task.suggestions}
            </p>
          </div>
        )}

        {/* Feedback */}
        {task.feedback && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <ThumbsUp className="h-5 w-5 text-green-600" />
              <h4 className="font-semibold text-green-800">Feedback</h4>
              <div className="ml-auto text-xs space-x-2">
                {task.feedback_by_user && (
                  <span className="text-green-600">
                    By:{" "}
                    {task.feedback_by_user.full_name ||
                      task.feedback_by_user.email}
                  </span>
                )}
                {task.feedback_date && (
                  <span className="text-green-600">
                    | {format(new Date(task.feedback_date), "MMM d, yyyy")}
                  </span>
                )}
              </div>
            </div>
            <p className="text-sm text-green-700 whitespace-pre-line">
              {task.feedback}
            </p>
          </div>
        )}

        {/* Empty state */}
        {!task.suggestions && !task.feedback && (
          <div className="text-center py-8 text-gray-500">
            <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No suggestions or feedback available for this task.</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            onClick={onEdit}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
          >
            Edit Task
          </button>
          <button
            onClick={onDelete}
            className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 text-sm font-medium"
          >
            Delete Task
          </button>
        </div>
      </div>
    </div>
  );
}
