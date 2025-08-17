// src/components/EmiCalculator.jsx
import React, { useMemo, useState } from "react";
import { Card, Form, InputNumber, Row, Col, Typography, Divider } from "antd";

const { Title } = Typography;

export default function EmiCalculator() {
  const [price, setPrice] = useState(120000);   // on-road price
  const [down, setDown] = useState(20000);      // down payment

  const processingFee = 8000; // fixed processing fee

  const inr = (n) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Math.max(0, Math.round(n || 0)));

  const { emiMap } = useMemo(() => {
    const base = Math.max(Number(price || 0) - Number(down || 0), 0);
    const P = base + processingFee; // financed principal incl. fee
    const dpRatio = price > 0 ? (down / price) : 0;
    const rate = dpRatio < 0.30 ? 0.11 : 0.09; // rule: <30% ⇒ 11%, else 9%

    const makeEmi = (m) => {
      const years = m / 12;
      const interest = P * rate * years;
      const total = P + interest;
      return m > 0 ? total / m : 0;
    };

    const map = Object.fromEntries([18, 24, 30, 36].map((m) => [m, makeEmi(m)]));
    return { emiMap: map };
  }, [price, down, processingFee]);

  const maxDown = Math.max(price, 0);

  return (
    <Row justify="center" style={{ padding: 16 }}>
      <Col xs={24} sm={22} md={20} lg={16} xl={12}>
        <Card bordered style={{ borderRadius: 12 }}>
          <Title level={3} style={{ marginTop: 0 }}>EMI Calculator</Title>
          <Divider />

          <Form layout="vertical">
            <Form.Item label="On-road Price (₹)">
              <InputNumber
                min={0}
                step={1000}
                value={price}
                onChange={(v) => setPrice(Number(v || 0))}
                style={{ width: "100%" }}
                formatter={(val) =>
                  `₹ ${String(val ?? "0").replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`
                }
                parser={(val) => String(val || "0").replace(/[₹,\s]/g, "")}
              />
            </Form.Item>

            <Form.Item label="Down Payment (₹)">
              <InputNumber
                min={0}
                max={maxDown}
                step={1000}
                value={down}
                onChange={(v) => setDown(Math.min(Number(v || 0), maxDown))}
                style={{ width: "100%" }}
                formatter={(val) =>
                  `₹ ${String(val ?? "0").replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`
                }
                parser={(val) => String(val || "0").replace(/[₹,\s]/g, "")}
              />
            </Form.Item>
          </Form>

          <Divider />

          <Title level={5} style={{ marginTop: 0 }}>Monthly EMI</Title>
          <Row gutter={[12, 12]}>
            {[18, 24, 30, 36].map((m) => (
              <Col xs={24} sm={12} md={12} lg={6} key={m}>
                <Card size="small" bordered style={{ borderRadius: 10, height: "100%" }}>
                  <Title level={5} style={{ margin: 0 }}>{m} months</Title>
                  <div style={{ fontSize: 20, marginTop: 6 }}>{inr(emiMap[m])}</div>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>
      </Col>
    </Row>
  );
}
