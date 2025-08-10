// src/components/EmiCalculator.jsx
import React, { useMemo, useState } from "react"; // React + hooks
import {
  Card, Form, InputNumber, Slider, Row, Col,
  Typography, Divider, Statistic, Radio, Space, Tooltip, Grid
} from "antd"; // Ant Design UI
import { InfoCircleOutlined } from "@ant-design/icons"; // Info icon

const { Title, Text } = Typography; // Typo helpers
const { useBreakpoint } = Grid;     // AntD responsive breakpoints

export default function EmiCalculator() {
  // ---------- RESPONSIVE ----------
  const screens = useBreakpoint(); // { xs, sm, md, lg, xl, xxl } → booleans
  const isMobile = !!screens.xs && !screens.md; // xs/sm behave like mobile
  const isTablet = !!screens.md && !screens.lg; // md only
  const controlSize = isMobile ? "large" : "middle"; // larger tap targets on mobile
  const outerPadding = isMobile ? 8 : isTablet ? 12 : 16; // tighter padding on small screens
  const cardBodyPadding = isMobile ? 12 : 20; // reduce card padding on phones

  // ---------- STATE ----------
  const [price, setPrice] = useState(120000);        // On-road price
  const [down, setDown] = useState(20000);           // Down payment
  const [rate, setRate] = useState(11);              // Annual flat interest (%)
  const [tenureType, setTenureType] = useState("months"); // "months" | "years"
  const [tenure, setTenure] = useState(24);          // Tenure value for selected type

  const fixedProcessingFee = 8000; // Processing fee included in principal

  // ---------- CALCULATION (FLAT / SIMPLE INTEREST) ----------
  const { principal, months, years, totalInterest, totalPayable, monthlyPay } = useMemo(() => {
    const base = Math.max(Number(price || 0) - Number(down || 0), 0); // avoid negative
    const p = base + fixedProcessingFee; // financed principal incl. fee
    const m = tenureType === "years"
      ? Math.max(1, Number(tenure || 0)) * 12
      : Math.max(1, Number(tenure || 0)); // normalize to months
    const y = m / 12;
    const r = Number(rate || 0) / 100;

    const interest = p * r * y; // simple (flat) interest
    const total = p + interest; // total payable
    const monthly = m > 0 ? total / m : 0; // equal monthly

    return {
      principal: isFinite(p) ? p : 0,
      months: isFinite(m) ? m : 0,
      years: isFinite(y) ? y : 0,
      totalInterest: isFinite(interest) ? interest : 0,
      totalPayable: isFinite(total) ? total : 0,
      monthlyPay: isFinite(monthly) ? monthly : 0,
    };
  }, [price, down, rate, tenure, tenureType]);

  // ---------- HELPERS ----------
  const inr = (n) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Math.max(0, Math.round(n || 0)));

  const maxDown = Math.max(price, 0); // cap down payment by price

  // Gutter tuning per device size (more breathing room on large screens)
  const fieldGutter = [16, 16];
  const resultsGutter = [16, 16];

  return (
    <Row justify="center" style={{ padding: outerPadding }}>
      {/* Center wrapper; max width grows with screen size */}
      <Col xs={24} sm={22} md={22} lg={20} xl={16} xxl={14} style={{ maxWidth: "100%" }}>
        <Card
          bordered
          bodyStyle={{ padding: cardBodyPadding }}
          style={{
            borderRadius: 16,
            boxShadow: isMobile ? "0 4px 16px rgba(24,144,255,0.12)" : "0 8px 30px rgba(24,144,255,0.15)",
            background: "linear-gradient(180deg, #e6f4ff 0%, #ffffff 40%)",
            overflow: "hidden", // prevents tiny overflow on xs
          }}
        >
          <Space direction="vertical" size={isMobile ? 6 : 8} style={{ width: "100%" }}>
            <Title
              level={isMobile ? 4 : 3}
              style={{ margin: 0, color: "#0958d9", textAlign: isMobile ? "center" : "left" }}
            >
              EMI Calculator
            </Title>
            <Text type="secondary" style={{ display: "block", textAlign: isMobile ? "center" : "left" }}>
              Flat interest model • Touch-friendly controls
            </Text>
          </Space>

          <Divider style={{ margin: isMobile ? "12px 0" : "16px 0" }} />

          {/* --------- INPUTS --------- */}
          <Form layout="vertical">
            <Row gutter={fieldGutter}>
              {/* On-road Price */}
              <Col xs={24} md={12}>
                <Form.Item
                  label={
                    <Space>
                      <Text strong>On-road Price (₹)</Text>
                      <Tooltip title="Total cost incl. RTO, insurance, accessories, etc.">
                        <InfoCircleOutlined />
                      </Tooltip>
                    </Space>
                  }
                >
                  <InputNumber
                    size={controlSize}
                    min={0}
                    step={1000}
                    value={price}
                    onChange={(v) => setPrice(Number(v || 0))}
                    style={{ width: "100%" }}
                    formatter={(val) =>
                      `₹ ${String(val ?? "0").replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`
                    }
                    parser={(val) => String(val || "0").replace(/[₹,\s,]/g, "")}
                    aria-label="On-road price in rupees"
                  />
                  <Slider
                    tooltip={{ open: false }}
                    min={0}
                    max={5000000}
                    step={5000}
                    value={price}
                    onChange={(v) => setPrice(Number(v))}
                    style={{ marginTop: 8 }}
                  />
                </Form.Item>
              </Col>

              {/* Down Payment */}
              <Col xs={24} md={12}>
                <Form.Item
                  label={
                    <Space>
                      <Text strong>Down Payment (₹)</Text>
                      <Tooltip title="Upfront amount; the rest is financed.">
                        <InfoCircleOutlined />
                      </Tooltip>
                    </Space>
                  }
                >
                  <InputNumber
                    size={controlSize}
                    min={0}
                    max={maxDown}
                    step={1000}
                    value={down}
                    onChange={(v) => setDown(Math.min(Number(v || 0), maxDown))}
                    style={{ width: "100%" }}
                    formatter={(val) =>
                      `₹ ${String(val ?? "0").replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`
                    }
                    parser={(val) => String(val || "0").replace(/[₹,\s,]/g, "")}
                    aria-label="Down payment in rupees"
                  />
                  <Slider
                    tooltip={{ open: false }}
                    min={0}
                    max={maxDown}
                    step={1000}
                    value={down}
                    onChange={(v) => setDown(Math.min(Number(v), maxDown))}
                    style={{ marginTop: 8 }}
                  />
                </Form.Item>
              </Col>

              {/* Interest Rate (Flat) */}
              <Col xs={24} md={12}>
                <Form.Item
                  label={
                    <Space>
                      <Text strong>Interest Rate (% p.a., flat)</Text>
                      <Tooltip title="Simple interest on initial principal for the entire tenure.">
                        <InfoCircleOutlined />
                      </Tooltip>
                    </Space>
                  }
                >
                  <InputNumber
                    size={controlSize}
                    min={0}
                    max={36}
                    step={0.1}
                    value={rate}
                    onChange={(v) => setRate(Number(v || 0))}
                    style={{ width: "100%" }}
                    aria-label="Flat annual interest rate"
                  />
                  <Slider
                    tooltip={{ open: false }}
                    min={0}
                    max={36}
                    step={0.1}
                    value={rate}
                    onChange={(v) => setRate(Number(v))}
                    style={{ marginTop: 8 }}
                  />
                </Form.Item>
              </Col>

              {/* Tenure (Months / Years) */}
              <Col xs={24} md={12}>
                <Form.Item
                  label={
                    <Space>
                      <Text strong>Tenure</Text>
                      <Tooltip title="Choose months or years; interest uses full years (m/12).">
                        <InfoCircleOutlined />
                      </Tooltip>
                    </Space>
                  }
                >
                  <Radio.Group
                    size={controlSize}
                    value={tenureType}
                    onChange={(e) => {
                      const next = e.target.value;
                      setTenureType(next);
                      if (next === "years") setTenure(Math.max(1, Math.round(tenure / 12)));
                      else setTenure(Math.max(1, Math.round(tenure * 12)));
                    }}
                    style={{ marginBottom: 8, display: "flex", gap: 8, flexWrap: "wrap" }}
                    aria-label="Tenure unit"
                  >
                    <Radio.Button value="months" style={{ flex: isMobile ? "1 0 120px" : "0 0 auto", textAlign: "center" }}>
                      Months
                    </Radio.Button>
                    <Radio.Button value="years" style={{ flex: isMobile ? "1 0 120px" : "0 0 auto", textAlign: "center" }}>
                      Years
                    </Radio.Button>
                  </Radio.Group>

                  {tenureType === "months" ? (
                    <>
                      <InputNumber
                        size={controlSize}
                        min={1}
                        max={120}
                        step={1}
                        value={tenure}
                        onChange={(v) => setTenure(Number(v || 0))}
                        style={{ width: "100%" }}
                        aria-label="Tenure in months"
                      />
                      <Slider
                        tooltip={{ open: false }}
                        min={1}
                        max={120}
                        step={1}
                        value={tenure}
                        onChange={(v) => setTenure(Number(v))}
                        style={{ marginTop: 8 }}
                      />
                    </>
                  ) : (
                    <>
                      <InputNumber
                        size={controlSize}
                        min={1}
                        max={10}
                        step={1}
                        value={tenure}
                        onChange={(v) => setTenure(Number(v || 0))}
                        style={{ width: "100%" }}
                        aria-label="Tenure in years"
                      />
                      <Slider
                        tooltip={{ open: false }}
                        min={1}
                        max={10}
                        step={1}
                        value={tenure}
                        onChange={(v) => setTenure(Number(v))}
                        style={{ marginTop: 8 }}
                      />
                    </>
                  )}
                </Form.Item>
              </Col>
            </Row>
          </Form>

          <Divider style={{ margin: isMobile ? "12px 0" : "16px 0" }} />

          {/* --------- RESULTS --------- */}
          <Row gutter={resultsGutter}>
            <Col xs={24} sm={12} lg={6}>
              <Card size="small" bordered style={{ borderRadius: 12 }}>
                <Statistic
                  title={isMobile ? "Loan (incl. fee)" : "Loan Amount (incl. ₹8,000 fee)"}
                  value={inr(principal)}
                />
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Card size="small" bordered style={{ borderRadius: 12 }}>
                <Statistic title="Monthly Payment" value={inr(monthlyPay)} />
                <Text type="secondary" style={{ display: "block" }}>
                  over {months} months
                </Text>
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Card size="small" bordered style={{ borderRadius: 12 }}>
                <Statistic title="Total Interest (flat)" value={inr(totalInterest)} />
                <Text type="secondary" style={{ display: "block" }}>
                  {rate}% p.a. × {years.toFixed(2)} yrs
                </Text>
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Card size="small" bordered style={{ borderRadius: 12 }}>
                <Statistic title="Total Payable" value={inr(totalPayable)} />
              </Card>
            </Col>
          </Row>

          <Divider style={{ margin: isMobile ? "12px 0" : "16px 0" }} />

          {/* --------- SUMMARY --------- */}
          <Row>
            <Col span={24}>
            </Col>
          </Row>
        </Card>
      </Col>
    </Row>
  );
}