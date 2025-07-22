import { Component, OnInit } from '@angular/core';
import { HttpService } from '../shared/http-serve.service';
import { Invoice } from '../shared/Invoice';
// import jsPDF from 'jspdf';
import 'jspdf-autotable';

@Component({
  selector: 'app-billing-summary',
  standalone: false,
  templateUrl: './billing-summary.component.html',
  styleUrl: './billing-summary.component.scss',
})
export class BillingSummaryComponent implements OnInit {
  invoice: Invoice | null = null;
  totals = {
    totalQuarryCbm: 0,
    totalDmgTonnage: 0,
    totalNetCbm: 0,
  };
  loading = true;
  error: string | null = null;

  constructor(private httpservice: HttpService) {}

  ngOnInit(): void {
    this.loadInvoice();
  }

  loadInvoice(): void {
    this.loading = true;
    this.httpservice
      .get<Invoice>('Dolphin/getinvoicebyid?id=687f5d294f45e14e9ddf161e')
      .subscribe({
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
    const volume = (measurement.lg * measurement.wd * measurement.ht) / 1000000; // Convert to cubic meters
    const quarryCbm = volume;
    const dmgTonnage = volume * 2.7; // Assuming granite density of 2.7 tons/m³
    const netCbm = volume * 0.95; // Assuming 5% wastage

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

  exportToPDF(): void {
    //   if (!this.invoice) return;
    //   const doc = new jsPDF();
    //   const pageWidth = doc.internal.pageSize.width;
    //   // Header
    //   doc.setFontSize(20);
    //   doc.setFont('helvetica', 'bold');
    //   doc.text('BILLING SUMMARY', pageWidth / 2, 20, { align: 'center' });
    //   // Invoice details
    //   doc.setFontSize(12);
    //   doc.setFont('helvetica', 'normal');
    //   let yPos = 40;
    //   // Bill To Section
    //   doc.setFont('helvetica', 'bold');
    //   doc.text('BILL TO:', 20, yPos);
    //   doc.setFont('helvetica', 'normal');
    //   doc.text(this.invoice.billTo, 20, yPos + 8);
    //   doc.text(this.invoice.billToAddress, 20, yPos + 16);
    //   doc.text(`Country: ${this.invoice.country}`, 20, yPos + 24);
    //   doc.text(`Phone: ${this.invoice.phone}`, 20, yPos + 32);
    //   doc.text(`GSTIN: ${this.invoice.gstin}`, 20, yPos + 40);
    //   // Invoice Info Section
    //   doc.text(`Gate Pass No: ${this.invoice.gatePassNo}`, 120, yPos);
    //   doc.text(`GP Type: ${this.invoice.gpType}`, 120, yPos + 8);
    //   doc.text(
    //     `Dispatch Date: ${this.formatDate(this.invoice.dispatchDate)}`,
    //     120,
    //     yPos + 16
    //   );
    //   doc.text(
    //     `Place of Dispatch: ${this.invoice.placeOfDispatch}`,
    //     120,
    //     yPos + 24
    //   );
    //   yPos += 60;
    //   // Granite Blocks Table
    //   const tableData = this.invoice.graniteStocks.map((block, index) => {
    //     const derived = this.calculateDerivedFields(block.measurement);
    //     return [
    //       (index + 1).toString(),
    //       block.blockNo.toString(),
    //       block.buyerBlockNo?.toString() || '-',
    //       `${block.measurement.lg} × ${block.measurement.wd} × ${block.measurement.ht}`,
    //       block.categoryGrade,
    //       derived.quarryCbm.toString(),
    //       derived.dmgTonnage.toString(),
    //       derived.netCbm.toString(),
    //     ];
    //   });
    //   // Add totals row
    //   tableData.push([
    //     '',
    //     '',
    //     '',
    //     '',
    //     'TOTAL',
    //     this.totals.totalQuarryCbm.toString(),
    //     this.totals.totalDmgTonnage.toString(),
    //     this.totals.totalNetCbm.toString(),
    //   ]);
    //   (doc as any).autoTable({
    //     startY: yPos,
    //     head: [
    //       [
    //         'S.No',
    //         'Block No',
    //         'Buyer Block',
    //         'Dimensions (mm)',
    //         'Category',
    //         'Quarry CBM',
    //         'DMG Tonnage',
    //         'Net CBM',
    //       ],
    //     ],
    //     body: tableData,
    //     theme: 'striped',
    //     headStyles: { fillColor: [65, 105, 225] },
    //     styles: { fontSize: 8 },
    //     columnStyles: {
    //       0: { cellWidth: 15 },
    //       1: { cellWidth: 20 },
    //       2: { cellWidth: 20 },
    //       3: { cellWidth: 35 },
    //       4: { cellWidth: 25 },
    //       5: { cellWidth: 25 },
    //       6: { cellWidth: 25 },
    //       7: { cellWidth: 25 },
    //     },
    //   });
    //   // Notes
    //   if (this.invoice.notes) {
    //     const finalY = (doc as any).lastAutoTable.finalY + 20;
    //     doc.setFont('helvetica', 'bold');
    //     doc.text('Notes:', 20, finalY);
    //     doc.setFont('helvetica', 'normal');
    //     doc.text(this.invoice.notes, 20, finalY + 8);
    //   }
    //   // Save PDF
    //   doc.save(`billing-summary-${this.invoice.gatePassNo}.pdf`);
    // }
  }
}
