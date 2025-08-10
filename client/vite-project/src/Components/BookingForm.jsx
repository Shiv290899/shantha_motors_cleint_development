import React, { useState } from "react";
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

const phoneRule = [
  { required: true, message: "Mobile number is required" },
  {
    pattern: /^[6-9]\d{9}$/,
    message: "Enter a valid 10-digit Indian mobile number",
  },
];

const BookingForm = () => {
  const screens = useBreakpoint();
  const isMobile = !screens.md;          // < md
  const isTabletOnly = screens.md && !screens.lg;

  const [form] = Form.useForm();
  const [aadharList, setAadharList] = useState([]);
  const [panList, setPanList] = useState([]);

  // Prevent auto-upload; limit type & size
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
    return false; // stop auto-upload, keep in fileList
  };

  const onFinish = (values) => {
    // normalize file objects
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
  };

  // Smoothly scroll to the first error on small screens
  const onFinishFailed = ({ errorFields }) => {
    if (errorFields?.length) {
      form.scrollToField(errorFields[0].name, { behavior: "smooth", block: "center" });
    }
  };

  // Shared card gradient & shadows tuned for mobile/tablet
  const headerBadge = (
    <div style={{
      height: isMobile ? 40 : 44,
      width: isMobile ? 40 : 44,
      borderRadius: 12,
      display: "grid",
      placeItems: "center",
      color: "white",
      background: "linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)",
      boxShadow: "0 8px 20px rgba(37, 99, 235, 0.35)",
      fontSize: isMobile ? 20 : 22,
    }}>
      🏍️
    </div>
  );

  return (
    <div style={{
      padding: isMobile ? 12 : isTabletOnly ? 18 : 24,
      background: isMobile ? "transparent" : "linear-gradient(180deg,#f8fbff 0%,#ffffff 100%)",
      minHeight: "100dvh",
      display: "grid",
      alignItems: "start",
    }}>
      <Card
        bordered={false}
        style={{
          width: "100%",
          maxWidth: 920,
          margin: isMobile ? "8px auto 24dvh" : "16px auto",
          borderRadius: 16,
          boxShadow:
            "0 10px 30px rgba(37, 99, 235, 0.10), 0 2px 8px rgba(0,0,0,0.06)",
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
              <Text type="secondary">
                Fill the details below to reserve your ride. It takes ~2 mins.
              </Text>
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
          scrollToFirstError
        >
          {/* Name */}
          <Form.Item
            label="Customer Name"
            name="customerName"
            rules={[{ required: true, message: "Please enter customer name" }]}
          >
            <Input
              size="large"
              placeholder="e.g., Rahul Sharma"
              allowClear
              autoComplete="name"
            />
          </Form.Item>

          {/* Phones */}
          <Row gutter={[16, 0]}>
            <Col xs={24} md={12}>
              <Form.Item label="Mobile Number" name="mobileNumber" rules={phoneRule}
                normalize={(v) => (v ? v.replace(/\D/g, "").slice(0, 10) : v)}
              >
                <Input
                  size="large"
                  placeholder="10-digit number"
                  maxLength={10}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  allowClear
                />
              </Form.Item>
              <Text type="secondary" style={{ marginTop: -6, display: "block" }}>
                Starts with 6/7/8/9, exactly 10 digits.
              </Text>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label="Alternate Mobile Number"
                name="alternateMobileNumber"
                rules={[
                  { pattern: /^$|^[6-9]\d{9}$/, message: "Enter a valid 10-digit number" },
                ]}
                normalize={(v) => (v ? v.replace(/\D/g, "").slice(0, 10) : v)}
              >
                <Input
                  size="large"
                  placeholder="Optional"
                  maxLength={10}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  allowClear
                />
              </Form.Item>
            </Col>
          </Row>

          {/* Email + Amount */}
          <Row gutter={[16, 0]}>
            <Col xs={24} md={12}>
              <Form.Item label="Email" name="email" rules={[{ type: "email" }]}>
                <Input
                  size="large"
                  placeholder="you@example.com"
                  allowClear
                  autoComplete="email"
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label="Booking Amount (₹)"
                name="bookingAmount"
                rules={[{ required: true, message: "Enter booking amount" }]}
              >
                <InputNumber
                  size="large"
                  className="w-full"
                  min={500}
                  step={500}
                  prefix={<CreditCardOutlined />}
                  placeholder="e.g., 2000"
                />
              </Form.Item>
              <Text type="secondary" style={{ marginTop: -6, display: "block" }}>
                Minimum ₹500. Adjust as per your policy.
              </Text>
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
              autoComplete="street-address"
            />
          </Form.Item>

          {/* Bike + Variant */}
          <Row gutter={[16, 0]}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Bike Model"
                name="bikeModel"
                rules={[{ required: true, message: "Select a model" }]}
              >
                <Select
                  size="large"
                  placeholder="Select Model"
                  showSearch
                  optionFilterProp="label"
                  allowClear
                  options={[
                    { value: "Hero Splendor", label: "Hero Splendor" },
                    { value: "Honda Shine", label: "Honda Shine" },
                    { value: "TVS Apache", label: "TVS Apache" },
                    { value: "Yamaha FZ", label: "Yamaha FZ" },
                  ]}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label="Variant"
                name="variant"
                rules={[{ required: true, message: "Select a variant" }]}
              >
                <Select
                  size="large"
                  placeholder="Select Variant"
                  showSearch
                  optionFilterProp="label"
                  allowClear
                  options={[
                    { value: "Standard", label: "Standard" },
                    { value: "Deluxe", label: "Deluxe" },
                    { value: "Disc Brake", label: "Disc Brake" },
                    { value: "Electric Start", label: "Electric Start" },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>

          {/* Documents */}
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
                  // Use a custom validator so it works with controlled fileList
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
                    <p className="ant-upload-hint">Single file only. Max 4MB.</p>
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
                    <p className="ant-upload-hint">Single file only. Max 4MB.</p>
                  </Dragger>
                </Form.Item>
              </Col>
            </Row>
          </Card>

          {/* Submit */}
          <Form.Item style={{ marginTop: 8, marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              size={isMobile ? "middle" : "large"}
              block
              style={{
                position: isMobile ? "fixed" : "static",
                left: 0,
                right: 0,
                bottom: isMobile ? 8 : "auto",
                marginInline: isMobile ? 12 : 0,
                zIndex: 20,
                borderRadius: 10,
                boxShadow:
                  "0 10px 20px rgba(37, 99, 235, 0.25), 0 2px 6px rgba(0,0,0,0.06)",
              }}
            >
              Reserve My Bike
            </Button>
            {!isMobile && (
              <div style={{ textAlign: "center", marginTop: 8 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  By submitting, you agree to our booking terms & verification policy.
                </Text>
              </div>
            )}
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default BookingForm;