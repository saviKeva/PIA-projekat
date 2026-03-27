import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClanMrezeComponent } from './clan-mreze.component';

describe('ClanMrezeComponent', () => {
  let component: ClanMrezeComponent;
  let fixture: ComponentFixture<ClanMrezeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClanMrezeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClanMrezeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
