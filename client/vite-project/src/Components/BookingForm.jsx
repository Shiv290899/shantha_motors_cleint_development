import React, { useState, useEffect, useMemo } from "react";
import {
  Form,
  Input,
  InputNumber,
  Select,
  Upload,
  Button,
  Row,
  Col,
  Card,
  Typography,
  message,
  Grid,
} from "antd";
import { InboxOutlined, CreditCardOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;
const { Dragger } = Upload;
const { useBreakpoint } = Grid;
const { Option } = Select;

const phoneRule = [
  { required: true, message: "Mobile number is required" },
  { pattern: /^[6-9]\d{9}$/, message: "Enter a valid 10-digit Indian mobile number" },
];

// Normalize keys from your Excel-exported JSON
const normalizeRow = (row = {}) => ({
  company: String(row["Company Name"] || "").trim(),
  model: String(row["Model Name"] || "").trim(),
  variant: String(row["Variant"] || "").trim(),
  onRoadPrice: Number(String(row["On-Road Price"] || "0").replace(/[,₹\s]/g, "")) || 0,
});

const BookingForm = () => {
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const isTabletOnly = screens.md && !screens.lg;

  const [form] = Form.useForm();
  const [aadharList, setAadharList] = useState([]);
  const [panList, setPanList] = useState([]);
  const [bikeData, setBikeData] = useState([]);

  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedModel, setSelectedModel] = useState("");

  // Load & normalize from /public/bikeData.json
  useEffect(() => {
    fetch("/bikeData.json")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setBikeData(data.map(normalizeRow).filter(r => r.company && r.model && r.variant));
        } else {
          message.error("Invalid bike data format");
        }
      })
      .catch(() => message.error("Failed to load bike data"));
  }, []);

  // Derived dropdown lists
  const companies = useMemo(
    () => [...new Set(bikeData.map((r) => r.company))],
    [bikeData]
  );

  const models = useMemo(
    () =>
      [...new Set(bikeData.filter((r) => r.company === selectedCompany).map((r) => r.model))],
    [bikeData, selectedCompany]
  );

  const variants = useMemo(
    () =>
      [
        ...new Set(
          bikeData
            .filter((r) => r.company === selectedCompany && r.model === selectedModel)
            .map((r) => r.variant)
        ),
      ],
    [bikeData, selectedCompany, selectedModel]
  );

  // When variant changes, set ONLY onRoadPrice field
  const handleVariantChange = (value) => {
    const found = bikeData.find(
      (r) => r.company === selectedCompany && r.model === selectedModel && r.variant === value
    );
    form.setFieldsValue({ onRoadPrice: found ? found.onRoadPrice : undefined });
  };

  const beforeUpload = (file) => {
    const isValidType =
      file.type === "application/pdf" ||
      file.type === "image/jpeg" ||
      file.type === "image/png";
    if (!isValidType) {
      message.error("Only PDF / JPG / PNG are allowed.");
      return Upload.LIST_IGNORE;
    }
    const isLt4M = file.size / 1024 / 1024 < 4;
    if (!isLt4M) {
      message.error("File must be smaller than 4MB.");
      return Upload.LIST_IGNORE;
    }
    return false;
  };

  const onFinish = (values) => {
    const aadhar = aadharList[0]?.originFileObj || null;
    const pan = panList[0]?.originFileObj || null;

    const payload = {
      ...values,
      mobileNumber: values.mobileNumber?.trim(),
      alternateMobileNumber: values.alternateMobileNumber?.trim() || undefined,
      documents: { aadhar, pan },
    };

    console.log("Booking submitted:", payload);
    message.success("✅ Booking submitted!");
    form.resetFields();
    setAadharList([]);
    setPanList([]);
    setSelectedCompany("");
    setSelectedModel("");
  };

  const onFinishFailed = ({ errorFields }) => {
    if (errorFields?.length) {
      form.scrollToField(errorFields[0].name, { behavior: "smooth", block: "center" });
    }
  };

  const headerBadge = (
    <div
      style={{
        height: isMobile ? 40 : 44,
        width: isMobile ? 40 : 44,
        borderRadius: 12,
        display: "grid",
        placeItems: "center",
        color: "white",
        background: "linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)",
        boxShadow: "0 8px 20px rgba(37, 99, 235, 0.35)",
        fontSize: isMobile ? 20 : 22,
      }}
    >
      🏍️
    </div>
  );

  return (
    <div
      style={{
        padding: isMobile ? 12 : isTabletOnly ? 18 : 24,
        background: isMobile ? "transparent" : "linear-gradient(180deg,#f8fbff 0%,#ffffff 100%)",
        minHeight: "100dvh",
        display: "grid",
        alignItems: "start",
      }}
    >
      <Card
        bordered={false}
        style={{
          width: "100%",
          maxWidth: 920,
          margin: isMobile ? "8px auto 24dvh" : "16px auto",
          borderRadius: 16,
          boxShadow: "0 10px 30px rgba(37, 99, 235, 0.10), 0 2px 8px rgba(0,0,0,0.06)",
        }}
        bodyStyle={{ padding: isMobile ? 16 : 28 }}
        headStyle={{ borderBottom: "none", padding: isMobile ? "12px 16px 0" : "16px 28px 0" }}
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {headerBadge}
            <div>
              <Title level={isMobile ? 4 : 3} style={{ margin: 0 }}>
                Two Wheeler Booking
              </Title>
              <Text type="secondary">Fill the details below to reserve your ride.</Text>
            </div>
          </div>
        }
      >
        <Form
          layout="vertical"
          form={form}
          onFinish={onFinish}
          onFinishFailed={onFinishFailed}
          requiredMark="optional"
        >
          {/* Customer Name */}
          <Form.Item
            label="Customer Name"
            name="customerName"
            rules={[{ required: true, message: "Please enter customer name" }]}
          >
            <Input size="large" placeholder="e.g., Rahul Sharma" allowClear />
          </Form.Item>

          {/* Phones */}
          <Row gutter={[16, 0]}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Mobile Number"
                name="mobileNumber"
                rules={phoneRule}
                normalize={(v) => (v ? v.replace(/\D/g, "").slice(0, 10) : v)}
              >
                <Input
                  size="large"
                  placeholder="10-digit number"
                  maxLength={10}
                  inputMode="numeric"
                  allowClear
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="Alternate Mobile Number"
                name="alternateMobileNumber"
                rules={[{ pattern: /^$|^[6-9]\d{9}$/, message: "Enter a valid 10-digit number" }]}
                normalize={(v) => (v ? v.replace(/\D/g, "").slice(0, 10) : v)}
              >
                <Input size="large" placeholder="Optional" maxLength={10} inputMode="numeric" allowClear />
              </Form.Item>
            </Col>
          </Row>

          {/* Email + Booking Amount + On-Road Price */}
          <Row gutter={[16, 0]}>
            <Col xs={24} md={8}>
              <Form.Item label="Email" name="email" rules={[{ type: "email" }]}>
                <Input size="large" placeholder="you@example.com" allowClear />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              {/* USER-ENTERED BOOKING AMOUNT */}
              <Form.Item
                label="Booking Amount (₹) — Paid by Customer"
                name="bookingAmount"
                rules={[{ required: true, message: "Enter booking amount" }]}
              >
                <InputNumber
                  size="large"
                  className="w-full"
                  min={0}
                  step={500}
                  prefix={<CreditCardOutlined />}
                  placeholder="Enter amount paid"
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              {/* AUTO-FILLED ON-ROAD PRICE (READ ONLY) */}
              <Form.Item label="On‑Road Price (₹)" name="onRoadPrice">
                <InputNumber
                  size="large"
                  className="w-full"
                  readOnly
                  placeholder="Select company/model/variant"
                  formatter={(v) => `₹ ${String(v ?? "")}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                />
              </Form.Item>
            </Col>
          </Row>

          {/* Address */}
          <Form.Item
            label="Address"
            name="address"
            rules={[{ required: true, message: "Please enter address" }]}
          >
            <Input.TextArea
              size="large"
              rows={isMobile ? 3 : 4}
              placeholder="House No, Street, Area, City, PIN"
              allowClear
            />
          </Form.Item>

          {/* Company → Model → Variant */}
          <Row gutter={[16, 0]}>
            <Col xs={24} md={8}>
              <Form.Item
                label="Company"
                name="company"
                rules={[{ required: true, message: "Select a company" }]}
              >
                <Select
                  size="large"
                  placeholder="Select Company"
                  onChange={(value) => {
                    setSelectedCompany(value);
                    setSelectedModel("");
                    form.setFieldsValue({
                      bikeModel: undefined,
                      variant: undefined,
                      onRoadPrice: undefined, // clear on-road price when changing
                    });
                  }}
                >
                  {companies.map((c, i) => (
                    <Option key={i} value={c}>
                      {c}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                label="Bike Model"
                name="bikeModel"
                rules={[{ required: true, message: "Select a model" }]}
              >
                <Select
                  size="large"
                  placeholder="Select Model"
                  disabled={!selectedCompany}
                  onChange={(value) => {
                    setSelectedModel(value);
                    form.setFieldsValue({ variant: undefined, onRoadPrice: undefined });
                  }}
                >
                  {models.map((m, i) => (
                    <Option key={i} value={m}>
                      {m}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                label="Variant"
                name="variant"
                rules={[{ required: true, message: "Select a variant" }]}
              >
                <Select
                  size="large"
                  placeholder="Select Variant"
                  disabled={!selectedModel}
                  onChange={handleVariantChange}
                >
                  {variants.map((v, i) => (
                    <Option key={i} value={v}>
                      {v}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          {/* Documents (optional) */}
          <Card
            size="small"
            title={<Text strong>Upload Documents</Text>}
            style={{ marginTop: 8, marginBottom: 12, borderRadius: 12 }}
            headStyle={{ background: "#f8fafc", borderRadius: 12 }}
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Aadhar Card (PDF/JPG/PNG)"
                  rules={[
                    {
                      validator: () =>
                        aadharList.length
                          ? Promise.resolve()
                          : Promise.reject(new Error("Upload Aadhar")),
                    },
                  ]}
                >
                  <Dragger
                    multiple={false}
                    beforeUpload={beforeUpload}
                    fileList={aadharList}
                    onChange={({ fileList }) => setAadharList(fileList)}
                    maxCount={1}
                    accept=".pdf,.jpg,.jpeg,.png"
                    itemRender={(origin) => origin}
                  >
                    <p className="ant-upload-drag-icon">
                      <InboxOutlined />
                    </p>
                    <p className="ant-upload-text">
                      Click or drag file to this area to upload
                    </p>
                  </Dragger>
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  label="PAN Card (PDF/JPG/PNG)"
                  rules={[
                    {
                      validator: () =>
                        panList.length
                          ? Promise.resolve()
                          : Promise.reject(new Error("Upload PAN")),
                    },
                  ]}
                >
                  <Dragger
                    multiple={false}
                    beforeUpload={beforeUpload}
                    fileList={panList}
                    onChange={({ fileList }) => setPanList(fileList)}
                    maxCount={1}
                    accept=".pdf,.jpg,.jpeg,.png"
                    itemRender={(origin) => origin}
                  >
                    <p className="ant-upload-drag-icon">
                      <InboxOutlined />
                    </p>
                    <p className="ant-upload-text">
                      Click or drag file to this area to upload
                    </p>
                  </Dragger>
                </Form.Item>
              </Col>
            </Row>
          </Card>

          {/* Submit */}
          <Form.Item style={{ marginTop: 8, marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" size={isMobile ? "middle" : "large"} block>
              Reserve My Bike
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default BookingForm;
