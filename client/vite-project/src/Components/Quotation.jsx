// QuotationOnePage.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Row, Col, Form, Input, InputNumber, Select, Button, Typography, Radio, message, Checkbox,
} from "antd";
import { PrinterOutlined } from "@ant-design/icons";

const { Text } = Typography;
const { Option } = Select;

// ----- Config -----
const PROCESSING_FEE = 8000;       // included in principal
const RATE_LOW = 9;                // DP ≥ 30%
const RATE_HIGH = 11;              // DP < 30%
const TENURES = [18, 24, 30, 36];
const VALID_DAYS = 15;

// ----- Static options (from your paper quotation) -----
const EXECUTIVES = ["Rukmini", "Radha", "Manasa", "Karthik", "Suresh"];

const EXTRA_FITTINGS = [
  "All Round Guard",
  "Side Stand",
  "Saree Guard",
  "Grip Cover",
  "Seat Cover",
  "Floor Mat",
  "ISI Helmet",
];

const MOTOR_CYCLES = [
  "Crash Guard",
  "Engine Guard",
  "Tank Cover",
  "Ladies Handle",
  "Gripper",
  "Seat Cover",
];

const DOCUMENTS_REQ = [
  "Aadhar Card",
  "Pan Card",
  "Bank Passbook",
  "ATM Card",
  "Local Address Proof",
];

// ----- Helpers -----
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

const today = () => new Date();
const fmtIN = (d) => d.toLocaleDateString("en-IN");

// --- NEW: phone + WhatsApp helpers ---
const toE164India = (raw) => {
  // Keep digits, trim leading zeros, add '91' if it's a plain 10-digit number
  const digits = String(raw || "").replace(/\D/g, "");
  if (!digits) return "";
  const noLeadZero = digits.replace(/^0+/, "");
  if (noLeadZero.length === 10) return `91${noLeadZero}`;
  if (noLeadZero.startsWith("91") && noLeadZero.length === 12) return noLeadZero;
  return noLeadZero; // fallback: use what we have
};

