import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProfilClanMrezeComponent } from './profil_clan_mreze.component';


describe('ProfilClanMrezeComponent', () => {
  let component: ProfilClanMrezeComponent;
  let fixture: ComponentFixture<ProfilClanMrezeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfilClanMrezeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProfilClanMrezeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
