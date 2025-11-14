import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/models';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar',
  imports: [CommonModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit, OnDestroy {
  user: User | null = null;
  private sub = new Subscription();

  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.sub.add(this.auth.currentUser$.subscribe(u => (this.user = u)));
  }

  async onSignOut(): Promise<void> {
    await this.auth.signOut();
    this.router.navigate(['/auth/login']);
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }
}
