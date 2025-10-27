import transporter from "../utils/transporter.js";
const logo = "https://eternicabeauty.com/data/logo/white-logo.png";

const emailTemplate = (title, body) => `
  <div style="background-color:#f8f9fa; padding:30px 0; font-family:Arial, sans-serif;">
    <div style="max-width:600px; margin:0 auto; background-color:#fff; border-radius:10px; overflow:hidden; box-shadow:0 2px 10px rgba(0,0,0,0.1);">
      <div style="background-color:#4C348C; padding:20px; text-align:center;">
        <img src="${logo}" alt="Eternica Beauty" style="max-height:60px;" />
      </div>
      <div style="padding:30px;">
        <h2 style="color:#4C348C; text-align:center;">${title}</h2>
        <div style="font-size:16px; color:#555; line-height:1.6;">${body}</div>
        <hr style="margin:25px 0; border:0; border-top:1px solid #eee;" />
        <p style="text-align:center; font-size:13px; color:#999;">
          © ${new Date().getFullYear()} Eternica Beauty. All rights reserved.
        </p>
      </div>
    </div>
  </div>
`;

export const sendCustomerEmail = async (order, name, email) => {
    const productList = order.items
        .map(
            (item) => `
      <tr>
        <td style="padding:10px 0; border-bottom:1px solid #eee;">
          <img src="${item.image}" width="60" style="border-radius:8px; vertical-align:middle;" />
        </td>
        <td style="padding:10px 15px; border-bottom:1px solid #eee;">
          <strong>${item.productName}</strong>
        </td>
      </tr>
    `
        )
        .join("");

    const body = `
    <p>Hi <strong>${name}</strong>,</p>
    <p>Thank you for your order! Your order number is <strong>${order.orderNumber}</strong>.</p>
    <table style="width:100%; border-collapse:collapse; margin-top:20px;">
      ${productList}
    </table>
    <p style="margin-top:20px;">We will contact you soon regarding shipping details.</p>
  `;

    await transporter.sendMail({
        from: `"Eternica Beauty" <${process.env.SMTP_FROM_EMAIL}>`,
        to: email,
        subject: `Order Confirmation - Eternica Beauty`,
        html: emailTemplate("Order Confirmation", body),
    });
};

export const sendCompanyEmail = async (order, name, email, phone, address) => {
    const productList = order.items
        .map(
            (item) => `
      <tr>
        <td style="padding:10px 0; border-bottom:1px solid #eee;">
          <img src="${item.image}" width="60" style="border-radius:8px; vertical-align:middle;" />
        </td>
        <td style="padding:10px 15px; border-bottom:1px solid #eee;">
          <strong>${item.productName}</strong>
        </td>
      </tr>
    `
        )
        .join("");

    const body = `
      <p><strong>Order Number:</strong> ${order.orderNumber}</p>
    <table style="width:100%; border-collapse:collapse; margin-top:20px; margin-bottom:20px;">
      ${productList}
    </table>
    <p><strong>Customer:</strong> ${name}</p>
    <p><strong>Email:</strong> ${email}</p>
    <p><strong>Phone:</strong> ${phone}</p>
    <p><strong>Address:</strong> ${address}</p>
  `;

    await transporter.sendMail({
        from: `"Eternica Beauty" <${process.env.SMTP_FROM_EMAIL}>`,
        to: process.env.SMTP_EMAIL,
        subject: `New Order - ${order.orderNumber}`,
        html: emailTemplate("New Order Received", body),
    });
};
