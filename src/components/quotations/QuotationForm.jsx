// components/quotations/QuotationForm.jsx
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import { Plus, Trash2, Calculator, Calendar, DollarSign } from "lucide-react";

export default function QuotationForm({ initialData, projects, onSuccess }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    project_id: initialData?.project_id || "",
    client_name: initialData?.client_name || "",
    client_email: initialData?.client_email || "",
    client_phone: initialData?.client_phone || "",
    valid_from:
      initialData?.valid_from || new Date().toISOString().split("T")[0],
    valid_until: initialData?.valid_until || "",
    payment_terms: initialData?.payment_terms || "",
    terms_and_conditions: initialData?.terms_and_conditions || "",
    currency: initialData?.currency || "BDT",
  });

  const [lineItems, setLineItems] = useState(
    initialData?.quotation_line_items || [
      { description: "", quantity: 1, unit_price: 0, line_total: 0 },
    ],
  );

  const totalAmount = lineItems.reduce(
    (sum, item) => sum + (item.line_total || 0),
    0,
  );

  useEffect(() => {
    // Auto-generate quote number for new quotations
    if (!initialData) {
      generateQuoteNumber();
    }
  }, []);

  const generateQuoteNumber = async () => {
    const year = new Date().getFullYear();
    const { data } = await supabase
      .from("quotations")
      .select("quote_number")
      .order("created_at", { ascending: false })
      .limit(1);

    let nextNum = 1;
    if (data && data.length > 0) {
      const lastNum = parseInt(data[0].quote_number.split("-")[2]);
      nextNum = lastNum + 1;
    }

    setFormData((prev) => ({
      ...prev,
      quote_number: `QT-${year}-${String(nextNum).padStart(4, "0")}`,
    }));
  };

  const updateLineItem = (index, field, value) => {
    const updated = [...lineItems];
    updated[index][field] = value;

    if (field === "quantity" || field === "unit_price") {
      updated[index].line_total =
        updated[index].quantity * updated[index].unit_price;
    }

    setLineItems(updated);
  };

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      { description: "", quantity: 1, unit_price: 0, line_total: 0 },
    ]);
  };

  const removeLineItem = (index) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!formData.client_name) throw new Error("Client name is required");
      if (lineItems.length === 0)
        throw new Error("At least one line item is required");
      if (lineItems.some((item) => !item.description))
        throw new Error("All line items must have a description");

      const quotationData = {
        ...formData,
        total_amount: totalAmount,
        created_by: user.id,
        status: "draft",
      };

      let quotationId;

      if (initialData) {
        // Update existing
        const { error } = await supabase
          .from("quotations")
          .update(quotationData)
          .eq("id", initialData.id);

        if (error) throw error;
        quotationId = initialData.id;

        // Delete existing line items
        await supabase
          .from("quotation_line_items")
          .delete()
          .eq("quotation_id", quotationId);
      } else {
        // Create new
        const { data, error } = await supabase
          .from("quotations")
          .insert([quotationData])
          .select()
          .single();

        if (error) throw error;
        quotationId = data.id;
      }

      // Insert line items
      const lineItemsData = lineItems.map((item, index) => ({
        quotation_id: quotationId,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        line_total: item.line_total,
        display_order: index,
      }));

      const { error: lineError } = await supabase
        .from("quotation_line_items")
        .insert(lineItemsData);

      if (lineError) throw lineError;

      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Basic Information */}
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Project
          </label>
          <select
            value={formData.project_id}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, project_id: e.target.value }))
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          >
            <option value="">Select project (optional)</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quote Number
          </label>
          <input
            type="text"
            value={formData.quote_number}
            disabled
            className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Client Name *
          </label>
          <input
            type="text"
            value={formData.client_name}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, client_name: e.target.value }))
            }
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Client Email
          </label>
          <input
            type="email"
            value={formData.client_email}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, client_email: e.target.value }))
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Client Phone
          </label>
          <input
            type="tel"
            value={formData.client_phone}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, client_phone: e.target.value }))
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Currency
          </label>
          <select
            value={formData.currency}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, currency: e.target.value }))
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          >
            <option value="BDT">BDT (৳)</option>
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
            <option value="GBP">GBP (£)</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Valid From
          </label>
          <input
            type="date"
            value={formData.valid_from}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, valid_from: e.target.value }))
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Valid Until
          </label>
          <input
            type="date"
            value={formData.valid_until}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, valid_until: e.target.value }))
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* Line Items */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Line Items</h3>
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
                value={item.description}
                onChange={(e) =>
                  updateLineItem(index, "description", e.target.value)
                }
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
              <input
                type="number"
                placeholder="Qty"
                value={item.quantity}
                onChange={(e) =>
                  updateLineItem(
                    index,
                    "quantity",
                    parseFloat(e.target.value) || 0,
                  )
                }
                className="w-24 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
              <input
                type="number"
                placeholder="Unit Price"
                value={item.unit_price}
                onChange={(e) =>
                  updateLineItem(
                    index,
                    "unit_price",
                    parseFloat(e.target.value) || 0,
                  )
                }
                className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
              <div className="w-32 px-4 py-2 bg-gray-50 rounded-lg font-medium">
                {formData.currency} {item.line_total.toLocaleString()}
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

        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex justify-end">
            <div className="w-64">
              <div className="flex justify-between py-2">
                <span className="font-medium">Subtotal:</span>
                <span>
                  {formData.currency} {totalAmount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between py-2 border-t border-gray-200">
                <span className="font-bold">Total:</span>
                <span className="font-bold text-lg">
                  {formData.currency} {totalAmount.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Terms */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Payment Terms
        </label>
        <textarea
          value={formData.payment_terms}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, payment_terms: e.target.value }))
          }
          rows={2}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          placeholder="e.g., 50% advance, 50% after delivery"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Terms & Conditions
        </label>
        <textarea
          value={formData.terms_and_conditions}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              terms_and_conditions: e.target.value,
            }))
          }
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          placeholder="Standard terms and conditions..."
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4">
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
