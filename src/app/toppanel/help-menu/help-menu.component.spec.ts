import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { HelpMenuComponent } from './help-menu.component';

describe('HelpMenuComponent', () => {
  let component: HelpMenuComponent;
  let fixture: ComponentFixture<HelpMenuComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ HelpMenuComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HelpMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
