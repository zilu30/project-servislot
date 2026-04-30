import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axiosConfig"; 

function ProviderSignup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    companyName: "",
    ownerName: "",
    username: "", 
    email: "",
    phone: "",
    serviceCategory: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    if (Object.values(formData).some(val => !val)) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);

    // Mapping React names to standard Backend names (snake_case)
    const signupData = {
      username: formData.username,
      email: formData.email,
      password: formData.password,
      role: "provider",
      company_name: formData.companyName,
      owner_name: formData.ownerName,
      phone_number: formData.phone,
      category: formData.serviceCategory,
    };

    try {
      // Send the mapped data
      const response = await api.post("signup/", signupData);
      console.log("Registration Successful:", response.data);
      setSuccess(true);
    } catch (err) {
      // 🔍 Detailed console logging to help us debug
      console.error("Backend Error Response:", err.response?.data);
      
      // If the backend sends a specific message, show it, otherwise show fallback
      const serverDetail = err.response?.data?.detail;
      const msg = typeof serverDetail === "string" 
        ? serverDetail 
        : "Registration failed. Please check the console for details.";
      
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {!success ? (
          <>
            <div className="auth-header">
              <span className="auth-badge">Provider Access</span>
              <h1>Provider Sign Up</h1>
              <p>Create a provider account to manage services and bookings.</p>
            </div>

            <form className="auth-form" onSubmit={handleSubmit}>
              <label>Company Name</label>
              <input type="text" name="companyName" placeholder="Enter company name" value={formData.companyName} onChange={handleChange} required />

              <label>Owner Name</label>
              <input type="text" name="ownerName" placeholder="Enter owner name" value={formData.ownerName} onChange={handleChange} required />
              
              <label>Username</label>
              <input type="text" name="username" placeholder="Choose a username" value={formData.username} onChange={handleChange} required />

              <label>Email Address</label>
              <input type="email" name="email" placeholder="Enter provider email" value={formData.email} onChange={handleChange} required />

              <label>Phone Number</label>
              <input type="text" name="phone" placeholder="Enter phone number" value={formData.phone} onChange={handleChange} required />

              <label>Service Category</label>
              <select name="serviceCategory" value={formData.serviceCategory} onChange={handleChange} required>
                <option value="">Select a category</option>
                <option value="Home Services">Home Services</option>
                <option value="Repair & Maintenance">Repair & Maintenance</option>
                <option value="Beauty & Personal Care">Beauty & Personal Care</option>
                <option value="Education & Tutoring">Education & Tutoring</option>
                <option value="Fitness & Wellness">Fitness & Wellness</option>
                <option value="Events & Photography">Events & Photography</option>
                <option value="Pet Services">Pet Services</option>
                <option value="Moving & Delivery">Moving & Delivery</option>
                <option value="Professional Services">Professional Services</option>
              </select>

              <label>Password</label>
              <input type="password" name="password" placeholder="Create a password" value={formData.password} onChange={handleChange} required />

              {error && (
                <p className="auth-error" style={{
                  color: '#e53e3e', 
                  backgroundColor: '#fff5f5', 
                  padding: '10px', 
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  border: '1px solid #feb2b2',
                  marginTop: '10px'
                }}>
                  {error}
                </p>
              )}

              <button type="submit" className="auth-submit-btn" disabled={loading} style={{ marginTop: '20px' }}>
                {loading ? "Creating Account..." : "Create Provider Account"}
              </button>
            </form>

            <div className="auth-footer">
              <p>Already have a provider account? <span className="auth-inline-link" onClick={() => navigate("/provider-login")} style={{ cursor: "pointer", fontWeight: 'bold' }}>Login</span></p>
            </div>
          </>
        ) : (
          <div className="auth-success" style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '10px' }}>✅</div>
            <h2>Account Created!</h2>
            <p>Your provider account is ready. You can now log in to manage your services.</p>
            <button className="auth-submit-btn" onClick={() => navigate("/provider-login")} style={{ marginTop: '20px' }}>
              Go to Provider Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProviderSignup;