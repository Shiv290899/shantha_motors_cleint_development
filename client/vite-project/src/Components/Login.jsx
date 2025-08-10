import { useState } from "react";
import { Button, Form, Input } from "antd";
import { Link, useNavigate } from "react-router-dom";
import "./auth.css";

function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false); // ✅ inside component

  const onFinish = (values) => {
    console.log("Login form submitted:", values);
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      alert("Login successful!");
      navigate("/");
    }, 1000);
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1 className="title">Login to Shantha Motors</h1>
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item
            label="Email"
            name="email"
            rules={[{ required: true, message: "Email is required" }]}
          >
            <Input type="email" placeholder="Enter your email" />
          </Form.Item>

          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: "Password is required" }]}
          >
            <Input.Password placeholder="Enter your password" />
          </Form.Item>

          <Button
            type="primary"
            block
            htmlType="submit"
            loading={loading} // show spinner
          >
            Login
          </Button>
        </Form>

        <p className="switch-text">
          New User? <Link to="/register">Register here</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;