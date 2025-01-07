import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CreateNewSubscriptionRequest, FeedsService, FeedData } from '../../../services/feeds.service';

@Component({
  selector: 'app-feeds-subscribe-overlay',
  imports: [CommonModule, FormsModule],
  templateUrl: './feeds-subscribe-overlay.component.html',
  styleUrl: './feeds-subscribe-overlay.component.css'
})
export class FeedsSubscribeOverlayComponent implements OnChanges {
  @Input() feedData!: FeedData;
  @Output() back = new EventEmitter<void>();
  serverName: string = '';
  subscribedChannel: string = '';
  webhookUrl: string = '';
  errorMessage: string = '';
  loading: boolean = false;

  constructor(private feedsService: FeedsService) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['feedData'] && changes['feedData'].currentValue) {
      this.feedData = changes['feedData'].currentValue;
    }
  }

  goBack(): void {
    this.back.emit();
  }

  onSubmit(): void {
    this.errorMessage = '';
    this.loading = true;

    this.feedsService.subscribeToFeed(this.serverName, this.subscribedChannel, this.webhookUrl, this.feedData.feedId)
      .subscribe({
        next: (response) => {
          if(response.status === 200)
          this.loading = false;
          this.goBack();
        },
        error: (error) => {
          console.error('Failed to subscribe to feed', error);
          this.errorMessage = 'Failed to subscribe to feed';
          this.loading = false;
        }
      });
  }
}
