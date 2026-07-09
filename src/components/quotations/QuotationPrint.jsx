// components/quotations/QuotationPrint.jsx
import React from "react";
import { format } from "date-fns";

const QuotationPrint = React.forwardRef(
  ({ quotation, lineItems, recurringItems, companySettings }, ref) => {
    const developmentTotal =
      lineItems?.reduce((sum, item) => sum + (item.line_total || 0), 0) || 0;
    const recurringTotal =
      recurringItems?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;
    const totalAmount =
      quotation?.total_amount || developmentTotal + recurringTotal;

    // Format date like "April 29, 2024"
    const formattedDate = quotation?.valid_from
      ? format(new Date(quotation.valid_from), "MMMM d, yyyy")
      : format(new Date(), "MMMM d, yyyy");

    // Use company settings from database or fallback defaults
    const company = companySettings || {};

    return (
      <div
        ref={ref}
        className="p-8 bg-white"
        style={{
          width: "210mm",
          minHeight: "297mm",
          fontFamily: "Arial, sans-serif",
        }}
      >
        {/* Header - OFFICIAL QUOTATION */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-1">
            OFFICIAL QUOTATION
          </h1>
          <div className="border-b-2 border-purple-600 w-24 mx-auto"></div>
        </div>

        {/* Company Info - From company_settings table */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold">
            {company.company_name || "Md. Irfath Chowdhury"}
          </h2>
          <p className="text-gray-700">
            {company.company_title || "Full Stack Developer"}
          </p>
          <p className="text-gray-600">
            {company.company_address || "Hathazari, Chittagong"}
          </p>
          <p className="text-gray-600">
            Phone: {company.company_phone || "01941637656"} | Email:{" "}
            {company.company_email || "irfathmostofa1@gmail.com"}
          </p>
          {company.company_website && (
            <p className="text-gray-600">Website: {company.company_website}</p>
          )}
        </div>

        {/* Date and Quote ID - Two column layout like image */}
        <div className="flex justify-between mb-6 pb-2 border-b border-gray-300">
          <div>
            <p className="text-gray-700">
              <span className="font-semibold">Date:</span> {formattedDate}
            </p>
          </div>
          <div>
            <p className="text-gray-700">
              <span className="font-semibold">Quote ID:</span>{" "}
              {quotation?.quote_number}
            </p>
          </div>
        </div>

        {/* Quotation For and Project - Like image format */}
        <div className="mb-6">
          <p className="text-gray-700">
            <span className="font-semibold">Quotation For:</span>{" "}
            {quotation?.client_name}
          </p>
          <p className="text-gray-700">
            <span className="font-semibold">Project:</span>{" "}
            {quotation?.project_name || "Website Development & SEO"}
          </p>
        </div>

        {/* Project Overview Section */}
        <div className="mb-5">
          <h3 className="font-bold text-gray-800 mb-2">Project Overview</h3>
          <p className="text-gray-700 leading-relaxed">
            {quotation?.project_overview ||
              "Professional WordPress website development for TeklaBD, focusing on course management, blogging, and service showcases with integrated SEO support to ensure digital visibility and growth."}
          </p>
        </div>

        {/* Scope of Work Section */}
        <div className="mb-5">
          <h3 className="font-bold text-gray-800 mb-2">Scope of Work</h3>
          <div className="text-gray-700 leading-relaxed">
            {quotation?.scope_of_work ? (
              <div className="whitespace-pre-line">
                {quotation.scope_of_work}
              </div>
            ) : (
              <div>
                <p>
                  - WordPress Development: Responsive design, LMS integration
                  for courses, and "Add Service" module.
                </p>
                <p>
                  - SEO Support: On-page optimization, meta-tagging, and Google
                  Search Console indexing.
                </p>
                <p>
                  - Content Management: Professional blog setup and service
                  posting architecture.
                </p>
                <p>
                  - Infrastructure: Domain registration and high-performance
                  WordPress hosting.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Financial Summary Table - Matching Image Format */}
        <div className="mb-6">
          <h3 className="font-bold text-gray-800 mb-3">Financial Summary</h3>
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-4 py-2 text-left font-semibold">
                  Description
                </th>
                <th className="border border-gray-300 px-4 py-2 text-right font-semibold">
                  Amount ({quotation?.currency || "BDT"})
                </th>
              </tr>
            </thead>
            <tbody>
              {lineItems
                ?.filter((item) => item.description)
                .map((item, index) => (
                  <tr key={index}>
                    <td className="border border-gray-300 px-4 py-2">
                      {item.description} (Qty: {item.quantity})
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-right">
                      {item.line_total?.toLocaleString()}.00
                    </td>
                  </tr>
                ))}
              {recurringItems
                ?.filter((item) => item.description)
                .map((item, index) => (
                  <tr key={`recurring-${index}`} className="bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2">
                      {item.description} ({item.frequency})
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-right">
                      {item.amount?.toLocaleString()}.00
                    </td>
                  </tr>
                ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-100 font-bold">
                <td className="border border-gray-300 px-4 py-2 text-right">
                  Total Investment
                </td>
                <td className="border border-gray-300 px-4 py-2 text-right">
                  {quotation?.currency || "BDT"} {totalAmount.toLocaleString()}
                  .00
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Vision & Post-Launch Support - Matching Image Format */}
        <div className="mb-5">
          <h3 className="font-bold text-gray-800 mb-2">
            Vision & Post-Launch Support
          </h3>
          {quotation?.training_included && (
            <div className="mb-2">
              <p className="font-semibold">Training:</p>
              <p className="text-gray-700">
                {quotation?.training_details ||
                  "I will provide a comprehensive training session on managing courses, publishing SEO-friendly blogs, and updating services independently."}
              </p>
            </div>
          )}
          <div className="mb-2">
            <p className="font-semibold">Long-term Plan:</p>
            <p className="text-gray-700">
              {quotation?.vision_support ||
                "The site is built for scalability, allowing future upgrades for higher traffic and advanced automated features."}
            </p>
          </div>
          {!quotation?.training_included && (
            <div className="mt-2">
              <p className="font-semibold">Training:</p>
              <p className="text-gray-700">
                I will provide a comprehensive training session on managing
                courses, publishing SEO-friendly blogs, and updating services
                independently.
              </p>
            </div>
          )}
        </div>

        {/* Terms & Conditions - Matching Image Format */}
        <div className="mb-5">
          <h3 className="font-bold text-gray-800 mb-2">Terms & Conditions</h3>
          <div className="text-gray-700 leading-relaxed">
            {quotation?.terms_and_conditions ? (
              <div className="whitespace-pre-line">
                {quotation.terms_and_conditions}
              </div>
            ) : (
              <div>
                <p>
                  - Payment: 50% advance to start, 50% upon successful handover.
                </p>
                <p>
                  - Renewal: Domain and Server costs are recurring annually.
                </p>
                <p>
                  - Support: Includes {quotation?.support_months || 3} months of
                  technical support for bug fixes and layout adjustments.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer - Matching Image Format */}
        <div className="mt-8 pt-4 text-center">
          <p className="text-gray-700">
            Thank you for your business! If you have any questions, feel free to
            contact me.
          </p>
        </div>
      </div>
    );
  },
);

QuotationPrint.displayName = "QuotationPrint";

export default QuotationPrint;
