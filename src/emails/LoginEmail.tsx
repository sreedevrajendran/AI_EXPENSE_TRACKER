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
} from "@react-email/components";
import * as React from "react";

interface LoginEmailProps {
    userFirstname: string;
    loginUrl?: string;
}

export const LoginEmail = ({ userFirstname, loginUrl = "https://floww.finance" }: LoginEmailProps) => {
    return (
        <Html>
            <Head />
            <Preview>Secure sign-in to Floww 🔒</Preview>
            <Body style={main}>
                <Container style={container}>
                    <Text style={paragraph}>Hi {userFirstname},</Text>
                    <Text style={paragraph}>Welcome back to Floww!</Text>
                    <Text style={paragraph}>
                        We noticed a successful sign-in to your account just now via Google.
                    </Text>
                    <Text style={paragraph}>
                        If this was you, you can safely ignore this email and head straight
                        to your dashboard to check out your latest financial insights.
                    </Text>
                    <Text style={paragraph}>
                        If you did not authorize this login, please ensure your Google account
                        is secure and contact us immediately by replying to this email.
                    </Text>
                    <Text style={paragraph}>
                        Keep flowing!<br />
                        <strong>The Floww Team</strong>
                    </Text>
                    <Section style={btnContainer}>
                        <Button style={button} href={loginUrl}>
                            Open Floww
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

export default LoginEmail;

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
