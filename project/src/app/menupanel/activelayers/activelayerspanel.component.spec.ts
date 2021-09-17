import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ActiveLayersPanelComponent } from './activelayerspanel.component';

describe('ActiveLayersPanelComponent', () => {
  let component: ActiveLayersPanelComponent;
  let fixture: ComponentFixture<ActiveLayersPanelComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ActiveLayersPanelComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ActiveLayersPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
