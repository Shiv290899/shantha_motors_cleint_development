// QuotationOnePage.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Row, Col, Form, Input, InputNumber, Select, Button, Typography, Radio, message,
} from "antd";
import { PrinterOutlined } from "@ant-design/icons";

const { Text, Title } = Typography;
const { Option } = Select;

// ----- Config -----
const PROCESSING_FEE = 8000;       // included in principal
const RATE_LOW = 9;                // DP ≥ 30%
const RATE_HIGH = 11;              // DP < 30%
const TENURES = [18, 24, 30, 36];  // change 30 -> 31 if needed

const phoneRule = [
  { required: true, message: "Mobile number is required" },
  { pattern: /^[6-9]\d{9}$/, message: "Enter a valid 10-digit Indian mobile number" },
];

const normalizeRow = (row = {}) => ({
  company: String(row["Company Name"] || "").trim(),
  model: String(row["Model Name"] || "").trim(),
  variant: String(row["Variant"] || "").trim(),
  onRoadPrice: Number(String(row["On-Road Price"] || "0").replace(/[,₹\s]/g, "")) || 0,
});

const inr0 = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Math.max(0, Math.round(n || 0)));

export default function QuotationOnePage() {
  const [form] = Form.useForm();

  // vehicle data
  const [bikeData, setBikeData] = useState([]);
  const [company, setCompany] = useState("");
  const [model, setModel] = useState("");
  const [variant, setVariant] = useState("");
  const [onRoadPrice, setOnRoadPrice] = useState(0);

  // mode + dp
  const [mode, setMode] = useState("cash"); // "cash" | "loan"
  const [downPayment, setDownPayment] = useState(0);

  useEffect(() => {
    fetch("/bikeData.json")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setBikeData(
            data.map(normalizeRow).filter((r) => r.company && r.model && r.variant)
          );
        } else message.error("Invalid bike data format");
      })
      .catch(() => message.error("Failed to load bike data"));
  }, []);

  const companies = useMemo(() => [...new Set(bikeData.map((r) => r.company))], [bikeData]);
  const models = useMemo(
    () => [...new Set(bikeData.filter((r) => r.company === company).map((r) => r.model))],
    [bikeData, company]
  );
  const variants = useMemo(
    () =>
      [
        ...new Set(
          bikeData.filter((r) => r.company === company && r.model === model).map((r) => r.variant)
        ),
      ],
    [bikeData, company, model]
  );

  const handleVariant = (v) => {
    setVariant(v);
    const found = bikeData.find(
      (r) => r.company === company && r.model === model && r.variant === v
    );
    const price = found?.onRoadPrice || 0;
    form.setFieldsValue({ onRoadPrice: price });
    setOnRoadPrice(price);
    setDownPayment(0);
  };

  const dpPct = onRoadPrice > 0 ? downPayment / onRoadPrice : 0;
  const rate = dpPct >= 0.3 ? RATE_LOW : RATE_HIGH;

  // **Monthly EMI only** (flat interest)
  const monthlyFor = (months) => {
    const base = Math.max(Number(onRoadPrice || 0) - Number(downPayment || 0), 0);
    const principal = base + PROCESSING_FEE;
    const years = months / 12;
    const totalInterest = principal * (rate / 100) * years;
    const total = principal + totalInterest;
    return months > 0 ? total / months : 0;
  };

  const handlePrint = () => {
    const { name, mobile, address } = form.getFieldsValue();
    if (!name || !mobile || !address || !company || !model || !variant || !onRoadPrice) {
      message.warning("Fill all details before printing.");
      return;
    }
    window.print();
  };

  return (
    <>
      {/* ====== Print-only styles to guarantee ONE A4 page ====== */}
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 10mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          body * { visibility: hidden; }
          .print-sheet, .print-sheet * { visibility: visible !important; }
          .print-sheet { position: absolute; inset: 0; margin: 0; }

          /* fit everything comfortably on one page */
          .sheet {
            width: 190mm;            /* 210 - margins */
            min-height: 277mm;       /* 297 - margins */
            font: 11pt/1.25 "Helvetica Neue", Arial, sans-serif;
            color: #111;
          }
          .row { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 12px; }
          .row-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px 12px; }
          .box { border: 1px solid #bbb; border-radius: 6px; padding: 6px 8px; }
          .title { font-size: 14pt; font-weight: 700; }
          .sub { font-weight: 600; margin-bottom: 4px; }
          .addr { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
          .emi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
          .emi { border: 1px solid #bbb; border-radius: 6px; padding: 8px 6px; text-align: center; }
          .emi .m { font-weight: 600; }
          .emi .v { font-weight: 700; font-size: 13pt; }

          /* Hide all on-screen controls */
          .no-print { display: none !important; }
        }

        /* On-screen layout (minimal, not printed) */
        .no-print { margin-bottom: 12px; }
        .screen-form { max-width: 980px; margin: 12px auto; }
        .emi-grid { display: grid; grid-template-columns: repeat(4, minmax(140px, 1fr)); gap: 8px; }
        .emi { border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px; text-align: center; }
        .emi .m { font-weight: 600; }
        .emi .v { font-weight: 700; font-size: 18px; }
      `}</style>

      {/* ---------- Minimal on-screen inputs (won't print) ---------- */}
      <div className="screen-form no-print">
        <Form layout="vertical" form={form}>
          <Row gutter={[12, 8]}>
            <Col xs={24} md={12}>
              <Form.Item label="Name" name="name" rules={[{ required: true, message: "Enter name" }]}>
                <Input placeholder="Customer name" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="Mobile Number"
                name="mobile"
                rules={phoneRule}
                normalize={(v) => (v ? v.replace(/\D/g, "").slice(0, 10) : v)}
              >
                <Input placeholder="10-digit mobile" maxLength={10} />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="Address" name="address" rules={[{ required: true, message: "Enter address" }]}>
                <Input.TextArea rows={2} placeholder="House No, Street, Area, City, PIN" />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item label="Company" name="company" rules={[{ required: true, message: "Select company" }]}>
                <Select
                  placeholder="Select Company"
                  onChange={(val) => {
                    setCompany(val);
                    setModel("");
                    setVariant("");
                    setOnRoadPrice(0);
                    setDownPayment(0);
                    form.setFieldsValue({ bikeModel: undefined, variant: undefined, onRoadPrice: undefined });
                  }}
                >
                  {companies.map((c) => <Option key={c} value={c}>{c}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Model" name="bikeModel" rules={[{ required: true, message: "Select model" }]}>
                <Select
                  placeholder="Select Model"
                  disabled={!company}
                  onChange={(val) => {
                    setModel(val);
                    setVariant("");
                    setOnRoadPrice(0);
                    setDownPayment(0);
                    form.setFieldsValue({ variant: undefined, onRoadPrice: undefined });
                  }}
                >
                  {models.map((m) => <Option key={m} value={m}>{m}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Variant" name="variant" rules={[{ required: true, message: "Select variant" }]}>
                <Select
                  placeholder="Select Variant"
                  disabled={!model}
                  onChange={handleVariant}
                >
                  {variants.map((v) => <Option key={v} value={v}>{v}</Option>)}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item label="On-Road Price (₹)" name="onRoadPrice">
                <InputNumber readOnly style={{ width: "100%" }} value={onRoadPrice}
                  formatter={(val) => `₹ ${String(val ?? "0").replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Payment Mode">
                <Radio.Group
                  optionType="button"
                  buttonStyle="solid"
                  value={mode}
                  onChange={(e) => setMode(e.target.value)}
                >
                  <Radio.Button value="cash">Cash</Radio.Button>
                  <Radio.Button value="loan">Loan</Radio.Button>
                </Radio.Group>
              </Form.Item>
            </Col>

            {mode === "loan" && (
              <>
                <Col xs={24} md={12}>
                  <Form.Item label="Down Payment (₹)">
                    <InputNumber
                      style={{ width: "100%" }}
                      min={0}
                      max={onRoadPrice}
                      step={1000}
                      value={downPayment}
                      onChange={(v) => setDownPayment(Math.min(Number(v || 0), onRoadPrice || 0))}
                      formatter={(val) => `₹ ${String(val ?? "0").replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`}
                      parser={(val) => String(val || "0").replace(/[₹,\s,]/g, "")}
                    />
                  </Form.Item>
                </Col>
              </>
            )}
           

            <Col span={24} style={{ textAlign: "right" }}>
              <Button type="primary" icon={<PrinterOutlined />} onClick={handlePrint}>
                Print
              </Button>
            </Col>
          </Row>
        </Form>
      </div>
      

      {/* ---------- PRINT SLIP (one page) ---------- */}
      <div className="print-sheet">
        <div className="sheet">
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "8px" }}>
            <div className="title">Shantha Motors</div>
            <div className="title">Quotation</div>
          </div>

          <div
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "12px",
    borderBottom: "2px solid #ccc",
    paddingBottom: "8px"
  }}
