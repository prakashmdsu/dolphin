import { Component, OnInit } from '@angular/core';
import { HttpService } from '../../shared/http-serve.service';
import { Invoice } from '../shared/Invoice';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ActivatedRoute } from '@angular/router';
import { TaxInvoice } from '../shared/InvoiceBillingLocalClient';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

@Component({
  selector: 'app-billing-summary',
  standalone: false,
  templateUrl: './billing-summary.component.html',
  styleUrl: './billing-summary.component.scss',
})
export class BillingSummaryComponent implements OnInit {
  invoice: Invoice | null = null;
  
   public invoiceBilling: TaxInvoice | null = null;
  public currentDate: Date = new Date();
  totals = {
    totalQuarryCbm: 0,
    totalDmgTonnage: 0,
    totalNetCbm: 0,
  };
  loading = true;
  error: string | null = null;

  constructor(
    private httpservice: HttpService,
    private route: ActivatedRoute
  ) {}

  // ngOnInit(): void {
  //   this.route.queryParams.subscribe((params) => {
  //     const id = params['id'];
  //     if (id) {
  //       this.loadInvoice(id);
  //     } else {
  //       this.error = 'No invoice ID provided in URL';
  //     }
  //   });
  // }

ngOnInit(): void {
  this.route.queryParams.subscribe((params) => {
    const id = params['id'];
    if (id) {
      this.loadInvoice(id);
      this.loadTaxInvoiceData(id); // Load tax invoice data as well
    } else {
      this.error = 'No invoice ID provided in URL';
    }
  });
}


  loadInvoice(id: string): void {
    this.loading = true;
    this.httpservice.get<Invoice>('Dolphin/getinvoicebyid?id=' + id).subscribe({
      next: (res) => {
        this.invoice = res;
        this.calculateTotals();
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load invoice data';
        this.loading = false;
        console.error(err);
      },
    });
  }

  calculateDerivedFields(measurement: { lg: number; wd: number; ht: number }) {
    const volume = (measurement.lg * measurement.wd * measurement.ht) / 1000000;
    const quarryCbm = volume;
    const dmgTonnage = volume * 2.7;
    const netCbm = volume * 0.95;

    return {
      quarryCbm: Number(quarryCbm.toFixed(4)),
      dmgTonnage: Number(dmgTonnage.toFixed(4)),
      netCbm: Number(netCbm.toFixed(4)),
    };
  }

