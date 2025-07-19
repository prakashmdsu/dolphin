import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StockgraniteblockComponent } from './stockgraniteblock.component';

describe('StockgraniteblockComponent', () => {
  let component: StockgraniteblockComponent;
  let fixture: ComponentFixture<StockgraniteblockComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StockgraniteblockComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(StockgraniteblockComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
