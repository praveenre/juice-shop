/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import { TestBed, type ComponentFixture } from '@angular/core/testing'
import { provideHttpClient } from '@angular/common/http'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { provideRouter } from '@angular/router'
import { ShoppingAssistantComponent } from './shopping-assistant.component'

describe('ShoppingAssistantComponent', () => {
  let fixture: ComponentFixture<ShoppingAssistantComponent>
  let component: ShoppingAssistantComponent
  let http: HttpTestingController
  const url = 'http://localhost:3000/rest/shopping-assistant'

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShoppingAssistantComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    }).compileComponents()
    fixture = TestBed.createComponent(ShoppingAssistantComponent)
    component = fixture.componentInstance
    http = TestBed.inject(HttpTestingController)
    fixture.detectChanges()
  })

  afterEach(() => http.verify())

  it('submits the current question and renders product answers', () => {
    component.question = '  Recommend juice  '
    component.ask()
    component.ask()
    const req = http.expectOne(url)
    expect(req.request.body).toEqual({ message: 'Recommend juice' })
    expect(req.request.method).toBe('POST')
    req.flush({
      message: 'Here are some products',
      answers: [{ id: 1, name: 'Apple Juice', description: 'A classic juice', price: 1.99, image: 'apple_juice.jpg' }]
    })
    fixture.detectChanges()
    expect(fixture.nativeElement.textContent).toContain('Apple Juice')
    expect(fixture.nativeElement.textContent).toContain('$1.99')
    expect(component.busy()).toBe(false)
  })

  it('does not submit blank or oversized questions', () => {
    for (const question of ['', ' ', 'a'.repeat(1001)]) {
      component.question = question
      component.ask()
    }
    http.expectNone(url)
  })

  for (const status of [429, 502]) {
    it(`recovers from HTTP ${status} without displaying server diagnostics`, () => {
      component.question = 'hello'
      component.ask()
      http.expectOne(url).flush({ error: 'secret diagnostic' }, { status, statusText: 'Error' })
      fixture.detectChanges()
      expect(component.busy()).toBe(false)
      expect(component.error()).not.toContain('secret')
      expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeTruthy()
    })
  }
})