  calculateTotals(): void {
    if (!this.invoice?.graniteStocks) return;

    let totalQuarryCbm = 0;
    let totalDmgTonnage = 0;
    let totalNetCbm = 0;

    this.invoice.graniteStocks.forEach((block) => {
      const derived = this.calculateDerivedFields(block.measurement);
      totalQuarryCbm += derived.quarryCbm;
      totalDmgTonnage += derived.dmgTonnage;
      totalNetCbm += derived.netCbm;
    });

    this.totals = {
      totalQuarryCbm: Number(totalQuarryCbm.toFixed(4)),
      totalDmgTonnage: Number(totalDmgTonnage.toFixed(4)),
      totalNetCbm: Number(totalNetCbm.toFixed(4)),
    };
  }


exportDeliveryChallanToPDF(): void {
  if (!this.invoice) return;

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  let yPos = 15;

  // Calculate total metric tonne
  const totalMetricTonne = this.invoice.graniteStocks.reduce((total, block) => {
    const derived = this.calculateDerivedFields(block.measurement);
    return total + derived.dmgTonnage;
  }, 0);

  // Header
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('DELIVERY CHALLAN', pageWidth / 2, yPos, { align: 'center' });
  yPos += 15;

  // Company Info
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('DOLPHIN INTERNATIONAL', 20, yPos);
  yPos += 6;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('2/10, 4th Floor, 80ft Road,', 20, yPos);
  yPos += 4;
  doc.text('Opp. Ramaliah Hospital', 20, yPos);
  yPos += 4;
  doc.text('RMV 2nd Stage, Bangalore - 560094', 20, yPos);
  yPos += 4;
  doc.text('GSTIN/UIN: 29AABFD047ID1ZW', 20, yPos);
  yPos += 4;
  doc.text('State Name : Karnataka, Code : 29', 20, yPos);
  yPos += 4;
  doc.text('E-Mail : dee@dolphingranite.com', 20, yPos);
  yPos += 15;

  // Two Column Section - Left Side
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Place of Loading:', 20, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text('PURTHAGERI VILLAGE', 80, yPos);
  yPos += 8;

  doc.setFont('helvetica', 'bold');
  doc.text('Export to Country:', 20, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(this.invoice.country, 80, yPos);
  yPos += 6;

  doc.setFont('helvetica', 'bold');
  doc.text('Country of Origin:', 20, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text('INDIA', 80, yPos);
  yPos += 6;

  doc.setFont('helvetica', 'bold');
  doc.text('Pre-Carriage by:', 20, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text('ROAD', 80, yPos);
  yPos += 6;

  doc.setFont('helvetica', 'bold');
  doc.text('Despatched through:', 20, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text('Truck', 80, yPos);

  // Two Column Section - Right Side
  let rightYPos = yPos - 32; // Reset to top of left column
  
  doc.setFont('helvetica', 'bold');
  doc.text('Delivery Challan No:', 120, rightYPos);
  doc.setFont('helvetica', 'normal');
  doc.text(this.invoice.gatePassNo, 170, rightYPos);
  rightYPos += 6;

  doc.setFont('helvetica', 'bold');
  doc.text('Dated:', 120, rightYPos);
  doc.setFont('helvetica', 'normal');
  doc.text(this.formatDate(this.invoice.dispatchDate), 170, rightYPos);
  rightYPos += 10;

  doc.setFont('helvetica', 'bold');
  doc.text('Place of Receipt:', 120, rightYPos);
  doc.setFont('helvetica', 'normal');
  doc.text('Krishnapatnam Port', 170, rightYPos);
  rightYPos += 6;

  doc.setFont('helvetica', 'bold');
  doc.text('Port of Loading:', 120, rightYPos);
  doc.setFont('helvetica', 'normal');
  doc.text('Krishnapatnam Port', 170, rightYPos);
  rightYPos += 6;

  doc.setFont('helvetica', 'bold');
  doc.text('Mode of Transport:', 120, rightYPos);
  doc.setFont('helvetica', 'normal');
  doc.text('Road', 170, rightYPos);
  rightYPos += 6;

  doc.setFont('helvetica', 'bold');
  doc.text('Truck:', 120, rightYPos);
  doc.setFont('helvetica', 'normal');
  doc.text('AP38JL7688', 170, rightYPos);
  rightYPos += 6;

  doc.setFont('helvetica', 'bold');
  doc.text('E Way Bill No:', 120, rightYPos);
  doc.setFont('helvetica', 'normal');
  doc.text('1221-4737-9439', 170, rightYPos);
  rightYPos += 6;

  doc.setFont('helvetica', 'bold');
  doc.text('Terms of Delivery:', 120, rightYPos);
  doc.setFont('helvetica', 'normal');
  doc.text('FOB', 170, rightYPos);

  yPos += 20;

  // Consignee Section
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Consignee:', 20, yPos);
  yPos += 6;
  
  doc.setFont('helvetica', 'normal');
  doc.text(this.invoice.billTo, 20, yPos);
  yPos += 5;
  doc.text(this.invoice.billToAddress, 20, yPos);
  yPos += 5;
  doc.text(`GSTN: ${this.invoice.gstin}`, 20, yPos);
  yPos += 15;

  // Prepare description with all block details
  const blockDetails = this.invoice.graniteStocks.map((block, index) => 
    `${block.blockNo}-${block.measurement.lg}-${block.measurement.wd}-${block.measurement.ht}`
  ).join('-');

  // Table Data
  const tableData = [
    [
      '1',
      `Dimensional Granite Blocks\n\nNo.of Blocks : ${this.invoice.graniteStocks?.length || 0} Block\n${blockDetails}\n\nShipping Mark : FAN / XMN`,
      '25161100',
      `${totalMetricTonne.toFixed(2)}`,
      `${totalMetricTonne.toFixed(2)} M.T`,
      '247589.00'
    ]
  ];

  // Totals row
  tableData.push([
    '',
    '',
    'Total',
    `${totalMetricTonne.toFixed(2)}`,
    '',
    '₹247589.00'
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [
      [
        'Sl No.',
        'Description of Goods',
        'HSN/SAC',
        'Quantity\nMetric Tonne',
        'Rate per',
        'Amount'
      ]
    ],
    body: tableData,
    theme: 'striped',
    headStyles: { 
      fillColor: [240, 240, 240], 
      textColor: [0, 0, 0],
      fontStyle: 'bold'
    },
    styles: { 
      fontSize: 8, 
      cellPadding: 3,
      valign: 'middle'
    },
    columnStyles: {
      0: { cellWidth: 15, halign: 'center' },
      1: { cellWidth: 80, halign: 'left' },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 25, halign: 'center' },
      4: { cellWidth: 20, halign: 'center' },
      5: { cellWidth: 25, halign: 'right' }
    },
    didParseCell: function (data) {
      // Make total row bold
      if (data.row.index === tableData.length - 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [249, 249, 249];
      }
      // Center align total text
      if (data.row.index === tableData.length - 1 && data.column.index === 2) {
        data.cell.styles.halign = 'right';
        data.cell.styles.fontStyle = 'bold';
      }
    }
  });

  // Get final Y position after table
  const finalY = (doc as any).lastAutoTable?.finalY || yPos + 80;

  // Remarks Section
  if (this.invoice.notes) {
    doc.setFont('helvetica', 'bold');
    doc.text('Remarks:', 20, finalY + 10);
    doc.setFont('helvetica', 'normal');
    const noteLines = doc.splitTextToSize(this.invoice.notes, 170);
    doc.text(noteLines, 20, finalY + 18);
  }

  // Footer
  doc.setFont('helvetica', 'normal');
  doc.text("Company's PAN: AABFD0471D", 20, pageHeight - 30);
  
  doc.setFont('helvetica', 'normal');
  doc.text('for DOLPHIN INTERNATIONAL', pageWidth - 80, pageHeight - 40);
  
  // Signature line (simple line)
  doc.line(pageWidth - 80, pageHeight - 25, pageWidth - 20, pageHeight - 25);
  
  doc.setFont('helvetica', 'normal');
  doc.text('Authorised Signatory', pageWidth - 80, pageHeight - 15);

  // Save
  doc.save(`delivery-challan-${this.invoice.gatePassNo}.pdf`);
}

exportTaxInvoiceToPDF(): void {
  if (!this.invoiceBilling) return;

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  let yPos = 15;

  // Header - TAX INVOICE with proper styling
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setFillColor(240, 240, 240);
  doc.rect(10, 10, pageWidth - 20, 18, 'F');
  doc.rect(10, 10, pageWidth - 20, 18);
  doc.text('TAX INVOICE', pageWidth / 2, 22, { align: 'center' });
  yPos = 35;

  // Company Information Section
  doc.rect(10, yPos, pageWidth - 20, 55);
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('DOLPHIN INTERNATIONAL', 15, yPos + 10);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('2/10, 4th Floor, 80ft Road,', 15, yPos + 18);
  doc.text('Opp. Ramaliah Hospital', 15, yPos + 24);
  doc.text('RMV 2nd Stage, Bangalore - 560094', 15, yPos + 30);
  doc.text('GSTIN/UIN: 29AABFD047ID1ZW', 15, yPos + 36);
  doc.text('State Name : Karnataka, Code : 29', 15, yPos + 42);
  doc.text('E-Mail : dee@dolphingranite.com', 15, yPos + 48);
  
  yPos += 60;

  // Invoice Details Section (Two columns with proper alignment)
  const detailsStartY = yPos;
  const leftColX = 15;
  const leftColValueX = 75;
  const rightColX = 110;
  const rightColValueX = 170;
  
  doc.rect(10, yPos, pageWidth - 20, 60);
  doc.line(pageWidth / 2, yPos, pageWidth / 2, yPos + 60); // Vertical divider
  
  // Left Column
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Proforma Invoice No:', leftColX, yPos + 8);
  doc.setFont('helvetica', 'normal');
  doc.text(this.invoiceBilling.proformaInvoiceNo || '________________', leftColValueX, yPos + 8);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Delivery Note:', leftColX, yPos + 16);
  doc.setFont('helvetica', 'normal');
  doc.text(this.invoiceBilling.deliveryNote || '________________', leftColValueX, yPos + 16);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Supplier\'s Ref:', leftColX, yPos + 24);
  doc.setFont('helvetica', 'normal');
  doc.text(this.invoiceBilling.suppliersRef || '________________', leftColValueX, yPos + 24);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Buyer\'s Order No:', leftColX, yPos + 32);
  doc.setFont('helvetica', 'normal');
  doc.text(this.invoiceBilling.buyersOrderNo || '________________', leftColValueX, yPos + 32);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Despatch Document No:', leftColX, yPos + 40);
  doc.setFont('helvetica', 'normal');
  doc.text(this.invoiceBilling.despatchDocNo || '________________', leftColValueX, yPos + 40);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Despatched through:', leftColX, yPos + 48);
  doc.setFont('helvetica', 'normal');
  doc.text(this.invoiceBilling.despatchedThrough || '________________', leftColValueX, yPos + 48);

  // Right Column
  doc.setFont('helvetica', 'bold');
  doc.text('Invoice:', rightColX, yPos + 8);
  doc.setFont('helvetica', 'normal');
  doc.text(this.invoiceBilling.invoiceNo || '________________', rightColValueX, yPos + 8);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Dated:', rightColX, yPos + 16);
  doc.setFont('helvetica', 'normal');
  doc.text(this.formatDate(this.invoiceBilling.invoiceDate) || '________________', rightColValueX, yPos + 16);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Mode/Terms of Payment:', rightColX, yPos + 24);
  doc.setFont('helvetica', 'normal');
  doc.text(this.invoiceBilling.paymentTerms || '________________', rightColValueX, yPos + 24);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Other Reference(s):', rightColX, yPos + 32);
  doc.setFont('helvetica', 'normal');
  doc.text(this.invoiceBilling.otherReferences || '________________', rightColValueX, yPos + 32);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Delivery Note Date:', rightColX, yPos + 40);
  doc.setFont('helvetica', 'normal');
  doc.text(this.formatDate(this.invoiceBilling.deliveryNoteDate) || '________________', rightColValueX, yPos + 40);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Destination:', rightColX, yPos + 48);
  doc.setFont('helvetica', 'normal');
  doc.text(this.invoiceBilling.destination || '________________', rightColValueX, yPos + 48);

  yPos += 65;

  // Bill To Section
  doc.rect(10, yPos, pageWidth - 20, 40);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Bill To:', 15, yPos + 8);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(this.invoiceBilling.billToName || '', 15, yPos + 16);
  
  const addressLines = doc.splitTextToSize(this.invoiceBilling.billToAddress || '', 80);
  doc.text(addressLines, 15, yPos + 22);
  
  doc.text(`GSTIN/UIN: ${this.invoiceBilling.billToGSTIN || ''}`, 15, yPos + 32);
  doc.text(`State Name : ${this.invoiceBilling.billToStateName || ''}`, 15, yPos + 38);

  yPos += 45;

  // Transport Details Section
  doc.rect(10, yPos, pageWidth - 20, 20);
  doc.line(pageWidth / 2, yPos, pageWidth / 2, yPos + 20);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('E WAY BILL NO:', 15, yPos + 8);
  doc.setFont('helvetica', 'normal');
  doc.text(this.invoiceBilling.eWayBillNo || '________________', 70, yPos + 8);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Terms of Delivery:', 15, yPos + 16);
  doc.setFont('helvetica', 'normal');
  doc.text(this.invoiceBilling.termsOfDelivery || '________________', 70, yPos + 16);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Motor Vehicle No:', rightColX, yPos + 8);
  doc.setFont('helvetica', 'normal');
  doc.text(this.invoiceBilling.motorVehicleNo || '________________', rightColValueX, yPos + 8);

  yPos += 25;

  // Main Items Table
  const tableData = [];
  if (this.invoiceBilling.items && this.invoiceBilling.items.length > 0) {
    this.invoiceBilling.items.forEach((item, index) => {
      tableData.push([
        (index + 1).toString(),
        item.description + (item.details ? '\n' + item.details : ''),
        item.hsnCode || '',
        `${item.quantity} ${item.unit}`,
        item.rate?.toFixed(2) || '',
        item.amount?.toFixed(2) || ''
      ]);
    });
  } else {
    tableData.push([
      '1',
      (this.invoiceBilling.itemDescription || '') + 
      (this.invoiceBilling.itemDetails ? '\n' + this.invoiceBilling.itemDetails : ''),
      this.invoiceBilling.hsnCode || '',
      `${this.invoiceBilling.quantity || ''} ${this.invoiceBilling.unit || ''}`,
      this.invoiceBilling.rate?.toFixed(2) || '',
      this.invoiceBilling.amount?.toFixed(2) || ''
    ]);
  }

  autoTable(doc, {
    startY: yPos,
    head: [['Sl No.', 'Description of Goods', 'HSN/SAC', 'Quantity', 'Rate per', 'Amount']],
    body: tableData,
    theme: 'grid',
    headStyles: { 
      fillColor: [240, 240, 240], 
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      halign: 'center'
    },
    styles: { 
      fontSize: 9, 
      cellPadding: 3,
      valign: 'middle'
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 15 },
      1: { halign: 'left', cellWidth: 75 },
      2: { halign: 'center', cellWidth: 25 },
      3: { halign: 'center', cellWidth: 25 },
      4: { halign: 'right', cellWidth: 25 },
      5: { halign: 'right', cellWidth: 35 }
    },
    tableWidth: 'wrap',
    margin: { left: 10, right: 10 }
  });

  let finalY = (doc as any).lastAutoTable?.finalY || yPos + 40;

  // Tax Summary Section - Right aligned with better spacing
  const taxSummaryStartY = finalY + 10;
  const taxSummaryX = pageWidth - 110; // Starting x position for tax summary
  const taxLabelWidth = 40;
  const taxPercentWidth = 25;
  const taxAmountWidth = 35;

  // Create a box for tax summary
  doc.rect(taxSummaryX - 5, taxSummaryStartY - 5, 105, 40);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  // CGST Row
  doc.text('CGST', taxSummaryX, taxSummaryStartY + 5);
  doc.text(`${this.invoiceBilling.cgstPercent || 0}%`, taxSummaryX + taxLabelWidth, taxSummaryStartY + 5, { align: 'right' });
  doc.text(`${this.invoiceBilling.cgstAmount?.toFixed(2) || '0.00'}`, taxSummaryX + taxLabelWidth + taxPercentWidth, taxSummaryStartY + 5, { align: 'right' });
  
  // SGST Row
  doc.text('SGST', taxSummaryX, taxSummaryStartY + 13);
  doc.text(`${this.invoiceBilling.sgstPercent || 0}%`, taxSummaryX + taxLabelWidth, taxSummaryStartY + 13, { align: 'right' });
  doc.text(`${this.invoiceBilling.sgstAmount?.toFixed(2) || '0.00'}`, taxSummaryX + taxLabelWidth + taxPercentWidth, taxSummaryStartY + 13, { align: 'right' });
  
  // Rounded Off Row
  doc.text('Rounded Off', taxSummaryX, taxSummaryStartY + 21);
  doc.text('', taxSummaryX + taxLabelWidth, taxSummaryStartY + 21, { align: 'right' });
  doc.text(`${this.invoiceBilling.roundedOff?.toFixed(2) || '0.00'}`, taxSummaryX + taxLabelWidth + taxPercentWidth, taxSummaryStartY + 21, { align: 'right' });
  
  // Draw line above total
  doc.line(taxSummaryX, taxSummaryStartY + 25, taxSummaryX + 95, taxSummaryStartY + 25);
  
  // Total Row - Bold
  doc.setFont('helvetica', 'bold');
  doc.text('Total', taxSummaryX, taxSummaryStartY + 32);
  doc.text(`${this.invoiceBilling.totalQuantity || ''} ${this.invoiceBilling.unit || ''}`, taxSummaryX + taxLabelWidth, taxSummaryStartY + 32, { align: 'right' });
  doc.text(`₹${this.invoiceBilling.totalAmount?.toFixed(2) || '0.00'}`, taxSummaryX + taxLabelWidth + taxPercentWidth, taxSummaryStartY + 32, { align: 'right' });

  finalY = taxSummaryStartY + 45;

  // Amount in Words Section
  doc.rect(10, finalY, pageWidth - 20, 20);
  doc.setFont('helvetica', 'bold');
  doc.text('Amount Chargeable (in words)', 15, finalY + 8);
  doc.setFont('helvetica', 'normal');
  const amountWords = doc.splitTextToSize(this.invoiceBilling.amountInWords || '', pageWidth - 30);
  doc.text(amountWords, 15, finalY + 15);

  finalY += 25;

  // Tax Summary Table with better alignment
  const taxTableData = [[
    this.invoiceBilling.hsnCode || '',
    this.invoiceBilling.taxableValue?.toFixed(2) || '',
    `${this.invoiceBilling.cgstPercent || 0}%`,
    this.invoiceBilling.cgstAmount?.toFixed(2) || '',
    `${this.invoiceBilling.sgstPercent || 0}%`,
    this.invoiceBilling.sgstAmount?.toFixed(2) || '',
    this.invoiceBilling.totalTaxAmount?.toFixed(2) || ''
  ]];

  const taxTotalRow = [
    'Total',
    this.invoiceBilling.totalTaxableValue?.toFixed(2) || '',
    '',
    this.invoiceBilling.totalCgstAmount?.toFixed(2) || '',
    '',
    this.invoiceBilling.totalSgstAmount?.toFixed(2) || '',
    this.invoiceBilling.grandTotalTaxAmount?.toFixed(2) || ''
  ];

  taxTableData.push(taxTotalRow);

  autoTable(doc, {
    startY: finalY,
    head: [
      ['HSN/SAC', 'Taxable\nValue', 'Central Tax\nRate', 'Central Tax\nAmount', 'State Tax\nRate', 'State Tax\nAmount', 'Total Tax\nAmount']
    ],
    body: taxTableData,
    theme: 'grid',
    headStyles: { 
      fillColor: [240, 240, 240], 
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      halign: 'center',
      valign: 'middle'
    },
    styles: { 
      fontSize: 8, 
      cellPadding: 2,
      valign: 'middle'
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 25 },
      1: { halign: 'right', cellWidth: 30 },
      2: { halign: 'center', cellWidth: 25 },
      3: { halign: 'right', cellWidth: 25 },
      4: { halign: 'center', cellWidth: 25 },
      5: { halign: 'right', cellWidth: 25 },
      6: { halign: 'right', cellWidth: 30 }
    },
    didParseCell: function (data) {
      // Make total row bold
      if (data.row.index === taxTableData.length - 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [249, 249, 249];
      }
    }
  });