export default function Quotation() {
  const [form] = Form.useForm();

  // vehicle data
  const [bikeData, setBikeData] = useState([]);
  const [company, setCompany] = useState("");
  const [model, setModel] = useState("");
  const [variant, setVariant] = useState("");
  const [onRoadPrice, setOnRoadPrice] = useState(0);

  // mode + dp
  const [mode, setMode] = useState("cash");
  const [downPayment, setDownPayment] = useState(0);

  // executive + checklist states
  const [executive, setExecutive] = useState(EXECUTIVES[0]);
  const [extraFittings, setExtraFittings] = useState(EXTRA_FITTINGS); // default all ON
  const [motorCycles, setMotorCycles] = useState(MOTOR_CYCLES);       // default all ON
  const [documentsReq, setDocumentsReq] = useState(DOCUMENTS_REQ);    // default all ON

  // header metadata
  const [quoteDate] = useState(today());

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

  // Monthly EMI (flat interest)
  const monthlyFor = (months) => {
    const base = Math.max(Number(onRoadPrice || 0) - Number(downPayment || 0), 0);
    const principal = base + PROCESSING_FEE;
    const years = months / 12;
    const totalInterest = principal * (rate / 100) * years;
    const total = principal + totalInterest;
    return months > 0 ? total / months : 0;
  };

  const handlePrint = async () => {
    try {
      await form.validateFields([
        "name",
        "mobile",
        "address",
        "company",
        "bikeModel",
        "variant",
        "onRoadPrice",
      ]);
      window.print();
    } catch {
      message.warning("Fix the highlighted fields before printing.");
    }
  };

  // --- NEW: WhatsApp button handler ---
  const handleWhatsApp = async () => {
  try {
    await form.validateFields(["mobile"]); // ensures phoneRule passes
  } catch {
    message.warning("Please enter a valid 10-digit mobile number.");
    return;
  }

  const mobileRaw = form.getFieldValue("mobile");
  const e164 = toE164India(mobileRaw);
  if (!e164) {
    message.warning("Could not read the mobile number.");
    return;
  }

  const name = (form.getFieldValue("name") || "Customer").trim();
  
  // ✨ Sweet & impressive Shantha Motors welcome message
  const welcomeMsg =
    `🌟 Welcome to *Shantha Motors*, ${name}! 🌟` +
    `\n\nHere’s your quotation — because every great ride begins with trust and style.` +
    `\n\n🚀 Let’s make your journey memorable!`;

  const url = `https://wa.me/${e164}?text=${encodeURIComponent(welcomeMsg)}`;
  window.open(url, "_blank");
};


  // Print helper: numbered/bulleted list (no tick marks)
  const PrintList = ({ items, numbered = true }) => {
    if (!items?.length) return <span>-</span>;
    const Tag = numbered ? "ol" : "ul"; // set numbered=false to use bullets
    return (
      <Tag className="plist">
        {items.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </Tag>
    );
  };

  return (
    <>
      {/* ====== Screen & Print styles ====== */}
      <style>{`
        .wrap { max-width: 1000px; margin: 12px auto; padding: 0 12px; }
        .card { background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; padding: 12px; }
        .section-title { font-weight: 600; margin-bottom: 8px; }

        @media (max-width: 575px) { .logo { height: 36px; } .brand { font-size: 18px; font-weight: 700; } .quo-title { font-size: 18px; font-weight: 700; } }
        @media (min-width: 576px) and (max-width: 991px) { .logo { height: 44px; } .brand { font-size: 20px; font-weight: 700; } .quo-title { font-size: 20px; font-weight: 700; } }
        @media (min-width: 992px) { .logo { height: 50px; } .brand { font-size: 22px; font-weight: 800; } .quo-title { font-size: 22px; font-weight: 800; } }

        /* On-screen EMI grid */
        .emi-grid { display: grid; grid-template-columns: repeat(2, minmax(140px, 1fr)); gap: 8px; }
        @media (min-width: 768px) { .emi-grid { grid-template-columns: repeat(4, minmax(140px, 1fr)); } }
        .emi { border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px; text-align: center; }
        .emi .m { font-weight: 600; }
        .emi .v { font-weight: 700; font-size: 18px; }

        /* print sheet */
        @media print {
          @page { size: A4 portrait; margin: 10mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          body * { visibility: hidden; }
          .print-sheet, .print-sheet * { visibility: visible !important; }
          .print-sheet { position: absolute; inset: 0; margin: 0; }
          .sheet { width: 190mm; min-height: 277mm; font: 11pt/1.28 "Helvetica Neue", Arial, sans-serif; color: #111; }
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
          .plist { margin: 0; padding-left: 18px; } /* numbered/bulleted list spacing */
          .plist li { margin: 0 0 2px; }
        }
      `}</style>

      {/* ---------- On-screen inputs (checkboxes to control print visibility) ---------- */}
      <div className="wrap no-print">
        <div className="card">
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

              {/* Executive Name */}
              <Col xs={24} md={12}>
                <Form.Item label="Executive Name" name="executive" initialValue={EXECUTIVES[0]}>
                  <Select placeholder="Select Executive" value={executive} onChange={setExecutive}>
                    {EXECUTIVES.map((e) => (
                      <Option key={e} value={e}>{e}</Option>
                    ))}
                  </Select>
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
                  <Select placeholder="Select Variant" disabled={!model} onChange={handleVariant}>
                    {variants.map((v) => <Option key={v} value={v}>{v}</Option>)}
                  </Select>
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item label="On-Road Price (₹)" name="onRoadPrice" rules={[{ required: true }]}>
                  <InputNumber
                    readOnly
                    style={{ width: "100%" }}
                    value={onRoadPrice}
                    formatter={(val) => `₹ ${String(val ?? "0").replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`}
                  />
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
              )}

              {/* --- Side-by-side toggles (control what appears on print) --- */}
              <Col span={24}>
                <Row gutter={[12, 8]}>
                  <Col xs={24} md={8}>
                    <Form.Item label="Extra Fittings (show/hide on print)">
                      <Checkbox.Group value={extraFittings} onChange={setExtraFittings}>
                        {EXTRA_FITTINGS.map((x) => (
                          <div key={x} style={{ marginBottom: 6 }}>
                            <Checkbox value={x}>{x}</Checkbox>
                          </div>
                        ))}
                      </Checkbox.Group>
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item label="Motor Cycles (show/hide on print)">
                      <Checkbox.Group value={motorCycles} onChange={setMotorCycles}>
                        {MOTOR_CYCLES.map((x) => (
                          <div key={x} style={{ marginBottom: 6 }}>
                            <Checkbox value={x}>{x}</Checkbox>
                          </div>
                        ))}
                      </Checkbox.Group>
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item label="Documents Required (show/hide on print)">
                      <Checkbox.Group value={documentsReq} onChange={setDocumentsReq}>
                        {DOCUMENTS_REQ.map((x) => (
                          <div key={x} style={{ marginBottom: 6 }}>
                            <Checkbox value={x}>{x}</Checkbox>
                          </div>
                        ))}
                      </Checkbox.Group>
                    </Form.Item>
                  </Col>
                </Row>
              </Col>

              <Col span={24} style={{ textAlign: "right" }}>
                {/* NEW: WhatsApp Button */}
                <Button
                  className="no-print"
                  onClick={handleWhatsApp}
                  style={{
                    marginRight: 8,
                    background: "#25D366",
                    color: "#fff",
                    borderColor: "#25D366",
                  }}
                >
                  WhatsApp 
                </Button>

                <Button className="no-print" type="primary" icon={<PrinterOutlined />} onClick={handlePrint}>
                  Print
                </Button>
              </Col>
            </Row>
          </Form>
        </div>
      </div>

      {/* ---------- PRINT SLIP (one page) ---------- */}
      <div className="print-sheet">
        <div className="sheet">
          {/* Header */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 8,
            borderBottom: "2px solid #ccc",
            paddingBottom: 8
          }}>
            {/* Left: Branding */}
            <div>
              <img
                src="/shantha-logo.png"
                alt="Shantha Motors Logo"
                className="logo"
                style={{ marginBottom: 4 }}
              />
              <div className="brand">Shantha Motors</div>
              <div style={{ fontSize: 12 }}>
                Muddinapalya Rd, MPM Layout, ITI Employees Layout, Annapurneshwari Nagar, Bengaluru, Karnataka 560091
              </div>
              <div style={{ fontSize: 12 }}>
                📞 9731366291 / 8073283502 &nbsp;|&nbsp; ✉ shanthamotors@gmail.com
              </div>
            </div>

            {/* Right: Quotation meta */}
            <div style={{ textAlign: "right" }}>
              <div className="quo-title">Quotation</div>
              <div style={{ fontSize: 12 }}><b>Date:</b> {fmtIN(quoteDate)}</div>
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
            </div>
            <div className="row" style={{ marginTop: 4 }}>
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

          {/* Executive + side-by-side lists */}
          <div className="box" style={{ marginBottom: 8 }}>
            <div className="row" style={{ marginBottom: 6 }}>
              <div><b>Executive Name:</b> {executive || "-"}</div>
              <div></div>
            </div>

            {/* side-by-side like your paper form */}
            <div className="row-3">
              <div>
                <div className="sub">Extra Fittings</div>
                <PrintList items={extraFittings} numbered={true} />
              </div>
              <div>
                <div className="sub">Motor Cycles</div>
                <PrintList items={motorCycles} numbered={true} />
              </div>
              <div>
                <div className="sub">Documents Required</div>
                <PrintList items={documentsReq} numbered={true} />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ fontSize: "9pt", marginTop: 6, display: "flex", justifyContent: "space-between" }}>
            <div>Generated on: {fmtIN(quoteDate)}</div>
            <div><b>Note:</b> Prices are indicative and subject to change without prior notice.</div>
          </div>
        </div>
      </div>
    </>
  );
}
