'use server';

/**
 * @fileOverview Brevo Email Service for Digital Class.
 * Handles automated SMTP transmissions for user lifecycle events.
 */

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const SENDER_EMAIL = "sales@digitalclassworld.com";
const SENDER_NAME = "Digital Class";

interface WelcomeEmailParams {
  toEmail: string;
  businessName: string;
}

/**
 * Sends a welcome email to new institutes using the Brevo API.
 */
export async function sendWelcomeEmail({ toEmail, businessName }: WelcomeEmailParams) {
  const endpoint = "https://api.brevo.com/v3/smtp/email";

  const htmlContent = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; padding: 30px; border-radius: 20px; background-color: #ffffff;">
      <h2 style="color: #0D9488; margin-top: 0; font-size: 24px;">Welcome to Digital Class! 🚀</h2>
      <p style="font-size: 16px;">Dear <strong>${businessName}</strong>,</p>
      <p style="font-size: 15px;">Welcome to Digital Class, India’s First Ed-Tech Marketplace & SAAS Platform.</p>
      <p style="font-size: 15px;">Your 3-Day Free Trial has been successfully activated. You can now start exploring our AI-Integrated Institute/School Management System along with Digital Class Marketplace, designed to help education providers manage operations, increase visibility, and grow their business online.</p>
      
      <div style="background-color: #f8fafc; padding: 20px; border-radius: 15px; margin: 25px 0; border: 1px solid #f1f5f9;">
        <h3 style="color: #1e3a8a; font-size: 16px; margin-top: 0; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; text-transform: uppercase; letter-spacing: 1px;">With Digital Class, you can:</h3>
        <ul style="list-style: none; padding-left: 0; margin-bottom: 0;">
          <li style="margin-bottom: 10px; display: flex; align-items: center;">✅ Manage Students, Fees, Admissions & Academic Records in one platform</li>
          <li style="margin-bottom: 10px; display: flex; align-items: center;">✅ Run your Institute/School through Web & Mobile App anytime, anywhere</li>
          <li style="margin-bottom: 10px; display: flex; align-items: center;">✅ Get a Dynamic SEO-Enabled Website to attract students from Google</li>
          <li style="margin-bottom: 10px; display: flex; align-items: center;">✅ Automate Daily Operations and save valuable administrative time</li>
          <li style="margin-bottom: 0; display: flex; align-items: center;">✅ Track Reports, Analytics & Performance in real time</li>
        </ul>
      </div>

      <div style="background-color: #fffaf0; padding: 20px; border-radius: 15px; margin: 25px 0; border: 1px solid #feebc8;">
        <h3 style="color: #c05621; font-size: 16px; margin-top: 0; border-bottom: 2px solid #fbd38d; padding-bottom: 8px; text-transform: uppercase; letter-spacing: 1px;">Marketplace Growth Opportunities:</h3>
        <ul style="list-style: none; padding-left: 0; margin-bottom: 0;">
          <li style="margin-bottom: 10px; display: flex; align-items: center;">🌟 Increase Visibility by listing your institute and courses on the Digital Class Marketplace</li>
          <li style="margin-bottom: 10px; display: flex; align-items: center;">🌟 Sell & Monetize Your Courses Online to reach students across India</li>
          <li style="margin-bottom: 10px; display: flex; align-items: center;">🌟 Promote your institute through Marketplace Advertisements</li>
          <li style="margin-bottom: 0; display: flex; align-items: center;">🌟 Generate more inquiries and admissions through our education platform</li>
        </ul>
      </div>

      <div style="margin: 35px 0; text-align: center;">
        <a href="https://erp.digitalclassworld.in" style="background-color: #0D9488; color: white; padding: 18px 35px; text-decoration: none; border-radius: 12px; font-weight: bold; display: inline-block; font-size: 16px; box-shadow: 0 4px 15px rgba(13, 148, 136, 0.2);">🔹 Login Now to Your Account</a>
      </div>

      <p style="font-size: 14px; color: #64748b; line-height: 1.8;">Digital Class is designed to help institutes and schools digitize their operations, expand their reach, and grow faster in the digital education ecosystem.</p>
      
      <p style="font-size: 14px; color: #64748b;">If you need any assistance, our team will be happy to support you.</p>
      <p style="font-size: 14px; color: #64748b;">You can reach us at <a href="mailto:sales@digitalclassworld.com" style="color: #0D9488; font-weight: bold; text-decoration: none;">sales@digitalclassworld.com</a> for further assistance.</p>
      
      <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 30px 0;" />
      <p style="font-size: 14px; color: #1e3a8a; font-weight: bold; margin-bottom: 5px;">
        Best Regards,
      </p>
      <p style="font-size: 14px; color: #0D9488; font-weight: 900; margin-top: 0; text-transform: uppercase;">
        Team Digital Class for ${businessName}
      </p>
    </div>
  `;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        sender: { name: SENDER_NAME, email: SENDER_EMAIL },
        to: [{ email: toEmail, name: businessName }],
        subject: "Welcome to Digital Class – Your 3-Day Free Trial is Now Active 🚀",
        htmlContent: htmlContent
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Brevo API Error Details:", errorData);
      return { success: false, error: errorData };
    }

    return { success: true };
  } catch (error) {
    console.error("Email Service Fetch Error:", error);
    return { success: false, error };
  }
}
