import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MSCLAnalyticComponent } from './mscl.analytic.component';

describe('MsclAnalyticComponent', () => {
  let component: MSCLAnalyticComponent;
  let fixture: ComponentFixture<MSCLAnalyticComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MSCLAnalyticComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MSCLAnalyticComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
