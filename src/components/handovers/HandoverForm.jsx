// components/handovers/HandoverForm.jsx
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import {
  Plus,
  Trash2,
  Box,
  Key,
  GraduationCap,
  HeartHandshake,
  Users,
  Calendar,
} from "lucide-react";

export default function HandoverForm({ projects, onSuccess, initialData }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [teamMembers, setTeamMembers] = useState([]);

  const [formData, setFormData] = useState({
    project_id: initialData?.project_id || "",
    handover_number: initialData?.handover_number || "",
    delivered_by: initialData?.delivered_by || user?.id,
    received_by: initialData?.received_by || "",
    handover_date:
      initialData?.handover_date || new Date().toISOString().split("T")[0],
    status: initialData?.status || "draft",
  });

  const [deliverables, setDeliverables] = useState(
    initialData?.handover_deliverables || [
      {
        category: "Website",
        feature_name: "",
        description: "",
        status: "delivered",
      },
    ],
  );

  const [credentials, setCredentials] = useState(
    initialData?.handover_credentials || [
      {
        platform_name: "",
        username: "",
        password_encrypted: "",
        access_url: "",
      },
    ],
  );

  const [trainingSessions, setTrainingSessions] = useState(
    initialData?.handover_training_sessions || [
      {
        session_date: "",
        duration_minutes: 60,
        topic: "",
        trainer_id: "",
        trainee_id: "",
      },
    ],
  );

  const [supportTerms, setSupportTerms] = useState(
    initialData?.handover_support_terms || [
      {
        support_type: "",
        description: "",
        duration_days: 30,
        included: true,
        cost: 0,
      },
    ],
  );

  useEffect(() => {
    generateHandoverNumber();
    fetchTeamMembers();
  }, []);

  useEffect(() => {
    if (formData.project_id) {
      fetchTeamMembers();
    }
  }, [formData.project_id]);

  const generateHandoverNumber = async () => {
    const year = new Date().getFullYear();
    const { data } = await supabase
      .from("handover_documents")
      .select("handover_number")
      .order("created_at", { ascending: false })
      .limit(1);

    let nextNum = 1;
    if (data && data.length > 0) {
      const lastNum = parseInt(data[0].handover_number.split("-")[2]);
      nextNum = lastNum + 1;
    }

    setFormData((prev) => ({
      ...prev,
      handover_number: `HO-${year}-${String(nextNum).padStart(4, "0")}`,
    }));
  };

  const fetchTeamMembers = async () => {
    if (!formData.project_id) return;

    try {
      const { data: membersData } = await supabase
        .from("project_members")
        .select("user_id, users:user_id(id, full_name, email)")
        .eq("project_id", formData.project_id);

      const { data: projectData } = await supabase
        .from("projects")
        .select("owner_id")
        .eq("id", formData.project_id)
        .single();

      const members = membersData?.map((m) => m.users) || [];

      if (projectData?.owner_id) {
        const { data: ownerData } = await supabase
          .from("users")
          .select("id, full_name, email")
          .eq("id", projectData.owner_id)
          .single();
        if (ownerData) members.push(ownerData);
      }

      setTeamMembers(members);
    } catch (error) {
      console.error("Error fetching team members:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!formData.project_id) throw new Error("Please select a project");
      if (!formData.received_by)
        throw new Error("Please select who received the handover");
      if (deliverables.length === 0)
        throw new Error("At least one deliverable is required");

      let handoverId;

      if (initialData) {
        const { error } = await supabase
          .from("handover_documents")
          .update(formData)
          .eq("id", initialData.id);
        if (error) throw error;
        handoverId = initialData.id;

        // Delete existing related records
        await supabase
          .from("handover_deliverables")
          .delete()
          .eq("handover_id", handoverId);
        await supabase
          .from("handover_credentials")
          .delete()
          .eq("handover_id", handoverId);
        await supabase
          .from("handover_training_sessions")
          .delete()
          .eq("handover_id", handoverId);
        await supabase
          .from("handover_support_terms")
          .delete()
          .eq("handover_id", handoverId);
      } else {
        const { data, error } = await supabase
          .from("handover_documents")
          .insert([{ ...formData, created_at: new Date().toISOString() }])
          .select()
          .single();
        if (error) throw error;
        handoverId = data.id;
      }

      // Insert deliverables
      if (deliverables.length > 0) {
        const deliverablesData = deliverables.map((item, index) => ({
          handover_id: handoverId,
          ...item,
          display_order: index,
        }));
        await supabase.from("handover_deliverables").insert(deliverablesData);
      }

      // Insert credentials
      const validCredentials = credentials.filter((c) => c.platform_name);
      if (validCredentials.length > 0) {
        await supabase
          .from("handover_credentials")
          .insert(
            validCredentials.map((c) => ({ handover_id: handoverId, ...c })),
          );
      }

      // Insert training sessions
      const validSessions = trainingSessions.filter(
        (s) => s.topic && s.trainer_id && s.trainee_id,
      );
      if (validSessions.length > 0) {
        await supabase
          .from("handover_training_sessions")
          .insert(
            validSessions.map((s) => ({ handover_id: handoverId, ...s })),
          );
      }

      // Insert support terms
      const validSupport = supportTerms.filter((s) => s.support_type);
      if (validSupport.length > 0) {
        await supabase
          .from("handover_support_terms")
          .insert(validSupport.map((s) => ({ handover_id: handoverId, ...s })));
      }

      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-8 max-h-[80vh] overflow-y-auto px-2"
    >
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Basic Information
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project *
            </label>
            <select
              value={formData.project_id}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, project_id: e.target.value }))
              }
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Select project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Handover Number
            </label>
            <input
              type="text"
              value={formData.handover_number}
              disabled
              className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Handover Date *
            </label>
            <input
              type="date"
              value={formData.handover_date}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  handover_date: e.target.value,
                }))
              }
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Received By *
            </label>
            <select
              value={formData.received_by}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  received_by: e.target.value,
                }))
              }
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Select client representative</option>
              {teamMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.full_name || member.email}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Deliverables Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Deliverables</h3>
          <button
            type="button"
            onClick={() =>
              setDeliverables([
                ...deliverables,
                {
                  category: "",
                  feature_name: "",
                  description: "",
                  status: "delivered",
                },
              ])
            }
            className="px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-lg"
          >
            <Plus className="h-4 w-4 inline mr-1" />
            Add Deliverable
          </button>
        </div>

        {deliverables.map((item, index) => (
          <div
            key={index}
            className="border border-gray-200 rounded-lg p-4 space-y-3"
          >
            <div className="flex justify-between">
              <Box className="h-5 w-5 text-gray-400" />
              <button
                type="button"
                onClick={() =>
                  setDeliverables(deliverables.filter((_, i) => i !== index))
                }
                className="text-red-500"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <input
              type="text"
              placeholder="Category (e.g., Website, Mobile App, Documentation)"
              value={item.category}
              onChange={(e) => {
                const updated = [...deliverables];
                updated[index].category = e.target.value;
                setDeliverables(updated);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
            <input
              type="text"
              placeholder="Feature Name"
              value={item.feature_name}
              onChange={(e) => {
                const updated = [...deliverables];
                updated[index].feature_name = e.target.value;
                setDeliverables(updated);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
            <textarea
              placeholder="Description"
              value={item.description}
              onChange={(e) => {
                const updated = [...deliverables];
                updated[index].description = e.target.value;
                setDeliverables(updated);
              }}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        ))}
      </div>

      {/* Credentials Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">
            Access Credentials (Optional)
          </h3>
          <button
            type="button"
            onClick={() =>
              setCredentials([
                ...credentials,
                {
                  platform_name: "",
                  username: "",
                  password_encrypted: "",
                  access_url: "",
                },
              ])
            }
            className="px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-lg"
          >
            <Plus className="h-4 w-4 inline mr-1" />
            Add Credential
          </button>
        </div>

        {credentials.map((item, index) => (
          <div
            key={index}
            className="border border-gray-200 rounded-lg p-4 space-y-3"
          >
            <div className="flex justify-between">
              <Key className="h-5 w-5 text-gray-400" />
              <button
                type="button"
                onClick={() =>
                  setCredentials(credentials.filter((_, i) => i !== index))
                }
                className="text-red-500"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <input
              type="text"
              placeholder="Platform Name (e.g., Hosting Panel, Admin Dashboard)"
              value={item.platform_name}
              onChange={(e) => {
                const updated = [...credentials];
                updated[index].platform_name = e.target.value;
                setCredentials(updated);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
            <input
              type="text"
              placeholder="Username"
              value={item.username}
              onChange={(e) => {
                const updated = [...credentials];
                updated[index].username = e.target.value;
                setCredentials(updated);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
            <input
              type="text"
              placeholder="Password (will be encrypted)"
              value={item.password_encrypted}
              onChange={(e) => {
                const updated = [...credentials];
                updated[index].password_encrypted = e.target.value;
                setCredentials(updated);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
            <input
              type="url"
              placeholder="Access URL"
              value={item.access_url}
              onChange={(e) => {
                const updated = [...credentials];
                updated[index].access_url = e.target.value;
                setCredentials(updated);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        ))}
      </div>

      {/* Training Sessions Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">
            Training Sessions (Optional)
          </h3>
          <button
            type="button"
            onClick={() =>
              setTrainingSessions([
                ...trainingSessions,
                {
                  session_date: "",
                  duration_minutes: 60,
                  topic: "",
                  trainer_id: "",
                  trainee_id: "",
                },
              ])
            }
            className="px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-lg"
          >
            <Plus className="h-4 w-4 inline mr-1" />
            Add Session
          </button>
        </div>

        {trainingSessions.map((item, index) => (
          <div
            key={index}
            className="border border-gray-200 rounded-lg p-4 space-y-3"
          >
            <div className="flex justify-between">
              <GraduationCap className="h-5 w-5 text-gray-400" />
              <button
                type="button"
                onClick={() =>
                  setTrainingSessions(
                    trainingSessions.filter((_, i) => i !== index),
                  )
                }
                className="text-red-500"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="date"
                placeholder="Session Date"
                value={item.session_date}
                onChange={(e) => {
                  const updated = [...trainingSessions];
                  updated[index].session_date = e.target.value;
                  setTrainingSessions(updated);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg"
              />
              <input
                type="number"
                placeholder="Duration (minutes)"
                value={item.duration_minutes}
                onChange={(e) => {
                  const updated = [...trainingSessions];
                  updated[index].duration_minutes = parseInt(e.target.value);
                  setTrainingSessions(updated);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <input
              type="text"
              placeholder="Session Topic"
              value={item.topic}
              onChange={(e) => {
                const updated = [...trainingSessions];
                updated[index].topic = e.target.value;
                setTrainingSessions(updated);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
            <div className="grid grid-cols-2 gap-3">
              <select
                value={item.trainer_id}
                onChange={(e) => {
                  const updated = [...trainingSessions];
                  updated[index].trainer_id = e.target.value;
                  setTrainingSessions(updated);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Select Trainer</option>
                {teamMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.full_name || member.email}
                  </option>
                ))}
              </select>
              <select
                value={item.trainee_id}
                onChange={(e) => {
                  const updated = [...trainingSessions];
                  updated[index].trainee_id = e.target.value;
                  setTrainingSessions(updated);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Select Trainee</option>
                {teamMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.full_name || member.email}
                  </option>
                ))}
              </select>
            </div>
            <textarea
              placeholder="Notes"
              value={item.notes}
              onChange={(e) => {
                const updated = [...trainingSessions];
                updated[index].notes = e.target.value;
                setTrainingSessions(updated);
              }}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        ))}
      </div>

      {/* Support Terms Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">
            Support Terms (Optional)
          </h3>
          <button
            type="button"
            onClick={() =>
              setSupportTerms([
                ...supportTerms,
                {
                  support_type: "",
                  description: "",
                  duration_days: 30,
                  included: true,
                  cost: 0,
                  start_date: "",
                  end_date: "",
                },
              ])
            }
            className="px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-lg"
          >
            <Plus className="h-4 w-4 inline mr-1" />
            Add Support Term
          </button>
        </div>

        {supportTerms.map((item, index) => (
          <div
            key={index}
            className="border border-gray-200 rounded-lg p-4 space-y-3"
          >
            <div className="flex justify-between">
              <HeartHandshake className="h-5 w-5 text-gray-400" />
              <button
                type="button"
                onClick={() =>
                  setSupportTerms(supportTerms.filter((_, i) => i !== index))
                }
                className="text-red-500"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <input
              type="text"
              placeholder="Support Type (e.g., Technical Support, Maintenance)"
              value={item.support_type}
              onChange={(e) => {
                const updated = [...supportTerms];
                updated[index].support_type = e.target.value;
                setSupportTerms(updated);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
            <textarea
              placeholder="Description"
              value={item.description}
              onChange={(e) => {
                const updated = [...supportTerms];
                updated[index].description = e.target.value;
                setSupportTerms(updated);
              }}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-gray-600">Start Date</label>
                <input
                  type="date"
                  value={item.start_date}
                  onChange={(e) => {
                    const updated = [...supportTerms];
                    updated[index].start_date = e.target.value;
                    setSupportTerms(updated);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">End Date</label>
                <input
                  type="date"
                  value={item.end_date}
                  onChange={(e) => {
                    const updated = [...supportTerms];
                    updated[index].end_date = e.target.value;
                    setSupportTerms(updated);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                placeholder="Duration (days)"
                value={item.duration_days}
                onChange={(e) => {
                  const updated = [...supportTerms];
                  updated[index].duration_days = parseInt(e.target.value);
                  setSupportTerms(updated);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg"
              />
              <input
                type="number"
                placeholder="Cost (if applicable)"
                value={item.cost}
                onChange={(e) => {
                  const updated = [...supportTerms];
                  updated[index].cost = parseFloat(e.target.value);
                  setSupportTerms(updated);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={item.included}
                onChange={(e) => {
                  const updated = [...supportTerms];
                  updated[index].included = e.target.checked;
                  setSupportTerms(updated);
                }}
                className="h-4 w-4 text-blue-600 rounded"
              />
              <span className="text-sm text-gray-700">
                Included in package (no additional cost)
              </span>
            </label>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 sticky bottom-0 bg-white py-4 border-t">
        <button
          type="button"
          onClick={onSuccess}
          className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
        >
          {loading
            ? "Saving..."
            : initialData
              ? "Update Handover"
              : "Create Handover"}
        </button>
      </div>
    </form>
  );
}
