// Updated TypeScript Component
import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { GraniteBlock } from '../shared/GraniteBlock';
import { HttpService } from '../../shared/http-serve.service';
import { Client } from '../shared/Client';
import { PreBilling } from '../shared/PreBilling';
import { Router } from '@angular/router';

@Component({
  selector: 'app-billing',
  standalone: false,
  templateUrl: './billing.component.html',
  styleUrl: './billing.component.scss',
})
export class BillingComponent implements OnInit {
  gatePassForm: FormGroup;
  gpTypes: any[] = [];
  clients: Client[] = [];
  graniteBlocks: GraniteBlock[] = [];
  selectedBlockNos: number[] = [];
  gatePassNo?: string;
  isInternationalClient: boolean = false; // New property to track client type
  
  hsnOptions = [
    {
      value: '25171000',
      label: '25171000 - Granite (crude or roughly trimmed)',
    },
    {
      value: '25172000',
      label: '25172000 - Granite (merely cut, by sawing or otherwise)',
    },
    {
      value: '68029100',
      label: '68029100 - Granite tiles, cubes and similar articles',
    },
    { value: '68029900', label: '68029900 - Other granite articles' },
    { value: '25169000', label: '25169000 - Other natural stone' },
    { value: '68022100', label: '68022100 - Granite slabs' },
    { value: '68022900', label: '68022900 - Other granite products' },
  ];

  termsOfPaymentOptions = [
    { value: '100% advance payment', label: '100% advance payment' },
    { value: 'Net 30', label: 'Net 30' },
    { value: 'Net 60', label: 'Net 60' },
    { value: 'COD', label: 'Cash on Delivery' },
    { value: 'Letter of Credit', label: 'Letter of Credit' },
  ];

  constructor(
    private fb: FormBuilder,
    private httpService: HttpService,
    private router: Router
  ) {
    this.gatePassForm = this.createForm();
  }

  allBlocksSnapshot: GraniteBlock[] = [];

  ngOnInit(): void {
    this.httpService
      .get<PreBilling>('Dolphin/bllingprepopulateddata')
      .subscribe((res) => {
        this.gpTypes = res.gpTypes;
        this.clients = res.clients;
        this.graniteBlocks = res.graniteStockBlocks;
        this.allBlocksSnapshot = JSON.parse(
          JSON.stringify(res.graniteStockBlocks)
        );

        this.gatePassNo = this.getNextGatePassNo(res?.gatePass ?? 'GP-001');
        this.gatePassForm.patchValue({ gatePassNo: this.gatePassNo });
      });
  }

  onBlocksSelected(): void {
    const blocksToAdd = this.selectedBlockNos;

    blocksToAdd.forEach((blockNo) => {
      const block = this.graniteBlocks.find((b) => b.blockNo === blockNo);
      if (block) {
        this.items.push(this.createItemFormGroup(block));
      }
    });

    this.graniteBlocks = this.graniteBlocks.filter(
      (block) => !blocksToAdd.includes(block.blockNo)
    );

    this.selectedBlockNos = [];
  }

  createForm(): FormGroup {
    return this.fb.group({
      gatePassNo: ['GP-001', Validators.required],
      dispatchDate: ['', Validators.required],
      billTo: ['', Validators.required],
      country: ['', Validators.required],
      billToAddress: ['', Validators.required],
      gstin: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      gpType: ['', Validators.required],
      placeOfDispatch: ['', Validators.required],
      hsn: ['', Validators.required],
      permitNo: ['', Validators.required],
      graniteStocks: this.fb.array([]),
      vehicleNo: ['', Validators.required],
      driverName: ['', Validators.required],
      driverContactNo: [
        '',
        [Validators.required, Validators.pattern(/^\d{10}$/)],
      ],
      tansporterContactNo: [
        '',
        [Validators.required, Validators.pattern(/^\d{10}$/)],
      ],
      notes: [''],
      ewayBillNo: [''],
      buyersOrderNumber: [''],
      supplierRef: [''],
      otherReference: [''],
      dispatchedThrough: [''],
      destination: [''],
      termsOfPayment: ['100% advance payment'],
      deliveryNoteDate: [''],
      otherrefence: [''],
      
      // International fields - conditionally validated
      BuyersOrderDate: [''],
      PlaceReceiptbyCarrier: [''],
      PortofDischarge: [''],
      PortofLoading: [''],
      PreCarrierBy: [''],
      ShippingBillDate: [''],
      ShippingBillno: [''],
      vesselorflightno: [''],
      portCode:['']
    });
  }