  finalY = (doc as any).lastAutoTable?.finalY || finalY + 40;

  // Tax Amount in Words
  doc.setFont('helvetica', 'bold');
  doc.text(`Tax Amount (in words): ${this.invoiceBilling.taxAmountInWords || ''}`, 
           15, finalY + 10);

  finalY += 20;

  // Bottom Section - Bank Details and Signature with better alignment
  const bottomSectionY = finalY;
  
  // Bank Details Box (Left side) - adjusted width
  const bankBoxWidth = (pageWidth - 30) * 0.6;
  const sigBoxWidth = (pageWidth - 30) * 0.4;
  
  doc.rect(10, bottomSectionY, bankBoxWidth, 60);
  doc.setFont('helvetica', 'bold');
  doc.text('Bank Details:', 15, bottomSectionY + 8);
  
  doc.setFont('helvetica', 'normal');
  doc.text(`Beneficiary Name: ${this.invoiceBilling.beneficiaryName || 'DOLPHIN INTERNATIONAL'}`, 15, bottomSectionY + 16);
  doc.text(`Account Number: ${this.invoiceBilling.accountNumber || '50200653156773'}`, 15, bottomSectionY + 24);
  doc.text(`Bank: ${this.invoiceBilling.bankName || 'HDFC Bank Ltd'}`, 15, bottomSectionY + 32);
  doc.text(`Branch: ${this.invoiceBilling.branchName || 'RMV 2nd Stage, Bangalore'}`, 15, bottomSectionY + 40);
  doc.text(`IFSC: ${this.invoiceBilling.ifscCode || 'HDFC0000123'}`, 15, bottomSectionY + 48);

