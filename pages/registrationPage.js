import { expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';

export class RegistrationPage {
    constructor(page) {
        this.page = page;

        this.signUpButton = page.getByRole('button', {
            name: 'Sign up',
            exact: true
        });

        this.registrationHeading = page.getByRole('heading', {
            name: 'Registration'
        });

        this.nameInput = page.locator('#signupName');
        this.lastNameInput = page.locator('#signupLastName');
        this.emailInput = page.locator('#signupEmail');
        this.passwordInput = page.locator('#signupPassword');
        this.repeatPasswordInput = page.locator('#signupRepeatPassword');

        this.registerButton = page.getByRole('button', {
            name: 'Register',
            exact: true
        });
    }

    async open() {
        await this.page.goto('/');
        await this.signUpButton.click();
        await expect(this.registrationHeading).toBeVisible();
    }

    async fillForm(overrides = {}) {
        const data = {
            name: 'Anna',
            lastName: 'Smith',
            email: `aqa-${randomUUID()}@test.com`,
            password: 'Test1234',
            repeatPassword: 'Test1234',
            ...overrides
        };

        await this.nameInput.fill(data.name);
        await this.lastNameInput.fill(data.lastName);
        await this.emailInput.fill(data.email);
        await this.passwordInput.fill(data.password);
        await this.repeatPasswordInput.fill(data.repeatPassword);

        return data;
    }

    async register() {
        const responsePromise = this.page.waitForResponse(response =>
            response.url().includes('/api/auth/signup') &&
            response.request().method() === 'POST'
        );

        await this.registerButton.click();

        return await responsePromise;
    }

    getErrorMessage(message) {
        return this.page.getByText(message, { exact: true });
    }

    async verifyValidation(field, value, error) {
        await this.fillForm();

        await field.fill(value);
        await field.blur();

        await expect(this.getErrorMessage(error)).toBeVisible();

        await expect(field).toHaveClass(/is-invalid/);

        await expect(field).toHaveCSS(
            'border-color',
            'rgb(220, 53, 69)'
        );

        await expect(this.registerButton).toBeDisabled();
    }

    async verifyRegisterEnabled() {
        await expect(this.registerButton).toBeEnabled();
    }

    async verifyRegisterDisabled() {
        await expect(this.registerButton).toBeDisabled();
    }

    async verifySuccessfulRegistration() {
        await expect(this.page).toHaveURL(/\/panel\/garage/);
    }
}