import { createTransport, getTestMessageUrl } from "nodemailer";

const transport = createTransport({
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT),
    secure: false,
    requireTLS: true,
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
    },
    logger: true
});  

const createEmail = (resetToken: string) : string => `
    <div style="
        border: 1px solid #000;
        padding: 20px;
        font-family: sans-serif;
        line-height: 2;
        font-size: 20px;
    ">
        <h2>Hello</h2>
        <p>You password reset token is here</p>
        <a href="${process.env.FRONTEND_URL}/reset?token=${resetToken}">Click Here to reset your password</a>
    </div>
`;

interface Envelope {
    from: string;
    to: string[] | null;
}

interface MailResponse {
    accepted?: string[] | null;
    rejected?: null[] | null;
    envelopeTime: number;
    messageTime: number;
    messageSize: number;
    response: string;
    envelope: Envelope;
    messageId: string;
}

export const sendEmail = async (resetToken: string, to: string) => {
    const info = (await transport.sendMail({
        to,
        from: 'support@dice.com',
        subject: 'Password reset token',
        html: createEmail(resetToken)
    })) as MailResponse;

    if (process.env.MAIL_USER.includes('ethereal.email')) {
        console.log(`Email sent | Preview ${getTestMessageUrl(info)}`)
    }
};