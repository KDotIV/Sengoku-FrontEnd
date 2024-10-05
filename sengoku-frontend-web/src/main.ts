import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideHttpClient } from '@angular/common/http';  // New HttpClient provider
import { appConfig } from './app/app.config';

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(),  // Use provideHttpClient instead of HttpClientModule
    ...appConfig.providers
  ]
})
  .catch((err) => console.error(err));