  get items(): FormArray {
    return this.gatePassForm.get('graniteStocks') as FormArray;
  }

  onClientChange(clientId: string): void {
    const selectedClient = this.clients.find(
      (client) => client.clientName === clientId
    );
    
    if (selectedClient) {
      // Check if client is international
      this.isInternationalClient = selectedClient.clientType === 'INTERNATIONAL';
      
      this.gatePassForm.patchValue({
        gstin: selectedClient.gstin,
        phone: selectedClient.phone,
        billToAddress: selectedClient.address,
        country: selectedClient.country,
      });

      // Update validators for international fields
      this.updateInternationalFieldValidators();
    } else {
      this.isInternationalClient = false;
      this.gatePassForm.patchValue({
        gstin: '',
        phone: '',
        billToAddress: '',
        country: '',
      });

      // Clear international fields and remove validators
      this.clearInternationalFields();
    }
  }

  private updateInternationalFieldValidators(): void {
    const internationalFields = [
      'BuyersOrderDate',
      'PlaceReceiptbyCarrier', 
      'PortofDischarge',
      'PortofLoading',
      'PreCarrierBy',
      'ShippingBillDate',
      'ShippingBillno',
      'vesselorflightno',
      'portCode'
    ];

    internationalFields.forEach(fieldName => {
      const control = this.gatePassForm.get(fieldName);
      if (control) {
        if (this.isInternationalClient) {
          control.setValidators([Validators.required]);
        } else {
          control.clearValidators();
          control.setValue(''); // Clear the value
        }
        control.updateValueAndValidity();
      }
    });
  }

  private clearInternationalFields(): void {
    const internationalFields = [
      'BuyersOrderDate',
      'PlaceReceiptbyCarrier',
      'PortofDischarge', 
      'PortofLoading',
      'PreCarrierBy',
      'ShippingBillDate',
      'ShippingBillno',
      'vesselorflightno',
       'portCode'
    ];

    const patchObject: any = {};
    internationalFields.forEach(fieldName => {
      patchObject[fieldName] = '';
      const control = this.gatePassForm.get(fieldName);
      if (control) {
        control.clearValidators();
        control.updateValueAndValidity();
      }
    });

    this.gatePassForm.patchValue(patchObject);
  }

  private getNextGatePassNo(currentGatePassNo: string): string {
    const match = currentGatePassNo.match(/^([A-Za-z\-]*)(\d+)$/);
    if (!match) return 'GP-001';

    const prefix = match[1];
    const number = parseInt(match[2], 10);
    const nextNumber = number + 1;
    const padded = nextNumber.toString().padStart(match[2].length, '0');

    return `${prefix}${padded}`;
  }

  private calculateDerivedFields(measurement: {
    lg: number;
    wd: number;
    ht: number;
  }) {
    const lg = +measurement.lg || 0;
    const wd = +measurement.wd || 0;
    const ht = +measurement.ht || 0;

    const quarryCbm = +((lg * wd * ht) / 1000000).toFixed(4);
    const dmgTonnage = +(quarryCbm * 2.85).toFixed(4);
    const netCbm = +(dmgTonnage / 6.5).toFixed(4);

    return { quarryCbm, dmgTonnage, netCbm };
  }

  createItemFormGroup(block?: GraniteBlock): FormGroup {
    const measurement = block?.measurement || { lg: 0, wd: 0, ht: 0 };
    const derived = this.calculateDerivedFields(measurement);

    return this.fb.group({
      blockNo: [block?.blockNo || '', Validators.required],
      itemDescription: [
        block?.itemDescription || 'Granite Block',
        Validators.required,
      ],
      categoryGrade: [block?.categoryGrade || '', Validators.required],
      measurement: this.fb.group({
        lg: [measurement.lg, [Validators.required, Validators.min(0.1)]],
        wd: [measurement.wd, [Validators.required, Validators.min(0.1)]],
        ht: [measurement.ht, [Validators.required, Validators.min(0.1)]],
      }),
      netWeightMt: [
        block?.netWeightMt || 0,
        [Validators.required, Validators.min(0.1)],
      ],
      quarryCbm: [
        derived.quarryCbm,
        [Validators.required, Validators.min(0.1)],
      ],
      dmgTonnage: [
        derived.dmgTonnage,
        [Validators.required, Validators.min(0.1)],
      ],
      netCbm: [derived.netCbm, [(Validators.required, Validators.min(0.1))]],
      uom: [block?.uom || 'CBM', Validators.required],
    });
  }

