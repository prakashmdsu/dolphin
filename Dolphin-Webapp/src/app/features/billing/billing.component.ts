import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { GraniteBlock } from '../shared/GraniteBlock';
import { HttpService } from '../shared/http-serve.service';
import { Client } from '../shared/Client';
import { PreBilling } from '../shared/PreBilling';

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

  constructor(private fb: FormBuilder, private httpService: HttpService) {
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
        // make a deep copy so you always have the “master” list:
        this.allBlocksSnapshot = JSON.parse(
          JSON.stringify(res.graniteStockBlocks)
        );
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
      // alert('Gate Pass submitted successfully!');

      this.httpService
        .post('dolphin/invoice', this.gatePassForm.value)
        .subscribe((res) => {});
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
