// QuotationOnePage.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Row, Col, Form, Input, InputNumber, Select, Button, Typography, Radio, message, Checkbox,
} from "antd";
import { PrinterOutlined } from "@ant-design/icons";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const { Text } = Typography;
const { Option } = Select;

// ----- Config -----
const PROCESSING_FEE = 8000;       // included in principal
const RATE_LOW = 9;                // DP ≥ 30%
const RATE_HIGH = 11;              // DP < 30%
const TENURES = [18, 24, 30, 36];
const VALID_DAYS = 15;

// ----- Static options -----
const EXECUTIVES = ["Rukmini", "Radha", "Manasa", "Karthik", "Suresh"];
const EXTRA_FITTINGS = ["All Round Guard","Side Stand","Saree Guard","Grip Cover","Seat Cover","Floor Mat","ISI Helmet"];
const MOTOR_CYCLES   = ["Crash Guard","Engine Guard","Tank Cover","Ladies Handle","Gripper","Seat Cover"];
const DOCUMENTS_REQ  = ["Aadhar Card","Pan Card","Bank Passbook","ATM Card","Local Address Proof"];

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
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 })
    .format(Math.max(0, Math.round(n || 0)));

const today = () => new Date();
const fmtIN = (d) => d.toLocaleDateString("en-IN");
const digitsOnly = (v = "") => String(v).replace(/\D/g, "");
const makePdfName = (form, company, model, variant) => {
  const nm = (form.getFieldValue("name") || "Customer").toString().trim().replace(/\s+/g, "_");
  const vc = [company, model, variant].filter(Boolean).join("_").replace(/\s+/g, "_");
  return `ShanthaMotors_Quotation_${nm}${vc ? "_" + vc : ""}.pdf`;
};
const makePngName = (form, company, model, variant) =>
  makePdfName(form, company, model, variant).replace(/\.pdf$/i, ".png");

// warm & impressive welcome (WhatsApp markdown)
const buildWelcomeMessage = ({ name, company, model, variant, priceText}) => {
  const greeting = `👋 Hello${name ? " " + name : ""}!`;
  const intro = "Welcome to *Shantha Motors* — premium service, transparent pricing, and smooth delivery. 🚀";
  const vline  = `Here’s your quotation for *${[company, model, variant].filter(Boolean).join(" ")}*.`;
  const p1 = `• On‑Road Price: *${priceText || "-"}*`;
  //const closer = `This quote is prepared by *${executive || "Team Shantha Motors"}*.`;
  const cta = "_Reply here for test ride, finance options, or delivery timelines. We’re happy to help!_";
  return [greeting, intro, vline, p1,  "", cta].filter(Boolean).join("\n");
};

// capture helpers (exactly the print view)
async function captureSheetToPngBlob() {
  const node = document.querySelector(".print-sheet");
  if (!node) throw new Error("Printable sheet not found.");
  const canvas = await html2canvas(node, {
    backgroundColor: "#ffffff",
    scale: 2.5,
    useCORS: true,
    windowWidth: document.documentElement.scrollWidth,
  });
  return await new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/png", 0.95));
}

