import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BillingSummaryComponent } from './billing-summary.component';

describe('BillingSummaryComponent', () => {
  let component: BillingSummaryComponent;
  let fixture: ComponentFixture<BillingSummaryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BillingSummaryComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(BillingSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
