import { sendEmail } from "./nodemailer.js";
import {
  welcomeUserTemplate,
  newUserAdminTemplate,
} from "../templates/welcomeEmail.js";

export const notifyRegistration = async (user, method = "email") => {
  try {
    const welcome = welcomeUserTemplate(user);
    await sendEmail({
      email: user.email,
      subject: welcome.subject,
      message: welcome.html,
    });
  } catch (error) {
    console.error("Failed to send welcome email:", error.message);
  }

  const admins = (process.env.ADMIN_NOTIFY_EMAILS || "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);

  if (admins.length) {
    try {
      const adminMail = newUserAdminTemplate({ ...user, method });
      await sendEmail({
        email: admins.join(","),
        subject: adminMail.subject,
        message: adminMail.html,
      });
    } catch (error) {
      console.error("Failed to send admin notification:", error.message);
    }
  }
};
