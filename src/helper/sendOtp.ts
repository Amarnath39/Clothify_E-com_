import axios from 'axios'

export const sendOtp = async (mobileNumber: string, otp: string) => {
    const apiKey = process.env.SMS_AUTH_KEY; // Replace with your MSG91 auth key
    const sender = process.env.SMS_SENDER_ID; // Replace with your MSG91 sender ID
    // const templateId = process.env.SMS_TEMPLATE_ID; // Replace with your MSG91 template ID
    // const route = 4; // MSG91 Route (Transactional: 4, Promotional: 1)
    const countryCode = '91'; // Country Code for India

    try {
        const response = await axios.post(`https://control.msg91.com/api/v5/widget/verifyAccessToken`, {
            mobile: `${countryCode}${mobileNumber}`,
            authkey: apiKey,
            sender,
            // template_id: templateId,
            otp,
            otp_length: otp.length,
            otp_expiry: 10, // OTP expiration time in minutes
        }, {headers: {
            'Content-Type': "application/json"
        }});
        console.log('OTP sent successfully:', response.data);
    } catch (error) {
        console.error('Error sending OTP:', error.response ? error.response.data : error.message);
    }
};
