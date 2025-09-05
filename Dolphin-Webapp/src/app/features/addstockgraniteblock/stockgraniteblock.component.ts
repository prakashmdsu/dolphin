import { Component, OnInit, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { StockGraniteBlock } from '../shared/StockBlock';
import { HttpService } from '../../shared/http-serve.service';

export interface DialogData {
  block?: StockGraniteBlock;
  mode: 'add' | 'edit';
}

@Component({
  selector: 'app-stockgraniteblock',
  standalone: false,
  templateUrl: './stockgraniteblock.component.html',
  styleUrl: './stockgraniteblock.component.scss',
})
export class StockgraniteblockComponent implements OnInit {
  blockForm!: FormGroup;
  calculatedQuarryCbm: number = 0;
  calculatedDmgTonnage: number = 0;
  calculatedNetCbm: number = 0;
  categoryGrades: string[] = ['A', 'B', 'C', 'D'];
  pitNumbers: number[] = Array.from({ length: 10 }, (_, i) => i + 1);
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private httpService: HttpService,
    public dialogRef: MatDialogRef<StockgraniteblockComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {}

  ngOnInit() {
    this.initializeForm();
    this.setupFormSubscriptions();

    // If editing, populate form with existing data
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
      buyerBlockNo: [null, Validators.required],
      categoryGrade: ['', Validators.required],
      measurement: this.fb.group({
        lg: [null, [Validators.required, Validators.min(0)]],
        wd: [null, [Validators.required, Validators.min(0)]],
        ht: [null, [Validators.required, Validators.min(0)]],
        netWeightMt: [null, [Validators.required, Validators.min(0)]],
      }),
      dispatchStatus: [false],
      updatedDate: [null],
      note: [''],
    });
  }

  private setupFormSubscriptions() {
    this.blockForm.get('measurement')?.valueChanges.subscribe(() => {
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

    this.calculatedQuarryCbm = +((lg * wd * ht) / 1000000).toFixed(4);
    this.calculatedDmgTonnage = +(this.calculatedQuarryCbm * 2.85).toFixed(4);
    this.calculatedNetCbm = +(this.calculatedDmgTonnage / 6.5).toFixed(4);
  }

  onSubmit() {
    if (this.blockForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      const block: StockGraniteBlock = {
        ...this.blockForm.value,
        quarryCbm: this.calculatedQuarryCbm,
        dmgTonnage: this.calculatedDmgTonnage,
        netCbm: this.calculatedNetCbm,
      };

      const apiCall =
        this.data.mode === 'edit'
          ? this.httpService.put(
              `dolphin/updategranitestocks/${block.id}`,
              block
            )
          : this.httpService.post('dolphin/addgranitestocks', block);

      apiCall.subscribe({
        next: (response) => {
          console.log('Block saved successfully:', response);
          this.dialogRef.close(response); // Close dialog and return the response
        },
        error: (error) => {
          console.error('Error saving block:', error);
          this.isSubmitting = false;
          // You can add error handling/notification here
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
      this.blockForm.patchValue({ date: new Date() });
    }
    this.updateCalculatedFields();
  }

  getDialogTitle(): string {
    return this.data.mode === 'edit' ? 'Edit Block' : 'Add New Block';
  }
}
