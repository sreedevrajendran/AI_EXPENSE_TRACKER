import { Resend } from 'resend';
import { WelcomeEmail } from '@/emails/WelcomeEmail';
import { LoginEmail } from '@/emails/LoginEmail';

const resend = new Resend(process.env.RESEND_API_KEY);
// For testing on the free tier, we MUST send the email to the verified domain/email, which is the email address used to sign up for Resend.
// In production with a verified domain, this would be `onboarding@yourdomain.com`
const SENDER_EMAIL = 'onboarding@resend.dev';

export async function sendWelcomeEmail(email: string, name: string) {
    if (!process.env.RESEND_API_KEY) {
        console.warn("RESEND_API_KEY not set. Skipping welcome email.");
        return;
    }

    try {
        const firstName = name?.split(' ')[0] || 'there';
        const { data, error } = await resend.emails.send({
            from: `Floww <${SENDER_EMAIL}>`,
            to: email, // Free tier requires this to be your verified email if domain isn't verified
            subject: 'Welcome to Floww ✨ Your financial clarity starts here.',
            react: WelcomeEmail({ userFirstname: firstName }),
        });

        if (error) {
            console.error("Failed to send welcome email via Resend:", error);
            return { success: false, error };
        }

        console.log("Welcome email sent successfully:", data);
        return { success: true, data };
    } catch (error) {
        console.error("Exception sending welcome email:", error);
        return { success: false, error };
    }
}

export async function sendLoginEmail(email: string, name: string) {
    if (!process.env.RESEND_API_KEY) {
        console.warn("RESEND_API_KEY not set. Skipping login email.");
        return;
    }

    try {
        const firstName = name?.split(' ')[0] || 'there';
        const { data, error } = await resend.emails.send({
            from: `Floww Security <${SENDER_EMAIL}>`,
            to: email, // Free tier: must be verified email
            subject: 'Secure sign-in to Floww 🔒',
            react: LoginEmail({ userFirstname: firstName }),
        });

        if (error) {
            console.error("Failed to send login email via Resend:", error);
            return { success: false, error };
        }

        console.log("Login email sent successfully:", data);
        return { success: true, data };
    } catch (error) {
        console.error("Exception sending login email:", error);
        return { success: false, error };
    }
}
