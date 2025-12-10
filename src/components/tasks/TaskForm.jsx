import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";

export default function TaskForm({
  projectId,
  milestoneId,
  onSuccess,
  initialData = null,
}) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [milestones, setMilestones] = useState([]);
  const [users, setUsers] = useState([]);

  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    description: initialData?.description || "",
    status: initialData?.status || "todo",
    priority: initialData?.priority || "medium",
    assignee_id: initialData?.assignee_id || "",
    deadline: initialData?.deadline || "",
    milestone_id: milestoneId || initialData?.milestone_id || "",
  });

  useEffect(() => {
    if (projectId) {
      fetchMilestones();
      fetchUsers();
    }
  }, [projectId]);

  const fetchMilestones = async () => {
    const { data } = await supabase
      .from("milestones")
      .select("id, name")
      .eq("project_id", projectId)
      .order("deadline", { ascending: true });

    setMilestones(data || []);
  };

  const fetchUsers = async () => {
    const { data } = await supabase
      .from("users")
      .select("id, email, full_name")
      .order("full_name", { ascending: true });

    setUsers(data || []);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const taskData = {
        ...formData,
        project_id: projectId,
        updated_at: new Date().toISOString(),
      };

      if (initialData) {
        // Update task
        const { error } = await supabase
          .from("tasks")
          .update(taskData)
          .eq("id", initialData.id);

        if (error) throw error;
      } else {
        // Create task
        const { error } = await supabase.from("tasks").insert([
          {
            ...taskData,
            created_at: new Date().toISOString(),
          },
        ]);

        if (error) throw error;
      }

      onSuccess?.();
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Task Title *
        </label>
        <input
          type="text"
          id="title"
          name="title"
          required
          value={formData.title}
          onChange={handleChange}
          className="input w-full"
          placeholder="Enter task title"
        />
      </div>

      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows="3"
          value={formData.description}
          onChange={handleChange}
          className="input resize-none w-full"
          placeholder="Describe the task..."
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="status"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Status
          </label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="input"
          >
            <option value="todo">To Do</option>
            <option value="in-progress">In Progress</option>
            <option value="review">Review</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="priority"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Priority
          </label>
          <select
            id="priority"
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            className="input"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="milestone_id"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Milestone
          </label>
          <select
            id="milestone_id"
            name="milestone_id"
            value={formData.milestone_id}
            onChange={handleChange}
            className="input"
          >
            <option value="">No Milestone</option>
            {milestones.map((milestone) => (
              <option key={milestone.id} value={milestone.id}>
                {milestone.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="assignee_id"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Assign To
          </label>
          <select
            id="assignee_id"
            name="assignee_id"
            value={formData.assignee_id}
            onChange={handleChange}
            className="input"
          >
            <option value="">Unassigned</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.full_name || user.email}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label
          htmlFor="deadline"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Deadline
        </label>
        <input
          type="date"
          id="deadline"
          name="deadline"
          value={formData.deadline}
          onChange={handleChange}
          className="input"
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={() => onSuccess?.()}
          className="btn-secondary"
          disabled={loading}
        >
          Cancel
        </button>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? "Saving..." : initialData ? "Update Task" : "Create Task"}
        </button>
      </div>
    </form>
  );
}
