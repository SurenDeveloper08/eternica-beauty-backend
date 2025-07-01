const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");

const injectData = (template, data) => {
    return template.replace(/{{(.*?)}}/g, (_, key) => data[key.trim()] || '');
};
const generateItemsTable = (items) => {
    return items.map((item) => `
       <tr>
                      <td align="left" valign="top" style="padding: 8px 0px 16px 16px; height: auto;">
                       <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                        <tr>
                         <td>
                          <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                           <tr>
                            <td valign="top">
                             <table border="0" cellpadding="0" cellspacing="0" role="presentation">
                              <tr>
                               <th valign="top" style="font-weight: normal; text-align: left;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                                 <tr>
                                  <td class="pc-w620-spacing-0-16-20-0" valign="top" style="padding: 0px 20px 0px 0px; height: auto;">
                                   <img src="${item?.product?.image}" alt="${item?.product?.productName}" class="pc-w620-width-64 pc-w620-height-64 pc-w620-width-64-min" width="100" height="104" alt="" style="display: block; outline: 0; line-height: 100%; -ms-interpolation-mode: bicubic; width: 100px; height: 104px; border: 0;" />
                                  </td>
                                 </tr>
                                </table>
                               </th>
                               <th valign="top" style="font-weight: normal; text-align: left;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                                 <tr>
                                  <td>
                                   <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                                    <tr>
                                     <td valign="top">
                                      <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                                       <tr>
                                        <th valign="top" style="font-weight: normal; text-align: left; padding: 0px 0px 4px 0px;">
                                         <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                                          <tr>
                                           <td valign="top" style="padding: 9px 0px 0px 0px; height: auto;">
                                            <div class="pc-font-alt pc-w620-fontSize-16 pc-w620-lineHeight-26" style="line-height: 140%; letter-spacing: -0.03em; font-family: 'Poppins', Arial, Helvetica, sans-serif; font-size: 16px; font-weight: 600; color: #001942;">
                                             <div><span>${item?.product?.productName}</span>
                                             </div>
                                            </div>
                                           </td>
                                          </tr>
                                         </table>
                                        </th>
                                       </tr>
                                   <tr>
                                        <th valign="top" style="font-weight: normal; text-align: left;">
                                         <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                                          <tr>
                                           <td valign="top">
                                            <div class="pc-font-alt" style="line-height: 140%; letter-spacing: -0.03em; font-family: 'Poppins', Arial, Helvetica, sans-serif; font-size: 14px; font-weight: normal; color: #53627a;">
                                             <div><span>Qty: ${item.quantity}</span>
                                             </div>
                                            </div>
                                           </td>
                                          </tr>
                                         </table>
                                        </th>
                                       </tr>
                                      </table>
                                     </td>
                                    </tr>
                                   </table>
                                  </td>
                                 </tr>
                                </table>
                               </th>
                              </tr>
                             </table>
                            </td>
                           </tr>
                          </table>
                         </td>
                        </tr>
                       </table>
                      </td>
                      <td class="pc-w620-padding-18-32-24-16" align="right" valign="top" style="padding: 16px 16px 24px 16px; height: auto;">
                       <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                        <tr>
                         <td valign="top" align="right">
                          <div class="pc-font-alt pc-w620-fontSize-16 pc-w620-lineHeight-20" style="line-height: 140%; letter-spacing: -0.03em; font-family: 'Poppins', Arial, Helvetica, sans-serif; font-size: 16px; font-weight: normal; color: #001942; text-align: right; text-align-last: right;">
                           <div><span style="color: #001942;">AED ${item.subtotal}</span>
                           </div>
                          </div>
                         </td>
                        </tr>
                       </table>
                      </td>
                     </tr>
    `).join('');
};



const sendEmail = async (to, subject, type, data, status) => {

    let templatePath = '';
   
    switch (status) {
        case 'Ordered':
            templatePath = path.join(__dirname, `../templates/${type}.html`);
            break;
        case 'Shipped':
           
        templatePath = path.resolve(__dirname, '../templates/Shipped.html');
            break;
        case 'Out for Delivery':
           templatePath = path.resolve(__dirname, '../templates/OutforDelivery.html');
            break;
        case 'Delivered':
            templatePath = path.resolve(__dirname, `../templates/Delivered${type}.html`);
            break;
        default:
            return; // Exit early if no template
    }

    // Validate if file exists
    if (!fs.existsSync(templatePath)) {
        console.error(`❌ Email template not found: ${templatePath}`);
        return;
    }
   const rawHtml = fs.readFileSync(templatePath, 'utf-8');
    const html = injectData(rawHtml, {
        customerName: data?.shippingInfo?.name,
        orderNumber: data?.orderNumber,
        address: data?.shippingInfo?.address,
        city: data?.shippingInfo?.city,
        country: data?.shippingInfo?.country,
        phone: data?.shippingInfo?.phone,
        email: data?.shippingInfo?.email,
        deliveryCharge: data?.deliveryCharge ? `AED ${data.deliveryCharge}` : 'Free',
        total: data.amount,
        itemsTable: generateItemsTable(data.items),
    });
   const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        auth: {
            user: process.env.SMTP_EMAIL,
            pass: process.env.SMTP_PASS,
        },
    });
   const mailOptions = {
        from: `"SPA STORE" <${process.env.SMTP_EMAIL}>`,
        to,
        subject,
        html,
    };

    await transporter.sendMail(mailOptions);
   };


module.exports = sendEmail;
