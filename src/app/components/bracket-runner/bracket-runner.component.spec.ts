import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BracketRunnerComponent } from './bracket-runner.component';

describe('BracketRunnerComponent', () => {
  let component: BracketRunnerComponent;
  let fixture: ComponentFixture<BracketRunnerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BracketRunnerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BracketRunnerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
