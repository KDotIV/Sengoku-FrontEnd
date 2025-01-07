import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CoOpsServices, CoOpTravelResult } from '../../services/co-op.service';
import { catchError, EMPTY, tap } from 'rxjs';

@Component({
  selector: 'app-co-op',
  imports: [CommonModule, FormsModule],
  standalone: true,
  templateUrl: './co-op.component.html',
  styleUrl: './co-op.component.css'
})
export class CoOpComponent implements OnInit{
  title = 'CoOps';
  userId: number = 1;
  operationName: string = '';
  coOps: CoOpTravelResult[] = [];
  errorMessage: string = '';

  constructor(private coOpsServices: CoOpsServices) { }

  ngOnInit(): void {
    this.queryCoOpsByUserId();
  }

  loading: boolean = false;

  queryCoOpsByUserId(): void {
    this.errorMessage = '';
    this.loading = true;

    this.coOpsServices.queryCoOpsByUserId(this.userId)
    .pipe(
      tap((data: CoOpTravelResult[]) => {
        this.coOps = data;
        this.loading = false;
        if(data.length === 0) {
          this.errorMessage = 'No CoOps under this User';
        } else {
          this.errorMessage = '';
        }
      }),
      catchError(error => {
        console.error('Failed to load CoOps', error);
        this.errorMessage = 'Failed to load CoOps. Please try again later';
        this.loading = false;
        return EMPTY;
      })
    ).subscribe();
  }
}
