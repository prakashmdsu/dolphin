import { Component, OnInit } from '@angular/core';
import { HttpService } from '../../shared/http-serve.service';
import { Invoice } from '../shared/Invoice';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ActivatedRoute } from '@angular/router';

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

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      const id = params['id'];
      if (id) {
        this.loadInvoice(id);
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

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  // Original PDF export method (keeping for backward compatibility)
  exportToPDF(): void {
    if (!this.invoice) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    let yPos = 20;

    // Billing Summary Title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('BILLING SUMMARY', pageWidth / 2, yPos, { align: 'center' });
    yPos += 20;

    // Static Company Info Header
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Company Name: Dolphin International', 20, yPos);
    yPos += 8;
    doc.setFont('helvetica', 'normal');
    doc.text('Address : A/P Purthageri Tq : Kustagi, Dt:Koppal', 20, yPos);
    yPos += 12;

    // Bill To Section
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('BILL TO:', 20, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(this.invoice.billTo, 20, yPos + 8);
    doc.text(this.invoice.billToAddress, 20, yPos + 16);
    doc.text(`Country: ${this.invoice.country}`, 20, yPos + 24);
    doc.text(`Phone: ${this.invoice.phone}`, 20, yPos + 32);
    doc.text(`GSTIN: ${this.invoice.gstin}`, 20, yPos + 40);

    // Invoice Info Section
    doc.text(`Gate Pass No: ${this.invoice.gatePassNo}`, 120, yPos);
    doc.text(`GP Type: ${this.invoice.gpType}`, 120, yPos + 8);
    doc.text(
      `Dispatch Date: ${this.formatDate(this.invoice.dispatchDate)}`,
      120,
      yPos + 16
    );
    doc.text(
      `Place of Dispatch: ${this.invoice.placeOfDispatch}`,
      120,
      yPos + 24
    );

    yPos += 60;

    // Table Data
    const tableData = this.invoice.graniteStocks.map((block, index) => {
      const derived = this.calculateDerivedFields(block.measurement);
      return [
        (index + 1).toString(),
        block.blockNo.toString(),
        block.buyerBlockNo?.toString() || '-',
        `${block.measurement.lg} × ${block.measurement.wd} × ${block.measurement.ht}`,
        block.categoryGrade,
        derived.quarryCbm.toString(),
        derived.dmgTonnage.toString(),
        derived.netCbm.toString(),
      ];
    });

    // Totals row
    tableData.push([
      '',
      '',
      '',
      '',
      'TOTAL',
      this.totals.totalQuarryCbm.toString(),
      this.totals.totalDmgTonnage.toString(),
      this.totals.totalNetCbm.toString(),
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [
        [
          'S.No',
          'Block No',
          'Buyer Block',
          'Dimensions (mm)',
          'Category',
          'Quarry CBM',
          'DMG Tonnage',
          'Net CBM',
        ],
      ],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [65, 105, 225] },
      styles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 15 },
        1: { cellWidth: 20 },
        2: { cellWidth: 20 },
        3: { cellWidth: 35 },
        4: { cellWidth: 25 },
        5: { cellWidth: 25 },
        6: { cellWidth: 25 },
        7: { cellWidth: 25 },
      },
    });

    // Notes
    if (this.invoice.notes) {
      const finalY = (doc as any).lastAutoTable?.finalY || yPos + 100;
      doc.setFont('helvetica', 'bold');
      doc.text('Notes:', 20, finalY + 10);
      doc.setFont('helvetica', 'normal');
      const noteLines = doc.splitTextToSize(this.invoice.notes, 170);
      doc.text(noteLines, 20, finalY + 18);
    }

    // Footer - Prepared By & Authorised Signatory
    const pageHeight = doc.internal.pageSize.height;
    doc.setFont('helvetica', 'bold');
    doc.text('Prepared By', 20, pageHeight - 20);
    doc.text('Authorised Signatory', pageWidth - 60, pageHeight - 20);

    // Save
    doc.save(`billing-summary-${this.invoice.gatePassNo}.pdf`);
  }

  // NEW EXPORT METHODS

// Generate Delivery Challan PDF using jsPDF (similar to exportToPDF method)


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
}
