import { Component, OnInit, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { StockGraniteBlock } from '../shared/StockBlock';
import { HttpService } from '../../shared/http-serve.service';
import { AuthService } from '../../shared/auth.service';

export interface DialogData {
  block?: StockGraniteBlock;
  mode: 'add' | 'edit';
}

@Component({
  selector: 'app-stockgraniteblock',
  standalone: false,
  templateUrl: './stockgraniteblock.component.html',
  styleUrls: ['./stockgraniteblock.component.scss'],
})
export class StockgraniteblockComponent implements OnInit {
  blockForm!: FormGroup;
  calculatedQuarryCbm: number = 0;
  calculatedDmgTonnage: number = 0;
  volumeUser: number = 0;
  calculatedNetCbm: number = 0;
  grossVolume: number = 0;
  customerTonnage: number = 0;

  categoryGrades: string[] = ['A', 'B', 'C', 'D'];
  preAllowance: number[] = [5, 10, 15, 20, 25, 30];
  blockTypes: string[] = ['Shaped', 'Irregular Shape'];
  pitNumbers: number[] = Array.from({ length: 10 }, (_, i) => i + 1);
  isSubmitting = false;

  // Role-based access
  isMember: boolean = false;
  isAdminOrAbove: boolean = false;

  constructor(
    private fb: FormBuilder,
    private httpService: HttpService,
    private authService: AuthService,
    public dialogRef: MatDialogRef<StockgraniteblockComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {
    this.isMember = this.authService.getUserRole() === 'member';
    this.isAdminOrAbove = this.authService.isAdmin();
  }

  ngOnInit() {
    this.initializeForm();
    this.setupFormSubscriptions();

    if (this.data.mode === 'edit' && this.data.block) {
      this.populateForm(this.data.block);
    }
  }

  private initializeForm() {
    this.blockForm = this.fb.group({
      id: [''],
      date: [new Date(), Validators.required],
      pitNo: [null, Validators.required],
      blockNo: [null, Validators.required],
      blockType: ['', Validators.required],
      buyerBlockNo: [null, this.isAdminOrAbove ? Validators.required : []],
      categoryGrade: ['', Validators.required],
      allowanceType: ['volume'], // Default to volume
      preAllowance: [null],
      tonnageAllowance: [null],
      grossVolume: [''],
      measurement: this.fb.group({
        lg: [null, [Validators.required, Validators.min(0)]],
        wd: [null, [Validators.required, Validators.min(0)]],
        ht: [null, [Validators.required, Validators.min(0)]],
      }),
      dispatchStatus: [false],
      updatedDate: [null],
      note: [''],
      // netWeightMt: [
      //   null,
      //   this.isAdminOrAbove ? [Validators.required, Validators.min(0)] : [],
      // ],
    });
  }

  private setupFormSubscriptions() {
    // Listen to measurement changes
    this.blockForm.get('measurement')?.valueChanges.subscribe(() => {
      this.updateCalculatedFields();
    });

    // Listen to pre-allowance changes
    this.blockForm.get('preAllowance')?.valueChanges.subscribe(() => {
      this.updateCalculatedFields();
    });

    // Listen to allowance type changes
    this.blockForm.get('allowanceType')?.valueChanges.subscribe((value) => {
      // Clear the other field when switching
      if (value === 'volume') {
        this.blockForm.get('tonnageAllowance')?.setValue(null);
      } else {
        this.blockForm.get('preAllowance')?.setValue(null);
      }
      this.updateCalculatedFields();
    });

    // Listen to tonnage allowance changes
    this.blockForm.get('tonnageAllowance')?.valueChanges.subscribe(() => {
      this.updateCalculatedFields();
    });
  }

  private populateForm(block: StockGraniteBlock) {
    this.blockForm.patchValue({
      ...block,
      date: new Date(block.date),
    });
    this.updateCalculatedFields();
  }

  updateCalculatedFields() {
    const m = this.blockForm.get('measurement')?.value;
    const lg = +m.lg || 0;
    const wd = +m.wd || 0;
    const ht = +m.ht || 0;
    const allowanceType =
      this.blockForm.get('allowanceType')?.value || 'volume';
    const preAllowanceValue = +this.blockForm.get('preAllowance')?.value || 0;
    const tonnageAllowance =
      +this.blockForm.get('tonnageAllowance')?.value || 0;

    this.volumeUser = (lg * wd * ht) / 1000000;
    // Quarry CBM = Raw volume (no deduction) - for Govt
    this.calculatedQuarryCbm = +((lg * wd * ht) / 1000000).toFixed(4);

    // DMG Tonnage = Quarry CBM × 2.85 (for Govt - no deduction)
    this.calculatedDmgTonnage = +(this.calculatedQuarryCbm * 2.85).toFixed(4);

    if (allowanceType === 'volume') {
      // Volume-based allowance: Deduct from dimensions
      this.grossVolume = +(
        ((lg - preAllowanceValue) *
          (wd - preAllowanceValue) *
          (ht - preAllowanceValue)) /
        1000000
      ).toFixed(4);

      // Ensure gross volume doesn't go negative
      if (this.grossVolume < 0) {
        this.grossVolume = 0;
      }

      // Customer Tonnage = Gross Volume × 2.85
      this.customerTonnage = +(this.grossVolume * 2.85).toFixed(4);

      // Net CBM = Customer Tonnage / 6.5
      this.calculatedNetCbm = +(this.customerTonnage / 6.5).toFixed(4);
    } else {
      // Tonnage-based allowance: Deduct tonnes directly from DMG Tonnage
      this.customerTonnage = +(
        this.calculatedDmgTonnage - tonnageAllowance
      ).toFixed(4);

      // Ensure customer tonnage doesn't go negative
      if (this.customerTonnage < 0) {
        this.customerTonnage = 0;
      }

      // Gross Volume = Customer Tonnage / 2.85 (reverse calculation)
      this.grossVolume = +(this.customerTonnage / 2.85).toFixed(4);

      // Net CBM = Customer Tonnage / 6.5
      this.calculatedNetCbm = +(this.customerTonnage / 6.5).toFixed(4);
    }
  }

  // Check if volume allowance is selected
  isVolumeAllowance(): boolean {
    return this.blockForm.get('allowanceType')?.value === 'volume';
  }

  // Check if tonnage allowance is selected
  isTonnageAllowance(): boolean {
    return this.blockForm.get('allowanceType')?.value === 'tonnage';
  }

  onSubmit() {
    if (this.blockForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      const block: StockGraniteBlock = {
        ...this.blockForm.value,
        quarryCbm: this.calculatedQuarryCbm,
        dmgTonnage: this.calculatedDmgTonnage,
        grossVolume: this.grossVolume,
        customerTonnage: this.customerTonnage,
        netCbm: this.calculatedNetCbm,
      };

      const apiCall =
        this.data.mode === 'edit'
          ? this.httpService.put(
              `dolphin/updategraniteblock/${block.id}`,
              block
            )
          : this.httpService.post('dolphin/addgranitestocks', block);

      apiCall.subscribe({
        next: (response) => {
          console.log('Block saved successfully:', response);
          this.dialogRef.close(response);
        },
        error: (error) => {
          console.error('Error saving block:', error);
          this.isSubmitting = false;
        },
      });
    }
  }

  onCancel() {
    this.dialogRef.close();
  }

  onReset() {
    if (this.data.mode === 'edit' && this.data.block) {
      this.populateForm(this.data.block);
    } else {
      this.blockForm.reset();
      this.blockForm.patchValue({
        date: new Date(),
        allowanceType: 'volume',
      });
    }
    this.updateCalculatedFields();
  }

  getDialogTitle(): string {
    return this.data.mode === 'edit' ? 'Edit Block' : 'Add New Block';
  }
}
