import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/models';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit, OnDestroy {
  user: User | null = null;
  isAdmin = false;
  isManager = false;
  isCustomer = false;
  menuItems: Array<{ label: string; route: string; requires?: string[] }> = [];

  private sub = new Subscription();

  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit(): void {
    // Subscribe to current user and rebuild menu when user changes
    this.sub.add(
      this.auth.currentUser$.subscribe(async (u) => {
        this.user = u;
        await this.updateRoles();
        this.buildMenu();
      })
    );
  }

  private async updateRoles(): Promise<void> {
    // hasRole() may perform a small query; check a few common roles we use in UI
    if (!this.user) {
      this.isAdmin = this.isManager = this.isCustomer = false;
      return;
    }
    try {
      this.isAdmin = await this.auth.hasRole('admin');
      this.isManager = await this.auth.hasRole('manager');
      this.isCustomer = await this.auth.hasRole('customer');
    } catch (err) {
      // If a role check fails, default to false (fail closed in UI)
      this.isAdmin = this.isManager = this.isCustomer = false;
    }
  }

  private buildMenu(): void {
    const base = [
      { label: 'Home', route: '/' },
      { label: 'About', route: '/about' },
      { label: 'Contact', route: '/contact' }
    ];

    const adminItems = [
      { label: 'Admin Dashboard', route: '/admin' },
      { label: 'Manage Users', route: '/admin/users' }
    ];

    const managerItems = [{ label: 'Company Dashboard', route: '/company' }];
    const customerItems = [{ label: 'My Account', route: '/customer' }];

    this.menuItems = [...base];

    if (this.isManager) this.menuItems.push(...managerItems);
    if (this.isCustomer) this.menuItems.push(...customerItems);
    if (this.isAdmin) this.menuItems.push(...adminItems);

    // Profile and auth actions
    if (this.user) {
      this.menuItems.push({ label: 'Profile', route: '/profile' });
      this.menuItems.push({ label: 'Sign Out', route: '/auth/logout' });
    } else {
      this.menuItems.push({ label: 'Sign In', route: '/auth/login' });
      this.menuItems.push({ label: 'Sign Up', route: '/auth/signup' });
    }
  }

  onNavigate(item: { label: string; route: string }): void {
    if (item.label === 'Sign Out') {
      this.auth.signOut().finally(() => this.router.navigate(['/auth/login']));
      return;
    }
    this.router.navigate([item.route]);
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }
}
