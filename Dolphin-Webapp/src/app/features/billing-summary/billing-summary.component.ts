import { Component, OnInit } from "@angular/core";
import { HttpService } from "../../shared/http-serve.service";
import { Invoice } from "../shared/Invoice";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { ActivatedRoute } from "@angular/router";
import { TaxInvoice } from "../shared/InvoiceBillingLocalClient";
import { logostring } from "../shared/logobase64";

interface Product {
  description: string;
  hsnSac: string;
  quantity: string;
  rate: string;
  per: string;
  amount: string;
}
// Extend jsPDF type to include autoTable
declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

@Component({
  selector: "app-billing-summary",
  standalone: false,
  templateUrl: "./billing-summary.component.html",
  styleUrl: "./billing-summary.component.scss",
})
export class BillingSummaryComponent implements OnInit {
  invoice: Invoice | null = null;
blocksids:string|null=null;
  products: Product[] = [];
  public invoiceBilling: TaxInvoice | null = null;
  public currentDate: Date = new Date();
  totals = {
    totalQuarryCbm: 0,
    totalDmgTonnage: 0,
    totalNetCbm: 0,
    totalNetWeightInMt: 0,
  };
  loading = true;
  error: string | null = null;

  constructor(
    private httpservice: HttpService,
    private route: ActivatedRoute
  ) {}

  private logoBase64: string = logostring;

  // Method to add logo to any PDF
  private addLogoToPDF(
    doc: any,
    pageWidth: number,
    yPosition: number = 15
  ): number {
    try {
      // Smaller logo for packing list
      const logoWidth = 25; // Reduced from 30
      const logoHeight = 15; // Reduced from 18
      const logoX = 15;

      doc.addImage(
        this.logoBase64,
        "PNG",
        logoX,
        yPosition,
        logoWidth,
        logoHeight
      );

      return yPosition + logoHeight + 3; // Reduced spacing from 5 to 3
    } catch (error) {
      console.error("Error adding logo:", error);
      return yPosition + 20;
    }
  }
  // Updated method for Packing List
  drawFirstPageLayout(doc: any, pageWidth: number, pagefor: string): void {
    // Move logo higher up - change from 10 to 5
    const nextY = this.addLogoToPDF(doc, pageWidth, 5);

    // Main title - adjust spacing
    doc.setFont("helvetica", "bold").setFontSize(16);

    // Updated title condition to handle three document types
    let documentTitle: string;
    if (pagefor === "taxinvoice") {
      documentTitle = "TAX INVOICE";
    } else if (pagefor === "deliverychallan") {
      documentTitle = "DELIVERY CHALLAN";
    } else {
      documentTitle = "PACKING LIST";
    }

    doc.text(documentTitle, pageWidth / 2, nextY + 5, { align: "center" });

    // GSTIN - adjust spacing
    doc.setFontSize(10).setFont("helvetica", "normal");

    // Show GSTIN for packing list and delivery challan, but not for tax invoice
    if (pagefor !== "taxinvoice" && pagefor !== "deliverychallan") {
      doc.text(
        "GSTIN: 29AABFD0471D1ZV, STATE CODE:29",
        pageWidth / 2,
        nextY + 10,
        {
          align: "center",
        }
      );
    }
  }