async function captureSheetToPdfBlob() {
  const node = document.querySelector(".print-sheet");
  if (!node) throw new Error("Printable sheet not found.");
  const canvas = await html2canvas(node, { backgroundColor: "#ffffff", scale: 2.5, useCORS: true, windowWidth: document.documentElement.scrollWidth });
  const img = canvas.toDataURL("image/png");
  const pdf = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
  const pageW = pdf.internal.pageSize.getWidth();  // 210
  const pageH = pdf.internal.pageSize.getHeight(); // 297
  const margin = 10;
  const w = pageW - margin * 2;
  const h = (canvas.height * w) / canvas.width;
  if (h <= pageH - margin * 2) {
    pdf.addImage(img, "PNG", margin, margin, w, h, undefined, "FAST");
  } else {
    let remaining = h, sourceY = 0;
    const sliceH = (canvas.width * (pageH - margin * 2)) / w;
    while (remaining > 0) {
      const pageCanvas = document.createElement("canvas");
      pageCanvas.width = canvas.width;
      pageCanvas.height = Math.min(sliceH, canvas.height - sourceY);
      const ctx = pageCanvas.getContext("2d");
      ctx.drawImage(canvas, 0, sourceY, canvas.width, pageCanvas.height, 0, 0, canvas.width, pageCanvas.height);
      const pageImg = pageCanvas.toDataURL("image/png");
      if (sourceY > 0) pdf.addPage();
      pdf.addImage(pageImg, "PNG", margin, margin, w, (pageCanvas.height * w) / canvas.width, undefined, "FAST");
      sourceY += pageCanvas.height;
      remaining -= (pageCanvas.height * w) / canvas.width;
    }
  }
  return pdf.output("blob");
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

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

  // executive + toggles
  const [executive, setExecutive] = useState(EXECUTIVES[0]);
  const [extraFittings, setExtraFittings] = useState(EXTRA_FITTINGS);
  const [motorCycles, setMotorCycles] = useState(MOTOR_CYCLES);
  const [documentsReq, setDocumentsReq] = useState(DOCUMENTS_REQ);

  const [quoteDate] = useState(today());
  const [shareFormat, setShareFormat] = useState("pdf"); // 'pdf' | 'png'
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/bikeData.json")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setBikeData(data.map(normalizeRow).filter((r) => r.company && r.model && r.variant));
        } else message.error("Invalid bike data format");
      })
      .catch(() => message.error("Failed to load bike data"));
  }, []);

  const companies = useMemo(() => [...new Set(bikeData.map((r) => r.company))], [bikeData]);
  const models = useMemo(() => [...new Set(bikeData.filter((r) => r.company === company).map((r) => r.model))], [bikeData, company]);
  const variants = useMemo(() => [...new Set(bikeData.filter((r) => r.company === company && r.model === model).map((r) => r.variant))], [bikeData, company, model]);

  const handleVariant = (v) => {
    setVariant(v);
    const found = bikeData.find((r) => r.company === company && r.model === model && r.variant === v);
    const price = found?.onRoadPrice || 0;
    form.setFieldsValue({ onRoadPrice: price });
    setOnRoadPrice(price);
    setDownPayment(0);
  };

  const dpPct = onRoadPrice > 0 ? downPayment / onRoadPrice : 0;
  const rate = dpPct >= 0.3 ? RATE_LOW : RATE_HIGH;

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
      await form.validateFields(["name","mobile","address","company","bikeModel","variant","onRoadPrice"]);
      window.print();
    } catch {
      message.warning("Fix the highlighted fields before printing.");
    }
  };

  // 👉 MAIN requirement: tap WhatsApp → open chat immediately with warm message
  const handleWhatsApp = async () => {
  try {
    await form.validateFields(["name","mobile","address","company","bikeModel","variant","onRoadPrice"]);
    setBusy(true);

    const name = (form.getFieldValue("name") || "").trim();
    const mobile = digitsOnly(form.getFieldValue("mobile"));
    if (mobile.length !== 10) {
      message.error("Enter a valid 10-digit Indian mobile number.");
      return;
    }

    const priceText = onRoadPrice ? inr0(onRoadPrice) : "-";
    const emiSample = mode === "loan" ? `${TENURES[3]}m: *${inr0(monthlyFor(TENURES[3]))}*` : "";
    const msg = buildWelcomeMessage({ name, company, model, variant, priceText, mode, emiText: emiSample, executive });

    // 1) Create the quotation file
    let blob, filename;
    if (shareFormat === "png") {
      blob = await captureSheetToPngBlob();
      filename = makePngName(form, company, model, variant);
    } else {
      blob = await captureSheetToPdfBlob();
      filename = makePdfName(form, company, model, variant);
    }
    const file = new File([blob], filename, { type: blob.type });

    // 2) If browser supports file share → send file + text to WhatsApp
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: "Shantha Motors Quotation",
        text: msg,
      });
      return;
    }

    // 3) Fallback: download file, open WhatsApp with text
    downloadBlob(blob, filename);
    const waUrl = `https://wa.me/91${mobile}?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, "_blank", "noopener,noreferrer");
    message.info("WhatsApp opened with welcome text. File downloaded — attach it manually.");
  } catch (e) {
    console.error(e);
    message.error("Could not share to WhatsApp. Please check the form and try again.");
  } finally {
    setBusy(false);
  }
};


  const PrintList = ({ items }) => {
    if (!items?.length) return <span>-</span>;
    return (
      <ol className="plist">
        {items.map((t) => <li key={t}>{t}</li>)}
      </ol>
    );
  };

  return (
    <>
      {/* ====== Screen & Print styles (tuned to match your sample) ====== */}
      <style>{`
        .wrap { max-width: 1000px; margin: 12px auto; padding: 0 12px; }
        .card { background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; padding: 12px; }

        /* Header scaling similar to your image */
        @media (max-width: 575px) { .logo { height: 34px; } .brand { font-size: 18px; font-weight: 700; } .quo-title { font-size: 18px; font-weight: 700; } }
        @media (min-width: 576px) and (max-width: 991px) { .logo { height: 42px; } .brand { font-size: 20px; font-weight: 700; } .quo-title { font-size: 20px; font-weight: 700; } }
        @media (min-width: 992px) { .logo { height: 48px; } .brand { font-size: 22px; font-weight: 800; } .quo-title { font-size: 22px; font-weight: 800; } }

        /* EMI chips like your screenshot */
        .emi-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-top: 6px; }
        .emi-chip { border: 1px solid #e5e7eb; border-radius: 10px; padding: 10px 12px; text-align: center; }
        .emi-chip .m { font-weight: 600; }
        .emi-chip .v { font-weight: 700; font-size: 16px; }

        @media print {
          @page { size: A4 portrait; margin: 10mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          body * { visibility: hidden; }
          .print-sheet, .print-sheet * { visibility: visible !important; }
          .print-sheet { position: absolute; inset: 0; margin: 0; }
          .sheet { width: 190mm; min-height: 277mm; font: 11pt/1.28 "Helvetica Neue", Arial, sans-serif; color: #111; }
          .plist { margin: 0; padding-left: 18px; }
          .plist li { margin: 0 0 2px; }
          .thin-hr { border: 0; border-top: 1px solid #d1d5db; margin: 6px 0 10px; }
        }

        /* WhatsApp button */
        .whatsapp-btn { background: #25D366; border-color: #1ebe57; color: #fff; }
        .whatsapp-btn:hover, .whatsapp-btn:focus { background: #1ebe57 !important; border-color: #19a64c !important; color: #fff !important; }
        .wa-icon { width: 1.05em; height: 1.05em; vertical-align: -0.12em; margin-right: 6px; }
      `}</style>

      {/* ---------- Controls (screen only) ---------- */}
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
                <Form.Item label="Mobile Number" name="mobile" rules={phoneRule} normalize={(v) => (v ? v.replace(/\D/g, "").slice(0, 10) : v)}>
                  <Input placeholder="10-digit mobile" maxLength={10} />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item label="Address" name="address" rules={[{ required: true, message: "Enter address" }]}>
                  <Input.TextArea rows={2} placeholder="House No, Street, Area, City, PIN" />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item label="Executive Name" name="executive" initialValue={EXECUTIVES[0]}>
                  <Select placeholder="Select Executive" value={executive} onChange={setExecutive}>
                    {EXECUTIVES.map((e) => <Option key={e} value={e}>{e}</Option>)}
                  </Select>
                </Form.Item>
              </Col>

              <Col xs={24} md={8}>
                <Form.Item label="Company" name="company" rules={[{ required: true, message: "Select company" }]}>
                  <Select
                    placeholder="Select Company"
                    onChange={(val) => {
                      setCompany(val); setModel(""); setVariant(""); setOnRoadPrice(0); setDownPayment(0);
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
                    placeholder="Select Model" disabled={!company}
                    onChange={(val) => {
                      setModel(val); setVariant(""); setOnRoadPrice(0); setDownPayment(0);
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
                  <InputNumber readOnly style={{ width: "100%" }} value={onRoadPrice}
                    formatter={(val) => `₹ ${String(val ?? "0").replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`} />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label="Payment Mode">
                  <Radio.Group optionType="button" buttonStyle="solid" value={mode} onChange={(e) => setMode(e.target.value)}>
                    <Radio.Button value="cash">Cash</Radio.Button>
                    <Radio.Button value="loan">Loan</Radio.Button>
                  </Radio.Group>
                </Form.Item>
              </Col>

              {mode === "loan" && (
                <Col xs={24} md={12}>
                  <Form.Item label="Down Payment (₹)">
                    <InputNumber style={{ width: "100%" }} min={0} max={onRoadPrice} step={1000} value={downPayment}
                      onChange={(v) => setDownPayment(Math.min(Number(v || 0), onRoadPrice || 0))}
                      formatter={(val) => `₹ ${String(val ?? "0").replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`}
                      parser={(val) => String(val || "0").replace(/[₹,\s,]/g, "")}
                    />
                  </Form.Item>
                </Col>
              )}

              {/* show/hide sections */}
              <Col span={24}>
                <Row gutter={[12, 8]}>
                  <Col xs={24} md={8}>
                    <Form.Item label="Extra Fittings (show/hide on print)">
                      <Checkbox.Group value={extraFittings} onChange={setExtraFittings}>
                        {EXTRA_FITTINGS.map((x) => <div key={x} style={{ marginBottom: 6 }}><Checkbox value={x}>{x}</Checkbox></div>)}
                      </Checkbox.Group>
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item label="Motor Cycles (show/hide on print)">
                      <Checkbox.Group value={motorCycles} onChange={setMotorCycles}>
                        {MOTOR_CYCLES.map((x) => <div key={x} style={{ marginBottom: 6 }}><Checkbox value={x}>{x}</Checkbox></div>)}
                      </Checkbox.Group>
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item label="Documents Required (show/hide on print)">
                      <Checkbox.Group value={documentsReq} onChange={setDocumentsReq}>
                        {DOCUMENTS_REQ.map((x) => <div key={x} style={{ marginBottom: 6 }}><Checkbox value={x}>{x}</Checkbox></div>)}
                      </Checkbox.Group>
                    </Form.Item>
                  </Col>
                </Row>
              </Col>

              {/* actions */}
              <Col span={24} style={{ display: "flex", gap: 8, justifyContent: "flex-end", alignItems: "center" }}>
                <Button className="no-print" icon={<PrinterOutlined />} onClick={handlePrint}>Print</Button>

                <div className="no-print" style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <Text>File:</Text>
                  <Select size="middle" value={shareFormat} onChange={setShareFormat} style={{ width: 110 }}>
                    <Option value="pdf">PDF</Option>
                    <Option value="png">PNG</Option>
                  </Select>
                </div>

                <Button className="no-print whatsapp-btn" loading={busy} onClick={handleWhatsApp}>
                  <svg className="wa-icon" viewBox="0 0 32 32" fill="currentColor" aria-hidden="true">
                    <path d="M19.11 17.19c-.29-.15-1.7-.84-1.96-.94-.26-.1-.45-.15-.64.15-.19.29-.74.94-.9 1.13-.17.19-.33.22-.61.07-.29-.15-1.2-.44-2.3-1.42-.85-.76-1.42-1.7-1.59-1.98-.17-.29-.02-.45.13-.6.13-.13.29-.33.43-.5.15-.17.19-.29.29-.48.1-.19.05-.36-.02-.5-.07-.15-.64-1.54-.88-2.12-.23-.56-.47-.49-.64-.49-.17 0-.36-.02-.55-.02-.19 0-.5.07-.76.36-.26.29-1 1-.99 2.44.02 1.44 1.02 2.84 1.17 3.04.15.19 2 3.05 4.85 4.28.68.29 1.21.46 1.62.59.68.22 1.29.19 1.77.12.54-.08 1.7-.69 1.94-1.36.24-.67.24-1.25.17-1.36-.07-.12-.26-.19-.55-.34zM16.02 3.2C9.43 3.2 4.12 8.5 4.12 15.1c0 2.11.55 4.1 1.53 5.83L4 28.8l8.06-1.59c1.68.92 3.61 1.45 5.64 1.45 6.59 0 11.9-5.31 11.9-11.9 0-6.6-5.31-11.9-11.9-11.9zm0 21.62c-1.88 0-3.63-.55-5.1-1.5l-.37-.23-4.78.94.98-4.66-.24-.38a9.85 9.85 0 0 1-1.53-5.2c0-5.43 4.41-9.84 9.84-9.84 5.43 0 9.84 4.41 9.84 9.84 0 5.43-4.41 9.84-9.84 9.84z"/>
                  </svg>
                  WhatsApp
                </Button>
              </Col>
            </Row>
          </Form>
        </div>
      </div>

      {/* ---------- PRINT SHEET (matches your earlier sample) ---------- */}
      <div className="print-sheet">
        <div className="sheet">
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
            <div>
              <img src="/shantha-logo.png" alt="Shantha Motors Logo" className="logo" style={{ marginBottom: 2 }} />
              <div className="brand">Shantha Motors</div>
              <div style={{ fontSize: 12 }}>
                Muddinapalya Rd, MPM Layout, ITI Employees Layout, Annapurneshwari Nagar, Bengaluru, Karnataka 560091
              </div>
              <div style={{ fontSize: 12 }}>
                📞 9731366291 / 8073283502 &nbsp;|&nbsp; ✉ shanthamotors@gmail.com
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div className="quo-title">Quotation</div>
              <div style={{ fontSize: 12 }}><b>Date:</b> {fmtIN(quoteDate)}</div>
            </div>
          </div>
          <hr className="thin-hr" />

          {/* Customer Details */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontWeight: 600, marginBottom: 2 }}>Customer Details</div>
            <div>Name: {form.getFieldValue("name") || "-"}</div>
            <div>Mobile: {form.getFieldValue("mobile") || "-"}</div>
            <div>Address: {form.getFieldValue("address") || "-"}</div>
          </div>

          {/* Vehicle Details */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontWeight: 600, marginBottom: 2 }}>Vehicle Details</div>
            <div>Company: {company || "-"}</div>
            <div>Model: {model || "-"}</div>
            <div>Variant: {variant || "-"}</div>
            <div>On‑Road Price: {onRoadPrice ? inr0(onRoadPrice) : "-"}</div>
            <div>Payment Mode: {mode.toUpperCase()}</div>
          </div>

          {/* Loan */}
          {mode === "loan" && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontWeight: 600, marginBottom: 2 }}>Loan Details</div>
              <div>Down Payment: {inr0(downPayment || 0)}</div>
              <div className="emi-row" style={{ marginTop: 8 }}>
                {TENURES.map((mo) => (
                  <div key={mo} className="emi-chip">
                    <div className="m">{mo} months</div>
                    <div className="v">{inr0(monthlyFor(mo))}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Executive + lists */}
          <div style={{ marginBottom: 8 }}>
            <div><b>Executive Name:</b> {executive || "-"}</div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px 18px" }}>
            <div>
              <div style={{ fontWeight: 600, marginBottom: 2 }}>Extra Fittings</div>
              <PrintList items={extraFittings} />
            </div>
            <div>
              <div style={{ fontWeight: 600, marginBottom: 2 }}>Motor Cycles</div>
              <PrintList items={motorCycles} />
            </div>
            <div>
              <div style={{ fontWeight: 600, marginBottom: 2 }}>Documents Required</div>
              <PrintList items={documentsReq} />
            </div>
          </div>

          {/* Footer */}
          <div style={{ fontSize: "9pt", marginTop: 8, display: "flex", justifyContent: "space-between" }}>
            <div>Generated on: {fmtIN(quoteDate)}</div>
            <div><b>Note:</b> Prices are indicative and subject to change without prior notice.</div>
          </div>
        </div>
      </div>
    </>
  );
}
