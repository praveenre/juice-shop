/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { FormsModule } from '@angular/forms'
import { RouterLink } from '@angular/router'
import { CurrencyPipe } from '@angular/common'
import { MatButtonModule } from '@angular/material/button'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatInputModule } from '@angular/material/input'
import { environment } from '../../environments/environment'

interface ProductAnswer {
  id: number
  name: string
  description: string
  price: number
  image: string
}

interface ShoppingReply {
  message: string
  answers: ProductAnswer[]
}

@Component({
  selector: 'app-shopping-assistant',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, RouterLink, MatButtonModule, MatFormFieldModule, MatInputModule, CurrencyPipe],
  templateUrl: './shopping-assistant.component.html',
  styleUrls: ['./shopping-assistant.component.scss']
})
export class ShoppingAssistantComponent {
  private readonly http = inject(HttpClient)
  question = ''
  busy = signal(false)
  reply = signal<ShoppingReply | null>(null)
  error = signal('')

  ask () {
    const message = this.question.trim()
    if (this.busy() || !message || message.length > 1000) return
    this.busy.set(true)
    this.reply.set(null)
    this.error.set('')
    this.http.post<ShoppingReply>(environment.hostServer + '/rest/shopping-assistant', { message }).subscribe({
      next: reply => {
        this.reply.set(reply)
        this.busy.set(false)
      },
      error: response => {
        this.error.set(response.status === 429
          ? 'Too many questions. Please wait a minute and try again.'
          : 'The shopping assistant is temporarily unavailable. Please try again later.')
        this.busy.set(false)
      }
    })
  }
}
