import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { FooterComponent } from './shared/components/footer/footer.component';
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet,ReactiveFormsModule,CommonModule,NavbarComponent,FooterComponent,SidebarComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'frontend';

  constructor(private auth: AuthService) {}

  ngOnInit(): void {
    // Attempt to restore any existing session on app start
    // restoreSession will load the profile and emit currentUser$
    this.auth.restoreSession().catch(() => {
      // ignore errors here; AuthService.error$ will surface user-friendly messages
    });
  }
}
