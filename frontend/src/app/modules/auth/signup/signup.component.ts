import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CommonModule } from '@angular/common';

function passwordMatch(control: AbstractControl) {
  const p = control.get('password')?.value;
  const c = control.get('confirmPassword')?.value;
  return p && c && p !== c ? { mismatch: true } : null;
}

@Component({
  selector: 'app-signup',
  imports: [CommonModule,ReactiveFormsModule],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss']
})
export class SignupComponent implements OnInit {
  form!: FormGroup;

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.form = this.fb.group(
      {
        displayName: ['', [Validators.required, Validators.minLength(2)]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required]]
      },
      { validators: passwordMatch }
    );
  }

  get f() {
    return this.form.controls;
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { displayName, email, password } = this.form.value;
    try {
      await this.auth.signUp(email, password, displayName);
      // After sign up, profile is created by DB trigger. Redirect to dashboard or verification page.
      this.router.navigate(['/dashboard']);
    } catch (err) {
      console.error('Signup failed', err);
    }
  }
}
