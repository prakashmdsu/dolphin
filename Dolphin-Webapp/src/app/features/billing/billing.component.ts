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
  graniteBlocks: GraniteBlock[] = []; // available blocks to add
  selectedBlockNos: number[] = [];
  gatePassNo?: string;
  constructor(
    private fb: FormBuilder,
    private httpService: HttpService,
    private router: Router
  ) {
    this.gatePassForm = this.createForm();
  }

  /** in your component */
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

        // Auto-generate next gate pass number
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

    // Remove selected blocks from graniteBlocks list
    this.graniteBlocks = this.graniteBlocks.filter(
      (block) => !blocksToAdd.includes(block.blockNo)
    );

    // Clear selection after adding
    this.selectedBlockNos = [];
  }

  createForm(): FormGroup {
    return this.fb.group({
      // companyName: ['Dolphin International', Validators.required],
      // address: ['AP Puttageri Tq : Kusngi, Dt Koppai', Validators.required],
      gatePassNo: ['GP-001', Validators.required],
      dispatchDate: ['', Validators.required],
      billTo: ['', Validators.required],
      country: ['', Validators.required],
      billToAddress: ['', Validators.required],
      gstin: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      gpType: ['', Validators.required],
      placeOfDispatch: ['', Validators.required],
      graniteStocks: this.fb.array([]),
      notes: [''],
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
      this.gatePassForm.patchValue({
        gstin: selectedClient.gstin,
        phone: selectedClient.phone,
        billToAddress: selectedClient.address,
        country: selectedClient.country,
      });
    } else {
      this.gatePassForm.patchValue({
        gstin: '',
        phone: '',
        billToAddress: '',
        country: '',
      });
    }
  }

  private getNextGatePassNo(currentGatePassNo: string): string {
    const match = currentGatePassNo.match(/^([A-Za-z\-]*)(\d+)$/);
    if (!match) return 'GP-001'; // fallback

    const prefix = match[1]; // 'GP-'
    const number = parseInt(match[2], 10); // e.g., 1 from '001'
    const nextNumber = number + 1;

    // Pad with leading zeros to maintain length (e.g., '002')
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

    const quarryCbm = +((lg * wd * ht) / 1000000).toFixed(4); // m³
    const dmgTonnage = +(quarryCbm * 2.85).toFixed(4); // example factor
    const netCbm = +(dmgTonnage / 6.5).toFixed(4); // example factor

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
      hsn: [block?.hsn || '', Validators.required],
      categoryGrade: [block?.categoryGrade || '', Validators.required],
      measurement: this.fb.group({
        lg: [measurement.lg, [Validators.required, Validators.min(0.1)]],
        wd: [measurement.wd, [Validators.required, Validators.min(0.1)]],
        ht: [measurement.ht, [Validators.required, Validators.min(0.1)]],
      }),
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
      permitNo: [block?.permitNo || '', Validators.required],
    });
  }

  addItemFromDropdown(selectedBlockNo: number): void {
    const selectedBlock = this.graniteBlocks.find(
      (block) => block.blockNo === selectedBlockNo
    );
    if (selectedBlock) {
      const itemForm = this.createItemFormGroup(selectedBlock);
      this.items.push(itemForm);

      // remove block from available list
      this.graniteBlocks = this.graniteBlocks.filter(
        (block) => block.blockNo !== selectedBlockNo
      );
    }
  }

  removeItem(index: number): void {
    // 1) grab the raw values (including disabled controls)
    const raw = (this.items.at(index) as FormGroup).getRawValue();
    const blockNo = raw.blockNo; // now defined
    // 2) find the original block object by blockNo
    const original = this.allBlocksSnapshot.find((b) => b.blockNo === blockNo);
    if (original) {
      this.graniteBlocks.push({ ...original });
      // optional: keep the dropdown sorted by blockNo
      this.graniteBlocks.sort((a, b) => a.blockNo - b.blockNo);
    }
    // 3) remove the form‑array row
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
        measurement: selectedBlock.measurement,
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
  } {
    let totalQuarryCbm = 0;
    let totalDmgTonnage = 0;
    let totalNetCbm = 0;

    this.items.controls.forEach((item) => {
      totalQuarryCbm += +(item.get('quarryCbm')?.value || 0);
      totalDmgTonnage += +(item.get('dmgTonnage')?.value || 0);
      totalNetCbm += +(item.get('netCbm')?.value || 0);
    });

    return {
      totalQuarryCbm: +totalQuarryCbm.toFixed(4),
      totalDmgTonnage: +totalDmgTonnage.toFixed(4),
      totalNetCbm: +totalNetCbm.toFixed(4),
    };
  }

  onSubmit(): void {
    if (this.gatePassForm.valid) {
      console.log('Gate Pass Form Data:', this.gatePassForm.value);

      this.httpService
        .post<any>('dolphin/invoice', this.gatePassForm.value)
        .subscribe({
          next: (res) => {
            // Assuming the response contains the newly created invoice ID
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
