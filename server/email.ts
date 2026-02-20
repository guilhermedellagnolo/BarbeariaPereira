import nodemailer from "nodemailer";

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.warn("EMAIL_USER or EMAIL_PASS not set. Email sending will be disabled.");
}

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // true for 465, false for other ports
  pool: true, // Keep connections open
  connectionTimeout: 10000, // 10 seconds timeout
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS?.replace(/\s+/g, ''),
  },
});

transporter.verify(function (error, success) {
  if (error) {
    console.error("❌ Erro na configuração do Nodemailer:", error);
  }
});

export async function sendBookingConfirmation(
  email: string,
  name: string,
  serviceName: string,
  date: string,
  time: string,
  price: number
) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn("Skipping email confirmation: Credentials missing");
    return;
  }

  const formattedPrice = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(price / 100);

  const html = `
    <div style="font-family: monospace; background-color: #050505; color: #ffffff; padding: 40px; text-align: center;">
      <div style="max-width: 600px; margin: 0 auto; border: 1px solid rgba(255,255,255,0.1); padding: 40px;">
        <h1 style="font-size: 24px; letter-spacing: 0.2em; margin-bottom: 40px; text-transform: uppercase;">Barbearia Pereira</h1>
        
        <p style="font-size: 14px; color: rgba(255,255,255,0.7); margin-bottom: 40px;">
          Olá ${name},<br><br>
          O seu agendamento foi confirmado com sucesso.
        </p>
        
        <div style="background-color: rgba(255,255,255,0.05); padding: 20px; text-align: left; margin-bottom: 40px;">
          <p style="margin: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px;">
            <span style="color: rgba(255,255,255,0.4); text-transform: uppercase; font-size: 10px; letter-spacing: 0.1em;">Serviço</span><br>
            ${serviceName}
          </p>
          <p style="margin: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px;">
            <span style="color: rgba(255,255,255,0.4); text-transform: uppercase; font-size: 10px; letter-spacing: 0.1em;">Data & Hora</span><br>
            ${date} às ${time}
          </p>
          <p style="margin: 10px 0;">
            <span style="color: rgba(255,255,255,0.4); text-transform: uppercase; font-size: 10px; letter-spacing: 0.1em;">Valor</span><br>
            ${formattedPrice}
          </p>
        </div>
        
        <p style="font-size: 12px; color: rgba(255,255,255,0.3);">
          Caso precise cancelar, entre em contacto com antecedência.<br>
          Estamos à sua espera.
        </p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `"Barbearia Pereira" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Confirmação de Agendamento - Barbearia Pereira",
    html,
  });
}
