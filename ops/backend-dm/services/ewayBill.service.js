const puppeteer = require('puppeteer');
const QRCode = require('qrcode');
const archiver = require('archiver');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class EWayBillService {
    /**
     * Generate a QR Code as Base64 string
     * @param {Object} data { billNo, driverName, vehicleNo }
     * @returns {Promise<string>}
     */
    static async generateQRCode(data) {
        try {
            // Simplified data for the QR code as requested
            const qrData = {
                billNo: data.billNo,
                driver: data.driverName,
                vehicle: data.vehicleNo
            };
            return await QRCode.toDataURL(JSON.stringify(qrData));
        } catch (error) {
            console.error('QR Code generation error:', error);
            throw error;
        }
    }

    /**
     * Generate an e-Way Bill PDF
     * @param {Object} billData 
     * @returns {Promise<Buffer>}
     */
    static async generatePDF(billData) {
        let browser;
        try {
            browser = await puppeteer.launch({
                headless: 'new',
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            const page = await browser.newPage();

            // Read HTML template
            const templatePath = path.join(__dirname, '../templates/ewayBill.html');
            const cssPath = path.join(__dirname, '../public/ewayBill.css');

            let htmlContent = fs.readFileSync(templatePath, 'utf8');
            const cssContent = fs.readFileSync(cssPath, 'utf8');

            // Inline CSS
            htmlContent = htmlContent.replace('{{cssPath}}', ''); // Remove external link
            htmlContent = htmlContent.replace('</head>', `<style>${cssContent}</style></head>`);

            // Simple template replacement
            const placeholders = {
                billNo: billData.billNo,
                generatedDate: billData.generatedDate,
                generatedBy: billData.generatedBy,
                validFrom: billData.validFrom,
                validUntil: billData.validUntil,
                qrCode: billData.qrCode,
                supplierGstin: billData.supplierGstin,
                dispatchPlace: billData.dispatchPlace,
                recipientGstin: billData.recipientGstin,
                deliveryPlace: billData.deliveryPlace,
                docNo: billData.docNo,
                docDate: billData.docDate,
                transactionType: billData.transactionType,
                vehicleNo: billData.vehicleNo,
                fromLocation: billData.fromLocation
            };

            Object.keys(placeholders).forEach(key => {
                const regex = new RegExp(`{{${key}}}`, 'g');
                htmlContent = htmlContent.replace(regex, placeholders[key] || '');
            });

            // Handle goods array (basic simulation of Handlebars each)
            let goodsHtml = '';
            if (billData.goods && Array.isArray(billData.goods)) {
                billData.goods.forEach(item => {
                    goodsHtml += `
                        <tr>
                            <td>${item.hsnCode || ''}</td>
                            <td>${item.productName || ''}</td>
                            <td>${item.quantity || 0}</td>
                            <td>${item.unit || 'NOS'}</td>
                            <td>₹ ${item.value || '0.00'}</td>
                        </tr>
                    `;
                });
            }

            const eachRegex = /{{#each goods}}[\s\S]*{{\/each}}/;
            if (eachRegex.test(htmlContent)) {
                htmlContent = htmlContent.replace(eachRegex, goodsHtml);
            }

            console.log(`Starting PDF generation for bill: ${billData.billNo}`);
            await page.setContent(htmlContent, { waitUntil: 'load' }); // Changed from networkidle0 for reliability
            console.log('HTML content set on page');

            const pdfBuffer = await page.pdf({
                format: 'A4',
                printBackground: true,
                margin: {
                    top: '20px',
                    right: '20px',
                    bottom: '20px',
                    left: '20px'
                }
            });

            if (!pdfBuffer || pdfBuffer.length === 0) {
                console.error(`Generated PDF buffer is empty for bill: ${billData.billNo}`);
            } else {
                console.log(`Successfully generated PDF buffer for bill: ${billData.billNo}, size: ${pdfBuffer.length} bytes`);
            }

            return pdfBuffer;
        } catch (error) {
            console.error(`PDF generation error for bill ${billData?.billNo}:`, error);
            throw error;
        } finally {
            if (browser) await browser.close();
        }
    }

    /**
     * Bundle multiple PDFs into a zip
     * @param {Array<{name: string, buffer: Buffer}>} files 
     * @returns {Promise<Buffer>}
     */
    static async createZip(files) {
        return new Promise((resolve, reject) => {
            const chunks = [];
            const archive = archiver('zip', {
                zlib: { level: 9 }
            });

            archive.on('data', chunk => chunks.push(chunk));
            archive.on('end', () => {
                console.log('Zip creation complete, total bytes:', Buffer.concat(chunks).length);
                resolve(Buffer.concat(chunks));
            });
            archive.on('error', err => {
                console.error('Archiver error:', err);
                reject(err);
            });

            try {
                files.forEach(file => {
                    console.log(`Appending file to zip: ${file.name}, Buffer size: ${file.buffer ? file.buffer.length : 'N/A'}`);
                    if (!file.buffer || !Buffer.isBuffer(file.buffer)) {
                        throw new Error(`Invalid buffer for file ${file.name}: ${typeof file.buffer}`);
                    }
                    archive.append(file.buffer, { name: file.name });
                });

                archive.finalize();
            } catch (err) {
                console.error('Error during zip finalization:', err);
                reject(err);
            }
        });
    }
}

module.exports = EWayBillService;
