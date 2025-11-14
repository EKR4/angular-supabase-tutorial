import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { AboutComponent } from './about/about.component';
import { ContactComponent } from './contact/contact.component';

export const PUBLIC_ROUTES: Routes = [
  {
    path: 'home',
    component: HomeComponent,
    title: 'Home'
  },
  {
    path: 'about',
    component: AboutComponent,
    title: 'About Us'
  },
  {
    path: 'contact',
    component: ContactComponent,
    title: 'Contact Us'
  },
   {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  }
];