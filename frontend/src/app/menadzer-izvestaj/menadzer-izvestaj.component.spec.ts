import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MenadzerIzvestajComponent } from './menadzer-izvestaj.component';

describe('MenadzerIzvestajComponent', () => {
  let component: MenadzerIzvestajComponent;
  let fixture: ComponentFixture<MenadzerIzvestajComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MenadzerIzvestajComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MenadzerIzvestajComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
