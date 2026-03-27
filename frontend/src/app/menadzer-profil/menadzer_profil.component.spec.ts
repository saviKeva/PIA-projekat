import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MenadzerProfilComponent } from './menadzer_profil.component';

describe('MenadzerProfilComponent', () => {
  let component: MenadzerProfilComponent;
  let fixture: ComponentFixture<MenadzerProfilComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MenadzerProfilComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MenadzerProfilComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