>
  {/* Left Side - Company Info */}
  <div>
    <img
      src="/shantha-logo.png"
      alt="Shantha Motors Logo"
      style={{ height: "50px", marginBottom: "4px" }}
    />

    
    <div style={{ fontSize: "20px", fontWeight: "bold" }}>Shantha Motors</div>
    <div style={{ fontSize: "12px" }}>Muddinapalya Rd, MPM Layout, ITI Employees Layout, Annapurneshwari Nagar, Bengaluru, Karnataka 560091</div>
    <div style={{ fontSize: "12px" }}>📞 9731366291/ 8073283502 | ✉ shanthamotors@gmail.com</div>
  </div>

  {/* Right Side - Quotation Info */}
  <div style={{ textAlign: "right" }}>
    <div style={{ fontSize: "12px" }}>Date: {new Date().toLocaleDateString("en-IN")}</div>
    <div style={{ fontSize: "12px" }}>Valid Until: 30 days</div>
  </div>
</div>




          {/* Customer */}
          <div className="box" style={{ marginBottom: 8 }}>
            <div className="sub">Customer Details</div>
            <div className="row">
              <div><b>Name:</b> {form.getFieldValue("name") || "-"}</div>
              <div><b>Mobile:</b> {form.getFieldValue("mobile") || "-"}</div>
              <div className="addr" style={{ gridColumn: "1 / span 2" }}>
                <b>Address:</b> {form.getFieldValue("address") || "-"}
              </div>
            </div>
          </div>

          {/* Vehicle */}
          <div className="box" style={{ marginBottom: 8 }}>
            <div className="sub">Vehicle Details</div>
            <div className="row-3">
              <div><b>Company:</b> {company || "-"}</div>
              <div><b>Model:</b> {model || "-"}</div>
              <div><b>Variant:</b> {variant || "-"}</div>
            </div>
            <div className="row" style={{ marginTop: 4 }}>
              <div><b>On-Road Price:</b> {onRoadPrice ? inr0(onRoadPrice) : "-"}</div>
              <div><b>Payment Mode:</b> {mode.toUpperCase()}</div>
            </div>
          </div>

          {/* Loan-only inline EMI */}
          {mode === "loan" && (
            <div className="box" style={{ marginBottom: 8 }}>
              <div className="sub">Loan Details</div>
              <div className="row" style={{ marginBottom: 4 }}>
                <div><b>Down Payment:</b> {inr0(downPayment || 0)}</div>
            </div>

              {/* Monthly EMIs only, side-by-side */}
              <div className="emi-grid">
                {TENURES.map((mo) => (
                  <div key={mo} className="emi">
                    <div className="m">{mo} months</div>
                    <div className="v">{inr0(monthlyFor(mo))}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer / note row kept tiny to avoid second page */}
          <div style={{ fontSize: "9pt", marginTop: 6, display: "flex", justifyContent: "space-between" }}>
            <div>Date: {new Date().toLocaleDateString("en-IN")}</div>
          </div>
        </div>
      </div>
    </>
  );
}
