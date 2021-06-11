import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OlmapactivelayersComponent } from './olmapactivelayers.component';

describe('OlmapactivelayersComponent', () => {
  let component: OlmapactivelayersComponent;
  let fixture: ComponentFixture<OlmapactivelayersComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OlmapactivelayersComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OlmapactivelayersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