  // Signature Box (Right side) - better alignment
  const sigBoxX = 10 + bankBoxWidth;
  doc.rect(sigBoxX, bottomSectionY, sigBoxWidth, 60);
  doc.setFont('helvetica', 'normal');
  doc.text('for DOLPHIN INTERNATIONAL', sigBoxX + 5, bottomSectionY + 15);
  
  // Signature line - better positioning
  doc.line(sigBoxX + 5, bottomSectionY + 42, sigBoxX + sigBoxWidth - 5, bottomSectionY + 42);
  doc.text('Authorised Signatory', sigBoxX + (sigBoxWidth / 2), bottomSectionY + 50, { align: 'center' });

  finalY = bottomSectionY + 65;

  // Additional Details - better alignment
  doc.setFont('helvetica', 'bold');
  doc.text(`Total DMG Charges: ${this.invoiceBilling.totalDmgCharges || 'N/A'}`, 15, finalY);
  doc.text(`Company's PAN: ${this.invoiceBilling.companyPAN || 'AABFD0471D'}`, 15, finalY + 8);

  // Footer Declaration (if space available)
  if (finalY + 40 < pageHeight - 10) {
    const footerY = pageHeight - 40;
    doc.rect(10, footerY, pageWidth - 20, 30);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Declaration:', pageWidth / 2, footerY + 8, { align: 'center' });
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const declarationText = 'We declare that this invoice shows the true value of the goods described and that all particulars are true and correct.';
    const declarationLines = doc.splitTextToSize(declarationText, pageWidth - 30);
    doc.text(declarationLines, pageWidth / 2, footerY + 15, { align: 'center' });
    
    doc.setFont('helvetica', 'bold');
    doc.text('SUBJECT TO BANGALORE JURISDICTION', pageWidth / 2, footerY + 22, { align: 'center' });
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text('This is a Computer Generated Invoice', pageWidth / 2, footerY + 28, { align: 'center' });
  }

