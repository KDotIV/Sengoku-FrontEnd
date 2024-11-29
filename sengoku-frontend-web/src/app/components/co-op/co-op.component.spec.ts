import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CoOpComponent } from './co-op.component';

describe('CoOpComponent', () => {
  let component: CoOpComponent;
  let fixture: ComponentFixture<CoOpComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CoOpComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CoOpComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
