import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GranitestocksComponent } from './granitestocks.component';

describe('GranitestocksComponent', () => {
  let component: GranitestocksComponent;
  let fixture: ComponentFixture<GranitestocksComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GranitestocksComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(GranitestocksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