  // Updated method for Continuation Pages
  drawContinuationPageLayout(
    doc: any,
    pageWidth: number,
    pageNumber: number
  ): void {
    // Move logo higher up - change from 10 to 5
    const nextY = this.addLogoToPDF(doc, pageWidth, 5);

    // Main title - adjust spacing
    doc.setFont("helvetica", "bold").setFontSize(16);
    doc.text("PACKING LIST", pageWidth / 2, nextY + 5, { align: "center" });

    doc.setFontSize(10).setFont("helvetica", "normal");
    doc.text(
      "GSTIN: 29AABFD0471D1ZV, STATE CODE:29",
      pageWidth / 2,
      nextY + 12,
      {
        align: "center",
      }
    );
  }
  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      const id = params["id"];
      if (id) {
        this.loadInvoice(id);
        // this.loadTaxInvoiceData(id); // Load tax invoice data as well
      } else {
        this.error = "No invoice ID provided in URL";
      }
    });
  }

  loadInvoice(id: string): void {
    this.loading = true;
    this.httpservice.get<Invoice>("Dolphin/getinvoicebyid?id=" + id).subscribe({
      next: (res) => {
        this.invoice = res;
        this.calculateTotals();
        let prod: Product = {
          description: `${this.invoice.gpType}\n  ${this.invoice.graniteStocks.length} nos`,
          hsnSac: res.hsn,
          // quantity: '25.300 M.T',
          quantity: `${this.totals.totalNetWeightInMt} M.T`,
          rate: "1469.92",
          per: "M.T",
          // amount: '37189.00',
          amount: `${this.totals.totalNetWeightInMt * 1469.92}`,
        };

        this.blocksids = this.invoice.graniteStocks.map(d => d.blockNo).join(',');
        this.products.push(prod);
        this.loading = false;
      },
      error: (err) => {
        this.error = "Failed to load invoice data";
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
    let totalNetWeightInMt = 0;
    this.invoice.graniteStocks.forEach((block) => {
      const derived = this.calculateDerivedFields(block.measurement);
      totalQuarryCbm += derived.quarryCbm;
      totalDmgTonnage += derived.dmgTonnage;
      totalNetCbm += derived.netCbm;
      totalNetWeightInMt += block.netWeightMt || 0;
    });

    this.totals = {
      totalQuarryCbm: Number(totalQuarryCbm.toFixed(4)),
      totalDmgTonnage: Number(totalDmgTonnage.toFixed(4)),
      totalNetCbm: Number(totalNetCbm.toFixed(4)),
      totalNetWeightInMt: Number(totalNetWeightInMt.toFixed(4)),
    };
  }

 
  // Additional debugging method to test basic PDF generation
  testPDFGeneration(): void {
    try {
      console.log("Testing basic PDF generation...");
      const doc = new jsPDF();
      doc.text("Test PDF", 20, 20);
      doc.save("test.pdf");
      console.log("Basic PDF test successful");
    } catch (error) {
      console.error("Basic PDF test failed:", error);
    }
  }

  // Updated main method - replace your existing exportPackingListPDF method
  exportPackingListPDF(): void {
    if (!this.invoice) return;

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    // Generate 1000 realistic granite blocks

    let totalCBM = 0;
    let totalWeight = 0;

    /** ========== FIRST PAGE LAYOUT ========== **/
    this.drawFirstPageLayout(doc, pageWidth, "packinglist");

    /** ========== MAIN INFO TABLE - FIXED ========== **/
    autoTable(doc, {
      startY: 35,
      theme: "grid",
      styles: {
        fontSize: 6,
        cellPadding: 1,
        lineColor: [0, 0, 0],
        lineWidth: 0.12,
        valign: "top",
      },
      columnStyles: {
        0: { cellWidth: 25, fontStyle: "bold" },
        1: { cellWidth: 54 },
        2: { cellWidth: 50, fontStyle: "bold" },
        3: { cellWidth: 53 },
      },
      body: [
        [
          {
            content: "Exporter",
            rowSpan: 6,
            styles: { valign: "middle", fontStyle: "bold" },
          },
          {
            content: `DOLPHIN INTERNATIONAL\nNO 2/10, 4TH FLOOR\n80FT ROAD, OPPOSITE\nRAMAIAH HOSPITAL RMV 2ND STAGE\nBANGALORE 560 094\nKARNATAKA, INDIA`,
            rowSpan: 6,
            styles: { valign: "top" },
          },
          "Invoice Number",
          "Date",
        ],
        ["DI2526001", "3-Jul-2025"],
        ["Buyer's Order Number", "Date"],
        ["LWDF202501", "20-May-2025"],
        [
          {
            content: "Shipping Bill No: 3293257",
            colSpan: 1,
            styles: { halign: "left" },
          },
          {
            content: "Date: 4-Jul-2025",
            colSpan: 1,
            styles: { halign: "left" },
          },
        ],
        ["Port Code", "INKRI1"],
        [
          {
            content: "Consignee & Buyer",
            rowSpan: 5,
            styles: { valign: "top", fontStyle: "bold" },
          },
          {
            content: `XIAMEN JINGTAIQUAN INDUSTRIAL CO.,LTD\n\nADD: - UNIT 1506,NO 21, NORTH SHUANGSHI\nROAD, XIAMEN AREA OF CHINA(FUJIAN)\nPILOT FREE, TRADE ZONE.`,
            rowSpan: 5,
            styles: { valign: "top" },
          },
          {
            content: "Exporter's Ref:" + "dsfdsfsdfsdafdas",
            colSpan: 2,
            styles: { halign: "left" },
          },
          "",
        ],
        [
          `IEC No: - ${this.invoice.gatePassNo  }`,
          "Last Modified Date: - 17-Apr-2025",
        ],
        [
          {
            content: `GSTIN: - ${
              this.invoice.gstin 
            }, STATE CODE: - 29`,
            colSpan: 2,
            styles: { halign: "left" },
          },
          "",
        ],
        [`PAN NO: - ${this.invoice.gatePassNo }`, ""],
        [
          {
            content: "LUT ARN: -",
            colSpan: 2,
            styles: { halign: "left" },
          },
          "",
        ],
      ],
    });

    /** ========== SHIPPING DETAILS - EXACT MATCH ========== **/
    let currentY = (doc as any).lastAutoTable.finalY;

    autoTable(doc, {
      startY: currentY,
      theme: "grid",
      styles: {
        fontSize: 6,
        cellPadding: 1.5,
        lineColor: [0, 0, 0],
        lineWidth: 0.12,
        valign: "top",
      },
      columnStyles: {
        0: { cellWidth: 25, fontStyle: "bold" },
        1: { cellWidth: 54 },
        2: { cellWidth: 50, fontStyle: "bold" },
        3: { cellWidth: 53 },
      },
      body: [
        [
          "Pre-Carriage by",
          "Place of Receipt by Pre-Carrier",
          "Country of Origin of Goods",
          "Country of final Destination",
        ],
        ["ROAD", "KRISHNAPATNAM PORT, INDIA", "INDIA", "CHINA"],
        [
          "Vessel/Flight No.",
          "Port of Loading",
          {
            content: "Terms of Delivery & Payment",
            colSpan: 2,
            styles: { halign: "left", fontStyle: "bold" },
          },
          "",
        ],
        [
          "MV SEA LEO VOY NO MU2518",
          "KRISHNAPATNAM PORT, INDIA",
          {
            content: "F.O.B. KRISHNAPATNAM PORT, INDIA",
            colSpan: 2,
            styles: { halign: "left" },
          },
          "",
        ],
        ["Port of Discharge", "Final Destination", "", ""],
        [
          "KRISHNAPATNAM PORT,\nINDIA",
          "CHINA",
          {
            content: "PAYMENT TT AFTER EMAIL COPY OF ORIGINAL BILL OF LADING.",
            colSpan: 2,
            styles: { halign: "left" },
          },
          "",
        ],
      ],
    });

    /** ========== BL & MARKS - FIRST PAGE ONLY ========== **/
    currentY = (doc as any).lastAutoTable.finalY;

    autoTable(doc, {
      startY: currentY,
      theme: "grid",
      styles: {
        fontSize: 6,
        cellPadding: 1,
        lineColor: [0, 0, 0],
        lineWidth: 0.12,
        valign: "top",
      },
      columnStyles: {
        0: { cellWidth: 25, fontStyle: "bold" },
        1: { cellWidth: 54 },
        2: { cellWidth: 30, fontStyle: "bold" },
        3: { cellWidth: 25, fontStyle: "bold" },
        4: { cellWidth: 48, fontStyle: "bold" },
      },
      body: [
        [
          "BL No. & Dt",
          `KPMXMNSL2518007 Dt 12-Jul-2025`,
          "",
          "Quantity",
          "GROSS AND NET WEIGHT.",
        ],
        [
          "Marks & Nos.",
          "No. & Kind of Packing",
          "Description of Goods",
          "CBM",
          "MT",
        ],
        [
          "SHIPPING MARK\nFAN / XMN",
          "205 Granite - Roughly Trimmed Blocks",
          "",
          "",
          "",
        ],
      ],
    });

    /** ========== NEW GRANITE BLOCKS DETAILS TABLE ========== **/
    currentY = (doc as any).lastAutoTable.finalY;

    // Generate granite blocks data dynamically
    const generateGraniteBlocksData = (count: number) => {
      if (!this.invoice?.graniteStocks) return;
      const blocks: string[][] = [];
      this.invoice.graniteStocks.forEach((block,i) => {
      const derived = this.calculateDerivedFields(block.measurement);
      const measurement = `${block.measurement.lg} X ${block.measurement.wd} X ${block.measurement.ht}`;
     blocks.push([
          "",
              (i+1).toString(),
          block.blockNo.toString(),
          measurement,
          derived.quarryCbm.toFixed(3),
       block.netWeightMt?.toFixed(3) ?? "",
        ]);
     
    });
      return blocks;
    };

    const graniteBlocksData = generateGraniteBlocksData(32);

    autoTable(doc, {
      startY: currentY,
      theme: "grid",
      styles: {
        fontSize: 6,
        cellPadding: 1,
        lineColor: [0, 0, 0],
        lineWidth: 0.12,
        halign: "center",
        valign: "middle",
      },
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: "bold",
        halign: "center",
      },
      columnStyles: {
        0: { cellWidth: 25, halign: "center" },
        1: { cellWidth: 32, halign: "center" },
        2: { cellWidth: 50, halign: "center" },
        3: { cellWidth: 25, halign: "center" },
        4: { cellWidth: 30, halign: "center" },
      },
      head: [["FAN/XMN", "SL.NO", "BLOCK NO", "MEASUREMENT", "CBM", "MT"]],
      body: graniteBlocksData,
      didDrawPage: (data) => {
        if (data.pageNumber > 1) {
          // Add header for continuation pages if needed
        }
      },
    });

    /** ========== TOTALS ROW ========== **/
    currentY = (doc as any).lastAutoTable.finalY;

    autoTable(doc, {
      startY: currentY,
      theme: "grid",
      styles: {
        fontSize: 6,
        cellPadding: 1,
        lineColor: [0, 0, 0],
        lineWidth: 0.12,
        halign: "center",
        fontStyle: "bold",
      },
     
      columnStyles: {
        0: { cellWidth: 42 },
        1: { cellWidth: 44 },
        2: { cellWidth: 25 },
        3: { cellWidth: 30 },
        4: { cellWidth: 20 },
      },
      body: [
        [
          { content: "", colSpan: 2},
         "C/F:",
          totalCBM.toFixed(3),
          totalWeight.toFixed(3),
        ],
      ],
    });

    // Add footer immediately after totals - with smart positioning
    this.addFooterToLastPage(doc, pageWidth, pageHeight);

    doc.save(`packing-list-${this.invoice.gatePassNo || "export"}.pdf`);
  }
  addPageNumbers(doc: any): void {
    const totalPages = doc.internal.getNumberOfPages();

    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);

      // Add page number at bottom center
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;

      // Page number text
      const pageText = `Page ${i} of ${totalPages}`;
      const textWidth = doc.getTextWidth(pageText);
      const x = (pageWidth - textWidth) / 2; // Center horizontally
      const y = pageHeight - 10; // 10mm from bottom

      doc.text(pageText, x, y);
    }
  }

  exportTaxInvoiceToPDF(): void {
    if (!this.invoice) return;

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    // Generate 1000 realistic granite blocks
    // const blocksToProcess = this.generateRealisticGraniteBlocks(1000);
    let totalCBM = 0;
    let totalWeight = 0;

    /** ========== FIRST PAGE LAYOUT ========== **/
    this.drawFirstPageLayout(doc, pageWidth, "taxinvoice");

    /** ========== MAIN INFO TABLE - FIXED ========== **/
    autoTable(doc, {
      startY: 35,
      theme: "grid",
      styles: {
        fontSize: 8,
        cellPadding: 1,
        lineColor: [0, 0, 0],
        lineWidth: 0.12,
        valign: "top",
      },
      columnStyles: {
        // 0: { cellWidth: 30, fontStyle: "bold" },
        1: { cellWidth: 60 },
        2: { cellWidth: 60 },
        3: { cellWidth: 59 },
      },
      body: [
        [
          {
            content: `DOLPHIN INTERNATIONAL\nNO 2/10, 4TH FLOOR\n80FT ROAD, OPPOSITE\nRAMAIAH HOSPITAL RMV 2ND STAGE\nBANGALORE 560 094\nKARNATAKA, INDIA`,
            rowSpan: 4,
            styles: { valign: "top" },
          },
          `ProformaInvoice Number: ${this.invoice.invoiceNo}`,
          `Date:` + new Date().toLocaleDateString("en-GB"),
        ],
        [
          `Delivery Note: ${this.invoice.notes}`,
          `Mode/Terms of Payment: ${this.invoice.termsOfPayment}`,
        ],
        [
          { content: `Supplier Ref: ${this.invoice.supplierRef}` },
          { content: `Other Reference(s): ${this.invoice.otherReference}` },
        ],
        [
          {
            content: `Buyer's Order Number:  ${this.invoice.buyersOrderNumber}`,
          },
          { content: `Dated: ${this.invoice.dated}` },
        ],
        [
          {
            content: `XIAMEN JINGTAIQUAN INDUSTRIAL CO.,LTD\n\nADD: - UNIT 1506,NO 21, NORTH SHUANGSHI\nROAD, XIAMEN AREA OF CHINA(FUJIAN)\nPILOT FREE, TRADE ZONE.`,
            rowSpan: 5,
            styles: { valign: "top" },
          },
          {
            content: "Dispatch through:" + "Truck",
            styles: { halign: "left" },
          },
          {
            content: ` Destination: ${this.invoice.destination}`,
            styles: { halign: "left" },
          },
        ],
        [
          {
            content: `Dispatch Document No: ${this.invoice.dispatchDocumentNo}`,
            styles: { halign: "left" },
          },
          {
            content: `Delivery Note Date : ${this.invoice.deliveryNoteDate}`,
            styles: { halign: "left" },
          },
        ],
        [
          {
            content: `E way bill no.: ${this.invoice.ewayBillNo}`,
            styles: { halign: "left" },
          },
          {
            content: `Motor vehicle no.: ${this.invoice.ewayBillNo}`,
            styles: { halign: "left" },
          },
        ],
        [
          {
            content: `Terms of Delivery: - ${this.invoice.termsOfDelivery}`,
            colSpan: 2,
            styles: { halign: "left" },
          },
          "",
        ],
      ],
    });

    // Get the final Y position from the first table
    const firstTableFinalY = (doc as any).lastAutoTable.finalY || 100;

    // Function to convert number to words
    const numberToWords = (num: number): string => {
      const ones = [
        "",
        "One",
        "Two",
        "Three",
        "Four",
        "Five",
        "Six",
        "Seven",
        "Eight",
        "Nine",
      ];
      const tens = [
        "",
        "",
        "Twenty",
        "Thirty",
        "Forty",
        "Fifty",
        "Sixty",
        "Seventy",
        "Eighty",
        "Ninety",
      ];
      const teens = [
        "Ten",
        "Eleven",
        "Twelve",
        "Thirteen",
        "Fourteen",
        "Fifteen",
        "Sixteen",
        "Seventeen",
        "Eighteen",
        "Nineteen",
      ];

      const convertHundreds = (n: number): string => {
        let result = "";
        if (n >= 100) {
          result += ones[Math.floor(n / 100)] + " Hundred ";
          n %= 100;
        }
        if (n >= 20) {
          result += tens[Math.floor(n / 10)] + " ";
          n %= 10;
        } else if (n >= 10) {
          result += teens[n - 10] + " ";
          return result;
        }
        if (n > 0) {
          result += ones[n] + " ";
        }
        return result;
      };

      if (num === 0) return "Zero";

      let result = "";
      const crore = Math.floor(num / 10000000);
      const lakh = Math.floor((num % 10000000) / 100000);
      const thousand = Math.floor((num % 100000) / 1000);
      const remainder = num % 1000;

      if (crore > 0) {
        result += convertHundreds(crore) + "Crore ";
      }
      if (lakh > 0) {
        result += convertHundreds(lakh) + "Lakh ";
      }
      if (thousand > 0) {
        result += convertHundreds(thousand) + "Thousand ";
      }
      if (remainder > 0) {
        result += convertHundreds(remainder);
      }

      return result.trim();
    };

    // Calculate totals
    let totalBaseAmount = 0;
    this.products.forEach((product) => {
      totalBaseAmount += parseFloat(product.amount);
    });

    const cgstRate = 2.5;
    const sgstRate = 2.5;
    const cgstAmount = (totalBaseAmount * cgstRate) / 100;
    const sgstAmount = (totalBaseAmount * sgstRate) / 100;
    const roundingOff = 0.54;
    const totalAmount = totalBaseAmount + cgstAmount + sgstAmount + roundingOff;

    // Convert total amount to words
    const amountInWords =
      numberToWords(Math.floor(totalAmount)) + " Rupees Only";

    // Calculate total quantity (assuming all in M.T)
    const totalQuantity = this.products.reduce((sum, product) => {
      const qty = parseFloat(product.quantity.split(" ")[0]);
      return sum + qty;
    }, 0);

    // Build table body dynamically
    const tableBody: any[] = [];

    // Add product rows
    this.products.forEach((product, index) => {
      tableBody.push([
        (index + 1).toString(),
        product.description,
        product.hsnSac,
        product.quantity,
        product.rate,
        product.per,
        product.amount,
      ]);
    });

    // Calculate minimum number of empty rows needed (at least 6 for spacing)
    const minEmptyRows = 5;
    const currentRows = this.products.length;
    const emptyRowsNeeded = Math.max(minEmptyRows, 8 - currentRows); // Ensure at least 15 total rows before tax

    // Add empty rows for spacing
    for (let i = 0; i < emptyRowsNeeded; i++) {
      tableBody.push(["", "", "", "", "", "", ""]);
    }

    // Add tax rows
    tableBody.push([
      "",
      {
        content: "CGST",
        styles: { halign: "right" as const, fontStyle: "bold" as const },
      },
      "",
      "",
      {
        content: "2.50 %",
        styles: { halign: "right" as const },
      },
      "",
      {
        content: cgstAmount.toFixed(2),
        styles: { halign: "right" as const },
      },
    ]);

    tableBody.push([
      "",
      {
        content: "SGST",
        styles: { halign: "right" as const, fontStyle: "bold" as const },
      },
      "",
      "",
      {
        content: "2.50 %",
        styles: { halign: "right" as const },
      },
      "",
      {
        content: sgstAmount.toFixed(2),
        styles: { halign: "right" as const },
      },
    ]);

    tableBody.push([
      "",
      {
        content: "Rounded Off",
        styles: { halign: "right" as const, fontStyle: "bold" as const },
      },
      "",
      "",
      "",
      "",
      {
        content: roundingOff.toFixed(2),
        styles: { halign: "right" as const },
      },
    ]);

    // Add total row
    tableBody.push([
      "",
      {
        content: "Total",
        styles: {
          halign: "right" as const,
          fontStyle: "bold" as const,
          fillColor: [240, 240, 240],
        },
      },
      "",
      {
        content: `${totalQuantity.toFixed(3)} M.T`,
        styles: {
          halign: "center" as const,
          fontStyle: "bold" as const,
          fillColor: [240, 240, 240],
        },
      },
      "",
      "",
      {
        content: `₹${totalAmount.toFixed(2)}`,
        styles: {
          halign: "right" as const,
          fontStyle: "bold" as const,
          fillColor: [240, 240, 240],
        },
      },
    ]);

    // Add amount in words row
    tableBody.push([
      {
        content: "Amount Chargeable (in words): " + amountInWords,
        colSpan: 5,
        styles: {
          fontSize: 7,
          halign: "left" as const,
          fontStyle: "bold" as const,
        },
      },
      {
        content: "E. & O.E",
        colSpan: 2,
        styles: { halign: "right" as const, fontStyle: "bold" as const },
      },
    ]);

    /** ========== SECOND TABLE - GOODS DETAILS ========== **/
    autoTable(doc, {
      startY: firstTableFinalY + 0.5,
      theme: "grid",
      styles: {
        fontSize: 8,
        cellPadding: 2,
        lineColor: [0, 0, 0],
        lineWidth: 0.12,
        valign: "middle",
        halign: "center",
      },
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: "bold",
        halign: "center",
      },
      columnStyles: {
        0: { cellWidth: 12, halign: "center" as const }, // Sl No.
        1: { cellWidth: 68, halign: "left" as const }, // Description
        2: { cellWidth: 20, halign: "center" as const }, // HSN/SAC
        3: { cellWidth: 25, halign: "center" as const }, // Quantity
        4: { cellWidth: 20, halign: "right" as const }, // Rate
        5: { cellWidth: 12, halign: "center" as const }, // per
        6: { cellWidth: 25, halign: "right" as const }, // Amount
      },
      head: [
        [
          "Sl\nNo.",
          "Description of Goods",
          "HSN/SAC",
          "Quantity",
          "Rate",
          "per",
          "Amount",
        ],
      ],
      body: tableBody, // Use the dynamically built body
      didParseCell: function (data) {
        const productRowCount = 0;
        const emptyRowStart = productRowCount;
        const emptyRowEnd = emptyRowStart + emptyRowsNeeded - 1;
        const totalRowIndex = data.table.body.length - 3; // Total row is 3rd from last
        const amountWordsHeaderIndex = data.table.body.length - 2; // Amount header is 2nd from last
        const amountWordsRowIndex = data.table.body.length - 1; // Words row is last

        // Special styling for total row
        if (data.row.index === totalRowIndex) {
          data.cell.styles.fillColor = [240, 240, 240];
          data.cell.styles.fontStyle = "bold" as const;
          data.cell.styles.lineWidth = 0.12;
          data.cell.styles.lineColor = [0, 0, 0];
        }
        // Special styling for amount chargeable header row
        else if (data.row.index === amountWordsHeaderIndex) {
          data.cell.styles.lineWidth = 0.12;
          data.cell.styles.lineColor = [0, 0, 0];
          data.cell.styles.fontStyle = "bold" as const;
        }
        // Special styling for amount in words row
        else if (data.row.index === amountWordsRowIndex) {
          data.cell.styles.lineWidth = 0.12;
          data.cell.styles.lineColor = [0, 0, 0];
          data.cell.styles.fontStyle = "bold" as const;
        }
        // Remove internal horizontal lines from empty rows to create clean spacing
        else if (
          data.row.index >= emptyRowStart &&
          data.row.index <= emptyRowEnd
        ) {
          if (data.cell.text[0] === "") {
            data.cell.styles.lineWidth = {
              top: data.row.index === emptyRowStart ? 0 : 0,
              right: 0.12,
              bottom: data.row.index === emptyRowEnd ? 0.12 : 0,
              left: 0.12,
            };
          }
        }
        // All other cells (product rows and tax rows)
        else {
          data.cell.styles.lineWidth = 0.12;
          data.cell.styles.lineColor = [0, 0, 0];
        }
      },
    });

    // Get the final Y position from the second table
    const secondTableFinalY = (doc as any).lastAutoTable.finalY || 200;

    /** ========== TAX CALCULATION TABLE ========== **/
    autoTable(doc, {
      startY: secondTableFinalY + 0.5,
      theme: "grid",
      styles: {
        fontSize: 8,
        cellPadding: 2,
        lineColor: [0, 0, 0],
        lineWidth: 0.12,
        valign: "middle",
        halign: "center",
      },
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: "bold",
        halign: "center",
      },
      columnStyles: {
        0: { cellWidth: 30, halign: "center" }, // HSN/SAC
        1: { cellWidth: 30, halign: "right" }, // Taxable Value
        2: { cellWidth: 20, halign: "center" }, // Central Tax Rate
        3: { cellWidth: 25, halign: "right" }, // Central Tax Amount
        4: { cellWidth: 20, halign: "center" }, // State Tax Rate
        5: { cellWidth: 25, halign: "right" }, // State Tax Amount
        6: { cellWidth: 32, halign: "right" }, // Total Tax Amount
      },
      head: [
        [
          "HSN/SAC",
          "Taxable\nValue",
          "Central Tax\nRate",
          "Central Tax\nAmount",
          "State Tax\nRate",
          "State Tax\nAmount",
          "Total\nTax Amount",
        ],
      ],
      body: [
        [
          this.invoice.hsn, // HSN/SAC code
          `${totalBaseAmount.toFixed(2)}`, // Taxable Value
          "2.50%", // Central Tax Rate
          `${cgstAmount.toFixed(2)}`, // Central Tax Amount
          "2.50%", // State Tax Rate
          `${sgstAmount.toFixed(2)}`, // State Tax Amount
          `${(cgstAmount + sgstAmount).toFixed(2)}`, // Total Tax Amount
        ],
        // Total row
        [
          {
            content: "Total",
            styles: {
              fontStyle: "bold",
              fillColor: [240, 240, 240],
              halign: "center",
            },
          },
          {
            content: `${totalBaseAmount.toFixed(2)}`,
            styles: {
              fontStyle: "bold",
              fillColor: [240, 240, 240],
              halign: "right",
            },
          },
          "", // Empty cell for rate column
          {
            content: `${cgstAmount.toFixed(2)}`,
            styles: {
              fontStyle: "bold",
              fillColor: [240, 240, 240],
              halign: "right",
            },
          },
          "", // Empty cell for rate column
          {
            content: `${sgstAmount.toFixed(2)}`,
            styles: {
              fontStyle: "bold",
              fillColor: [240, 240, 240],
              halign: "right",
            },
          },
          {
            content: `${(cgstAmount + sgstAmount).toFixed(2)}`,
            styles: {
              fontStyle: "bold",
              fillColor: [240, 240, 240],
              halign: "right",
            },
          },
        ],
        // Tax Amount in words row
        [
          {
            content:
              "Tax Amount (in words) :" +
              `Rupees ${numberToWords(
                Math.floor(cgstAmount + sgstAmount)
              )} and ${Math.round(
                ((cgstAmount + sgstAmount) % 1) * 100
              )} Paise Only`,
            colSpan: 7,
            styles: {
              fontSize: 7,
              halign: "left",
              fontStyle: "bold",
            },
          },
          "",
          "",
          "",
          "",
          "",
          "", // Empty cells for colSpan
        ],
      ],
      didParseCell: function (data) {
        // Style the total row (second row - index 1)
        if (data.row.index === 1) {
          data.cell.styles.fillColor = [240, 240, 240];
          data.cell.styles.fontStyle = "bold";
        }

        // Ensure all cells have borders
        data.cell.styles.lineWidth = 0.12;
        data.cell.styles.lineColor = [0, 0, 0];
      },
    });

    // Get the final Y position from the tax table
    const taxTableFinalY =
      (doc as any).lastAutoTable.finalY || secondTableFinalY + 50;

    /** ========== THIRD TABLE - FOOTER/DECLARATION ========== **/
    autoTable(doc, {
      startY: taxTableFinalY + 0.5,
      theme: "grid",
      styles: {
        fontSize: 7,
        cellPadding: 1,
        lineColor: [0, 0, 0],
        lineWidth: 0.12,
        valign: "top",
        halign: "left",
      },
      columnStyles: {
        0: { cellWidth: 95, halign: "left" as const }, // Left column (Remarks, PAN, Declaration)
        1: { cellWidth: 87, halign: "right" as const }, // Right column (Company signature)
      },
      body: [
        // First row - Remarks and Company header
        [
          {
            content: "Remarks:",
            styles: { fontStyle: "bold" as const, halign: "left" as const },
          },
          {
            content: "for DOLPHIN INTERNATIONAL",
            styles: { fontStyle: "bold" as const, halign: "right" as const },
          },
        ],
        // Second row - DMG Charges and signature space
        [
          {
            content: "Total DMG Charges - 11689.00",
            styles: { halign: "left" as const, minCellHeight: 20 },
          },
          {
            content: "\n\nAuthorised Signatory",
            styles: {
              halign: "right" as const,
              valign: "bottom" as const,
              minCellHeight: 20,
            },
          },
        ],
        // Third row - PAN information
        [
          {
            content: "Company's PAN :        AABFD0471D",
            styles: { halign: "left" as const },
          },
          "",
        ],
        // Fourth row - Declaration
        [
          {
            content: "Declaration",
            styles: { fontStyle: "bold" as const, halign: "left" as const },
          },
          "",
        ],
        // Fifth row - Declaration text (spanning full width)
        [
          {
            content:
              "We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.",
            colSpan: 2,
            styles: { halign: "center" as const, fontStyle: "bold" as const },
          },
          "",
        ],
        // Sixth row - Jurisdiction
        [
          {
            content: "SUBJECT TO BANGALORE JURISDICTION",
            colSpan: 2,
            styles: { halign: "center" as const, fontStyle: "bold" as const },
          },
          "",
        ],
        // Seventh row - Computer generated
        [
          {
            content: "This is a Computer Generated Invoice",
            colSpan: 2,
            styles: { halign: "center" as const, fontStyle: "bold" as const },
          },
          "",
        ],
      ],
      didParseCell: function (data) {
        // Apply borders to all cells
        data.cell.styles.lineWidth = 0.12;
        data.cell.styles.lineColor = [0, 0, 0];

        // Special handling for signature cell (row 1, column 1)
        if (data.row.index === 1 && data.column.index === 1) {
          data.cell.styles.minCellHeight = 20;
          data.cell.styles.valign = "bottom" as const;
        }
      },
    });

    doc.save(`packing-list-${this.invoice.gatePassNo || "export"}.pdf`);
  }

  addFooterToLastPage(doc: any, pageWidth: number, pageHeight: number): void {
    const currentY = (doc as any).lastAutoTable.finalY;
    const footerHeight = 50; // Approximate height needed for footer content
    const marginFromBottom = 10; // Margin from page bottom

    // Check if there's enough space for footer on current page
    const availableSpace = pageHeight - currentY - marginFromBottom;

    if (availableSpace < footerHeight) {
      // Not enough space, move to next page
      doc.addPage();
      const newFooterY = 30; // Start from top of new page with some margin
      this.drawFooterContent(doc, pageWidth, pageHeight, newFooterY);
    } else {
      // Enough space, add footer on current page
      const footerY = currentY + 10; // Small gap after totals table
      this.drawFooterContent(doc, pageWidth, pageHeight, footerY);
    }

    // Add page numbers to all pages
    this.addPageNumbers(doc);
  }

  drawFooterContent(
    doc: any,
    pageWidth: number,
    pageHeight: number,
    startY: number
  ): void {
    let currentY = startY;

    // IEC, GSTIN, PAN info at left side
    doc.setFontSize(8).setFont("helvetica", "normal");
    doc.text("IEC No: - 0798015888", 20, currentY);
    doc.text("GSTIN: - 29AABFD0471D1ZV, STATE CODE: - 29", 20, currentY + 5);
    doc.text("PAN NO: - AABFD0471D", 20, currentY + 10);

    // Signature area at right side
    doc.text("Signature & Date", pageWidth - 80, currentY);
    doc.text("for DOLPHIN INTERNATIONAL", pageWidth - 80, currentY + 5);
    doc.text("AUTHORIZED SIGNATURE", pageWidth - 80, currentY + 15);

    // Company footer at bottom - always at page bottom regardless of where footer starts
    doc.setFontSize(7);
    doc.text(
      "NO 2/10, 4TH FLOOR, 80FT ROAD, OPPOSITE, RAMAIAH HOSPITAL RMV 2nd STAGE, BANGALORE 560 094, INDIA.",
      pageWidth / 2,
      pageHeight - 15,
      { align: "center" }
    );
    doc.text(
      'Illal Off: "Vasudev", Opp. S.V.M.College, ILKAL - 587 125, INDIA Off: 91-8351-270361 Fax: 270123',
      pageWidth / 2,
      pageHeight - 11,
      { align: "center" }
    );
    doc.text(
      "E-mail: di@dolphingranite.com Website: http://www.dolphingranite.com",
      pageWidth / 2,
      pageHeight - 7,
      { align: "center" }
    );
  }
 

  // Helper method for date formatting
  public formatDate(date: any): string {
    if (!date) return "";
    if (date instanceof Date) {
      return date.toLocaleDateString("en-GB");
    }
    if (typeof date === "string") {
      return new Date(date).toLocaleDateString("en-GB");
    }
    return date.toString();
  }



  // Helper method to convert regular invoice to tax invoice format


  convertImageToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  }

 exportDeliveryChallanToPDF(): void {
    if (!this.invoice) return;

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });
    const pageWidth = doc.internal.pageSize.width;
    /** ========== FIRST PAGE LAYOUT ========== **/
    this.drawFirstPageLayout(doc, pageWidth, "deliverychallan");


    /** ========== MAIN INFO TABLE - DELIVERY CHALLAN FORMAT ========== **/
   autoTable(doc, {
  startY: 35,
  theme: "grid",
  styles: {
    fontSize: 8,
    cellPadding: 1,
    lineColor: [0, 0, 0],
    lineWidth: 0.12,
    valign: "top",
    halign: "left",
  },
  columnStyles: {
    0: { cellWidth: 95 }, // Left column - Exporter details
    1: { cellWidth: 55 }, // Middle column
    2: { cellWidth: 27 }, // Right column
  },
  body: [
    // Row 1 - FIXED: Remove extra empty string when using colSpan
    [
      {
        content: `Exporter\nDOLPHIN INTERNATIONAL\n2/10, 4th Floor, 80ft Road,\nOpp. Ramaiah Hospital\nRMV 2nd Stage, Bangalore - 560094\nGSTIN/UIN: 29AABFD0471D1ZV\nState Name : Karnataka, Code : 29`,
        rowSpan: 4,
        styles: { valign: "top" },
      },
      {
        content: "Delivery Challan No",
        colSpan: 2
      },
      // Don't add empty string here when using colSpan
    ],
    // Row 2
    [
      {
        content: "Dated: " + this.invoice.dated,
        colSpan: 2
      },
    ],
    // Row 3
    [
      {
        content: "Export to Country: " + this.invoice.country,
        colSpan: 2
      },
    ],
    // Row 4
    [
      {
        content: "",
        colSpan: 2
      },
    ],
    // Row 5
    [
      {
        content: `Place of Loading :\nPURTHAGERI VILLEGE\nKOPPAL DIST - 583281`,
        rowSpan: 5,
        styles: { valign: "top" },
      },
      {
        content: "Country of Origin of Goods: India",
        colSpan: 2
      },
    ],
    // Row 6
    [
      {
        content: "Place of Receipt: " + this.invoice.placeOfDispatch,
        colSpan: 2
      },
    ],
    // Row 7
    [
      {
        content: "Pre-Carriage by: " + this.invoice.dispatchedThrough,
        colSpan: 2
      },
    ],
    // Row 8
    [
      {
        content: "Port of Loading: Krishnapatnam Port",
        colSpan: 2
      }
    ],
    // Row 9
    [
      {
        content: "Despatched through: Truck",
        colSpan: 2
      },
    ],
    // Row 10
    [
      {
        content: `Consignee :\nXiamen Jingtaiquan Industrial Co.Ltd, CHINA\nUnloading Destination :\nGSTN-37AADCO1422E1ZW\nOmshree Maa Mangala Logistics Pvt Ltd\nStock Yard KRISHNAPATNAM PORT.\nNellore- 524344 Andra Pradesh\nPic : Mr. Ranjan\nMob: 77997 91904`,
        rowSpan: 3,
        styles: { valign: "top" },
      },
      {
        content: `Motor Vehicle No.: ${this.invoice.vehicleNo}`,
        colSpan: 2
      },
    ],
    // Row 11
    [
      {
        content: "E Way Bill No.",
        colSpan: 2
      }
    ],
    // Row 12
    [
      {
        content: "Terms of Delivery",
        colSpan: 2,
      },
    ],
  ],
  didParseCell: function (data) {
    // Apply borders to all cells
    data.cell.styles.lineWidth = 0.12;
    data.cell.styles.lineColor = [0, 0, 0];
  },
});
    // Get the final Y position from the first table
    const firstTableFinalY = (doc as any).lastAutoTable.finalY || 100;

    // Function to convert number to words
    const numberToWords = (num: number): string => {
      const ones = [
        "",
        "One",
        "Two",
        "Three",
        "Four",
        "Five",
        "Six",
        "Seven",
        "Eight",
        "Nine",
      ];
      const tens = [
        "",
        "",
        "Twenty",
        "Thirty",
        "Forty",
        "Fifty",
        "Sixty",
        "Seventy",
        "Eighty",
        "Ninety",
      ];
      const teens = [
        "Ten",
        "Eleven",
        "Twelve",
        "Thirteen",
        "Fourteen",
        "Fifteen",
        "Sixteen",
        "Seventeen",
        "Eighteen",
        "Nineteen",
      ];

      const convertHundreds = (n: number): string => {
        let result = "";
        if (n >= 100) {
          result += ones[Math.floor(n / 100)] + " Hundred ";
          n %= 100;
        }
        if (n >= 20) {
          result += tens[Math.floor(n / 10)] + " ";
          n %= 10;
        } else if (n >= 10) {
          result += teens[n - 10] + " ";
          return result;
        }
        if (n > 0) {
          result += ones[n] + " ";
        }
        return result;
      };

      if (num === 0) return "Zero";

      let result = "";
      const crore = Math.floor(num / 10000000);
      const lakh = Math.floor((num % 10000000) / 100000);
      const thousand = Math.floor((num % 100000) / 1000);
      const remainder = num % 1000;

      if (crore > 0) {
        result += convertHundreds(crore) + "Crore ";
      }
      if (lakh > 0) {
        result += convertHundreds(lakh) + "Lakh ";
      }
      if (thousand > 0) {
        result += convertHundreds(thousand) + "Thousand ";
      }
      if (remainder > 0) {
        result += convertHundreds(remainder);
      }

      return result.trim();
    };

    // Calculate totals
    let totalBaseAmount = 0;
    this.products.forEach((product) => {
      totalBaseAmount += parseFloat(product.amount);
    });

    const cgstRate = 2.5;
    const sgstRate = 2.5;
    const cgstAmount = (totalBaseAmount * cgstRate) / 100;
    const sgstAmount = (totalBaseAmount * sgstRate) / 100;
    const roundingOff = 0.54;
    const totalAmount = totalBaseAmount + cgstAmount + sgstAmount + roundingOff;

    // Convert total amount to words
    const amountInWords =
      numberToWords(Math.floor(totalAmount)) + " Rupees Only";

    // Calculate total quantity (assuming all in M.T)
    const totalQuantity = this.products.reduce((sum, product) => {
      const qty = parseFloat(product.quantity.split(" ")[0]);
      return sum + qty;
    }, 0);

    // Replace "//Add additional table" with this code:

    /** ========== GOODS DETAILS TABLE ========== **/
    // Build table body for goods details
    const goodsTableBody: any[] = [];

    // Add product rows with detailed information
    this.products.forEach((product, index) => {
      // Main product row
      goodsTableBody.push([
        {
          content: (index + 1).toString(),
          rowSpan: 3,
          styles: { valign: "middle", halign: "center" },
        },
        this.invoice?.gpType,
      this.invoice?.hsn,
        `${parseFloat(product.quantity.split(" ")[0]).toFixed(3)}`,
        parseFloat(product.rate).toFixed(2),
        product.per || "M.T",
        parseFloat(product.amount).toFixed(2),
      ]);

      // Block details row
      goodsTableBody.push([
        // First cell is merged from above (rowSpan)
        `No.of Blocks : ${this.invoice?.graniteStocks.length} Block\n${
         this.blocksids
        }`,
        "",
        "",
        "",
        "",
        "",
      ]);

      // Shipping mark row
      goodsTableBody.push([
        // First cell is merged from above (rowSpan)
        `Shipping Mark : FAN / XMN`,
        "",
        "",
        "",
        "",
        "",
      ]);
    });

    // Add total row
    goodsTableBody.push([
      "",
      {
        content: "Total",
        styles: { fontStyle: "bold", halign: "right" },
      },
      "",
      {
        content: `${totalQuantity.toFixed(3)}`,
        styles: { fontStyle: "bold", halign: "center" },
      },
      "",
      "",
      {
        content: `₹${totalBaseAmount.toFixed(2)}`,
        styles: { fontStyle: "bold", halign: "right" },
      },
    ]);

    autoTable(doc, {
      startY: firstTableFinalY + 0.5,
      theme: "grid",
      styles: {
        fontSize: 8,
        cellPadding: 2,
        lineColor: [0, 0, 0],
        lineWidth: 0.12,
        valign: "top",
        halign: "left",
      },
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: "bold",
        halign: "center",
        valign: "middle",
      },
      columnStyles: {
        0: { cellWidth: 15, halign: "center" }, // Sl No.
        1: { cellWidth: 80, halign: "left" }, // Description
        2: { cellWidth: 20, halign: "center" }, // HSN/SAC
        3: { cellWidth: 20, halign: "center" }, // Quantity
        4: { cellWidth: 15, halign: "right" }, // Rate
        5: { cellWidth: 12, halign: "center" }, // per
        6: { cellWidth: 20, halign: "right" }, // Amount
      },
      head: [
        [
          "Sl\nNo.",
          "Description of Goods",
          "HSN/SAC",
          "Quantity\nMetric Tonne",
          "Rate",
          "per",
          "Amount",
        ],
      ],
      body: goodsTableBody,
      didParseCell: function (data) {
        const totalRowIndex = data.table.body.length - 1; // Last row is total

        // Special styling for total row
        if (data.row.index === totalRowIndex) {
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.lineWidth = 0.12;
          data.cell.styles.lineColor = [0, 0, 0];
        }
        // Regular rows
        else {
          data.cell.styles.lineWidth = 0.12;
          data.cell.styles.lineColor = [0, 0, 0];
        }

        // Handle merged cells for block details and shipping mark rows
        const productCount = 0; // Will be calculated based on your products
        for (let i = 0; i < data.table.body.length - 1; i += 3) {
          // Block details row (second row of each product group)
          if (data.row.index === i + 1 && data.column.index > 1) {
            data.cell.styles.fillColor = [250, 250, 250];
          }
          // Shipping mark row (third row of each product group)
          if (data.row.index === i + 2 && data.column.index > 1) {
            data.cell.styles.fillColor = [250, 250, 250];
          }
        }
      },
    });

    // Get the final Y position from the goods table
    const goodsTableFinalY =
      (doc as any).lastAutoTable.finalY || firstTableFinalY + 100;

       /** ========== THIRD TABLE - FOOTER/DECLARATION ========== **/
    autoTable(doc, {
      startY: goodsTableFinalY,
      theme: "grid",
      styles: {
        fontSize: 7,
        cellPadding: 1,
        lineColor: [0, 0, 0],
        lineWidth: 0.12,
        valign: "top",
        halign: "left",
      },
      columnStyles: {
        0: { cellWidth: 95, halign: "left" as const }, // Left column (Remarks, PAN, Declaration)
        1: { cellWidth: 87, halign: "right" as const }, // Right column (Company signature)
      },
      body: [
        // First row - Remarks and Company header
        [
          {
            content: "Remarks:",
            styles: { fontStyle: "bold" as const, halign: "left" as const },
          },
          {
            content: "for DOLPHIN INTERNATIONAL",
            styles: { fontStyle: "bold" as const, halign: "right" as const },
          },
        ],
        // Second row - DMG Charges and signature space
        [
          {
            content: "",
            styles: { halign: "left" as const, minCellHeight: 20 },
          },
          {
            content: "\n\nAuthorised Signatory",
            styles: {
              halign: "right" as const,
              valign: "bottom" as const,
              minCellHeight: 20,
            },
          },
        ],
        // Third row - PAN information
        [
          {
            content: "Company's PAN :        AABFD0471D",
            colSpan: 2,
            styles: { halign: "left" as const },
          },
          "",
        ],
      ],
      didParseCell: function (data) {
        // Apply borders to all cells
        data.cell.styles.lineWidth = 0.12;
        data.cell.styles.lineColor = [0, 0, 0];

        // Special handling for signature cell (row 1, column 1)
        if (data.row.index === 1 && data.column.index === 1) {
          data.cell.styles.minCellHeight = 20;
          data.cell.styles.valign = "bottom" as const;
        }
      },
    });

    doc.save(`delivery-challan-${this.invoice.gatePassNo || "export"}.pdf`);
  }

}