  // Save the PDF
  doc.save(`tax-invoice-${this.invoiceBilling.invoiceNo || 'draft'}.pdf`);
}
// Helper method for date formatting
public formatDate(date: any): string {
  if (!date) return '';
  if (date instanceof Date) {
    return date.toLocaleDateString('en-GB');
  }
  if (typeof date === 'string') {
    return new Date(date).toLocaleDateString('en-GB');
  }
  return date.toString();
}


// Add this method to your component
loadTaxInvoiceData(id: string): void {
  this.httpservice.get<TaxInvoice>('Dolphin/gettaxinvoicebyid?id=' + id).subscribe({
    next: (res) => {
      this.invoiceBilling = res;
    },
    error: (err) => {
      console.error('Failed to load tax invoice data:', err);
      // Fallback: convert regular invoice to tax invoice format
      if (this.invoice) {
        this.invoiceBilling = this.convertToTaxInvoice(this.invoice);
      }
    },
  });
}

// Helper method to convert regular invoice to tax invoice format
convertToTaxInvoice(invoice: Invoice): TaxInvoice {
  const totalMetricTonne = invoice.graniteStocks?.reduce((total, block) => {
    const derived = this.calculateDerivedFields(block.measurement);
    return total + derived.dmgTonnage;
  }, 0) || 0;

  return {
    invoiceNo: invoice.gatePassNo,
    invoiceDate: invoice.dispatchDate,
    billToName: invoice.billTo,
    billToAddress: invoice.billToAddress,
    billToGSTIN: invoice.gstin,
    billToStateName: 'Karnataka', // Default or get from invoice
    itemDescription: 'Dimensional Granite Blocks',
    hsnCode: '25161100',
    quantity: totalMetricTonne,
    unit: 'M.T',
    rate: 2475.89,
    amount: 247589,
    cgstPercent: 9,
    cgstAmount: 22283,
    sgstPercent: 9,
    sgstAmount: 22283,
    totalQuantity: totalMetricTonne,
    totalAmount: 292155, // Including tax
    taxableValue: 247589,
    totalTaxAmount: 44566,
    totalTaxableValue: 247589,
    totalCgstAmount: 22283,
    totalSgstAmount: 22283,
    grandTotalTaxAmount: 44566,
    amountInWords: 'Two Lakh Ninety Two Thousand One Hundred Fifty Five Rupees Only',
    taxAmountInWords: 'Forty Four Thousand Five Hundred Sixty Six Rupees Only',
    beneficiaryName: 'DOLPHIN INTERNATIONAL',
    accountNumber: '50200053156773',
    bankName: 'HDFC Bank Ltd',
    branchName: 'RMV 2nd Stage, Bangalore',
    ifscCode: 'HDFC0000123',
    companyPAN: 'AABFD0471D',
    eWayBillNo: '1221-4737-9439',
    termsOfDelivery: 'FOB',
    motorVehicleNo: 'AP38JL7688'
  };
}

// Modified ngOnInit to load both types of data

}
