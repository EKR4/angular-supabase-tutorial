import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/models';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-footer',
  imports: [CommonModule],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent implements OnInit, OnDestroy {
  year = new Date().getFullYear();
  user: User | null = null;
  private sub = new Subscription();

  constructor(private auth: AuthService) {}

  ngOnInit(): void {
    this.sub.add(this.auth.currentUser$.subscribe(u => (this.user = u)));
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }
}
