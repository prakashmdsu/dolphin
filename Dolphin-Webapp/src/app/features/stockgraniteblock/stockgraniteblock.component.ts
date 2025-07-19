import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { StockGraniteBlock } from '../shared/StockBlock';
import { HttpService } from '../shared/http-serve.service';

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

  constructor(private fb: FormBuilder, private httpService: HttpService) {}
  ngOnInit() {
    this.blockForm = this.fb.group({
      id: [''],
      date: [null, Validators.required],
      pitNo: [null, Validators.required],
      blockNo: [null, Validators.required],
      buyerBlockNo: [null, Validators.required],
      categoryGrade: ['', Validators.required],
      measurement: this.fb.group({
        lg: [null, Validators.required],
        wd: [null, Validators.required],
        ht: [null, Validators.required],
      }),
      dispatchStatus: [false],
      updatedDate: [null],
      note: [''],
    });

    this.blockForm.get('measurement')?.valueChanges.subscribe(() => {
      this.updateCalculatedFields();
    });
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
    // if (this.blockForm.valid) {
    //   const block: StockGraniteBlock = {
    //     ...this.blockForm.value,
    //     quarryCbm: this.calculatedQuarryCbm,
    //     dmgTonnage: this.calculatedDmgTonnage,
    //     netCbm: this.calculatedNetCbm,
    //   };
    //   console.log('Block to save:', block);
    //   // TODO: save block
    // }
    if (this.blockForm.valid) {
      const block: StockGraniteBlock = this.blockForm.value;

      this.httpService
        .post('dolphin/addgranitestocks', block)
        .subscribe((res) => {});
      console.log('Block to save:', block);
      // TODO: call API or service to save
    }
  }
}
