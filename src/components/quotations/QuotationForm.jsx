// components/quotations/QuotationForm.jsx
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import {
  Plus,
  Trash2,
  Calculator,
  Calendar,
  DollarSign,
  FileText,
  Users,
  Globe,
  Clock,
} from "lucide-react";

export default function QuotationForm({ projectId, initialData, onSuccess }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [project, setProject] = useState(null);

  const [formData, setFormData] = useState({
    quote_number: initialData?.quote_number || "",
    client_name: initialData?.client_name || "",
    client_email: initialData?.client_email || "",
    client_phone: initialData?.client_phone || "",
    project_name: initialData?.project_name || "",
    project_overview: initialData?.project_overview || "",
    scope_of_work: initialData?.scope_of_work || "",
    vision_support: initialData?.vision_support || "",
    terms_and_conditions: initialData?.terms_and_conditions || "",
    valid_from:
      initialData?.valid_from || new Date().toISOString().split("T")[0],
    valid_until: initialData?.valid_until || "",
    payment_terms: initialData?.payment_terms || "",
    currency: initialData?.currency || "BDT",
    notes: initialData?.notes || "",
    training_included: initialData?.training_included || false,
    training_details: initialData?.training_details || "",
    support_months: initialData?.support_months || 3,
  });

  // Initialize lineItems safely with proper structure
  const [lineItems, setLineItems] = useState(() => {
    if (
      initialData?.quotation_line_items &&
      initialData.quotation_line_items.length > 0
    ) {
      return initialData.quotation_line_items.map((item) => ({
        description: item.description || "",
        quantity: item.quantity || 1,
        unit_price: item.unit_price || 0,
        line_total:
          item.line_total || (item.quantity || 1) * (item.unit_price || 0),
        category: item.category || "development",
      }));
    }
    return [
      {
        description: "",
        quantity: 1,
        unit_price: 0,
        line_total: 0,
        category: "development",
      },
    ];
  });

  const [recurringItems, setRecurringItems] = useState(() => {
    if (
      initialData?.recurring_items &&
      initialData.recurring_items.length > 0
    ) {
      return initialData.recurring_items;
    }
    return [];
  });

  // Fetch existing line items when editing
  useEffect(() => {
    if (initialData?.id) {
      fetchLineItems(initialData.id);
      fetchRecurringItems(initialData.id);
    }
  }, [initialData?.id]);

  useEffect(() => {
    if (projectId) {
      fetchProject();
    }
    if (!initialData) {
      generateQuoteNumber();
    }
  }, [projectId]);

  const fetchLineItems = async (quotationId) => {
    try {
      const { data, error } = await supabase
        .from("quotation_line_items")
        .select("*")
        .eq("quotation_id", quotationId)
        .order("display_order", { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        const formattedItems = data.map((item) => ({
          description: item.description || "",
          quantity: item.quantity || 1,
          unit_price: item.unit_price || 0,
          line_total:
            item.line_total || (item.quantity || 1) * (item.unit_price || 0),
          category: item.category || "development",
        }));
        setLineItems(formattedItems);
      }
    } catch (error) {
      console.error("Error fetching line items:", error);
    }
  };

  const fetchRecurringItems = async (quotationId) => {
    try {
      const { data, error } = await supabase
        .from("quotation_recurring_items")
        .select("*")
        .eq("quotation_id", quotationId)
        .order("display_order", { ascending: true });

      if (error) throw error;
      if (data && data.length > 0) {
        setRecurringItems(data);
      }
    } catch (error) {
      console.error("Error fetching recurring items:", error);
    }
  };

  const fetchProject = async () => {
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("name, client_name, client_email")
        .eq("id", projectId)
        .single();

      if (error) throw error;
      setProject(data);

      // Auto-fill client info from project (only for new quotations)
      if (data && !initialData) {
        setFormData((prev) => ({
          ...prev,
          client_name: data.client_name || prev.client_name,
          client_email: data.client_email || prev.client_email,
          project_name: data.name || prev.project_name,
        }));
      }
    } catch (error) {
      console.error("Error fetching project:", error);
    }
  };

  const generateQuoteNumber = async () => {
    const year = new Date().getFullYear();
    const { data } = await supabase
      .from("quotations")
      .select("quote_number")
      .order("created_at", { ascending: false })
      .limit(1);

    let nextNum = 1;
    if (data && data.length > 0 && data[0].quote_number) {
      const parts = data[0].quote_number.split("-");
      if (parts.length >= 3) {
        const lastNum = parseInt(parts[2]);
        nextNum = isNaN(lastNum) ? 1 : lastNum + 1;
      }
    }

    setFormData((prev) => ({
      ...prev,
      quote_number: `QT-${year}-${String(nextNum).padStart(3, "0")}`,
    }));
  };

  const updateLineItem = (index, field, value) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index] };
    updated[index][field] = value;

    if (field === "quantity" || field === "unit_price") {
      const quantity = updated[index].quantity || 0;
      const unitPrice = updated[index].unit_price || 0;
      updated[index].line_total = quantity * unitPrice;
    }

    setLineItems(updated);
  };

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      {
        description: "",
        quantity: 1,
        unit_price: 0,
        line_total: 0,
        category: "development",
      },
    ]);
  };

  const removeLineItem = (index) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index));
    }
  };

  const updateRecurringItem = (index, field, value) => {
    const updated = [...recurringItems];
    updated[index] = { ...updated[index], [field]: value };
    setRecurringItems(updated);
  };

  const addRecurringItem = () => {
    setRecurringItems([
      ...recurringItems,
      {
        description: "",
        amount: 0,
        frequency: "annual",
        display_order: recurringItems.length,
      },
    ]);
  };

  const removeRecurringItem = (index) => {
    setRecurringItems(recurringItems.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    const developmentTotal = lineItems.reduce(
      (sum, item) => sum + (item.line_total || 0),
      0,
    );
    const recurringTotal = recurringItems.reduce(
      (sum, item) => sum + (item.amount || 0),
      0,
    );
    return developmentTotal + recurringTotal;
  };

  const handleDateChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value === "" ? null : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!formData.client_name) throw new Error("Client name is required");

      const validLineItems = lineItems.filter(
        (item) => item.description && item.description.trim(),
      );

      if (validLineItems.length === 0) {
        throw new Error("At least one line item with description is required");
      }

      const totalAmount = calculateTotal();

      const quotationData = {
        project_id: projectId,
        quote_number: formData.quote_number,
        created_by: user.id,
        client_name: formData.client_name,
        client_email: formData.client_email || null,
        client_phone: formData.client_phone || null,
        total_amount: totalAmount,
        currency: formData.currency,
        status: "draft",
        valid_from: formData.valid_from || null,
        valid_until: formData.valid_until || null,
        payment_terms: formData.payment_terms || null,
        terms_and_conditions: formData.terms_and_conditions || null,
        project_name: formData.project_name || null,
        project_overview: formData.project_overview || null,
        scope_of_work: formData.scope_of_work || null,
        vision_support: formData.vision_support || null,
        training_included: formData.training_included,
        training_details: formData.training_details || null,
        support_months: formData.support_months,
        notes: formData.notes || null,
      };

      let quotationId;

      if (initialData) {
        // Update existing quotation
        const { error } = await supabase
          .from("quotations")
          .update(quotationData)
          .eq("id", initialData.id);

        if (error) throw error;
        quotationId = initialData.id;

        // Delete existing line items and recurring items
        await supabase
          .from("quotation_line_items")
          .delete()
          .eq("quotation_id", quotationId);
        await supabase
          .from("quotation_recurring_items")
          .delete()
          .eq("quotation_id", quotationId);
      } else {
        // Create new quotation
        const { data, error } = await supabase
          .from("quotations")
          .insert([quotationData])
          .select()
          .single();

        if (error) throw error;
        quotationId = data.id;
      }

      // Insert line items
      if (validLineItems.length > 0) {
        const lineItemsData = validLineItems.map((item, index) => ({
          quotation_id: quotationId,
          description: item.description,
          quantity: item.quantity || 1,
          unit_price: item.unit_price || 0,
          line_total: (item.quantity || 1) * (item.unit_price || 0),
          category: item.category || "development",
          display_order: index,
        }));

        const { error: lineError } = await supabase
          .from("quotation_line_items")
          .insert(lineItemsData);

        if (lineError) throw lineError;
      }

      // Insert recurring items
      const validRecurringItems = recurringItems.filter(
        (item) =>
          item.description && item.description.trim() && item.amount > 0,
      );

      if (validRecurringItems.length > 0) {
        const recurringItemsData = validRecurringItems.map((item, index) => ({
          quotation_id: quotationId,
          description: item.description,
          amount: item.amount,
          frequency: item.frequency || "annual",
          display_order: index,
        }));

        const { error: recurringError } = await supabase
          .from("quotation_recurring_items")
          .insert(recurringItemsData);

        if (recurringError) throw recurringError;
      }

      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = calculateTotal();

  // Safe number formatter
  const formatNumber = (value) => {
    if (value === undefined || value === null) return "0";
    return value.toLocaleString();
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

      {/* Header Information */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quote Number
            </label>
            <input
              type="text"
              value={formData.quote_number || ""}
              disabled
              className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg font-mono"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date
            </label>
            <input
              type="date"
              value={formData.valid_from || ""}
              onChange={(e) => handleDateChange("valid_from", e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Client Information */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Users className="h-5 w-5" />
          Client Information
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Client Name *
            </label>
            <input
              type="text"
              value={formData.client_name || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  client_name: e.target.value,
                }))
              }
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Client Email
            </label>
            <input
              type="email"
              value={formData.client_email || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  client_email: e.target.value,
                }))
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Client Phone
            </label>
            <input
              type="tel"
              value={formData.client_phone || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  client_phone: e.target.value,
                }))
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project Name
            </label>
            <input
              type="text"
              value={formData.project_name || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  project_name: e.target.value,
                }))
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Rest of the form remains the same but with safe formatting */}

      {/* Line Items - Fixed the toLocaleString error */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Development Costs
          </h3>
          <button
            type="button"
            onClick={addLineItem}
            className="px-3 py-1.5 text-sm bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100"
          >
            <Plus className="h-4 w-4 inline mr-1" />
            Add Item
          </button>
        </div>

        <div className="space-y-3">
          {lineItems.map((item, index) => (
            <div key={index} className="flex gap-3 items-start">
              <input
                type="text"
                placeholder="Description"
                value={item?.description || ""}
                onChange={(e) =>
                  updateLineItem(index, "description", e.target.value)
                }
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
              />
              <input
                type="number"
                placeholder="Qty"
                value={item?.quantity || 1}
                onChange={(e) =>
                  updateLineItem(
                    index,
                    "quantity",
                    parseFloat(e.target.value) || 0,
                  )
                }
                className="w-24 px-4 py-2 border border-gray-300 rounded-lg"
              />
              <input
                type="number"
                placeholder="Unit Price"
                value={item?.unit_price || 0}
                onChange={(e) =>
                  updateLineItem(
                    index,
                    "unit_price",
                    parseFloat(e.target.value) || 0,
                  )
                }
                className="w-32 px-4 py-2 border border-gray-300 rounded-lg"
              />
              <div className="w-32 px-4 py-2 bg-gray-50 rounded-lg font-medium">
                {formData.currency} {formatNumber(item?.line_total || 0)}
              </div>
              <button
                type="button"
                onClick={() => removeLineItem(index)}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Financial Summary - Fixed toLocaleString error */}
      <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Financial Summary
        </h3>

        <div className="space-y-2 mb-4">
          {lineItems
            .filter((item) => item?.description)
            .map((item, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span>{item.description}</span>
                <span>
                  {formData.currency} {formatNumber(item?.line_total || 0)}
                </span>
              </div>
            ))}
          {recurringItems
            .filter((item) => item?.description && item?.amount > 0)
            .map((item, index) => (
              <div
                key={`recurring-${index}`}
                className="flex justify-between text-sm text-gray-600"
              >
                <span>
                  {item.description} ({item.frequency})
                </span>
                <span>
                  {formData.currency} {formatNumber(item?.amount || 0)}
                </span>
              </div>
            ))}
        </div>

        <div className="border-t border-gray-300 pt-3">
          <div className="flex justify-between font-bold text-lg">
            <span>Total Investment</span>
            <span className="text-purple-600">
              {formData.currency} {formatNumber(totalAmount)}
            </span>
          </div>
        </div>
      </div>

      {/* Rest of the form components remain the same */}

      {/* Valid Until Date */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Validity Period
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Valid From
            </label>
            <input
              type="date"
              value={formData.valid_from || ""}
              onChange={(e) => handleDateChange("valid_from", e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Valid Until
            </label>
            <input
              type="date"
              value={formData.valid_until || ""}
              onChange={(e) => handleDateChange("valid_until", e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Vision & Support */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Vision & Post-Launch Support
        </h3>

        <div className="mb-4">
          <label className="flex items-center gap-2 mb-3">
            <input
              type="checkbox"
              checked={formData.training_included}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  training_included: e.target.checked,
                }))
              }
              className="h-4 w-4 text-purple-600 rounded"
            />
            <span className="font-medium">Include Training Session</span>
          </label>

          {formData.training_included && (
            <textarea
              value={formData.training_details || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  training_details: e.target.value,
                }))
              }
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              placeholder="Describe the training details..."
            />
          )}
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Support Duration (months)
          </label>
          <input
            type="number"
            value={formData.support_months}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                support_months: parseInt(e.target.value) || 0,
              }))
            }
            className="w-32 px-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <textarea
          value={formData.vision_support || ""}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, vision_support: e.target.value }))
          }
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          placeholder="Describe the vision and post-launch support..."
        />
      </div>

      {/* Payment Terms */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Payment Terms
        </h3>
        <textarea
          value={formData.payment_terms || ""}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, payment_terms: e.target.value }))
          }
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          placeholder="e.g., 50% advance to start, 50% upon successful handover"
        />
      </div>

      {/* Terms & Conditions */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Terms & Conditions
        </h3>
        <textarea
          value={formData.terms_and_conditions || ""}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              terms_and_conditions: e.target.value,
            }))
          }
          rows={6}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          placeholder="List your terms and conditions..."
        />
      </div>

      {/* Notes */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Additional Notes
        </h3>
        <textarea
          value={formData.notes || ""}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, notes: e.target.value }))
          }
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          placeholder="Any additional notes..."
        />
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
          className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
        >
          {loading
            ? "Saving..."
            : initialData
              ? "Update Quotation"
              : "Create Quotation"}
        </button>
      </div>
    </form>
  );
}
