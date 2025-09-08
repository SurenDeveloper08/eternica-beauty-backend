const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");

const injectData = (template, data) => {
    return template.replace(/{{(.*?)}}/g, (_, key) => data[key.trim()] || '');
};

const generateItemsTablenew = (items, currency) => {
    return items.map((item) => ` <tr>
                                                                                                                                                    <td class="m_2965410129824235511pc-w620-halign-left m_2965410129824235511pc-w620-valign-middle m_2965410129824235511pc-w620-padding-20-0-20-20 m_2965410129824235511pc-w620-width-100pc"
                                                                                                                                                        align="left"
                                                                                                                                                        valign="middle"
                                                                                                                                                        style="padding:20px 0px 20px 20px;border-bottom:1px solid #d1dfe3;height:auto">
                                                                                                                                                        <table
                                                                                                                                                            width="100%"
                                                                                                                                                            border="0"
                                                                                                                                                            cellpadding="0"
                                                                                                                                                            cellspacing="0"
                                                                                                                                                            role="presentation">
                                                                                                                                                            <tbody>
                                                                                                                                                                <tr>
                                                                                                                                                                    <td class="m_2965410129824235511pc-w620-spacing-0-0-12-0 m_2965410129824235511pc-w620-align-left"
                                                                                                                                                                        valign="top"
                                                                                                                                                                        style="padding:0px 20px 12px 0px;height:auto">
                                                                                                                                                                        <img src="${item?.product?.image}" alt="${item?.product?.productName}"
                                                                                                                                                                        class="m_2965410129824235511pc-w620-align-left"
                                                                                                                                                                            width="102"
                                                                                                                                                                            height="102"
                                                                                                                                                                            alt=""
                                                                                                                                                                            style="display:block;outline:0;line-height:100%;width:102px;height:auto;max-width:100%;border-radius:6px 6px 6px 6px;border:0">
                                                                                                                                                                    </td>
                                                                                                                                                                </tr>
                                                                                                                                                            </tbody>
                                                                                                                                                        </table>
                                                                                                                                                         <table
                                                                                                                                                            width="100%"
                                                                                                                                                            border="0"
                                                                                                                                                            cellpadding="0"
                                                                                                                                                            cellspacing="0"
                                                                                                                                                            role="presentation">
                                                                                                                                                            <tbody>
                                                                                                                                                                <tr>
                                                                                                                                                                    <td class="m_2965410129824235511pc-w620-align-left"
                                                                                                                                                                        valign="top"
                                                                                                                                                                        style="padding:0px 0px 2px 0px;height:auto">
                                                                                                                                                                        <table
                                                                                                                                                                            border="0"
                                                                                                                                                                            cellpadding="0"
                                                                                                                                                                            cellspacing="0"
                                                                                                                                                                            role="presentation"
                                                                                                                                                                            class="m_2965410129824235511pc-w620-align-left"
                                                                                                                                                                            width="100%">
                                                                                                                                                                            <tbody>
                                                                                                                                                                                <tr>
                                                                                                                                                                                    <td valign="top"
                                                                                                                                                                                        class="m_2965410129824235511pc-w620-align-left">
                                                                                                                                                                                        <div class="m_2965410129824235511pc-w620-align-left"
                                                                                                                                                                                            style="line-height:24px;letter-spacing:-0px;font-family:'Nunito Sans',Arial,Helvetica,sans-serif;font-size:14px;font-weight:600;color:#121212cc">
                                                                                                                                                                                            <div>
                                                                                                                                                                                                <span>${item?.product?.productName}</span>
                                                                                                                                                                                            </div>
                                                                                                                                                                                        </div>
                                                                                                                                                                                    </td>
                                                                                                                                                                                </tr>
                                                                                                                                                                            </tbody>
                                                                                                                                                                        </table>
                                                                                                                                                                    </td>
                                                                                                                                                                </tr>
                                                                                                                                                            </tbody>
                                                                                                                                                        </table>
                                                                                                                                                         ${item?.color ?
            `<table
                                                                                                                                                            width="100%"
                                                                                                                                                            border="0"
                                                                                                                                                            cellpadding="0"
                                                                                                                                                            cellspacing="0"
                                                                                                                                                            role="presentation">
                                                                                                                                                            <tbody>
                                                                                                                                                                <tr>
                                                                                                                                                                    <td class="m_2965410129824235511pc-w620-align-left"
                                                                                                                                                                        valign="top"
                                                                                                                                                                        style="padding:0px 0px 2px 0px;height:auto">
                                                                                                                                                                        <table
                                                                                                                                                                            border="0"
                                                                                                                                                                            cellpadding="0"
                                                                                                                                                                            cellspacing="0"
                                                                                                                                                                            role="presentation"
                                                                                                                                                                            class="m_2965410129824235511pc-w620-align-left"
                                                                                                                                                                            width="100%">
                                                                                                                                                                            <tbody>
                                                                                                                                                                                <tr>
                                                                                                                                                                                    <td valign="top"
                                                                                                                                                                                        class="m_2965410129824235511pc-w620-align-left">
                                                                                                                                                                                        <div class="m_2965410129824235511pc-w620-align-left m_2965410129824235511pc-w620-fontSize-14px m_2965410129824235511pc-w620-lineHeight-24"
                                                                                                                                                                                            style="line-height:24px;letter-spacing:-0px;font-family:'Nunito Sans',Arial,Helvetica,sans-serif;font-size:14px;font-weight:600;color:#121212cc">
                                                                                                                                                                                            <div>
                                                                                                                                                                                                <span>Color
                                                                                                                                                                                                    :
                                                                                                                                                                                                    ${item?.color}</span>
                                                                                                                                                                                            </div>
                                                                                                                                                                                        </div>
                                                                                                                                                                                    </td>
                                                                                                                                                                                </tr>
                                                                                                                                                                            </tbody>
                                                                                                                                                                        </table>
                                                                                                                                                                    </td>
                                                                                                                                                                </tr>
                                                                                                                                                            </tbody>
                                                                                                                                                        </table>`: ''
        }
                                                                                                                                                          ${item?.size ?
            `<table
                                                                                                                                                            width="100%"
                                                                                                                                                            border="0"
                                                                                                                                                            cellpadding="0"
                                                                                                                                                            cellspacing="0"
                                                                                                                                                            role="presentation">
                                                                                                                                                            <tbody>
                                                                                                                                                                <tr>
                                                                                                                                                                    <td class="m_2965410129824235511pc-w620-align-left"
                                                                                                                                                                        valign="top"
                                                                                                                                                                        style="padding:0px 0px 2px 0px;height:auto">
                                                                                                                                                                        <table
                                                                                                                                                                            border="0"
                                                                                                                                                                            cellpadding="0"
                                                                                                                                                                            cellspacing="0"
                                                                                                                                                                            role="presentation"
                                                                                                                                                                            class="m_2965410129824235511pc-w620-align-left"
                                                                                                                                                                            width="100%">
                                                                                                                                                                            <tbody>
                                                                                                                                                                                <tr>
                                                                                                                                                                                    <td valign="top"
                                                                                                                                                                                        class="m_2965410129824235511pc-w620-align-left">
                                                                                                                                                                                        <div class="m_2965410129824235511pc-w620-align-left"
                                                                                                                                                                                            style="line-height:24px;letter-spacing:-0px;font-family:'Nunito Sans',Arial,Helvetica,sans-serif;font-size:14px;font-weight:600;color:#121212cc">
                                                                                                                                                                                            <div>
                                                                                                                                                                                                <span>Variant / Size
                                                                                                                                                                                                    :
                                                                                                                                                                                                  ${item.size}
                                                                                                                                                                                                </span>
                                                                                                                                                                                            </div>
                                                                                                                                                                                        </div>
                                                                                                                                                                                    </td>
                                                                                                                                                                                </tr>
                                                                                                                                                                            </tbody>
                                                                                                                                                                        </table>
                                                                                                                                                                    </td>
                                                                                                                                                                </tr>
                                                                                                                                                            </tbody>
                                                                                                                                                        </table>`: ''
        }
                                                                                                                                                        <table
                                                                                                                                                            border="0"
                                                                                                                                                            cellpadding="0"
                                                                                                                                                            cellspacing="0"
                                                                                                                                                            role="presentation"
                                                                                                                                                            class="m_2965410129824235511pc-w620-align-left"
                                                                                                                                                            width="100%">
                                                                                                                                                            <tbody>
                                                                                                                                                                <tr>
                                                                                                                                                                    <td valign="top"
                                                                                                                                                                        class="m_2965410129824235511pc-w620-align-left">
                                                                                                                                                                        <div class="m_2965410129824235511pc-w620-align-left"
                                                                                                                                                                            style="line-height:24px;letter-spacing:-0px;font-family:'Nunito Sans',Arial,Helvetica,sans-serif;font-size:14px;font-weight:600;color:#121212cc">
                                                                                                                                                                            <div>
                                                                                                                                                                                <span>Quantity:
                                                                                                                                                                                    ${item.quantity}</span>
                                                                                                                                                                            </div>
                                                                                                                                                                        </div>
                                                                                                                                                                    </td>
                                                                                                                                                                </tr>
                                                                                                                                                            </tbody>
                                                                                                                                                        </table>
                                                                                                                                                        ${item?.eligible === false ?
            `<table
    width="100%"
    border="0"
    cellpadding="0"
    cellspacing="0"
    role="presentation">
    <tbody>
        <tr>
            <td class="m_2965410129824235511pc-w620-align-left"
                valign="top"
                style="padding:0px 0px 2px 0px;height:auto">
                <table
                    border="0"
                    cellpadding="0"
                    cellspacing="0"
                    role="presentation"
                    class="m_2965410129824235511pc-w620-align-left"
                    width="100%">
                    <tbody>
                        <tr>
                            <td valign="top"
                                class="m_2965410129824235511pc-w620-align-left">
                                <div class="m_2965410129824235511pc-w620-align-left m_2965410129824235511pc-w620-fontSize-14px m_2965410129824235511pc-w620-lineHeight-24"
                                    style="line-height:24px;letter-spacing:-0px;font-family:'Nunito Sans',Arial,Helvetica,sans-serif;font-size:14px;font-weight:600;color:#121212cc">
                                    <div>
                                      <span style="color: red;">Undeliverable</span>
                                    </div>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </td>
        </tr>
    </tbody>
</table>` : ''
        }

                                                                                                                                                    </td>
                                                                                                                                                    <td class="m_2965410129824235511pc-w620-halign-right m_2965410129824235511pc-w620-valign-bottom m_2965410129824235511pc-w620-padding-20-20-20-0 m_2965410129824235511pc-w620-width-100pc"
                                                                                                                                                        align="right"
                                                                                                                                                        valign="bottom"
                                                                                                                                                        style="padding:0px 20px 20px 0px;border-bottom:1px solid #d1dfe3;height:auto">
                                                                                                                                                        <table
                                                                                                                                                            width="100%"
                                                                                                                                                            border="0"
                                                                                                                                                            cellpadding="0"
                                                                                                                                                            cellspacing="0"
                                                                                                                                                            role="presentation">
                                                                                                                                                            <tbody>
                                                                                                                                                                <tr>
                                                                                                                                                                    <td class="m_2965410129824235511pc-w620-spacing-0-0-0-0 m_2965410129824235511pc-w620-align-right"
                                                                                                                                                                        align="right"
                                                                                                                                                                        valign="top">
                                                                                                                                                                        <table
                                                                                                                                                                            border="0"
                                                                                                                                                                            cellpadding="0"
                                                                                                                                                                            cellspacing="0"
                                                                                                                                                                            role="presentation"
                                                                                                                                                                            class="m_2965410129824235511pc-w620-align-right"
                                                                                                                                                                            width="100%">
                                                                                                                                                                            <tbody>
                                                                                                                                                                                <tr>
                                                                                                                                                                                    <td valign="top"
                                                                                                                                                                                        class="m_2965410129824235511pc-w620-padding-0-0-0-0 m_2965410129824235511pc-w620-align-right"
                                                                                                                                                                                        align="right">
                                                                                                                                                                                        <div class="m_2965410129824235511pc-w620-align-right"
                                                                                                                                                                                            style="text-decoration:none">
                                                                                                                                                                                            <div
                                                                                                                                                                                                style="font-size:14px;line-height:22px;text-align:right;text-align-last:right;color:#121212;font-family:'Nunito Sans',Arial,Helvetica,sans-serif;letter-spacing:0px;font-weight:800;font-style:normal">
                                                                                                                                                                                                <div
                                                                                                                                                                                                    style="font-family:'Nunito Sans',Arial,Helvetica,sans-serif">
                                                                                                                                                                                                    <span
                                                                                                                                                                                                        style="font-family:'Nunito Sans',Arial,Helvetica,sans-serif;font-size:14px;line-height:22px"
                                                                                                                                                                                                        class="m_2965410129824235511pc-w620-font-size-14px m_2965410129824235511pc-w620-line-height-22px">${currency}
                                                                                                                                                                                                        ${item.subtotal}</span>
                                                                                                                                                                                                </div>
                                                                                                                                                                                            </div>
                                                                                                                                                                                        </div>
                                                                                                                                                                                    </td>
                                                                                                                                                                                </tr>
                                                                                                                                                                            </tbody>
                                                                                                                                                                        </table>
                                                                                                                                                                    </td>
                                                                                                                                                                </tr>
                                                                                                                                                            </tbody>
                                                                                                                                                        </table>
                                                                                                                                                    </td>
                                                                                                                                                </tr>`).join('');
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
                           <div><span style="color: #001942;">${currency} ${item.subtotal}</span>
                           </div>
                          </div>
                         </td>
                        </tr>
                       </table>
                      </td>
                     </tr>
    `).join('');
};
const generateStatus = (items) => {
    return items.map((item) => `
 <tr>
                        <td align="center" valign="top">
                         <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation">
                          <tr>
                           <td class="pc-w620-spacing-0-32-12-32 pc-w620-valign-middle pc-w620-halign-center" align="center" style="padding: 0px 0px 12px 0px;">
                            <table class="pc-w620-halign-center pc-w620-width-hug" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation">
                             <tr>
                              <td style="width:unset;" valign="top">
                               <table class="pc-width-hug pc-w620-gridCollapsed-0 pc-w620-width-hug pc-w620-halign-center" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation">
                                <tr class="pc-grid-tr-first pc-grid-tr-last">
                                 <td class="pc-grid-td-first pc-w620-itemsSpacings-0-0" valign="middle" style="padding-top: 0px; padding-right: 0px; padding-bottom: 0px; padding-left: 0px;">
                                  <table class="pc-w620-width-fill" border="0" cellpadding="0" cellspacing="0" role="presentation">
                                   <tr>
                                    <td class="pc-w620-halign-center pc-w620-valign-middle" align="center" valign="middle">
                                     <table class="pc-w620-halign-center" align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                                      <tr>
                                       <td class="pc-w620-halign-center" align="center" valign="top" style="line-height: 1;">
                                        <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                                         <tr>
                                          <td class="pc-w620-halign-center" align="center" valign="top">
                                           <img src="https://cloudfilesdm.com/postcards/checked-b1157785.png" class="pc-w620-width-32 pc-w620-height-auto pc-w620-halign-center" width="40" height="40" alt="" style="display: block; outline: 0; line-height: 100%; -ms-interpolation-mode: bicubic; width: 40px; height: auto; max-width: 100%; border: 0;" />
                                          </td>
                                         </tr>
                                        </table>
                                       </td>
                                      </tr>
                                     </table>
                                    </td>
                                   </tr>
                                  </table>
                                 </td>
                                 <td class="pc-w620-itemsSpacings-0-0" valign="middle" style="padding-top: 0px; padding-right: 0px; padding-bottom: 0px; padding-left: 0px;">
                                  <table class="pc-w620-width-fill" style="width: 100%;" border="0" cellpadding="0" cellspacing="0" role="presentation">
                                   <tr>
                                    <td class="pc-w620-halign-center pc-w620-valign-middle" align="left" valign="middle">
                                     <table class="pc-w620-halign-center" align="left" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                                      <tr>
                                       <td class="pc-w620-halign-center" align="left" valign="top">
                                        <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                                         <tr>
                                          <td valign="top">
                                           <table class="pc-w620-width-64  pc-w620-halign-center" width="124" border="0" cellpadding="0" cellspacing="0" role="presentation" align="left" style="margin-right: auto;">
                                            <tr>
                                             <td valign="top" style="line-height: 1px; font-size: 1px; border-bottom: 1px solid #000000;">&nbsp;</td>
                                            </tr>
                                           </table>
                                          </td>
                                         </tr>
                                        </table>
                                       </td>
                                      </tr>
                                     </table>
                                    </td>
                                   </tr>
                                  </table>
                                 </td>
                                 <td class="pc-w620-itemsSpacings-0-0" valign="middle" style="padding-top: 0px; padding-right: 0px; padding-bottom: 0px; padding-left: 0px;">
                                  <table class="pc-w620-width-fill" border="0" cellpadding="0" cellspacing="0" role="presentation">
                                   <tr>
                                    <td align="center" valign="middle">
                                     <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                                      <tr>
                                       <td align="center" valign="top" style="line-height: 1;">
                                        <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                                         <tr>
                                          <td align="center" valign="top">
                                           <img src="https://cloudfilesdm.com/postcards/image-1702463224472.png" class="pc-w620-width-32 pc-w620-height-auto" width="40" height="40" alt="" style="display: block; outline: 0; line-height: 100%; -ms-interpolation-mode: bicubic; width: 40px; height: auto; max-width: 100%; border: 0;" />
                                          </td>
                                         </tr>
                                        </table>
                                       </td>
                                      </tr>
                                     </table>
                                    </td>
                                   </tr>
                                  </table>
                                 </td>
                                 <td class="pc-w620-itemsSpacings-0-0" valign="middle" style="padding-top: 0px; padding-right: 0px; padding-bottom: 0px; padding-left: 0px;">
                                  <table class="pc-w620-width-fill" style="width: 100%;" border="0" cellpadding="0" cellspacing="0" role="presentation">
                                   <tr>
                                    <td class="pc-w620-halign-center pc-w620-valign-middle" align="left" valign="top">
                                     <table class="pc-w620-halign-center" align="left" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                                      <tr>
                                       <td class="pc-w620-halign-center" align="left" valign="top">
                                        <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                                         <tr>
                                          <td valign="top">
                                           <table class="pc-w620-width-64  pc-w620-halign-center" width="124" border="0" cellpadding="0" cellspacing="0" role="presentation" align="left" style="margin-right: auto;">
                                            <tr>
                                             <td valign="top" style="line-height: 1px; font-size: 1px; border-bottom: 1px solid #000000;">&nbsp;</td>
                                            </tr>
                                           </table>
                                          </td>
                                         </tr>
                                        </table>
                                       </td>
                                      </tr>
                                     </table>
                                    </td>
                                   </tr>
                                  </table>
                                 </td>
                                 <td class="pc-grid-td-last pc-w620-itemsSpacings-0-0" valign="middle" style="padding-top: 0px; padding-right: 0px; padding-bottom: 0px; padding-left: 0px;">
                                  <table class="pc-w620-width-fill" border="0" cellpadding="0" cellspacing="0" role="presentation">
                                   <tr>
                                    <td class="pc-w620-halign-center pc-w620-valign-middle" align="center" valign="middle">
                                     <table class="pc-w620-halign-center" align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                                      <tr>
                                       <td class="pc-w620-halign-center" align="center" valign="top" style="line-height: 1;">
                                        <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                                         <tr>
                                          <td class="pc-w620-halign-center" align="center" valign="top">
                                           <img src="https://cloudfilesdm.com/postcards/image-1702463242847.png" class="pc-w620-width-32 pc-w620-height-auto pc-w620-halign-center" width="40" height="40" alt="" style="display: block; outline: 0; line-height: 100%; -ms-interpolation-mode: bicubic; width: 40px; height: auto; max-width: 100%; border: 0;" />
                                          </td>
                                         </tr>
                                        </table>
                                       </td>
                                      </tr>
                                     </table>
                                    </td>
                                   </tr>
                                  </table>
                                 </td>
                                </tr>
                               </table>
                              </td>
                             </tr>
                            </table>
                           </td>
                          </tr>
                         </table>
                        </td>
                       </tr>
                       <tr>
                        <td align="center" valign="top">
                         <table class="pc-w620-width-fill" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                          <tr>
                           <td class="pc-w620-spacing-0-0-24-0 pc-w620-valign-top pc-w620-halign-center" style="padding: 0px 0px 24px 0px;">
                            <table class="pc-width-fill pc-w620-gridCollapsed-0 pc-w620-width-fill pc-w620-halign-center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                             <tr class="pc-grid-tr-first pc-grid-tr-last">
                              <td class="pc-grid-td-first pc-w620-itemsSpacings-0-0" align="center" valign="top" style="padding-top: 0px; padding-right: 0px; padding-bottom: 0px; padding-left: 0px;">
                               <table class="pc-w620-width-fill pc-w620-halign-center" style="width: 100%;" border="0" cellpadding="0" cellspacing="0" role="presentation">
                                <tr>
                                 <td align="center" valign="middle">
                                  <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                                   <tr>
                                    <td align="center" valign="top">
                                     <table class="pc-w620-width-80" width="80" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation">
                                      <tr>
                                       <td valign="top">
                                        <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%" align="center">
                                         <tr>
                                          <td valign="top" class="pc-w620-align-center" align="center">
                                           <div class="pc-font-alt pc-w620-align-center" style="text-decoration: none;">
                                            <div style="font-size:14px;line-height:137%;text-align:center;text-align-last:center;color:#121212cc;font-family:'Nunito Sans', Arial, Helvetica, sans-serif;letter-spacing:0px;font-weight:400;font-style:normal;">
                                             <div style="font-family:'Nunito Sans', Arial, Helvetica, sans-serif;"><span style="font-family: 'Nunito Sans', Arial, Helvetica, sans-serif; font-size: 16px; line-height: 120%;" class="pc-w620-font-size-14px">Ordered </span>
                                             </div>
                                            </div>
                                           </div>
                                          </td>
                                         </tr>
                                        </table>
                                       </td>
                                      </tr>
                                     </table>
                                    </td>
                                   </tr>
                                  </table>
                                 </td>
                                </tr>
                               </table>
                              </td>
                              <td class="pc-w620-itemsSpacings-0-0" align="center" valign="top" style="padding-top: 0px; padding-right: 0px; padding-bottom: 0px; padding-left: 0px;">
                               <table class="pc-w620-width-fill pc-w620-halign-center" style="width: 100%;" border="0" cellpadding="0" cellspacing="0" role="presentation">
                                <tr>
                                 <td align="center" valign="middle">
                                  <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                                   <tr>
                                    <td align="center" valign="top">
                                     <table class="pc-w620-width-80" width="80" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation">
                                      <tr>
                                       <td valign="top">
                                        <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%" align="center">
                                         <tr>
                                          <td valign="top" align="center">
                                           <div class="pc-font-alt pc-w620-fontSize-14px" style="line-height: 120%; letter-spacing: 0px; font-family: 'Nunito Sans', Arial, Helvetica, sans-serif; font-size: 16px; font-weight: normal; color: #121212cc; text-align: center; text-align-last: center;">
                                            <div><span style="font-weight: 400;font-style: normal;">Shipped</span>
                                            </div>
                                           </div>
                                          </td>
                                         </tr>
                                        </table>
                                       </td>
                                      </tr>
                                     </table>
                                    </td>
                                   </tr>
                                  </table>
                                 </td>
                                </tr>
                               </table>
                              </td>
                              <td class="pc-grid-td-last pc-w620-itemsSpacings-0-0" align="center" valign="top" style="padding-top: 0px; padding-right: 0px; padding-bottom: 0px; padding-left: 0px;">
                               <table class="pc-w620-width-fill pc-w620-halign-center" style="width: 100%;" border="0" cellpadding="0" cellspacing="0" role="presentation">
                                <tr>
                                 <td align="center" valign="middle">
                                  <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                                   <tr>
                                    <td align="center" valign="top">
                                     <table class="pc-w620-width-80" width="80" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation">
                                      <tr>
                                       <td valign="top">
                                        <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%" align="center">
                                         <tr>
                                          <td valign="top" class="pc-w620-align-center" align="center">
                                           <div class="pc-font-alt pc-w620-align-center" style="text-decoration: none;">
                                            <div style="font-size:14px;line-height:137%;text-align:center;text-align-last:center;color:#121212cc;font-family:'Nunito Sans', Arial, Helvetica, sans-serif;letter-spacing:0px;font-weight:400;font-style:normal;">
                                             <div style="font-family:'Nunito Sans', Arial, Helvetica, sans-serif;"><span style="font-family: 'Nunito Sans', Arial, Helvetica, sans-serif; font-size: 16px; line-height: 120%;" class="pc-w620-font-size-14px">Delivered</span>
                                             </div>
                                            </div>
                                           </div>
                                          </td>
                                         </tr>
                                        </table>
                                       </td>
                                      </tr>
                                     </table>
                                    </td>
                                   </tr>
                                  </table>
                                 </td>
                                </tr>
                               </table>
                              </td>
                             </tr>
                            </table>
                           </td>
                          </tr>
                         </table>
                        </td>
                       </tr>`).join('');
};
const generateInvoice = (invoice) => {
    return (`
 <tr>
         <td valign="top">
          <!-- BEGIN MODULE: Call To Action -->
          <table width="100%" border="0" cellspacing="0" cellpadding="0" role="presentation">
           <tr>
            <td class="pc-w620-spacing-0-0-0-0" width="100%" border="0" cellspacing="0" cellpadding="0" role="presentation">
             <table width="100%" border="0" cellspacing="0" cellpadding="0" role="presentation">
              <tr>
               <td valign="top" class="pc-w620-padding-30-24-0-24" style="padding: 48px 32px 0px 32px; height: unset; background-color: #ffffff;" bgcolor="#ffffff">
                <table class="pc-width-fill pc-w620-gridCollapsed-0" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                 <tr class="pc-grid-tr-first pc-grid-tr-last">
                  <td class="pc-grid-td-first pc-grid-td-last" align="center" valign="top" style="padding-top: 0px; padding-right: 0px; padding-bottom: 0px; padding-left: 0px;">
                   <table style="width: 100%;" border="0" cellpadding="0" cellspacing="0" role="presentation">
                    <tr>
                     <td class="pc-w620-padding-32-32-32-32" align="center" valign="top" style="padding: 32px 32px 32px 32px; height: auto; background-color: #d5ffec; border-radius: 8px 8px 8px 8px;">
                      <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                       <tr>
                        <td align="center" valign="top">
                         <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation">
                          <tr>
                           <td valign="top" style="padding: 0px 0px 12px 0px; height: auto;">
                            <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                             <tr>
                              <td valign="top" class="pc-w620-align-center" align="left">
                               <div class="pc-font-alt pc-w620-align-center" style="text-decoration: none;">
                                <div style="font-size:32px;line-height:128%;text-align:left;text-align-last:left;color:#121212;font-family:'Nunito Sans', Arial, Helvetica, sans-serif;font-style:normal;font-weight:700;letter-spacing:0px;">
                                 <div style="font-family:'Nunito Sans', Arial, Helvetica, sans-serif;" class="pc-w620-text-align-center"><span style="font-family: 'Nunito Sans', Arial, Helvetica, sans-serif; font-size: 32px; line-height: 128%;">Download Your Invoice</span>
                                 </div>
                                </div>
                               </div>
                              </td>
                             </tr>
                            </table>
                           </td>
                          </tr>
                         </table>
                        </td>
                       </tr>
                       <tr>
                        <td align="center" valign="top">
                         <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation">
                          <tr>
                           <td valign="top" style="padding: 0px 0px 20px 0px; height: auto;">
                            <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                             <tr>
                              <td valign="top" align="center">
                               <div class="pc-font-alt" style="text-decoration: none;">
                                <div style="font-size:16px;line-height:140%;text-align:center;text-align-last:center;color:#121212cc;font-family:'Nunito Sans', Arial, Helvetica, sans-serif;font-style:normal;font-weight:400;letter-spacing:0px;">
                                 <div style="font-family:'Nunito Sans', Arial, Helvetica, sans-serif;"><span style="font-family: 'Nunito Sans', Arial, Helvetica, sans-serif; font-size: 16px; line-height: 140%;">You can access a detailed copy of your purchase for your records or reimbursement. It's quick and secure.</span>
                                 </div>
                                </div>
                               </div>
                              </td>
                             </tr>
                            </table>
                           </td>
                          </tr>
                         </table>
                        </td>
                       </tr>
                       <tr>
                        <td align="center" valign="top">
                         <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="min-width: 100%;">
                          <tr>
                           <th valign="top" align="center" style="text-align: center; font-weight: normal;">
                            <!--[if mso]>
        <table border="0" cellpadding="0" cellspacing="0" role="presentation" class="pc-w620-width-100pc" align="center" style="border-collapse: separate; border-spacing: 0; margin-right: auto; margin-left: auto;">
            <tr>
                <td valign="middle" align="center" style="border-radius: 500px 500px 500px 500px; background-color: #3bb77e; text-align:center; color: #ffffff; padding: 12px 24px 12px 24px; mso-padding-left-alt: 0; margin-left:24px;" bgcolor="#3bb77e">
                                    <a class="pc-font-alt" style="display: inline-block; text-decoration: none; text-align: center;" download href="${invoice}" target="_blank"><span style="font-size:16px;line-height:26px;color:#ffffff;font-family:'Nunito Sans', Arial, Helvetica, sans-serif;letter-spacing:0px;font-weight:700;font-style:normal;display:inline-block;vertical-align:top;"><span style="font-family:'Nunito Sans', Arial, Helvetica, sans-serif;display:inline-block;"><span style="font-family: 'Nunito Sans', Arial, Helvetica, sans-serif; font-size: 16px; line-height: 26px;">Download</span></span></span></a>
                                </td>
            </tr>
        </table>
        <![endif]-->
                            <!--[if !mso]><!-- -->
                            <a class="pc-w620-width-100pc" style="display: inline-block; box-sizing: border-box; border-radius: 500px 500px 500px 500px; background-color: #3bb77e; padding: 12px 24px 12px 24px; vertical-align: top; text-align: center; text-align-last: center; text-decoration: none; -webkit-text-size-adjust: none;" href="${invoice}" target="_blank"><span style="font-size:16px;line-height:26px;color:#ffffff;font-family:'Nunito Sans', Arial, Helvetica, sans-serif;letter-spacing:0px;font-weight:700;font-style:normal;display:inline-block;vertical-align:top;"><span style="font-family:'Nunito Sans', Arial, Helvetica, sans-serif;display:inline-block;"><span style="font-family: 'Nunito Sans', Arial, Helvetica, sans-serif; font-size: 16px; line-height: 26px;">Download</span></span></span></a>
                            <!--<![endif]-->
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
                 </tr>
                </table>
               </td>
              </tr>
             </table>
            </td>
           </tr>
          </table>
         
         </td>
        </tr>
`);
};

const generateMsg = () => {
   
    return `
      <tr>
        <td colspan="2" align="left"
            style="padding: 0 20px 10px 20px;">
            <div
                style="font-size: 13px; line-height: 18px; color: #e00000; font-family: 'Nunito Sans', Arial, Helvetica, sans-serif;">
                <strong>Note:</strong> Prices of
                undeliverable products are <span
                    style="color:#e00000; font-weight: 600;">not
                    included</span> in the total
                amount.
            </div>
        </td>
      </tr>`;
};

const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        auth: {
            user: process.env.SMTP_EMAIL,
            pass: process.env.SMTP_PASS,
        },
    });

const sendEmail = async (to, type, data, status, currency, eligible, invoice) => {
    let adminSubject = '';
    let adminMessage = '';
    let customerSubject = '';
    let customerMessage = '';

    const getTemplatePath = (userType) => {
        const fileName = userType === 'admin' ? 'newsLetterAdmin.html' : 'newsLetterCustomer.html';
        return path.join(__dirname, `../templates/${fileName}`);
    };
    function injectData(template, data) {
        return template.replace(/{{(.*?)}}/g, (_, key) => data[key.trim()] || '');
    }

    switch (status) {
        case 'Ordered':
            adminSubject = `New Order Received - ${data?.orderNumber}`;
            adminMessage = `Order ${data?.orderNumber} has been confirmed.`;
            customerSubject = `${data?.shippingInfo?.name}, your order ${data?.orderNumber} has been confirmed`;
            customerMessage = `We've received your order ${data?.orderNumber} and will begin processing it shortly.`;
            break;

        case 'processed':
            adminSubject = `Order ${data?.orderNumber} is Ready for Dispatch`;
            adminMessage = `Order ${data?.orderNumber} is packed and ready to ship.`;
            customerSubject = `${data?.shippingInfo?.name}, your order ${data?.orderNumber} is being packed`;
            customerMessage = `Your order ${data?.orderNumber} is currently being packed and prepared for shipment.`;
            break;

        case 'Shipped':
            adminSubject = `Order ${data?.orderNumber} marked as Shipped`;
            adminMessage = `Order ${data?.orderNumber} has been marked as shipped.`;
            customerSubject = `${data?.shippingInfo?.name}, your order ${data?.orderNumber} has been shipped`;
            customerMessage = `Good news! Your order ${data?.orderNumber} has been shipped. You’ll receive a delivery update soon.`;
            break;

        case 'Out for Delivery':
            adminSubject = `Order ${data?.orderNumber} is Out for Delivery`;
            adminMessage = `Order ${data?.orderNumber} is currently out for delivery.`;
            customerSubject = `${data?.shippingInfo?.name}, your order ${data?.orderNumber} is out for delivery`;
            customerMessage = `Your order ${data?.orderNumber} is out for delivery. Please be available to receive it.`;
            break;

        case 'Delivered':
            adminSubject = `Order ${data?.orderNumber} Delivered`;
            adminMessage = `Order ${data?.orderNumber} has been delivered successfully.`;
            customerSubject = `${data?.shippingInfo?.name}, your order ${data?.orderNumber} has been delivered`;
            customerMessage = `Your order ${data?.orderNumber} has been delivered. Thank you for shopping with us!`;
            break;

        case 'Cancelled':
            adminSubject = `Order ${data?.orderNumber} Cancelled`;
            adminMessage = `Order ${data?.orderNumber} has been cancelled.`;
            customerSubject = `${data?.shippingInfo?.name}, your order ${data?.orderNumber} has been cancelled`;
            customerMessage = `Your order ${data?.orderNumber} has been cancelled. If you didn't request this, please contact us.`;
            break;

        default:
            adminSubject = `Order ${data?.orderNumber} Status Updated`;
            adminMessage = `Order ${data?.orderNumber} status updated to ${status}.`;
            customerSubject = `${data?.shippingInfo?.name}, your order ${data?.orderNumber} has been updated`;
            customerMessage = `There's an update to your order ${data?.orderNumber}. Please check your account for details.`;
    }

    // Validate if file exists
    if (!fs.existsSync(getTemplatePath(type))) {
        console.error(`❌ Email template not found: ${getTemplatePath(type)}`);
        return;
    }
    const rawHtml = fs.readFileSync(getTemplatePath(type), 'utf-8');
    const html = injectData(rawHtml, {
        subject: type === 'admin' ? adminSubject : customerSubject,
        message: type === 'admin' ? adminMessage : customerMessage,
        customerName: data?.shippingInfo?.name,
        orderNumber: data?.orderNumber,
        address: data?.shippingInfo?.address,
        city: data?.shippingInfo?.city,
        country: data?.shippingInfo?.country,
        phone: data?.shippingInfo?.phone,
        email: data?.shippingInfo?.email,
        deliveryCharge: data?.deliveryCharge ? `${currency} ${data.deliveryCharge}` : 'Free',
        total: data.amount,
        currency: currency,
        itemsTable: generateItemsTablenew(data.items, currency),
        invoiceButton: status === 'Delivered' && type === 'customer' ? generateInvoice(invoice) : '',
        undeliverable: !eligible ? generateMsg() : ''
    });
    
    const mailOptions = {
        from: `"SPA STORE" <${process.env.SMTP_EMAIL}>`,
        to,
        subject: type === 'admin' ? adminSubject : customerSubject,
        html,
    };

    await transporter.sendMail(mailOptions);
};
const sendOtpEmail = async (to, name, otp) => {
   // Email subject
     const templatePath = path.join(__dirname, '../templates/otp.html');

    if (!fs.existsSync(templatePath)) {
        console.error('❌ OTP template not found:', templatePath);
        return;
    }

    let html = fs.readFileSync(templatePath, 'utf-8');
    html = html.replace(/{{name}}/g, name)
               .replace(/{{otp}}/g, otp); // Replace with actual logo URL

    // HTML template
  
    const mailOptions = {
        from: `"SPA STORE" <${process.env.SMTP_EMAIL}>`,
        to,
        subject: "Your SPA STORE OTP Code",
        html,
    };

    await transporter.sendMail(mailOptions);
};
const sendContactEmail = async (to, firstName, lastName, email, mobile, subject, message) => {
   // Email subject
     const templatePath = path.join(__dirname, '../templates/contact.html');

    if (!fs.existsSync(templatePath)) {
        console.error('❌ contact template not found:', templatePath);
        return;
    }

    let html = fs.readFileSync(templatePath, 'utf-8');
    html = html.replace(/{{firstName}}/g, firstName)
               .replace(/{{lastName}}/g, lastName) // Replace with actual logo URL
               .replace(/{{email}}/g, email)
               .replace(/{{mobile}}/g, mobile)
               .replace(/{{subject}}/g, subject)
               .replace(/{{message}}/g, message);

    const mailOptions = {
        from: `"SPA STORE" <${process.env.SMTP_EMAIL}>`,
        to,
        subject: `SPA STORE: New Message from ${firstName} ${lastName}`,
        html,
    };

   await transporter.sendMail(mailOptions);
};

module.exports = {sendEmail, sendOtpEmail, sendContactEmail};
