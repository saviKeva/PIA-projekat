import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MenadzerProstoriComponent } from './menadzer-prostori.component';

describe('MenadzerProstoriComponent', () => {
  let component: MenadzerProstoriComponent;
  let fixture: ComponentFixture<MenadzerProstoriComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MenadzerProstoriComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MenadzerProstoriComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
