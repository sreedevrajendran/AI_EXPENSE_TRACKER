import {
    Body,
    Button,
    Container,
    Head,
    Hr,
    Html,
    Preview,
    Section,
    Text,
    Img,
} from "@react-email/components";
import * as React from "react";

interface WelcomeEmailProps {
    userFirstname: string;
    loginUrl?: string;
}

export const WelcomeEmail = ({ userFirstname, loginUrl = "https://floww.finance" }: WelcomeEmailProps) => {
    return (
        <Html>
            <Head />
            <Preview>Welcome to Floww ✨ Your financial clarity starts here.</Preview>
            <Body style={main}>
                <Container style={container}>
                    <Text style={paragraph}>Hi {userFirstname},</Text>
                    <Text style={paragraph}>
                        Welcome to <strong>Floww</strong>! We are thrilled to have you onboard.
                    </Text>
                    <Text style={paragraph}>
                        Managing your finances shouldn’t feel like a chore. That’s why we built Floww to be more than just an expense tracker—it's your personal AI Document Intelligence + Financial Analytics Platform.
                    </Text>

                    <Section style={listSection}>
                        <Text style={listHeading}>Here is what you can do right now to get started:</Text>
                        <Text style={listItem}>
                            <strong>📷 Snap a Receipt:</strong> Head over to the scanner and upload a grocery bill or bank statement. Our AI will automatically extract the items, categorize them, and log the amount.
                        </Text>
                        <Text style={listItem}>
                            <strong>💬 Ask Agent Floww:</strong> Got a question about your spending? Just ask Agent Floww. It understands your context and can give you real-time analytics.
                        </Text>
                        <Text style={listItem}>
                            <strong>🎯 Set a Budget:</strong> Jump into the Budgets tab to set up your first monthly goal.
                        </Text>
                    </Section>

                    <Text style={paragraph}>
                        If you ever have questions, reply directly to this email. We are here to help you gain total clarity over your financial health.
                    </Text>
                    <Text style={paragraph}>
                        Cheers,<br />
                        <strong>The Floww Team</strong>
                    </Text>

                    <Section style={btnContainer}>
                        <Button style={button} href={loginUrl}>
                            Go to Dashboard
                        </Button>
                    </Section>

                    <Hr style={hr} />
                    <Text style={footer}>
                        Floww — AI Document Intelligence + Financial Analytics Platform.
                    </Text>
                </Container>
            </Body>
        </Html>
    );
};

export default WelcomeEmail;

const main = {
    backgroundColor: "#f6f9fc",
    fontFamily:
        '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
    backgroundColor: "#ffffff",
    margin: "0 auto",
    padding: "20px 0 48px",
    marginBottom: "64px",
    borderRadius: "12px",
    maxWidth: "600px",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)",
};

const paragraph = {
    fontSize: "16px",
    lineHeight: "26px",
    color: "#333",
    padding: "0 48px",
};

const listSection = {
    padding: "10px 48px",
    backgroundColor: "#f9fafc",
    borderRadius: "8px",
    margin: "20px 48px",
};

const listHeading = {
    fontSize: "16px",
    fontWeight: "bold",
    color: "#111",
    marginBottom: "12px",
};

const listItem = {
    fontSize: "14px",
    lineHeight: "22px",
    color: "#444",
    marginBottom: "10px",
};

const btnContainer = {
    textAlign: "center" as const,
    marginTop: "32px",
};

const button = {
    backgroundColor: "#007AFF",
    borderRadius: "8px",
    color: "#fff",
    fontSize: "16px",
    textDecoration: "none",
    textAlign: "center" as const,
    display: "block",
    padding: "12px 24px",
    margin: "0 auto",
    width: "200px",
    fontWeight: "bold",
};

const hr = {
    borderColor: "#e6ebf1",
    margin: "20px 0",
};

const footer = {
    color: "#8898aa",
    fontSize: "12px",
    textAlign: "center" as const,
    marginTop: "12px",
};
