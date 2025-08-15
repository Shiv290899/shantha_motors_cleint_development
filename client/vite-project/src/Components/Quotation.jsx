
import React, { useEffect, useMemo, useState } from "react";
import {
  Card, Row, Col, Form, Input, InputNumber, Select, Button,
  Typography, Radio, Space, Divider, message
} from "antd";
import { PrinterOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;
const { Option } = Select;

// ----- Config -----
const PROCESSING_FEE = 8000;       // included in principal
const RATE_LOW = 9;                // DP >= 30%
const RATE_HIGH = 11;              // DP < 30%
// Change 30 to 31 if you really need 31 months
const TENURES = [18, 24, 30, 36];

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

export default function Quotation() {
  const [form] = Form.useForm();

  // vehicle data / selections
  const [bikeData, setBikeData] = useState([]);
  const [company, setCompany] = useState("");
  const [model, setModel] = useState("");
  const [onRoadPrice, setOnRoadPrice] = useState(0);

  // payment + EMI
  const [mode, setMode] = useState("cash");     // "cash" | "loan"
  const [downPayment, setDownPayment] = useState(0);

  // load db
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

  // dropdown options
  const companies = useMemo(() => [...new Set(bikeData.map((r) => r.company))], [bikeData]);
  const models = useMemo(
    () => [...new Set(bikeData.filter((r) => r.company === company).map((r) => r.model))],
    [bikeData, company]
  );
  const variants = useMemo(
    () => [
      ...new Set(
        bikeData.filter((r) => r.company === company && r.model === model).map((r) => r.variant)
      ),
    ],
    [bikeData, company, model]
  );

  const handleVariant = (v) => {
    const found = bikeData.find(
      (r) => r.company === company && r.model === model && r.variant === v
    );
    const price = found?.onRoadPrice || 0;
    form.setFieldsValue({ onRoadPrice: price });
    setOnRoadPrice(price);
    // reset EMI inputs
    setDownPayment(0);
  };

  // interest rule
  const dpPct = onRoadPrice > 0 ? downPayment / onRoadPrice : 0;
  const rate = dpPct >= 0.3 ? RATE_LOW : RATE_HIGH;

  // flat-interest EMI (monthly only)
  const monthlyFor = (months) => {
    const base = Math.max(Number(onRoadPrice || 0) - Number(downPayment || 0), 0);
    const principal = base + PROCESSING_FEE;
    const years = months / 12;
    const totalInterest = principal * (rate / 100) * years;
    const total = principal + totalInterest;
    return months > 0 ? total / months : 0;
  };

  const handlePrint = () => {
    if (!form.getFieldValue("name") || !form.getFieldValue("mobile") || !onRoadPrice) {
      message.warning("Please fill Name, Mobile, and select the vehicle first.");
      return;
    }
    window.print();
  };

  return (
    <>
      {/* Print styles: one-page slip, hide controls not needed in print */}
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 10mm; }
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { position: absolute; inset: 0; }
          .no-print { display: none !important; }
          .emi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
          .emi-box { padding: 8px 6px; border: 1px solid #999; border-radius: 6px; }
        }
        .emi-grid { display: grid; grid-template-columns: repeat(4, minmax(120px, 1fr)); gap: 8px; }
        .emi-box { padding: 10px 8px; border: 1px solid #e5e7eb; border-radius: 8px; text-align: center; }
      `}</style>

      <Row justify="center" style={{ padding: 16 }}>
        <Col xs={24} md={22} lg={20} xl={16}>
          <Card
            className="print-area"
            style={{ borderRadius: 16 }}
            title={<Title level={4} style={{ margin: 0 }}>Quotation</Title>}
            extra={
              <Space className="no-print">
                <Radio.Group
                  optionType="button"
                  buttonStyle="solid"
                  value={mode}
                  onChange={(e) => setMode(e.target.value)}
                >
                  <Radio.Button value="cash">Cash</Radio.Button>
                  <Radio.Button value="loan">Loan</Radio.Button>
                </Radio.Group>
                <Button type="primary" icon={<PrinterOutlined />} onClick={handlePrint}>
                  Print Quotation
                </Button>
              </Space>
            }
            bodyStyle={{ paddingTop: 12 }}
          >
            {/* Customer */}
            <Form layout="vertical" form={form}>
              <Row gutter={[12, 8]}>
                <Col xs={24} md={12}>
                  <Form.Item label="Name" name="name" rules={[{ required: true, message: "Enter customer name" }]}>
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
                    <Input.TextArea rows={3} placeholder="House No, Street, Area, City, PIN" />
                  </Form.Item>
                </Col>
              </Row>

              <Divider style={{ margin: "8px 0 12px" }} />

              {/* Vehicle Details */}
              <Title level={5} style={{ margin: 0 }}>Vehicle Details</Title>
              <Row gutter={[12, 8]}>
                <Col xs={24} md={8}>
                  <Form.Item label="Company" name="company" rules={[{ required: true, message: "Select company" }]}>
                    <Select
                      placeholder="Select Company"
                      onChange={(val) => {
                        setCompany(val);
                        setModel("");
                        form.setFieldsValue({ bikeModel: undefined, variant: undefined, onRoadPrice: undefined });
                        setOnRoadPrice(0);
                        setDownPayment(0);
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
                        form.setFieldsValue({ variant: undefined, onRoadPrice: undefined });
                        setOnRoadPrice(0);
                        setDownPayment(0);
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

                {/* On-road price */}
                <Col xs={24} md={12}>
                  <Form.Item label="On-Road Price (₹)" name="onRoadPrice">
                    <InputNumber
                      readOnly
                      style={{ width: "100%" }}
                      value={onRoadPrice}
                      formatter={(val) => `₹ ${String(val ?? "0").replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`}
                    />
                  </Form.Item>
                </Col>

                {/* Payment Mode inline details */}
                <Col xs={24} md={12}>
                  <Form.Item label="Payment Mode">
                    <Text strong>{mode.toUpperCase()}</Text>
                  </Form.Item>
                </Col>
              </Row>

              {/* Loan-only section: inline EMI (no popup) */}
              {mode === "loan" && (
                <>
                  <Row gutter={[12, 8]}>
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
                   
                  </Row>

                  {/* EMI amounts only, side-by-side */}
                  <div className="emi-grid">
                    {TENURES.map((mo) => (
                      <div key={mo} className="emi-box">
                        <div style={{ fontWeight: 600 }}>{mo} months</div>
                        <div style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.2 }}>
                          {inr0(monthlyFor(mo))}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </Form>
          </Card>
        </Col>
      </Row>
    </>
  );
}
