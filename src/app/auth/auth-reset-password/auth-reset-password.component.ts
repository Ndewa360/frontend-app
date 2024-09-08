import { Component, OnInit } from '@angular/core';
import {UntypedFormBuilder, UntypedFormGroup, Validators} from "@angular/forms"
import {Router} from "@angular/router"

@Component({
  selector: 'app-auth-reset-password',
  templateUrl: './auth-reset-password.component.html',
  styleUrls: ['./auth-reset-password.component.scss']
})
export class AuthResetPasswordComponent implements OnInit {

  public formGroup: UntypedFormGroup

  constructor(protected formBuilder: UntypedFormBuilder,
              private router: Router,
            ) {
  }

  ngOnInit(): void {
    this.formGroup = this.formBuilder.group({
      password: ['', [Validators.required,]],
      passwordConfirm: ['', [Validators.required,]],
    }, {updateOn: 'blur'})
  }

  onSubmit() {
    this.formGroup.markAllAsTouched()
    this.router.navigate(['/app'])
  }

  isValid(name) {
    const instance = this.formGroup.get(name)
    return instance.invalid && (instance.dirty || instance.touched)
  }
}