  addItemFromDropdown(selectedBlockNo: number): void {
    const selectedBlock = this.graniteBlocks.find(
      (block) => block.blockNo === selectedBlockNo
    );
    if (selectedBlock) {
      const itemForm = this.createItemFormGroup(selectedBlock);
      this.items.push(itemForm);

      this.graniteBlocks = this.graniteBlocks.filter(
        (block) => block.blockNo !== selectedBlockNo
      );
    }
  }

  removeItem(index: number): void {
    const raw = (this.items.at(index) as FormGroup).getRawValue();
    const blockNo = raw.blockNo;
    const original = this.allBlocksSnapshot.find((b) => b.blockNo === blockNo);
    if (original) {
      this.graniteBlocks.push({ ...original });
      this.graniteBlocks.sort((a, b) => a.blockNo - b.blockNo);
    }
    this.items.removeAt(index);
  }

  onBlockNoChange(index: number, selectedBlockNo: number): void {
    const selectedBlock = this.graniteBlocks.find(
      (block) => block.blockNo === selectedBlockNo
    );
    if (selectedBlock) {
      const itemForm = this.items.at(index) as FormGroup;
      const derived = this.calculateDerivedFields(selectedBlock.measurement);

      itemForm.patchValue({
        hsn: selectedBlock.hsn,
        categoryGrade: selectedBlock.categoryGrade,
        quarryCbm: derived.quarryCbm,
        dmgTonnage: derived.dmgTonnage,
        netCbm: derived.netCbm,
        itemDescription: selectedBlock.itemDescription,
        permitNo: selectedBlock.permitNo,
        uom: selectedBlock.uom,
      });
    }
  }

  onMeasurementChange(itemIndex: number): void {
    const itemForm = this.items.at(itemIndex) as FormGroup;
    const measurement = itemForm.get('measurement')?.value;
    const derived = this.calculateDerivedFields(measurement);

    itemForm.patchValue({
      quarryCbm: derived.quarryCbm,
      dmgTonnage: derived.dmgTonnage,
      netCbm: derived.netCbm,
    });
  }

  calculateTotals(): {
    totalQuarryCbm: number;
    totalDmgTonnage: number;
    totalNetCbm: number;
    totalNetWeightMt: number;
  } {
    let totalQuarryCbm = 0;
    let totalDmgTonnage = 0;
    let totalNetCbm = 0;
    let totalNetWeightMt = 0;

    this.items.controls.forEach((item) => {
      totalQuarryCbm += +(item.get('quarryCbm')?.value || 0);
      totalDmgTonnage += +(item.get('dmgTonnage')?.value || 0);
      totalNetCbm += +(item.get('netCbm')?.value || 0);
      totalNetWeightMt += +(item.get('netWeightMt')?.value || 0);
    });

    return {
      totalQuarryCbm: +totalQuarryCbm.toFixed(4),
      totalDmgTonnage: +totalDmgTonnage.toFixed(4),
      totalNetCbm: +totalNetCbm.toFixed(4),
      totalNetWeightMt: +totalNetWeightMt.toFixed(4),
    };
  }

  onSubmit(): void {
    if (this.gatePassForm.valid) {
      console.log('Gate Pass Form Data:', this.gatePassForm.value);

      this.httpService
        .post<any>('dolphin/invoice', this.gatePassForm.value)
        .subscribe({
          next: (res) => {
            if (res && res.id) {
              this.router.navigate(['/features/summary'], {
                queryParams: { id: res.id },
              });
            } else {
              alert('Invoice saved, but ID not returned.');
            }
          },
          error: (err) => {
            console.error('Error saving invoice:', err);
            alert('Failed to save invoice. Please try again.');
          },
        });
    } else {
      this.markFormGroupTouched(this.gatePassForm);
      alert('Please fill all required fields correctly.');
    }
  }

  private markFormGroupTouched(formGroup: FormGroup | FormArray): void {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      if (control instanceof FormGroup || control instanceof FormArray) {
        this.markFormGroupTouched(control);
      } else {
        control?.markAsTouched();
      }
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.gatePassForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  isItemFieldInvalid(index: number, fieldName: string): boolean {
    const field = this.items.at(index).get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldErrorMessage(fieldName: string): string {
    const field = this.gatePassForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return `${fieldName} is required`;
      if (field.errors['pattern']) return `${fieldName} format is invalid`;
      if (field.errors['min']) return `${fieldName} must be greater than 0`;
    }
    return '';
  }
}